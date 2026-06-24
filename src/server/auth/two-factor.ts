import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { isStaffRole } from "./policy";

export const STAFF_2FA_MODE_ENV = "STAFF_2FA_MODE";
export const EMAIL_OTP_PURPOSE = "STAFF_2FA";
export const EMAIL_OTP_EXPIRY_MINUTES = 10;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_SESSION_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_SESSION_LOCK_MINUTES = 10;

function getOtpHashSecret() {
  const secret = process.env.AUTH_SECRET ?? "local-dev-only-auth-secret-do-not-use-in-production";
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return secret;
}

export function staffTwoFactorMode(env: NodeJS.ProcessEnv = process.env) {
  return env[STAFF_2FA_MODE_ENV] === "totp" ? "totp" : "disabled";
}

export function isStaffTwoFactorEnabled(env: NodeJS.ProcessEnv = process.env) {
  return staffTwoFactorMode(env) === "totp";
}

export function requiresTwoFactor(roleName: string, env: NodeJS.ProcessEnv = process.env) {
  return isStaffRole(roleName) && isStaffTwoFactorEnabled(env);
}

export function initialSessionStatusForRole(roleName: string, env: NodeJS.ProcessEnv = process.env) {
  return requiresTwoFactor(roleName, env) ? "PENDING_2FA" : "ACTIVE";
}

export function canFinalizeSession(
  roleName: string,
  session: { status: string; twoFactorVerifiedAt?: Date | string | null },
  env: NodeJS.ProcessEnv = process.env
) {
  if (session.status !== "ACTIVE") {
    return false;
  }
  return !requiresTwoFactor(roleName, env) || Boolean(session.twoFactorVerifiedAt);
}

export function twoFactorLockedUntilForAttempt(attemptCount: number, now = new Date()) {
  return attemptCount >= TWO_FACTOR_SESSION_MAX_ATTEMPTS
    ? new Date(now.getTime() + TWO_FACTOR_SESSION_LOCK_MINUTES * 60_000)
    : null;
}

export function isTwoFactorSessionLocked(
  session: { twoFactorLockedUntil?: Date | string | null },
  now = new Date()
) {
  if (!session.twoFactorLockedUntil) {
    return false;
  }

  return new Date(session.twoFactorLockedUntil).getTime() > now.getTime();
}

export function generateEmailOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function emailOtpExpiryDate(now = new Date()) {
  return new Date(now.getTime() + EMAIL_OTP_EXPIRY_MINUTES * 60_000);
}

export function hashEmailOtp({
  otp,
  userId,
  purpose
}: {
  otp: string;
  userId: string;
  purpose: string;
}) {
  return createHmac("sha256", getOtpHashSecret()).update(`${userId}:${purpose}:${otp}`).digest("base64url");
}

export function verifyEmailOtpHash(input: {
  otp: string;
  userId: string;
  purpose: string;
  otpHash: string;
}) {
  const actual = Buffer.from(hashEmailOtp(input), "base64url");
  const expected = Buffer.from(input.otpHash, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
