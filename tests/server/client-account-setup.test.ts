import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_ACCOUNT_SETUP_TOKEN_TTL_MS,
  createClientAccountSetupToken,
  publicClientAccountSetupSchema,
  publicClientAccountSetupTarget,
  verifyClientAccountSetupToken
} from "@/server/portal/client-account-setup-service";

const clientId = "11111111-1111-4111-8111-111111111111";
const consultationId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-07-05T10:00:00.000Z");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("client account setup contract", () => {
  it("signs successful-consultation setup links with expiry and tamper protection", () => {
    vi.stubEnv("CLIENT_ACCOUNT_SETUP_SIGNING_SECRET", "client-account-setup-secret-32-plus-chars");

    const token = createClientAccountSetupToken({
      clientId,
      consultationId,
      email: "client@example.com",
      now
    });

    const payload = verifyClientAccountSetupToken(token.value, now);
    expect(payload).toMatchObject({
      purpose: "client_account_setup",
      version: 1,
      clientId,
      consultationId,
      email: "client@example.com"
    });
    expect(token.expiresAt.getTime()).toBe(now.getTime() + CLIENT_ACCOUNT_SETUP_TOKEN_TTL_MS);

    const tampered = `${token.value.slice(0, -1)}x`;
    expect(() => verifyClientAccountSetupToken(tampered, now)).toThrow();
    expect(() => verifyClientAccountSetupToken(token.value, new Date(token.expiresAt.getTime() + 1))).toThrow();
  });

  it("builds a setup URL for new clients and a login URL for existing client accounts", () => {
    vi.stubEnv("CLIENT_ACCOUNT_SETUP_SIGNING_SECRET", "client-account-setup-secret-32-plus-chars");
    vi.stubEnv("APP_ORIGIN", "https://kmt.test");

    const setup = publicClientAccountSetupTarget({
      client: { id: clientId, email: null, userId: null },
      consultationId,
      now
    });
    expect(setup.status).toBe("setup_available");
    expect(setup.status === "setup_available" ? setup.setupUrl : "").toContain("https://kmt.test/client-account/setup?token=");

    const existing = publicClientAccountSetupTarget({
      client: { id: clientId, email: "client@example.com", userId: "33333333-3333-4333-8333-333333333333" },
      consultationId,
      now
    });
    expect(existing).toEqual({
      status: "existing_account",
      loginUrl: "/login?next=/client",
      email: "client@example.com"
    });
  });

  it("requires a valid email and matching strong password before public account creation", () => {
    const valid = publicClientAccountSetupSchema.parse({
      token: "x".repeat(40),
      email: "client@example.com",
      password: "strong-pass-123",
      confirmPassword: "strong-pass-123",
      locale: "ar"
    });
    expect(valid.email).toBe("client@example.com");

    expect(() =>
      publicClientAccountSetupSchema.parse({
        token: "x".repeat(40),
        email: "not-email",
        password: "short",
        confirmPassword: "different",
        locale: "ar"
      })
    ).toThrow();
  });
});
