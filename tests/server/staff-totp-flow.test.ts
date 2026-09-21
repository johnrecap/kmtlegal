import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(async (_query?: unknown): Promise<unknown> => null),
  sessionCreate: vi.fn(async (_data?: unknown): Promise<unknown> => ({ id: "sess-1", status: "PENDING_2FA" })),
  sessionFindUnique: vi.fn(async (_query?: unknown): Promise<unknown> => null),
  sessionUpdate: vi.fn(async (args?: unknown): Promise<unknown> => args),
  sessionUpdateMany: vi.fn(async (_args?: unknown): Promise<unknown> => ({ count: 1 })),
  credentialFindUnique: vi.fn(async (_query?: unknown): Promise<unknown> => null),
  credentialUpsert: vi.fn(async (args?: unknown): Promise<unknown> => ({ id: "cred-1", ...((args as { create?: Record<string, unknown> } | undefined)?.create ?? {}) })),
  credentialUpdate: vi.fn(async (args?: unknown): Promise<unknown> => args),
  auditCreate: vi.fn(async (args?: unknown): Promise<unknown> => args),
  otpFindFirst: vi.fn(async (_query?: unknown): Promise<unknown> => null)
}));

const auditMocks = vi.hoisted(() => ({
  appendAuditLog: vi.fn(async () => undefined)
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: { findUnique: databaseMocks.userFindUnique },
    session: {
      create: databaseMocks.sessionCreate,
      findUnique: databaseMocks.sessionFindUnique,
      update: databaseMocks.sessionUpdate,
      updateMany: databaseMocks.sessionUpdateMany
    },
    staffTwoFactorCredential: {
      findUnique: databaseMocks.credentialFindUnique,
      upsert: databaseMocks.credentialUpsert,
      update: databaseMocks.credentialUpdate
    },
    auditLog: { create: databaseMocks.auditCreate },
    emailOtpChallenge: { findFirst: databaseMocks.otpFindFirst },
    $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
  }
}));

vi.mock("@/server/audit/audit-service", () => ({
  appendAuditLog: auditMocks.appendAuditLog,
  auditLogCreateData: vi.fn((input: Record<string, unknown>) => input)
}));

vi.mock("@/server/email/email-service", () => ({
  sendTemplatedEmail: vi.fn(async () => ({ mode: "disabled" }))
}));

import { hashPassword } from "@/server/auth/password";
import { openSealedSecret, sealSecret } from "@/server/auth/secret";
import { generateTotpCode, verifyTotpCode } from "@/server/auth/totp";
import {
  canFinalizeSession,
  isStaffTwoFactorEnabled,
  requiresTwoFactor
} from "@/server/auth/two-factor";
import {
  confirmTotpEnrollment,
  encodeBase32Secret,
  startTotpEnrollment,
  totpEnrollmentStatus
} from "@/server/auth/totp-enrollment-service";
import { loginWithPassword, resetStaffTwoFactor, verifyPendingTotp } from "@/server/auth/auth-service";
import { ROLES } from "@/server/auth/policy";
import { PLAN35_PRINCIPALS } from "../fixtures/plan35-role-fixtures";

const STAFF_ENV = { STAFF_2FA_MODE: "totp" } as unknown as NodeJS.ProcessEnv;
const DISABLED_ENV = { STAFF_2FA_MODE: "disabled" } as unknown as NodeJS.ProcessEnv;
let previousMode: string | undefined;

function staffUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-staff-1",
    name: "Staff",
    email: "staff@example.invalid",
    phone: "+201000000000",
    locale: "ar",
    status: "ACTIVE",
    deletedAt: null,
    passwordHash: "unused",
    role: { name: ROLES.officeAdmin, status: "ACTIVE", permissions: [] },
    clientProfile: null,
    twoFactorCredential: null,
    ...overrides
  };
}

