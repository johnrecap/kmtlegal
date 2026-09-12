import { createHash, createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/server/http/errors";
import { paymentApiSourceMessages } from "@/lib/ui-copy";
import {
  assertLiveProviderConfigured,
  paymobApiBaseUrl,
  paymobCheckoutBaseUrl,
  paymobPaymentMethodIds,
  paymobRequestTimeoutMs,
  paytabsHostedCheckoutTemplate,
  paymentFailureUrl,
  paymentProvider,
  paymentReturnUrl,
  paymentWebhookUrl,
  type PaymentProviderName
} from "./payment-config";

export type HostedCheckoutInput = {
  attemptId: string;
  amount: string;
  currency: string;
  description: string;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  request?: Request;
  provider?: PaymentProviderName;
  statusToken?: string | null;
  locale?: "ar" | "en" | null;
  expiresAt?: Date;
};

export type HostedCheckoutResult = {
  provider: PaymentProviderName;
  checkoutUrl: string;
  providerSessionId: string;
  providerOrderId?: string;
};

export type NormalizedWebhookPayload = {
  provider: PaymentProviderName;
  attemptId: string;
  providerTransactionId: string | null;
  providerOrderId?: string;
  rawStatus: string;
  status: ReturnType<typeof mapProviderPaymentStatus>;
  amount: string;
  currency: string;
};

export async function createHostedCheckout(input: HostedCheckoutInput): Promise<HostedCheckoutResult> {
  const provider = input.provider ?? paymentProvider();
  if (provider === "paymob") {
    return createPaymobHostedCheckout(input);
  }

  return createPaytabsHostedCheckout(input);
}

function createPaytabsHostedCheckout(input: HostedCheckoutInput): HostedCheckoutResult {
  assertLiveProviderConfigured("paytabs");

  const templatedUrl = paytabsHostedCheckoutTemplate();
  if (templatedUrl) {
    return {
      provider: "paytabs",
      checkoutUrl: renderCheckoutTemplate(templatedUrl, input),
      providerSessionId: input.attemptId
    };
  }

  return {
    provider: "paytabs",
    checkoutUrl: paymentReturnUrl(input.attemptId, input.request, statusReturnOptions(input)),
    providerSessionId: input.attemptId
  };
}

async function createPaymobHostedCheckout(input: HostedCheckoutInput): Promise<HostedCheckoutResult> {
  assertLiveProviderConfigured("paymob");

  const paymentMethods = paymobPaymentMethodIds();
  if (!paymentMethods.length) {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Paymob payment methods are not configured.");
  }

  const amountMinor = decimalAmountToMinorUnits(input.amount);
  const returnUrl = paymentReturnUrl(input.attemptId, input.request, statusReturnOptions(input));
  const failureUrl = paymentFailureUrl(input.attemptId, input.request, statusReturnOptions(input));
  const payload = {
    amount: amountMinor,
    ...(input.expiresAt ? {expiration: Math.max(1, Math.floor((input.expiresAt.getTime() - Date.now()) / 1000))} : {}),
    currency: input.currency,
    payment_methods: paymentMethods,
    items: [
      {
        name: "KMT Legal consultation booking",
        amount: amountMinor,
        description: input.description,
        quantity: 1
      }
    ],
    billing_data: paymobBillingData(input.customer),
    customer: paymobCustomer(input.customer),
    extras: {
      attemptId: input.attemptId,
      returnUrl,
      failureUrl
    },
    notification_url: paymentWebhookUrl("paymob", input.request),
    redirection_url: returnUrl
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), paymobRequestTimeoutMs());
  let response: Response;

  try {
    response = await fetch(`${paymobApiBaseUrl()}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(504, "SERVICE_UNAVAILABLE", "Paymob checkout creation timed out.");
    }
    throw new ApiError(502, "SERVICE_UNAVAILABLE", "Paymob checkout creation failed.");
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(502, "SERVICE_UNAVAILABLE", "Paymob checkout creation failed.");
  }

  const clientSecret = stringValue(body.client_secret) || stringValue(body.clientSecret);
  const checkoutUrl = stringValue(body.checkout_url) || stringValue(body.checkoutUrl) || buildPaymobCheckoutUrl(clientSecret);
  const providerSessionId = stringValue(body.id) || stringValue(body.intention_id) || stringValue(body.intentionId) || input.attemptId;
  const providerOrderId = stringValue(body.intention_order_id);

  if (!checkoutUrl) {
    throw new ApiError(502, "SERVICE_UNAVAILABLE", "Paymob checkout response did not include a checkout URL.");
  }
  if (!/^\d+$/.test(providerOrderId)) {
    throw new ApiError(502, "SERVICE_UNAVAILABLE", paymentApiSourceMessages.checkoutOrderMissing);
  }

  return {
    provider: "paymob",
    checkoutUrl,
    providerSessionId,
    providerOrderId
  };
}

export function verifyWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  secret: string;
  provider?: PaymentProviderName;
  parsedBody?: Record<string, unknown>;
}) {
  if (!input.secret || !input.signature) {
    return false;
  }

  const signature = normalizeSignature(input.signature);
  if (input.provider === "paymob") {
    const canonical = paymobWebhookHmacSource(input.parsedBody);
    return Boolean(canonical && timingSafeHexEqual(signature, createHmac("sha512", input.secret).update(canonical).digest("hex")));
  }
  const expected = [
    createHmac("sha256", input.secret).update(input.rawBody).digest("hex")
  ];

  return expected.some((candidate) => timingSafeHexEqual(signature, candidate));
}

export function webhookSignature(request: Request, provider: PaymentProviderName, body?: Record<string, unknown>) {
  if (provider === "paymob") {
    const url = new URL(request.url);
    return (
      url.searchParams.get("hmac") ||
      request.headers.get("x-paymob-hmac") ||
      stringValue(body?.hmac) ||
      stringValue(nestedValue(body, ["obj", "hmac"]))
    );
  }

  return (
    request.headers.get("x-kmt-payment-signature") ||
    request.headers.get("x-paytabs-signature") ||
    request.headers.get("signature") ||
    request.headers.get("Signature")
  );
}

export function providerWebhookEventId(body: Record<string, unknown>, provider: PaymentProviderName, payloadHash: string) {
  if (provider === "paymob") {
    const obj = paymobWebhookObject(body);
    // Paymob's id identifies a transaction, not a lifecycle event. Only signed
    // fields define an observation; unsigned metadata cannot create another event.
    return `${stringValue(obj.id)}:${paymobWebhookFingerprint(body)}`;
  }

  return String(body.eventId || body.id || body.tran_ref || body.transaction_id || body.cart_id || payloadHash);
}

export function paymobWebhookFingerprint(body: Record<string, unknown>) {
  return createHash("sha256").update(paymobWebhookHmacSource(body)).digest("hex");
}

export function normalizeProviderWebhookPayload(
  body: Record<string, unknown>,
  provider: PaymentProviderName,
  payloadHash: string
): NormalizedWebhookPayload {
  if (provider === "paymob") {
    return normalizePaymobWebhookPayload(body, payloadHash);
  }

  return normalizePaytabsWebhookPayload(body, provider);
}

export function mapProviderPaymentStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (["a", "paid", "success", "succeeded", "captured", "approved", "true"].includes(value)) {
    return "PAID" as const;
  }
  if (["p", "pending", "created", "processing", "authorized", "auth"].includes(value)) {
    return "PENDING" as const;
  }
  if (["r", "refunded", "refund"].includes(value)) {
    return "REFUNDED" as const;
  }
  if (["d", "disputed", "chargeback"].includes(value)) {
    return "DISPUTED" as const;
  }
  if (["c", "cancelled", "canceled", "void", "voided"].includes(value)) {
    return "CANCELLED" as const;
  }
  if (["expired", "timeout", "timed_out"].includes(value)) {
    return "EXPIRED" as const;
  }
  return "FAILED" as const;
}

function renderCheckoutTemplate(template: string, input: HostedCheckoutInput) {
  const returnUrl = paymentReturnUrl(input.attemptId, input.request, statusReturnOptions(input));
  const failureUrl = paymentFailureUrl(input.attemptId, input.request, statusReturnOptions(input));
  const replacements: Record<string, string> = {
    attemptId: input.attemptId,
    amount: input.amount,
    currency: input.currency,
    returnUrl,
    failureUrl,
    webhookUrl: paymentWebhookUrl("paytabs", input.request)
  };

  return template.replace(/\{(attemptId|amount|currency|returnUrl|failureUrl|webhookUrl)\}/g, (_, key: string) =>
    encodeURIComponent(replacements[key] ?? "")
  );
}

function statusReturnOptions(input: HostedCheckoutInput) {
  return {
    token: input.statusToken,
    locale: input.locale
  };
}

function normalizeSignature(value: string) {
  return value.trim().replace(/^sha(256|512)=/i, "");
}

function timingSafeHexEqual(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) {
    return false;
  }
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function decimalAmountToMinorUnits(amount: string) {
  const [whole = "0", fraction = ""] = amount.split(".");
  const cents = `${fraction}00`.slice(0, 2);
  return Number.parseInt(`${whole.replace(/\D/g, "") || "0"}${cents}`, 10);
}

function paymobBillingData(customer: HostedCheckoutInput["customer"]) {
  const { firstName, lastName } = splitName(customer.name);
  return {
    apartment: "NA",
    first_name: firstName,
    last_name: lastName,
    street: "NA",
    building: "NA",
    phone_number: customer.phone || "NA",
    city: "Cairo",
    country: "EG",
    email: customer.email || "payments@kmtlegal.local",
    floor: "NA",
    state: "NA"
  };
}

function paymobCustomer(customer: HostedCheckoutInput["customer"]) {
  const { firstName, lastName } = splitName(customer.name);
  return {
    first_name: firstName,
    last_name: lastName,
    email: customer.email || "payments@kmtlegal.local"
  };
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "KMT",
    lastName: parts.slice(1).join(" ") || "Legal"
  };
}

function buildPaymobCheckoutUrl(clientSecret: string) {
  if (!clientSecret || !process.env.PAYMOB_PUBLIC_KEY) {
    return "";
  }

  const url = new URL(paymobCheckoutBaseUrl());
  url.searchParams.set("publicKey", process.env.PAYMOB_PUBLIC_KEY);
  url.searchParams.set("clientSecret", clientSecret);
  return url.toString();
}

function normalizePaytabsWebhookPayload(body: Record<string, unknown>, provider: PaymentProviderName): NormalizedWebhookPayload {
  const attemptId = String(body.attemptId || body.cart_id || body.cartId || "");
  const providerTransactionId = String(body.transactionId || body.tran_ref || body.transaction_id || body.providerTransactionId || "");
  const responseStatus = String(body.status || body.respStatus || nestedValue(body, ["payment_result", "response_status"]) || "");
  const transactionType = stringValue(body.tran_type).toLowerCase();
  const status = paytabsPaymentStatus(responseStatus, transactionType);
  const amount = String(body.amount || body.cart_amount || "");
  const currency = String(body.currency || body.cart_currency || "");

  if (!attemptId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Payment webhook attempt id is missing.");
  }

  return {
    provider,
    attemptId,
    providerTransactionId: providerTransactionId || null,
    rawStatus: responseStatus,
    status,
    amount,
    currency
  };
}

export function paytabsPaymentStatus(responseStatus: string, transactionType: string) {
  const code = responseStatus.trim().toUpperCase();
  if (code === "A") {
    if (["sale", "capture"].includes(transactionType)) return "PAID" as const;
    if (transactionType === "refund") return "REFUNDED" as const;
    if (transactionType === "void") return "CANCELLED" as const;
    return "PENDING" as const;
  }
  if (["H", "P"].includes(code)) return "PENDING" as const;
  if (code === "V") return "CANCELLED" as const;
  if (code === "X") return "EXPIRED" as const;
  if (["D", "E"].includes(code)) return "FAILED" as const;
  // The standby template's existing full-word contract is separate from codes.
  const status = mapProviderPaymentStatus(responseStatus);
  if (status === "PAID") {
    if (transactionType === "auth") return "PENDING" as const;
    if (transactionType === "refund") return "REFUNDED" as const;
    if (transactionType === "void") return "CANCELLED" as const;
  }
  return status;
}

function normalizePaymobWebhookPayload(body: Record<string, unknown>, payloadHash: string): NormalizedWebhookPayload {
  const obj = paymobWebhookObject(body);
  const attemptId =
    stringValue(body.attemptId) ||
    stringValue(obj.attemptId) ||
    stringValue(obj.merchant_order_id) ||
    stringValue(nestedValue(obj, ["order", "merchant_order_id"])) ||
    stringValue(nestedValue(obj, ["payment_key_claims", "extra", "attemptId"])) ||
    stringValue(nestedValue(obj, ["payment_key_claims", "extra", "attempt_id"])) ||
    stringValue(nestedValue(obj, ["extra", "attemptId"])) ||
    stringValue(nestedValue(obj, ["extras", "attemptId"]));
  const providerTransactionId = stringValue(obj.id);
  const providerOrderId = stringValue(nestedValue(obj, ["order", "id"])) || stringValue(obj.order);
  const rawStatus = paymobRawStatus(obj);
  const amount = centsToAmountText(stringValue(obj.amount_cents));
  const currency = stringValue(obj.currency);

  if (!providerOrderId || !providerTransactionId) {
    throw new ApiError(400, "VALIDATION_ERROR", paymentApiSourceMessages.orderMissing);
  }

  return {
    provider: "paymob",
    attemptId,
    providerTransactionId: providerTransactionId || payloadHash,
    providerOrderId,
    rawStatus,
    status: mapProviderPaymentStatus(rawStatus),
    amount,
    currency
  };
}

function paymobRawStatus(obj: Record<string, unknown>) {
  // These flags are covered by the canonical HMAC. status/txn_response_code,
  // nested order totals and data messages are not authority for payment state.
  if (booleanValue(obj.is_refunded)) {
    return "refunded";
  }
  if (booleanValue(obj.is_voided)) {
    return "voided";
  }
  if (booleanValue(obj.pending)) return "pending";
  if (booleanValue(obj.error_occured)) return "failed";
  if (booleanValue(obj.success)) {
    if (booleanValue(obj.is_auth)) return "authorized";
    if (booleanValue(obj.is_capture) || booleanValue(obj.is_standalone_payment)) return "paid";
    return "pending";
  }
  return "failed";
}

function paymobWebhookObject(body?: Record<string, unknown>) {
  const obj = body?.obj;
  return obj && typeof obj === "object" && !Array.isArray(obj) ? (obj as Record<string, unknown>) : body ?? {};
}

function paymobWebhookHmacSource(body?: Record<string, unknown>) {
  const obj = paymobWebhookObject(body);
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order",
    "owner",
    "pending",
    "source_data_pan",
    "source_data_sub_type",
    "source_data_type",
    "success"
  ];

  const hasAny = fields.some((field) => paymobHmacFieldValue(obj, field) !== undefined);
  if (!hasAny) {
    return "";
  }

  return fields.map((field) => paymobHmacValue(field, paymobHmacFieldValue(obj, field))).join("");
}

function paymobHmacFieldValue(obj: Record<string, unknown>, field: string) {
  if (field === "source_data_pan") {
    return nestedValue(obj, ["source_data", "pan"]) ?? nestedValue(obj, [field]);
  }
  if (field === "source_data_sub_type") {
    return nestedValue(obj, ["source_data", "sub_type"]) ?? nestedValue(obj, [field]);
  }
  if (field === "source_data_type") {
    return nestedValue(obj, ["source_data", "type"]) ?? nestedValue(obj, [field]);
  }
  return nestedValue(obj, [field]);
}

function paymobHmacValue(field: string, value: unknown) {
  if (field === "order" && value && typeof value === "object" && !Array.isArray(value)) {
    return stringValue((value as Record<string, unknown>).id);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function centsToAmountText(value: string) {
  if (!/^\d+$/.test(value)) return value;
  if (!value) {
    return "";
  }
  const cents = Number.parseInt(value, 10);
  if (!Number.isFinite(cents)) {
    return value;
  }
  return (cents / 100).toFixed(2);
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "True" || value === "1";
}

function nestedValue(body: unknown, path: string[]) {
  let value: unknown = body;
  for (const segment of path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}
