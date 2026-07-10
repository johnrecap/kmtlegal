import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  assertProviderReadyForActivation,
  paymentProvider,
  paymentProviderReadiness,
  paymentReservationMinutes,
  requireVerifiedWebhookSignature
} from "@/server/payments/payment-config";
import { createHostedCheckout, verifyWebhookSignature } from "@/server/payments/payment-provider";
import {
  createPaymentReceiptToken,
  createPaymentStatusToken,
  paymentStatusTokenMaxAgeSeconds,
  publicPaymentReceiptUrl,
  verifyPaymentReceiptToken,
  verifyPaymentStatusToken
} from "@/server/payments/payment-receipt-service";
import { adminPaymentGatewaySettingsSchema, activeProviderFromValue } from "@/server/payments/payment-settings-service";
import {
  mapProviderPaymentStatus,
  paidAttemptWebhookConfirmationBlocker,
  paidWebhookPayloadProblem,
  paymentWebhookMoneyComparison,
  publicPaymentAttemptConsultationDto,
  safeWebhookPayloadSnapshot
} from "@/server/payments/payment-service";
import { adminConsultationPricingRuleWriteSchema, consultationPriceDto } from "@/server/payments/pricing-service";
import { consultationBookingFlags, consultationBookingModeFromValue } from "@/server/consultations/consultation-booking-settings";

