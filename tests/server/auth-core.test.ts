import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { hasPermission, isStaffRole, permissionsForRole, ROLES } from "@/server/auth/policy";
import { generateTotpCode, verifyTotpCode } from "@/server/auth/totp";
import {
  canFinalizeSession,
  emailOtpExpiryDate,
  hashEmailOtp,
  initialSessionStatusForRole,
  isTwoFactorSessionLocked,
  requiresTwoFactor,
  twoFactorLockedUntilForAttempt,
  verifyEmailOtpHash
} from "@/server/auth/two-factor";

describe("auth password helpers", () => {
  it("hashes and verifies passwords without plaintext storage", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple");

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain("CorrectHorseBatteryStaple");
    await expect(verifyPassword("CorrectHorseBatteryStaple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("auth role and permission policy", () => {
  it("requires 2FA for staff roles only", () => {
    expect(isStaffRole(ROLES.lawyer)).toBe(true);
    expect(isStaffRole(ROLES.officeAdmin)).toBe(true);
    expect(isStaffRole(ROLES.marketingStaff)).toBe(true);
    expect(isStaffRole(ROLES.superAdmin)).toBe(true);
    expect(isStaffRole(ROLES.client)).toBe(false);
  });

  it("resolves role permissions and super admin wildcard", () => {
    expect(permissionsForRole(ROLES.client)).toContain("case.read.own");
    expect(hasPermission({ roleName: ROLES.client }, "case.read.any")).toBe(false);
    expect(hasPermission({ roleName: ROLES.superAdmin }, "settings.manage.any")).toBe(true);
    expect(hasPermission({ roleName: ROLES.superAdmin, permissions: ["user.manage.any"] }, "client.account.manage")).toBe(true);
  });
});

describe("staff 2FA helpers", () => {
  it("keeps staff 2FA disabled by default for the installer release", () => {
    expect(requiresTwoFactor(ROLES.lawyer)).toBe(false);
    expect(initialSessionStatusForRole(ROLES.lawyer)).toBe("ACTIVE");
    expect(canFinalizeSession(ROLES.lawyer, { status: "ACTIVE" })).toBe(true);
  });

  it("retains the dormant TOTP mode for the future Staff 2FA rework", () => {
    const env = { NODE_ENV: "test", STAFF_2FA_MODE: "totp" } as unknown as NodeJS.ProcessEnv;
    expect(requiresTwoFactor(ROLES.lawyer, env)).toBe(true);
    expect(initialSessionStatusForRole(ROLES.lawyer, env)).toBe("PENDING_2FA");
    expect(canFinalizeSession(ROLES.lawyer, { status: "PENDING_2FA" }, env)).toBe(false);
    expect(canFinalizeSession(ROLES.lawyer, { status: "ACTIVE" }, env)).toBe(false);
    expect(canFinalizeSession(ROLES.lawyer, { status: "ACTIVE", twoFactorVerifiedAt: new Date() }, env)).toBe(true);
  });

  it("does not require 2FA for client sessions", () => {
    expect(requiresTwoFactor(ROLES.client)).toBe(false);
    expect(initialSessionStatusForRole(ROLES.client)).toBe("ACTIVE");
    expect(canFinalizeSession(ROLES.client, { status: "ACTIVE" })).toBe(true);
  });

  it("keeps staff reset permission restricted to super admin", () => {
    expect(hasPermission({ roleName: ROLES.superAdmin }, "twoFactor.reset.staff")).toBe(true);
    expect(hasPermission({ roleName: ROLES.officeAdmin }, "twoFactor.reset.staff")).toBe(false);
    expect(hasPermission({ roleName: ROLES.lawyer }, "twoFactor.reset.staff")).toBe(false);
    expect(hasPermission({ roleName: ROLES.client }, "twoFactor.reset.staff")).toBe(false);
  });

  it("expires email OTP challenges after the configured window", () => {
    const now = new Date("2026-06-23T10:00:00.000Z");
    expect(emailOtpExpiryDate(now).toISOString()).toBe("2026-06-23T10:10:00.000Z");
  });

  it("generates RFC-compatible TOTP codes", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const now = new Date(59_000);

    expect(generateTotpCode(secret, { now, digits: 8 })).toBe("94287082");
    expect(verifyTotpCode(secret, "94287082", { now, digits: 8, window: 0 })).toBe(true);
    expect(verifyTotpCode(secret, "00000000", { now, digits: 8, window: 0 })).toBe(false);
  });

  it("hashes email OTPs without storing the raw OTP", () => {
    const otpHash = hashEmailOtp({ otp: "123456", userId: "user-1", purpose: "STAFF_2FA" });

    expect(otpHash).not.toContain("123456");
    expect(verifyEmailOtpHash({ otp: "123456", userId: "user-1", purpose: "STAFF_2FA", otpHash })).toBe(true);
    expect(verifyEmailOtpHash({ otp: "654321", userId: "user-1", purpose: "STAFF_2FA", otpHash })).toBe(false);
  });

  it("locks session-level 2FA attempts after the configured threshold", () => {
    const now = new Date("2026-06-24T12:00:00.000Z");

    expect(twoFactorLockedUntilForAttempt(4, now)).toBeNull();
    const lockedUntil = twoFactorLockedUntilForAttempt(5, now);
    expect(lockedUntil?.toISOString()).toBe("2026-06-24T12:10:00.000Z");
    expect(isTwoFactorSessionLocked({ twoFactorLockedUntil: lockedUntil }, now)).toBe(true);
    expect(isTwoFactorSessionLocked({ twoFactorLockedUntil: lockedUntil }, new Date("2026-06-24T12:11:00.000Z"))).toBe(false);
  });
});
