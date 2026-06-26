import { prisma } from "@/server/db/prisma";
import { sendTemplatedEmail } from "@/server/email/email-service";
import { appendAuditLog, auditLogCreateData } from "@/server/audit/audit-service";
import { verifyPassword } from "./password";
import { hasPermission } from "./policy";
import { openSealedSecret } from "./secret";
import { hashSessionToken, SESSION_COOKIE_NAME } from "./session";
import { safeUser, createSessionForUser, getAuthContextFromRequest, type AuthContext } from "./session-store";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_PURPOSE,
  emailOtpExpiryDate,
  generateEmailOtp,
  hashEmailOtp,
  isTwoFactorSessionLocked,
  twoFactorLockedUntilForAttempt,
  verifyEmailOtpHash
} from "./two-factor";
import { verifyTotpCode } from "./totp";

export type LoginResult =
  | { status: "authenticated"; token: string; user: ReturnType<typeof safeUser>; permissions: string[] }
  | { status: "two_factor_required"; token: string; user: ReturnType<typeof safeUser> };

function shouldExposeDevOtp() {
  return process.env.APP_ENV === "local" || (!process.env.APP_ENV && process.env.NODE_ENV === "development");
}

const authUserInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  },
  clientProfile: true,
  twoFactorCredential: true
};

export async function loginWithPassword({
  email,
  password,
  request
}: {
  email: string;
  password: string;
  request: Request;
}): Promise<LoginResult | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: authUserInclude
  });

  if (!user || user.status !== "ACTIVE" || !verifyPassword(password, user.passwordHash)) {
    await appendAuditLog({
      actorId: user?.id,
      action: "auth.login_failed",
      resourceType: "User",
      resourceId: user?.id,
      metadata: { reason: "invalid_credentials" },
      request
    });
    return null;
  }

  const { token, session } = await createSessionForUser(user, request);
  await appendAuditLog({
    actorId: user.id,
    action: session.status === "PENDING_2FA" ? "auth.login_password_verified_pending_2fa" : "auth.login_success",
    resourceType: "Session",
    resourceId: session.id,
    metadata: { role: user.role.name },
    request
  });

  if (session.status === "PENDING_2FA") {
    return { status: "two_factor_required", token, user: safeUser(user) };
  }

  return {
    status: "authenticated",
    token,
    user: safeUser(user),
    permissions: user.role.permissions.map((entry) => entry.permission.key)
  };
}

export async function logoutByRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  if (!token) {
    return;
  }

  await prisma.session.updateMany({
    where: { tokenHash: hashSessionToken(decodeURIComponent(token)), revokedAt: null },
    data: { status: "REVOKED", revokedAt: new Date() }
  });
}

export async function verifyPendingTotp(request: Request, code: string) {
  const context = await getAuthContextFromRequest(request, { allowPendingTwoFactor: true });
  if (!context || context.sessionStatus !== "PENDING_2FA") {
    return null;
  }

  if (isTwoFactorSessionLocked(context)) {
    await auditTwoFactorFailure(request, context, "totp", "session_locked");
    return null;
  }

  const credential = context.user.twoFactorCredential;
  if (!credential?.totpSecretEncrypted || credential.recoveryState !== "ENABLED") {
    await recordTwoFactorFailure(request, context, "totp", "credential_not_ready");
    return null;
  }

  const secret = openSealedSecret(credential.totpSecretEncrypted);
  if (!verifyTotpCode(secret, code)) {
    await recordTwoFactorFailure(request, context, "totp", "invalid_code");
    return null;
  }

  const now = new Date();
  await prisma.$transaction([
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
    prisma.staffTwoFactorCredential.update({
      where: { userId: context.user.id },
      data: { lastVerifiedAt: now }
    }),
    prisma.auditLog.create({
      data: auditLogCreateData({
        actorId: context.user.id,
        action: "auth.2fa_totp_verified",
        resourceType: "Session",
        resourceId: context.sessionId,
        metadata: { method: "totp" },
        request
      })
    })
  ]);

  return { user: safeUser(context.user), permissions: context.principal.permissions ?? [] };
}

export async function sendEmailOtpForPendingSession(request: Request) {
  const context = await getAuthContextFromRequest(request, { allowPendingTwoFactor: true });
  if (!context || context.sessionStatus !== "PENDING_2FA") {
    return null;
  }

  if (isTwoFactorSessionLocked(context)) {
    await auditTwoFactorFailure(request, context, "email_otp", "session_locked");
    return null;
  }

  const otp = generateEmailOtp();
  await prisma.emailOtpChallenge.create({
    data: {
      userId: context.user.id,
      purpose: EMAIL_OTP_PURPOSE,
      otpHash: hashEmailOtp({ otp, userId: context.user.id, purpose: EMAIL_OTP_PURPOSE }),
      expiresAt: emailOtpExpiryDate()
    }
  });

  const delivery = await sendTemplatedEmail({
    to: { email: context.user.email, userId: context.user.id },
    templateKey: "staff_2fa_email_otp",
    data: { otp, expiresInMinutes: 10 }
  });

  await prisma.emailMessage.create({
    data: {
      toUserId: context.user.id,
      toEmailHash: delivery.toEmailHash,
      templateKey: delivery.templateKey,
      purpose: EMAIL_OTP_PURPOSE,
      status: delivery.mode === "smtp" ? "SENT" : "QUEUED",
      providerMessageId: delivery.providerMessageId,
      sentAt: delivery.mode === "smtp" ? new Date() : null
    }
  });

  await appendAuditLog({
    actorId: context.user.id,
    action: "auth.2fa_email_otp_created",
    resourceType: "Session",
    resourceId: context.sessionId,
    metadata: { delivery: "queued" },
    request
  });

  return {
    delivery: delivery.mode === "smtp" ? "sent" : "queued",
    devOtp: shouldExposeDevOtp() ? otp : undefined
  };
}