function pendingSession(user: Record<string, unknown>, status = "PENDING_2FA") {
  return {
    id: "sess-pending-1",
    tokenHash: "hash",
    status,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 3600_000),
    twoFactorAttemptCount: 0,
    twoFactorLockedUntil: null,
    twoFactorVerifiedAt: status === "ACTIVE" ? new Date() : null,
    user
  };
}

function firstCallArg(mock: { mock: { calls: unknown[][] } }) {
  return mock.mock.calls[0][0] as { data: Record<string, unknown>; create: Record<string, unknown> };
}

function auditedPayloads(mock: { mock: { calls: unknown[][] } }) {
  return mock.mock.calls.map((call) => call[0]);
}

function pendingRequest() {
  return new Request("http://localhost/api/auth/2fa/totp/verify", { headers: { cookie: "kmt_session=test-token" } });
}

describe("staff TOTP flow (TASK 04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previousMode = process.env.STAFF_2FA_MODE;
    process.env.STAFF_2FA_MODE = "totp";
  });

  afterEach(() => {
    if (previousMode === undefined) delete process.env.STAFF_2FA_MODE;
    else process.env.STAFF_2FA_MODE = previousMode;
  });

  it("keeps TOTP verification deterministic-safe: window edges and malformed codes", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const now = new Date("2026-09-20T12:00:00.000Z");
    const code = generateTotpCode(secret, { now });
    expect(verifyTotpCode(secret, code, { now, window: 0 })).toBe(true);
    expect(verifyTotpCode(secret, code, { now: new Date(now.getTime() + 120_000), window: 0 })).toBe(false);
    expect(verifyTotpCode(secret, "12 34", { now })).toBe(false);
    expect(verifyTotpCode(secret, "abcdef", { now })).toBe(false);
  });

  it("gates TOTP by staff role and mode, leaving Client login unchanged", () => {
    expect(requiresTwoFactor(ROLES.officeAdmin, STAFF_ENV)).toBe(true);
    expect(requiresTwoFactor(ROLES.lawyer, STAFF_ENV)).toBe(true);
    expect(requiresTwoFactor(ROLES.client, STAFF_ENV)).toBe(false);
    expect(requiresTwoFactor(ROLES.officeAdmin, DISABLED_ENV)).toBe(false);
    expect(isStaffTwoFactorEnabled(DISABLED_ENV)).toBe(false);
  });

  it("denies pending sessions a finalized context", () => {
    expect(canFinalizeSession(ROLES.officeAdmin, { status: "PENDING_2FA", twoFactorVerifiedAt: null }, STAFF_ENV)).toBe(false);
    expect(canFinalizeSession(ROLES.officeAdmin, { status: "ACTIVE", twoFactorVerifiedAt: new Date() }, STAFF_ENV)).toBe(true);
    expect(canFinalizeSession(ROLES.client, { status: "ACTIVE", twoFactorVerifiedAt: null }, STAFF_ENV)).toBe(true);
  });

  it("returns two_factor_required for staff and authenticated for Client", async () => {
    const passwordHash = await hashPassword("Correct horse 42!");
    databaseMocks.userFindUnique.mockResolvedValueOnce(staffUser({ passwordHash }));
    const staffResult = await loginWithPassword({ email: "staff@example.invalid", password: "Correct horse 42!", request: pendingRequest() });
    expect(staffResult?.status).toBe("two_factor_required");

    databaseMocks.sessionCreate.mockResolvedValueOnce({ id: "sess-2", status: "ACTIVE" });

    databaseMocks.userFindUnique.mockResolvedValueOnce(
      staffUser({ passwordHash, role: { name: ROLES.client, status: "ACTIVE", permissions: [] } })
    );
    const clientResult = await loginWithPassword({ email: "c@example.invalid", password: "Correct horse 42!", request: pendingRequest() });
    expect(clientResult?.status).toBe("authenticated");
  });

  it("starts enrollment with a sealed secret and never audits the plaintext", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValueOnce(pendingSession(staffUser()));
    const started = await startTotpEnrollment(pendingRequest());
    expect(started.setupKey).toMatch(/^[A-Z2-7]{32}$/);
    expect(started.otpauthUri.startsWith("otpauth://totp/KMT%20Legal:")).toBe(true);
    const upserted = firstCallArg(databaseMocks.credentialUpsert);
    expect(upserted.create.recoveryState).toBe("PENDING_SETUP");
    expect(String(upserted.create.totpSecretEncrypted)).not.toContain(started.setupKey);
    expect(openSealedSecret(String(upserted.create.totpSecretEncrypted))).toBe(started.setupKey);
    const audited = JSON.stringify(auditedPayloads(auditMocks.appendAuditLog));
    expect(audited).toContain("auth.2fa_enroll_started");
    expect(audited).not.toContain(started.setupKey);
  });

  it("refuses enrollment when a factor is already enabled", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValueOnce(pendingSession(staffUser()));
    databaseMocks.credentialFindUnique.mockResolvedValueOnce({ recoveryState: "ENABLED", totpSecretEncrypted: "sealed" });
    await expect(startTotpEnrollment(pendingRequest())).rejects.toMatchObject({ status: 409 });
    expect(databaseMocks.credentialUpsert).not.toHaveBeenCalled();
  });

  it("confirms enrollment with a valid code and finalizes the session atomically", async () => {
    const user = staffUser();
    databaseMocks.sessionFindUnique.mockResolvedValue(pendingSession(user));
    const started = await startTotpEnrollment(pendingRequest());
    const sealed = String(firstCallArg(databaseMocks.credentialUpsert).create.totpSecretEncrypted);
    databaseMocks.credentialFindUnique.mockResolvedValue({ recoveryState: "PENDING_SETUP", totpSecretEncrypted: sealed });

    const code = generateTotpCode(started.setupKey, { now: new Date() });
    const result = await confirmTotpEnrollment(pendingRequest(), code);
    expect(result.user.id).toBe(user.id);
    const sessionUpdate = firstCallArg(databaseMocks.sessionUpdate);
    expect(sessionUpdate.data.status).toBe("ACTIVE");
    expect(sessionUpdate.data.twoFactorVerifiedAt).toBeInstanceOf(Date);
    const credentialUpdate = firstCallArg(databaseMocks.credentialUpdate);
    expect(credentialUpdate.data.recoveryState).toBe("ENABLED");
  });

  it("rejects an invalid enrollment code and records the attempt", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValue(pendingSession(staffUser()));
    databaseMocks.credentialFindUnique.mockResolvedValue({
      recoveryState: "RESET_REQUIRED",
      totpSecretEncrypted: sealSecret("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    });
    await expect(confirmTotpEnrollment(pendingRequest(), "000000")).rejects.toMatchObject({ status: 401 });
    expect(databaseMocks.sessionUpdate).toHaveBeenCalled();
    expect(firstCallArg(databaseMocks.sessionUpdate).data.twoFactorAttemptCount).toBe(1);
  });

  it("rejects enrollment confirmation once the session is already ACTIVE (replay)", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValue(pendingSession(staffUser(), "ACTIVE"));
    await expect(confirmTotpEnrollment(pendingRequest(), "123456")).rejects.toMatchObject({ status: 401 });
  });

  it("rejects TOTP verification on a non-pending session (replay)", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValue(pendingSession(staffUser(), "ACTIVE"));
    expect(await verifyPendingTotp(pendingRequest(), "123456")).toBeNull();
  });

  it("reports enrollment status without secrets", async () => {
    databaseMocks.sessionFindUnique.mockResolvedValue(pendingSession(staffUser()));
    databaseMocks.credentialFindUnique.mockResolvedValueOnce({ recoveryState: "RESET_REQUIRED" });
    const status = await totpEnrollmentStatus(pendingRequest());
    expect(status).toEqual({ enrolled: false, recoveryState: "RESET_REQUIRED" });
  });

  it("restricts staff 2FA reset to Super Admin and audits without secrets", async () => {
    const target = { id: "user-lawyer-9", role: { name: ROLES.lawyer } };
    databaseMocks.userFindUnique.mockResolvedValue(target);

    databaseMocks.sessionFindUnique.mockResolvedValue(
      pendingSession({ ...staffUser(), id: "lawyer-actor", role: { name: ROLES.lawyer, status: "ACTIVE", permissions: [] } }, "ACTIVE")
    );
    expect(await resetStaffTwoFactor(pendingRequest(), target.id)).toBeNull();

    databaseMocks.sessionFindUnique.mockResolvedValue(
      pendingSession({ ...staffUser(), id: "root-actor", role: { name: ROLES.superAdmin, status: "ACTIVE", permissions: [] } }, "ACTIVE")
    );
    databaseMocks.userFindUnique.mockResolvedValue(target);
    const reset = await resetStaffTwoFactor(pendingRequest(), target.id);
    expect(reset?.recoveryState).toBe("RESET_REQUIRED");
    const audited = JSON.stringify(auditedPayloads(auditMocks.appendAuditLog));
    expect(audited).toContain("auth.2fa_reset");

    databaseMocks.sessionFindUnique.mockResolvedValue(
      pendingSession({ ...staffUser(), id: "root-actor", role: { name: ROLES.superAdmin, status: "ACTIVE", permissions: [] } }, "ACTIVE")
    );
    databaseMocks.userFindUnique.mockResolvedValue({ id: "client-1", role: { name: ROLES.client } });
    expect(await resetStaffTwoFactor(pendingRequest(), "client-1")).toBeNull();
  });

  it("keeps the TOTP route contract rate-limited, mode-gated, and secret-free", () => {
    const root = process.cwd();
    const verify = fs.readFileSync(path.join(root, "src/app/api/auth/2fa/totp/verify/route.ts"), "utf8");
    const enroll = fs.readFileSync(path.join(root, "src/app/api/auth/2fa/totp/enroll/route.ts"), "utf8");
    const confirm = fs.readFileSync(path.join(root, "src/app/api/auth/2fa/totp/enroll/confirm/route.ts"), "utf8");
    const status = fs.readFileSync(path.join(root, "src/app/api/auth/2fa/totp/status/route.ts"), "utf8");
    const reset = fs.readFileSync(path.join(root, "src/app/api/admin/users/[userId]/2fa/reset/route.ts"), "utf8");
    const loginForm = fs.readFileSync(path.join(root, "src/features/auth/login-form.tsx"), "utf8");
    for (const source of [verify, enroll, confirm, status]) {
      expect(source).toContain("rateLimiters.twoFactor");
      expect(source).toContain("isStaffTwoFactorEnabled");
      expect(source).toContain('"Cache-Control": "no-store"');
    }
    expect(verify).toContain("verifyPendingTotp");
    expect(enroll).toContain("startTotpEnrollment");
    expect(confirm).toContain("confirmTotpEnrollment");
    expect(status).toContain("totpEnrollmentStatus");
    expect(reset).toContain("resetStaffTwoFactor");
    expect(reset).toContain("getAuthContextFromRequest");
    expect(reset).not.toContain("FEATURE_DISABLED");
    expect(loginForm).toContain("/login/2fa");
  });

  it("enforces reset authority in the existing service contract", () => {
    const root = process.cwd();
    const service = fs.readFileSync(path.join(root, "src/server/auth/auth-service.ts"), "utf8");
    expect(service).toContain("twoFactor.reset.staff");
    expect(service).toContain("auth.2fa_reset");
  });

  it("encodes authenticator secrets without leaking structure", () => {
    expect(encodeBase32Secret(Buffer.from("12345678901234567890", "utf8"))).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });
});
