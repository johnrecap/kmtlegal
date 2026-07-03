import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { paymentProvider, paymentReservationMinutes, requireVerifiedWebhookSignature } from "@/server/payments/payment-config";
import { verifyWebhookSignature } from "@/server/payments/payment-provider";
import { mapProviderPaymentStatus } from "@/server/payments/payment-service";
import { adminConsultationPricingRuleWriteSchema, consultationPriceDto } from "@/server/payments/pricing-service";

describe("payment gateway contract", () => {
  it("keeps payment provider config bounded and production signatures required", () => {
    expect(paymentProvider(testEnv({ PAYMENT_PROVIDER: "PayTabs" }))).toBe("paytabs");
    expect(paymentProvider(testEnv())).toBe("paytabs");
    expect(paymentReservationMinutes(testEnv({ PAYMENT_ATTEMPT_EXPIRY_MINUTES: "15" }))).toBe(15);
    expect(paymentReservationMinutes(testEnv({ PAYMENT_ATTEMPT_EXPIRY_MINUTES: "1" }))).toBe(15);
    expect(requireVerifiedWebhookSignature(testEnv({ APP_ENV: "production" }))).toBe(true);
    expect(requireVerifiedWebhookSignature(testEnv({ PAYMENT_REQUIRE_WEBHOOK_SIGNATURE: "true" }))).toBe(true);
  });

  it("verifies webhook HMAC signatures with constant-time hex comparison", () => {
    const rawBody = JSON.stringify({ attemptId: "attempt-1", status: "paid" });
    const secret = "test-webhook-secret";
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

    expect(verifyWebhookSignature({ rawBody, signature, secret })).toBe(true);
    expect(verifyWebhookSignature({ rawBody, signature: `sha256=${signature}`, secret })).toBe(true);
    expect(verifyWebhookSignature({ rawBody, signature: "bad", secret })).toBe(false);
    expect(verifyWebhookSignature({ rawBody, signature, secret: "wrong" })).toBe(false);
  });

  it("maps provider statuses into the internal payment attempt states", () => {
    expect(mapProviderPaymentStatus("A")).toBe("PAID");
    expect(mapProviderPaymentStatus("pending")).toBe("PENDING");
    expect(mapProviderPaymentStatus("refunded")).toBe("REFUNDED");
    expect(mapProviderPaymentStatus("chargeback")).toBe("DISPUTED");
    expect(mapProviderPaymentStatus("void")).toBe("CANCELLED");
    expect(mapProviderPaymentStatus("expired")).toBe("EXPIRED");
    expect(mapProviderPaymentStatus("declined")).toBe("FAILED");
  });

  it("validates admin consultation pricing rules and price snapshots", () => {
    const rule = adminConsultationPricingRuleWriteSchema.parse({
      serviceCategory: "claims-collections",
      mode: "ONLINE",
      amount: "1500.129",
      currency: "EGP",
      active: true,
      effectiveFrom: "2026-07-03T00:00:00.000Z",
      version: "2",
      label: "Online deposit"
    });

    expect(rule.amount).toBe(1500.13);
    expect(rule.version).toBe(2);
    expect(() =>
      adminConsultationPricingRuleWriteSchema.parse({
        serviceCategory: "claims-collections",
        mode: "ONLINE",
        amount: 0,
        currency: "EGP",
        active: true,
        effectiveFrom: "2026-07-03T00:00:00.000Z"
      })
    ).toThrow();

    const dto = consultationPriceDto({
      amount: new Prisma.Decimal("1500.13"),
      amountText: "1500.13",
      currency: "EGP",
      pricingRuleId: "11111111-1111-4111-8111-111111111111",
      priceVersion: 2,
      serviceCategory: "claims-collections",
      mode: "ONLINE",
      label: "Online deposit"
    });
    expect(dto).toMatchObject({
      amount: "1500.13",
      currency: "EGP",
      priceVersion: 2,
      mode: "ONLINE"
    });
  });
});

function testEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values } as NodeJS.ProcessEnv;
}