export async function verifyEmailOtpForPendingSession(request: Request, otp: string) {
  const context = await getAuthContextFromRequest(request, { allowPendingTwoFactor: true });
  if (!context || context.sessionStatus !== "PENDING_2FA") {
    return null;
  }

  if (isTwoFactorSessionLocked(context)) {
    await auditTwoFactorFailure(request, context, "email_otp", "session_locked");
    return null;
  }

  const challenge = await prisma.emailOtpChallenge.findFirst({
    where: {
      userId: context.user.id,
      purpose: EMAIL_OTP_PURPOSE,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!challenge || challenge.attemptCount >= EMAIL_OTP_MAX_ATTEMPTS) {
    await recordTwoFactorFailure(request, context, "email_otp", "invalid_or_expired_challenge");
    return null;
  }

  const isValid = verifyEmailOtpHash({
    otp,
    userId: context.user.id,
    purpose: EMAIL_OTP_PURPOSE,
    otpHash: challenge.otpHash
  });

  if (!isValid) {
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } }
    });
    await recordTwoFactorFailure(request, context, "email_otp", "invalid_code");
    return null;
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now, attemptCount: { increment: 1 } }
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
        action: "auth.2fa_email_otp_verified",
        resourceType: "Session",
        resourceId: context.sessionId,
        metadata: { method: "email_otp" },
        request
      })
    })
  ]);

  return { user: safeUser(context.user), permissions: context.principal.permissions ?? [] };
}

async function recordTwoFactorFailure(
  request: Request,
  context: AuthContext,
  method: "totp" | "email_otp",
  reason: string
) {
  await recordTwoFactorFailureOperation(request, context, method, reason);
}

function recordTwoFactorFailureOperation(
  request: Request,
  context: AuthContext,
  method: "totp" | "email_otp",
  reason: string
) {
  const nextAttemptCount = context.twoFactorAttemptCount + 1;
  const lockedUntil = twoFactorLockedUntilForAttempt(nextAttemptCount);

  return prisma.$transaction([
    prisma.session.update({
      where: { id: context.sessionId },
      data: {
        twoFactorAttemptCount: nextAttemptCount,
        twoFactorLockedUntil: lockedUntil,
        lastTwoFactorFailedAt: new Date()
      }
    }),
    prisma.auditLog.create({
      data: auditLogCreateData({
        actorId: context.user.id,
        action: method === "totp" ? "auth.2fa_totp_failed" : "auth.2fa_email_otp_failed",
        resourceType: "Session",
        resourceId: context.sessionId,
        metadata: {
          method,
          reason,
          attemptCount: nextAttemptCount,
          locked: Boolean(lockedUntil)
        },
        request
      })
    })
  ]);
}

async function auditTwoFactorFailure(
  request: Request,
  context: AuthContext,
  method: "totp" | "email_otp",
  reason: string
) {
  await appendAuditLog({
    actorId: context.user.id,
    action: method === "totp" ? "auth.2fa_totp_failed" : "auth.2fa_email_otp_failed",
    resourceType: "Session",
    resourceId: context.sessionId,
    metadata: { method, reason, locked: true },
    request
  });
}

export async function resetStaffTwoFactor(request: Request, targetUserId: string) {
  const context = await getAuthContextFromRequest(request);
  if (!context || !hasPermission(context.principal, "twoFactor.reset.staff")) {
    return null;
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      role: true
    }
  });

  if (!target || target.role.name === "Client" || target.role.name === "Guest") {
    return null;
  }

  const credential = await prisma.staffTwoFactorCredential.upsert({
    where: { userId: target.id },
    create: {
      userId: target.id,
      recoveryState: "RESET_REQUIRED"
    },
    update: {
      totpSecretEncrypted: null,
      enabledAt: null,
      lastVerifiedAt: null,
      recoveryState: "RESET_REQUIRED"
    }
  });

  await appendAuditLog({
    actorId: context.user.id,
    action: "auth.2fa_reset",
    resourceType: "User",
    resourceId: target.id,
    metadata: { targetRole: target.role.name, credentialId: credential.id },
    request
  });

  return { targetUserId: target.id, recoveryState: credential.recoveryState };
}
