import { randomBytes } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { appendAuditLog, auditLogCreateData } from "@/server/audit/audit-service";
import { ApiError } from "@/server/http/errors";
import { recordPendingTwoFactorFailure } from "./auth-service";
import { getAuthContextFromRequest, safeUser, type AuthContext } from "./session-store";
import { isStaffTwoFactorEnabled, isTwoFactorSessionLocked } from "./two-factor";
import { openSealedSecret, sealSecret } from "./secret";
import { verifyTotpCode } from "./totp";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_ISSUER = "KMT Legal";

export function encodeBase32Secret(bytes: Buffer): string {
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let encoded = "";
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    encoded += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }
  return encoded;
}

export function buildTotpOtpAuthUri({ accountName, secret }: { accountName: string; secret: string }): string {
  const label = `${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(accountName)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&digits=6&period=30`;
}

function requireTotpMode() {
  if (!isStaffTwoFactorEnabled()) {
    throw new ApiError(503, "FEATURE_DISABLED", "TOTP is not enabled.");
  }
}

async function requirePendingStaffContext(request: Request): Promise<AuthContext> {
  const context = await getAuthContextFromRequest(request, { allowPendingTwoFactor: true });
  if (!context || context.sessionStatus !== "PENDING_2FA") {
    throw new ApiError(401, "UNAUTHENTICATED", "A pending two-factor session is required.");
  }
  if (isTwoFactorSessionLocked(context)) {
    throw new ApiError(401, "TWO_FACTOR_EXPIRED", "The verification session is locked. Sign in again.");
  }
  return context;
}

export async function startTotpEnrollment(request: Request) {
  requireTotpMode();
  const context = await requirePendingStaffContext(request);

  const credential = await prisma.staffTwoFactorCredential.findUnique({
    where: { userId: context.user.id }
  });

  if (credential?.recoveryState === "ENABLED") {
    throw new ApiError(409, "CONFLICT", "A TOTP factor is already enrolled. Ask a Super Admin to reset it before re-enrolling.");
  }
  if (credential?.recoveryState === "DISABLED_BY_ADMIN") {
    throw new ApiError(403, "PERMISSION_DENIED", "Two-factor enrollment is disabled for this account.");
  }

  const setupKey = encodeBase32Secret(randomBytes(20));
  const sealed = sealSecret(setupKey);
  const nextState = credential?.recoveryState === "RESET_REQUIRED" ? "RESET_REQUIRED" : "PENDING_SETUP";

  await prisma.staffTwoFactorCredential.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      totpSecretEncrypted: sealed,
      enabledAt: null,
      lastVerifiedAt: null,
      recoveryState: nextState
    },
    update: {
      totpSecretEncrypted: sealed,
      enabledAt: null,
      lastVerifiedAt: null,
      recoveryState: nextState
    }
  });

  await appendAuditLog({
    actorId: context.user.id,
    action: "auth.2fa_enroll_started",
    resourceType: "User",
    resourceId: context.user.id,
    metadata: { recoveryState: nextState },
    request
  });

  return {
    setupKey,
    otpauthUri: buildTotpOtpAuthUri({ accountName: context.user.email, secret: setupKey }),
    recoveryState: nextState
  };
}

export async function confirmTotpEnrollment(request: Request, code: string) {
  requireTotpMode();
  const context = await requirePendingStaffContext(request);

  const credential = await prisma.staffTwoFactorCredential.findUnique({
    where: { userId: context.user.id }
  });

  if (!credential?.totpSecretEncrypted || (credential.recoveryState !== "PENDING_SETUP" && credential.recoveryState !== "RESET_REQUIRED")) {
    throw new ApiError(409, "CONFLICT", "No pending enrollment exists. Start enrollment first.");
  }

  const secret = openSealedSecret(credential.totpSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    await recordPendingTwoFactorFailure(request, context, "totp", "enrollment_code_invalid");
    throw new ApiError(401, "TWO_FACTOR_INVALID", "The verification code is incorrect.");
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.staffTwoFactorCredential.update({
      where: { userId: context.user.id },
      data: { recoveryState: "ENABLED", enabledAt: now, lastVerifiedAt: now }
    }),
    prisma.session.update({
      where: { id: context.sessionId },
      data: {
        status: "ACTIVE",
        twoFactorVerifiedAt: now,
        twoFactorAttemptCount: 0,
        twoFactorLockedUntil: null,
        lastTwoFactorFailedAt: null
      }
    }),
    prisma.auditLog.create({
      data: auditLogCreateData({
        actorId: context.user.id,
        action: "auth.2fa_enrolled",
        resourceType: "Session",
        resourceId: context.sessionId,
        metadata: { method: "totp" },
        request
      })
    })
  ]);

  return { user: safeUser(context.user), permissions: context.principal.permissions ?? [] };
}

export async function totpEnrollmentStatus(request: Request) {
  requireTotpMode();
  const context = await requirePendingStaffContext(request);

  const credential = await prisma.staffTwoFactorCredential.findUnique({
    where: { userId: context.user.id },
    select: { recoveryState: true }
  });

  return {
    enrolled: credential?.recoveryState === "ENABLED",
    recoveryState: credential?.recoveryState ?? "PENDING_SETUP"
  };
}
