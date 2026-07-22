import { describe, expect, it, vi } from "vitest";
import {
  AnalyticsPrivacyError,
  actorHash,
  buildAnalyticsEventData,
  fileSizeBucket,
  parseClientAnalyticsEvent,
  safeFileType,
  sanitizeAnalyticsProperties
} from "@/server/observability/analytics-service";
import { safeLog } from "@/server/observability/safe-log";
import {
  PAYMENT_CHECKOUT_RECONCILIATION_EVENT,
  paymentCheckoutReconciliationMetadata
} from "@/server/consultations/consultation-assistant-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const staff: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["case.update.any"]
};

describe("privacy-safe analytics and observability contract", () => {
  it("accepts only allowlisted client analytics events", () => {
    const event = parseClientAnalyticsEvent({
      name: "booking.step_viewed",
      source: "PUBLIC",
      properties: {
        step: "contact",
        stepIndex: 0,
        serviceCategory: "corporate"
      }
    });

    expect(event.name).toBe("booking.step_viewed");
    expect(event.source).toBe("PUBLIC");

    expect(() =>
      parseClientAnalyticsEvent({
        name: "case.status_updated",
        source: "PUBLIC",
        properties: {
          previousStatus: "NEW",
          status: "ACTIVE",
          actorScope: "admin"
        }
      })
    ).toThrow(ApiError);
  });

  it("rejects PII, legal summaries, document content, and unknown properties", () => {
    expect(() =>
      sanitizeAnalyticsProperties("booking.step_viewed", {
        step: "contact",
        stepIndex: 0,
        serviceCategory: "john@example.com"
      })
    ).toThrow(ApiError);

    expect(() =>
      sanitizeAnalyticsProperties("case.status_updated", {
        previousStatus: "NEW",
        status: "ACTIVE",
        actorScope: "admin",
        caseSummary: "Private facts"
      })
    ).toThrow(ApiError);

    expect(() =>
      sanitizeAnalyticsProperties("booking.step_viewed", {
        step: "contact",
        stepIndex: 0,
        serviceCategory: "KMT-2026-ABCD"
      })
    ).toThrow(AnalyticsPrivacyError);
  });

  it("builds storage-ready events without raw actor ids", () => {
    process.env.AUTH_SECRET = "test-analytics-secret";
    process.env.APP_ENV = "test";
    process.env.APP_RELEASE = "plan-21";

    const data = buildAnalyticsEventData({
      name: "case.status_updated",
      source: "ADMIN",
      outcome: "SUCCESS",
      actor: staff,
      requestId: "req_test",
      properties: {
        previousStatus: "NEW",
        status: "ACTIVE",
        actorScope: "admin"
      }
    });

    expect(data.actorHash).toHaveLength(64);
    expect(data.actorHash).not.toBe(staff.id);
    expect(data.actorRole).toBe(ROLES.officeAdmin);
    expect(data.environment).toBe("test");
    expect(data.release).toBe("plan-21");
    expect(data.requestId).toBe("req_test");
  });

  it("normalizes safe file telemetry dimensions", () => {
    expect(fileSizeBucket(0)).toBe("unknown");
    expect(fileSizeBucket(512 * 1024)).toBe("0-1MB");
    expect(fileSizeBucket(2 * 1024 * 1024)).toBe("1-3MB");
    expect(fileSizeBucket(4 * 1024 * 1024)).toBe("3-5MB");
    expect(fileSizeBucket(6 * 1024 * 1024)).toBe("5MB+");

    expect(safeFileType("application/pdf")).toBe("application/pdf");
    expect(safeFileType("application/x-msdownload")).toBe("unknown");
  });

  it("hashes actors deterministically and logs with redaction", () => {
    process.env.AUTH_SECRET = "test-analytics-secret";
    expect(actorHash(staff)).toBe(actorHash(staff));
    expect(actorHash(null)).toBeNull();

    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    safeLog("info", "test.event", {
      requestId: "req_test",
      password: "secret",
      prompt: "raw legal prompt",
      safe: "ok"
    });

    expect(info).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(payload.metadata.password).toBe("[REDACTED]");
    expect(payload.metadata.prompt).toBe("[REDACTED]");
    expect(payload.metadata.safe).toBe("ok");
    info.mockRestore();
  });

  it("allowlists the exactly-once paid-booking reconciliation event metadata", () => {
    const metadata = paymentCheckoutReconciliationMetadata({
      requestId: "req-checkout",
      provider: "paymob",
      paymentAttemptId: "35000000-0000-4000-8000-000000000090",
      providerCheckoutId: "provider-session-1",
      password: "must-not-survive",
      checkoutUrl: "https://payment.example/private-token",
      email: "client@example.invalid"
    } as never);

    expect(Object.keys(metadata).sort()).toEqual([
      "failureCode",
      "paymentAttemptId",
      "provider",
      "providerCheckoutId",
      "requestId",
      "retryPolicy",
      "source"
    ]);
    expect(metadata).toMatchObject({
      failureCode: "P2034",
      retryPolicy: "single_attempt",
      source: "public_booking"
    });
    expect(JSON.stringify(metadata)).not.toMatch(/password|checkoutUrl|client@example/);

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    safeLog("error", PAYMENT_CHECKOUT_RECONCILIATION_EVENT, metadata);
    expect(error).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(error.mock.calls[0]?.[0]));
    expect(payload.event).toBe("payment.checkout_reconciliation_required");
    expect(payload.metadata).toEqual(metadata);
    error.mockRestore();
  });
});