describe("payment gateway contract", () => {
  it("keeps payment provider config bounded and production signatures required", () => {
    expect(paymentProvider(testEnv({ PAYMENT_PROVIDER: "PayTabs" }))).toBe("paytabs");
    expect(paymentProvider(testEnv({ PAYMENT_PROVIDER: "paymob" }))).toBe("paymob");
    expect(paymentProvider(testEnv())).toBe("paymob");
    expect(() => paymentProvider(testEnv({ PAYMENT_PROVIDER: "stripe" }))).toThrow();
    expect(paymentReservationMinutes(testEnv({ PAYMENT_ATTEMPT_EXPIRY_MINUTES: "15" }))).toBe(15);
    expect(paymentReservationMinutes(testEnv({ PAYMENT_ATTEMPT_EXPIRY_MINUTES: "1" }))).toBe(15);
    expect(requireVerifiedWebhookSignature(testEnv({ APP_ENV: "production" }))).toBe(true);
    expect(requireVerifiedWebhookSignature(testEnv({ PAYMENT_REQUIRE_WEBHOOK_SIGNATURE: "true" }))).toBe(true);
  });

  it("blocks activating Paymob until required server-side env is configured", () => {
    expect(paymentProviderReadiness("paymob", testEnv()).configured).toBe(false);
    expect(paymentProviderReadiness("paymob", testEnv()).missing).toEqual([
      "PAYMOB_SECRET_KEY",
      "PAYMOB_PUBLIC_KEY",
      "PAYMOB_HMAC_SECRET",
      "PAYMOB_PAYMENT_METHOD_IDS"
    ]);
    expect(() => assertProviderReadyForActivation("paymob", testEnv())).toThrow();

    expect(() =>
      assertProviderReadyForActivation(
        "paymob",
        testEnv({
          PAYMOB_SECRET_KEY: "secret",
          PAYMOB_PUBLIC_KEY: "public",
          PAYMOB_HMAC_SECRET: "hmac",
          PAYMOB_PAYMENT_METHOD_IDS: "123,card-moto"
        })
      )
    ).not.toThrow();
  });

  it("keeps PayTabs unavailable for new attempts unless its explicit standby flag is enabled", () => {
    const configured = {
      PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE: "https://payments.test/{attemptId}",
      PAYTABS_WEBHOOK_SECRET: "historical-webhook-secret"
    };
    expect(() => assertProviderReadyForActivation("paytabs", testEnv(configured))).toThrowError(
      expect.objectContaining({ code: "PAYMENT_PROVIDER_DISABLED" })
    );
    expect(() => assertProviderReadyForActivation("paytabs", testEnv({ ...configured, PAYTABS_ENABLED: "true" }))).not.toThrow();
  });

  it("reads stored payment gateway settings with env fallback", () => {
    expect(activeProviderFromValue({ activeProvider: "paymob" })).toBe("paymob");

    vi.stubEnv("PAYMENT_PROVIDER", "paymob");
    try {
      expect(activeProviderFromValue(null)).toBe("paymob");
      expect(activeProviderFromValue({ activeProvider: "stripe" })).toBe("paymob");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("bounds consultation booking mode settings to paid or free AI chat", () => {
    expect(consultationBookingModeFromValue(null)).toBe("AI_CHAT_PAID");
    expect(consultationBookingModeFromValue({ mode: "PAID_CHAT" })).toBe("AI_CHAT_PAID");
    expect(consultationBookingModeFromValue({ mode: "MANUAL_REVIEW" })).toBe("AI_CHAT_FREE");
    expect(consultationBookingModeFromValue({ mode: "free_booking" })).toBe("AI_CHAT_PAID");
    expect(consultationBookingFlags("AI_CHAT_PAID")).toMatchObject({
      bookingMode: "AI_CHAT_PAID",
      paymentEnabled: true,
      aiChatEnabled: true
    });
    expect(consultationBookingFlags("AI_CHAT_FREE")).toMatchObject({
      bookingMode: "AI_CHAT_FREE",
      paymentEnabled: false,
      aiChatEnabled: true
    });
    expect(
      adminPaymentGatewaySettingsSchema.parse({
        activeProvider: "paymob",
        bookingMode: "AI_CHAT_FREE"
      })
    ).toMatchObject({ activeProvider: "paymob", bookingMode: "AI_CHAT_FREE" });
    expect(
      adminPaymentGatewaySettingsSchema.parse({
        activeProvider: "paymob",
        bookingMode: "MANUAL_REVIEW"
      })
    ).toMatchObject({ activeProvider: "paymob", bookingMode: "AI_CHAT_FREE" });
    expect(() =>
      adminPaymentGatewaySettingsSchema.parse({
        activeProvider: "paytabs",
        bookingMode: "FREE_AUTO_CONFIRM"
      })
    ).toThrow();
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

  it("signs public payment receipt links and rejects tampered tokens", () => {
    const env = testEnv({ PAYMENT_RECEIPT_SIGNING_SECRET: "receipt-secret-32-characters-long", PAYMENT_RECEIPT_TOKEN_MAX_AGE_SECONDS: "3600" });
    const attemptId = "11111111-1111-4111-8111-111111111111";
    const paymentId = "22222222-2222-4222-8222-222222222222";
    const issuedAt = new Date("2026-07-07T00:00:00.000Z");
    const token = createPaymentReceiptToken({ attemptId, paymentId, issuedAt }, env);

    expect(verifyPaymentReceiptToken({ attemptId, token, now: new Date("2026-07-07T00:59:59.000Z") }, env)).toMatchObject({ attemptId, paymentId });
    expect(verifyPaymentReceiptToken({ attemptId, token, now: new Date("2026-07-07T01:00:00.000Z") }, env)).toBeNull();
    expect(verifyPaymentReceiptToken({ attemptId: "33333333-3333-4333-8333-333333333333", token, now: issuedAt }, env)).toBeNull();
    expect(verifyPaymentReceiptToken({ attemptId, token: `${token}tampered`, now: issuedAt }, env)).toBeNull();

    vi.stubEnv("PAYMENT_RECEIPT_SIGNING_SECRET", "receipt-secret-32-characters-long");
    try {
      const url = publicPaymentReceiptUrl({ attemptId, paymentId });
      expect(url).toContain("/payment/consultation/receipt?");
      expect(url).toContain(`attemptId=${attemptId}`);
      expect(new URL(`https://kmt.test${url}`).searchParams.get("token")).toBeTruthy();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("signs public payment status links and rejects attempt id tampering", () => {
    const env = testEnv({ PAYMENT_STATUS_SIGNING_SECRET: "status-secret-32-characters-long", PAYMENT_STATUS_TOKEN_MAX_AGE_SECONDS: "1800" });
    const attemptId = "11111111-1111-4111-8111-111111111111";
    const issuedAt = new Date("2026-07-07T00:00:00.000Z");
    const token = createPaymentStatusToken({ attemptId, issuedAt }, env);

    expect(paymentStatusTokenMaxAgeSeconds(env)).toBe(1800);
    expect(verifyPaymentStatusToken({ attemptId, token, now: new Date("2026-07-07T00:29:59.000Z") }, env)).toMatchObject({ attemptId });
    expect(verifyPaymentStatusToken({ attemptId, token, now: new Date("2026-07-07T00:30:00.000Z") }, env)).toBeNull();
    expect(verifyPaymentStatusToken({ attemptId: "33333333-3333-4333-8333-333333333333", token }, env)).toBeNull();
    expect(verifyPaymentStatusToken({ attemptId, token: `${token}tampered` }, env)).toBeNull();
  });

  it("keeps tokenless public payment status free of consultation details", () => {
    const consultation = {
      id: "44444444-4444-4444-8444-444444444444",
      status: "PAYMENT_PENDING",
      summary: "Sensitive legal dispute summary",
      urgency: "URGENT",
      preferredMode: "ONLINE",
      serviceCategory: "claims-collections",
      city: "Cairo"
    };

    const safe = publicPaymentAttemptConsultationDto(consultation, false);
    expect(safe).toEqual({
      id: consultation.id,
      status: consultation.status
    });
    expect(JSON.stringify(safe)).not.toContain("Sensitive legal dispute summary");
    expect(JSON.stringify(safe)).not.toContain("Cairo");

    expect(publicPaymentAttemptConsultationDto(consultation, true)).toMatchObject({
      summary: consultation.summary,
      city: consultation.city
    });
  });

  it("blocks paid webhook confirmation when amount or currency does not match the attempt", () => {
    const attempt = { amount: new Prisma.Decimal("1500.00"), currency: "EGP" };
    const basePayload = {
      provider: "paytabs" as const,
      attemptId: "11111111-1111-4111-8111-111111111111",
      providerTransactionId: "txn-1",
      rawStatus: "paid",
      status: "PAID" as const,
      amount: "1500.00",
      currency: "EGP"
    };

    expect(paidWebhookPayloadProblem({ payload: basePayload, attempt })).toBeNull();
    expect(paidWebhookPayloadProblem({ payload: { ...basePayload, amount: "1499.99" }, attempt })?.code).toBe("PAYMENT_AMOUNT_MISMATCH");
    expect(paidWebhookPayloadProblem({ payload: { ...basePayload, currency: "USD" }, attempt })?.code).toBe("PAYMENT_CURRENCY_MISMATCH");

    const source = readFileSync(join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");
    expect(source).toContain('await releaseFailedAttempt({ tx, attempt, status: "FAILED", failureCode: paidPayloadProblem.code })');
  });

  it("compares client-requested money with provider webhook money for finance review", () => {
    const attempt = { amount: new Prisma.Decimal("1500.00"), currency: "EGP" };
    const normalizedPayload = {
      provider: "paymob",
      attemptId: "11111111-1111-4111-8111-111111111111",
      providerTransactionId: "txn-1",
      rawStatus: "paid",
      status: "PAID",
      amount: "1500.00",
      currency: "EGP"
    };

    expect(paymentWebhookMoneyComparison({ normalizedPayload, attempt }).status).toBe("MATCHED");
    expect(paymentWebhookMoneyComparison({ normalizedPayload: { ...normalizedPayload, amount: "1400.00" }, attempt }).status).toBe("AMOUNT_MISMATCH");
    expect(paymentWebhookMoneyComparison({ normalizedPayload: { ...normalizedPayload, currency: "USD" }, attempt }).status).toBe("CURRENCY_MISMATCH");
    expect(paymentWebhookMoneyComparison({ normalizedPayload, attempt: null }).status).toBe("MISSING_ATTEMPT");
    expect(paymentWebhookMoneyComparison({ normalizedPayload: { ...normalizedPayload, status: "FAILED" }, attempt }).status).toBe("NOT_PAID");
  });

  it("keeps webhook events immutable and blocks transaction relinking across attempts", () => {
    const source = readFileSync(join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

    expect(source).toContain("recordWebhookPayloadMismatch");
    expect(source).toContain("webhook_payload_hash_mismatch");
    expect(source).toContain("payment.webhook_payload_mismatch");
    expect(source).toContain("safeWebhookPayloadSnapshot");
    expect(source).toContain("receivedPayloadSnapshot");
    expect(schema).toContain("payloadSnapshot  Json?");
    expect(source).toContain("existingTransaction.attemptId !== input.attemptId");
    expect(source).toContain("provider_transaction_attempt_mismatch");
    expect(source).not.toContain("attemptId: input.attemptId,\n          rawStatus: input.rawStatus");
  });

  it("stores only a redacted webhook payload snapshot for payment audit trails", () => {
    const snapshot = safeWebhookPayloadSnapshot({
      eventId: "evt-1",
      fullName: "Sensitive Client",
      email: "client@example.com",
      phone: "+201001234567",
      obj: {
        id: "txn-1",
        amount_cents: 150000,
        billing_data: {
          first_name: "Sensitive",
          phone_number: "+201001234567"
        }
      }
    });

    expect(JSON.stringify(snapshot)).toContain("evt-1");
    expect(JSON.stringify(snapshot)).toContain("150000");
    expect(JSON.stringify(snapshot)).not.toContain("Sensitive Client");
    expect(JSON.stringify(snapshot)).not.toContain("client@example.com");
    expect(JSON.stringify(snapshot)).not.toContain("+201001234567");
  });

  it("expires only the requested public payment status attempt and batches global expiry", () => {
    const source = readFileSync(join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");

    expect(source).toContain("expireOpenConsultationPaymentAttempts(new Date(), { attemptId })");
    expect(source).toContain("take: limit");
    expect(source).toContain('orderBy: { expiresAt: "asc" }');
  });

  it("creates a Paymob hosted checkout intention without exposing secrets", async () => {
    vi.stubEnv("PAYMOB_SECRET_KEY", "paymob-secret");
    vi.stubEnv("PAYMOB_PUBLIC_KEY", "paymob-public");
    vi.stubEnv("PAYMOB_HMAC_SECRET", "paymob-hmac");
    vi.stubEnv("PAYMOB_PAYMENT_METHOD_IDS", "123,456");
    vi.stubEnv("PAYMOB_API_BASE_URL", "https://accept.test");
    vi.stubEnv("PAYMOB_CHECKOUT_BASE_URL", "https://accept.test/unifiedcheckout/");

    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: "intent_1", client_secret: "client_secret_1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await createHostedCheckout({
        provider: "paymob",
        attemptId: "11111111-1111-4111-8111-111111111111",
        amount: "1500.13",
        currency: "EGP",
        description: "Consultation booking",
        customer: {
          name: "Test Client",
          email: "client@example.com",
          phone: "+201000000000"
        },
        request: new Request("https://kmt.test/booking")
      });

      expect(result.provider).toBe("paymob");
      expect(result.providerSessionId).toBe("intent_1");
      expect(result.checkoutUrl).toContain("https://accept.test/unifiedcheckout/");
      expect(result.checkoutUrl).toContain("publicKey=paymob-public");
      expect(result.checkoutUrl).toContain("clientSecret=client_secret_1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://accept.test/v1/intention/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Token paymob-secret",
            "Content-Type": "application/json"
          })
        })
      );
      const requestInit = fetchMock.mock.calls[0]?.[1];
      const payload = JSON.parse(String(requestInit?.body));
      expect(payload).toMatchObject({
        amount: 150013,
        currency: "EGP",
        payment_methods: [123, 456],
        notification_url: "https://kmt.test/api/webhooks/paymob",
        redirection_url: "https://kmt.test/payment/consultation/return?attemptId=11111111-1111-4111-8111-111111111111"
      });
      expect(payload.extras).toMatchObject({ attemptId: "11111111-1111-4111-8111-111111111111" });
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it("verifies Paymob webhook HMAC signatures", () => {
    const payload = {
      obj: {
        id: 123,
        amount_cents: 150013,
        currency: "EGP",
        success: true,
        order: {
          merchant_order_id: "11111111-1111-4111-8111-111111111111"
        }
      }
    };
    const rawBody = JSON.stringify(payload);
    const secret = "paymob-hmac";
    const signature = createHmac("sha512", secret).update(rawBody).digest("hex");

    expect(
      verifyWebhookSignature({
        rawBody,
        signature,
        secret,
        provider: "paymob",
        parsedBody: payload
      })
    ).toBe(true);
    expect(
      verifyWebhookSignature({
        rawBody,
        signature: `sha512=${signature}`,
        secret,
        provider: "paymob",
        parsedBody: payload
      })
    ).toBe(true);
    expect(
      verifyWebhookSignature({
        rawBody,
        signature: "bad",
        secret,
        provider: "paymob",
        parsedBody: payload
      })
    ).toBe(false);
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

  it("blocks late paid webhooks from confirming expired or released appointments", () => {
    const now = new Date("2026-07-04T12:00:00.000Z");
    const futureExpiry = new Date("2026-07-04T12:10:00.000Z");
    const pastExpiry = new Date("2026-07-04T11:59:00.000Z");

    expect(
      paidAttemptWebhookConfirmationBlocker(
        {
          attemptStatus: "PENDING",
          expiresAt: futureExpiry,
          appointmentStatus: "RESERVED",
          consultationStatus: "PAYMENT_PENDING"
        },
        now
      )
    ).toBe("");
    expect(
      paidAttemptWebhookConfirmationBlocker(
        {
          attemptStatus: "EXPIRED",
          expiresAt: pastExpiry,
          appointmentStatus: "CANCELLED",
          consultationStatus: "REVIEWING"
        },
        now
      )
    ).toContain("can no longer confirm");
    expect(
      paidAttemptWebhookConfirmationBlocker(
        {
          attemptStatus: "PENDING",
          expiresAt: pastExpiry,
          appointmentStatus: "RESERVED",
          consultationStatus: "PAYMENT_PENDING"
        },
        now
      )
    ).toContain("expired");
    expect(
      paidAttemptWebhookConfirmationBlocker(
        {
          attemptStatus: "PENDING",
          expiresAt: futureExpiry,
          appointmentStatus: "CANCELLED",
          consultationStatus: "PAYMENT_PENDING"
        },
        now
      )
    ).toContain("no longer reserved");
  });

  it("keeps already-paid attempts from being downgraded by later non-paid webhooks", () => {
    const source = readFileSync(join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");

    expect(source).toContain("async function updateOpenAttemptStatus");
    expect(source).toContain('input.attempt.payment || input.attempt.status === "PAID"');
    expect(source).toContain("await updateOpenAttemptStatus");
  });

  it("creates secretary review notifications only after paid webhook confirmation", () => {
    const source = readFileSync(join(process.cwd(), "src/server/payments/payment-service.ts"), "utf8");
    const paidConfirmationIndex = source.indexOf("async function confirmPaidAttempt");
    const notificationIndex = source.indexOf("createConsultationReviewNotifications", paidConfirmationIndex);
    const openAttemptUpdateIndex = source.indexOf("async function updateOpenAttemptStatus");

    expect(paidConfirmationIndex).toBeGreaterThan(-1);
    expect(notificationIndex).toBeGreaterThan(paidConfirmationIndex);
    expect(notificationIndex).toBeLessThan(openAttemptUpdateIndex);
    expect(source).toContain("consultationId: input.attempt.consultationRequestId");
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
