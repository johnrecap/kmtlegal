import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog, appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { redactMetadata, type RedactableJson } from "@/server/audit/redaction";
import { createConsultationReviewNotifications } from "@/server/admin/notification-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { captureAnalyticsEventBestEffort } from "@/server/observability/analytics-service";
import { canonicalPhoneForSearch } from "@/server/phone/phone-normalization";
import { publicClientAccountSetupTarget } from "@/server/portal/client-account-setup-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import {
  createHostedCheckout,
  mapProviderPaymentStatus,
  normalizeProviderWebhookPayload,
  providerWebhookEventId,
  verifyWebhookSignature,
  webhookSignature,
  type NormalizedWebhookPayload
} from "./payment-provider";
import {
  paymentReservationMinutes,
  paymentWebhookSecret,
  requireVerifiedWebhookSignature
} from "./payment-config";
import {
  createPaymentStatusToken,
  publicPaymentReceiptUrl,
  verifyPaymentStatusToken
} from "./payment-receipt-service";
import { getActivePaymentGateway } from "./payment-settings-service";
import type { PaymentProviderName } from "./payment-config";
import type { ConsultationPriceSnapshot } from "./pricing-service";

export { mapProviderPaymentStatus } from "./payment-provider";

const paymentAttemptStatusSchema = z.enum(["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED", "DISPUTED", "CANCELLED"]);
const webhookProcessingStatusSchema = z.enum(["PENDING", "PROCESSED", "FAILED", "IGNORED"]);
const paymentProviderSchema = z.enum(["paytabs", "paymob"]);
const webhookMoneyStatusSchema = z.enum(["MATCHED", "AMOUNT_MISMATCH", "CURRENCY_MISMATCH", "MISSING_ATTEMPT", "NOT_PAID", "NEEDS_REVIEW"]);
const confirmablePaidAttemptStatuses = ["CREATED", "PENDING"] as const;

export const adminPaymentAttemptListQuerySchema = z.object({
  status: paymentAttemptStatusSchema.optional().or(z.literal("")),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(20)
});

export const adminPaymentWebhookListQuerySchema = z.object({
  provider: paymentProviderSchema.optional().or(z.literal("")),
  processingStatus: webhookProcessingStatusSchema.optional().or(z.literal("")),
  moneyStatus: webhookMoneyStatusSchema.optional().or(z.literal("")),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(20)
});

type PaymentClient = Prisma.TransactionClient;
const expiredAttemptBatchSize = 100;

export type CreateConsultationPaymentAttemptInput = {
  tx: PaymentClient;
  client: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
  };
  consultationRequest: {
    id: string;
    serviceCategory: string;
  };
  appointment: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    mode: "PHONE" | "ONLINE" | "OFFICE";
  };
  price: ConsultationPriceSnapshot;
  request?: Request;
  locale?: "ar" | "en";
};

export function canReadAdminPaymentOperations(actor: Principal) {
  return hasPermission(actor, "finance.read.any") || hasPermission(actor, "finance.manage.any");
}

export function canManageAdminPaymentOperations(actor: Principal) {
  return hasPermission(actor, "finance.manage.any");
}

export async function expireOpenConsultationPaymentAttempts(
  now = new Date(),
  options: { attemptId?: string; limit?: number } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? expiredAttemptBatchSize, 1), 500);
  const attempts = await prisma.paymentAttempt.findMany({
    where: {
      ...(options.attemptId ? { id: options.attemptId } : {}),
      status: { in: ["CREATED", "PENDING"] },
      expiresAt: { lt: now }
    },
    select: { id: true, appointmentId: true, consultationRequestId: true },
    orderBy: { expiresAt: "asc" },
    take: limit
  });

  if (!attempts.length) {
    return 0;
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentAttempt.updateMany({
      where: { id: { in: attempts.map((attempt) => attempt.id) } },
      data: { status: "EXPIRED", failureCode: "ATTEMPT_EXPIRED" }
    });

    await tx.appointment.updateMany({
      where: { id: { in: attempts.map((attempt) => attempt.appointmentId) }, status: "RESERVED" },
      data: { status: "CANCELLED", notes: "Payment reservation expired before trusted payment confirmation." }
    });

    await tx.consultationRequest.updateMany({
      where: { id: { in: attempts.map((attempt) => attempt.consultationRequestId) }, status: "PAYMENT_PENDING" },
      data: { status: "REVIEWING" }
    });
  });

  return attempts.length;
}

export async function createConsultationPaymentAttempt(input: CreateConsultationPaymentAttemptInput) {
  const activeProvider = await getActivePaymentGateway({ client: input.tx });
  const expiresAt = new Date(Date.now() + paymentReservationMinutes() * 60_000);
  const idempotencyKey = consultationAttemptIdempotencyKey({
    provider: activeProvider,
    clientId: input.client.id,
    startsAt: input.appointment.startsAt,
    serviceCategory: input.price.serviceCategory,
    mode: input.price.mode,
    amount: input.price.amountText,
    currency: input.price.currency,
    priceVersion: input.price.priceVersion
  });

  const existing = await input.tx.paymentAttempt.findFirst({
    where: {
      idempotencyKey,
      status: { in: ["CREATED", "PENDING"] },
      expiresAt: { gt: new Date() }
    }
  });

  if (existing?.checkoutUrl) {
    return existing;
  }

  const attempt = existing
    ? existing
    : await input.tx.paymentAttempt.create({
        data: {
          provider: activeProvider,
          status: "CREATED",
          clientId: input.client.id,
          consultationRequestId: input.consultationRequest.id,
          appointmentId: input.appointment.id,
          pricingRuleId: input.price.pricingRuleId,
          priceVersion: input.price.priceVersion,
          serviceCategory: input.price.serviceCategory,
          mode: input.price.mode,
          amount: input.price.amount,
          currency: input.price.currency,
          startsAt: input.appointment.startsAt,
          endsAt: input.appointment.endsAt,
          expiresAt,
          idempotencyKey
        }
      });

  const checkout = await createHostedCheckout({
    provider: activeProvider,
    attemptId: attempt.id,
    amount: input.price.amountText,
    currency: input.price.currency,
    description: `KMT Legal consultation booking ${attempt.id}`,
    customer: {
      name: input.client.fullName,
      email: input.client.email,
      phone: input.client.phone
    },
    request: input.request,
    statusToken: createPaymentStatusToken({ attemptId: attempt.id }),
    locale: input.locale
  });

  const updated = await input.tx.paymentAttempt.update({
    where: { id: attempt.id },
    data: {
      provider: checkout.provider,
      status: "PENDING",
      checkoutUrl: checkout.checkoutUrl,
      providerSessionId: checkout.providerSessionId
    }
  });

  await appendAuditLog({
    client: input.tx,
    action: "payment.checkout_create",
    resourceType: "PaymentAttempt",
    resourceId: updated.id,
    clientId: input.client.id,
    appointmentId: input.appointment.id,
    metadata: {
      provider: updated.provider,
      amount: updated.amount.toString(),
      currency: updated.currency,
      serviceCategory: updated.serviceCategory,
      mode: updated.mode,
      expiresAt: updated.expiresAt.toISOString()
    },
    request: input.request
  });

  captureAnalyticsEventBestEffort({
    name: "payment.checkout_created",
    source: "SERVER",
    outcome: "INFO",
    properties: {
      provider: updated.provider,
      serviceCategory: updated.serviceCategory,
      mode: updated.mode,
      currency: updated.currency
    }
  });

  return updated;
}

export async function getPublicPaymentAttemptStatus(input: { attemptId: string; token?: string | null }) {
  const attemptId = parseWithSchema(uuidSchema, input.attemptId, "Payment attempt id is invalid.");
  await expireOpenConsultationPaymentAttempts(new Date(), { attemptId });

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      client: { select: { id: true, fullName: true, phone: true, email: true, userId: true } },
      appointment: { select: { id: true, title: true, startsAt: true, status: true } },
      consultationRequest: { select: { id: true, status: true, summary: true, urgency: true, preferredMode: true, serviceCategory: true, city: true } },
      payment: {
        select: {
          id: true,
          invoiceNumber: true,
          receiptNumber: true,
          amount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          paidAt: true
        }
      }
    }
  });

  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Payment attempt was not found.");
  }

  const includeSensitive = Boolean(input.token && verifyPaymentStatusToken({ attemptId, token: input.token }));
  return paymentAttemptDto(attempt, { includeSensitive });
}

export async function handlePaymentWebhook(input: { request: Request; rawBody: string; requestId: string; provider: PaymentProviderName }) {
  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");
  const body = parseWebhookJson(input.rawBody);
  const payloadSnapshot = safeWebhookPayloadSnapshot(body);
  const provider = input.provider;
  const eventId = providerWebhookEventId(body, provider, payloadHash);
  const secret = paymentWebhookSecret(provider);
  const signature = webhookSignature(input.request, provider, body);
  const signatureVerified = verifyWebhookSignature({ rawBody: input.rawBody, signature, secret, provider, parsedBody: body });
  const signatureStatus = signatureVerified ? "VERIFIED" : secret || requireVerifiedWebhookSignature() ? "INVALID" : "UNVERIFIED";

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { provider_eventId: { provider, eventId } }
  });
  if (existing && existing.payloadHash !== payloadHash) {
    await recordWebhookPayloadMismatch({
      event: existing,
      payloadHash,
      payloadSnapshot,
      request: input.request,
      requestId: input.requestId
    });
    throw new ApiError(409, "CONFLICT", "Payment webhook event payload does not match the original event.", [
      { path: "eventId", message: "Duplicate payment webhook event has a different payload.", code: "webhook_payload_hash_mismatch" }
    ]);
  }
  if (existing?.processingStatus === "PROCESSED") {
    return { event: existing, idempotent: true };
  }

  if (signatureStatus === "INVALID") {
    const event = await upsertWebhookEvent({
      provider,
      eventId,
      payloadHash,
      payloadSnapshot,
      signatureStatus,
      processingStatus: "FAILED",
      errorCode: "INVALID_SIGNATURE"
    });
    throw new ApiError(400, "VALIDATION_ERROR", "Payment webhook signature is invalid.", [
      { path: "signature", message: "Invalid webhook signature.", code: "invalid_signature" }
    ]);
  }

  const normalized = normalizeProviderWebhookPayload(body, provider, payloadHash);
  const event = await upsertWebhookEvent({
    provider,
    eventId,
    payloadHash,
    payloadSnapshot,
    signatureStatus,
    processingStatus: "PENDING",
    attemptId: normalized.attemptId,
    normalizedPayload: normalized
  });

  try {
    const processed = await applyWebhookPaymentState({
      eventId: event.id,
      payload: normalized,
      provider,
      request: input.request,
      requestId: input.requestId
    });
    return { event: processed, idempotent: false };
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: "FAILED",
        errorCode: paymentWebhookProcessingErrorCode(error),
        processedAt: new Date()
      }
    });
    throw error;
  }
}

export async function replayAdminPaymentWebhookEvent(input: { actor: Principal; eventId: string; request?: Request; requestId?: string }) {
  if (!canManageAdminPaymentOperations(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance management permission is required.");
  }

  const eventId = parseWithSchema(uuidSchema, input.eventId, "Webhook event id is invalid.");
  const event = await prisma.paymentWebhookEvent.findUnique({
    where: { id: eventId },
    include: { attempt: true }
  });

  if (!event) {
    throw new ApiError(404, "NOT_FOUND", "Payment webhook event was not found.");
  }

  if (!event.attempt) {
    throw new ApiError(409, "CONFLICT", "Webhook event is not linked to a payment attempt.");
  }

  const replayed = await prisma.paymentWebhookEvent.update({
    where: { id: event.id },
    data: {
      replayCount: { increment: 1 },
      processingStatus: "PENDING",
      errorCode: null
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "payment.webhook_replay",
    resourceType: "PaymentWebhookEvent",
    resourceId: replayed.id,
    clientId: event.attempt.clientId,
    appointmentId: event.attempt.appointmentId,
    metadata: { provider: event.provider, eventId: event.eventId, replayCount: replayed.replayCount },
    request: input.request,
    requestId: input.requestId
  });

  const normalized = parseStoredNormalizedPayload(replayed.normalizedPayload);
  if (!normalized) {
    return replayed;
  }

  const provider: PaymentProviderName = event.provider === "paymob" ? "paymob" : "paytabs";

  return applyWebhookPaymentState({
    eventId: replayed.id,
    payload: normalized,
    provider,
    request: input.request ?? new Request("http://internal.kmt.local/admin/payment-webhook-replay"),
    requestId: input.requestId ?? replayed.id
  });
}

export async function listAdminPaymentAttempts(input: { actor: Principal; query?: unknown }) {
  if (!canReadAdminPaymentOperations(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  }

  const filters = parseWithSchema(adminPaymentAttemptListQuerySchema, input.query ?? {}, "Payment attempt filters are invalid.");
  const pagination = toPagination(filters);
  const search = filters.q?.trim();
  const canonicalPhone = canonicalPhoneForSearch(search);
  const where: Prisma.PaymentAttemptWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(search
      ? {
          OR: [
            { providerSessionId: { contains: search, mode: "insensitive" } },
            { providerPaymentId: { contains: search, mode: "insensitive" } },
            { failureCode: { contains: search, mode: "insensitive" } },
            { client: { fullName: { contains: search, mode: "insensitive" } } },
            { client: { phone: { contains: search, mode: "insensitive" } } },
            ...(canonicalPhone ? [{ client: { phoneCanonical: { contains: canonicalPhone } } }] : []),
            { consultationRequest: { phone: { contains: search, mode: "insensitive" } } },
            ...(canonicalPhone ? [{ consultationRequest: { phoneCanonical: { contains: canonicalPhone } } }] : [])
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.paymentAttempt.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, phone: true, email: true } },
        appointment: { select: { id: true, startsAt: true, endsAt: true, status: true, title: true } },
        payment: { select: { id: true, invoiceNumber: true, status: true, paidAt: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.paymentAttempt.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function listAdminPaymentWebhookEvents(input: { actor: Principal; query?: unknown }) {
  if (!canReadAdminPaymentOperations(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  }

  const filters = parseWithSchema(adminPaymentWebhookListQuerySchema, input.query ?? {}, "Webhook filters are invalid.");
  const pagination = toPagination(filters);
  const search = filters.q?.trim();
  const where: Prisma.PaymentWebhookEventWhereInput = {
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.processingStatus ? { processingStatus: filters.processingStatus } : {}),
    ...(filters.moneyStatus ? paymentWebhookMoneyStatusWhere(filters.moneyStatus) : {}),
    ...(search
      ? {
          OR: [
            { provider: { contains: search, mode: "insensitive" } },
            { eventId: { contains: search, mode: "insensitive" } },
            { errorCode: { contains: search, mode: "insensitive" } },
            { attempt: { client: { fullName: { contains: search, mode: "insensitive" } } } },
            { attempt: { providerSessionId: { contains: search, mode: "insensitive" } } },
            { attempt: { providerPaymentId: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.paymentWebhookEvent.findMany({
      where,
      include: {
        attempt: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            client: { select: { id: true, fullName: true } },
            appointment: { select: { id: true, startsAt: true, status: true } }
          }
        }
      },
      orderBy: [{ receivedAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.paymentWebhookEvent.count({ where })
  ]);

  return {
    items: items.map((event) => ({
      ...event,
      moneyComparison: paymentWebhookMoneyComparison({
        normalizedPayload: event.normalizedPayload,
        attempt: event.attempt,
        errorCode: event.errorCode,
        processingStatus: event.processingStatus,
        signatureStatus: event.signatureStatus
      })
    })),
    total,
    filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

function paymentWebhookMoneyStatusWhere(status: z.infer<typeof webhookMoneyStatusSchema>): Prisma.PaymentWebhookEventWhereInput {
  if (status === "MATCHED") {
    return {
      attemptId: { not: null },
      processingStatus: "PROCESSED",
      errorCode: null,
      normalizedPayload: { path: ["status"], equals: "PAID" }
    };
  }
  if (status === "AMOUNT_MISMATCH") {
    return { errorCode: "PAYMENT_AMOUNT_MISMATCH" };
  }
  if (status === "CURRENCY_MISMATCH") {
    return { errorCode: "PAYMENT_CURRENCY_MISMATCH" };
  }
  if (status === "MISSING_ATTEMPT") {
    return { attemptId: null };
  }
  if (status === "NOT_PAID") {
    return { normalizedPayload: { path: ["status"], not: "PAID" } };
  }

  return {
    OR: [
      { processingStatus: "FAILED" },
      { signatureStatus: "INVALID" },
      { errorCode: { not: null } },
      { attemptId: null }
    ]
  };
}

export function paymentWebhookMoneyComparison(input: {
  normalizedPayload: Prisma.JsonValue | null;
  attempt?: { amount: Prisma.Decimal | string | number; currency: string } | null;
  errorCode?: string | null;
  processingStatus?: string;
  signatureStatus?: string;
}) {
  const normalized = parseStoredNormalizedPayload(input.normalizedPayload);
  const expectedAmount = input.attempt ? decimalText(input.attempt.amount) : null;
  const expectedCurrency = input.attempt?.currency ?? null;
  const receivedAmount = normalized?.amount?.trim() || null;
  const receivedCurrency = normalized?.currency?.trim().toUpperCase() || null;
  const providerStatus = normalized?.status ?? null;

  if (input.errorCode === "PAYMENT_AMOUNT_MISMATCH") {
    return moneyComparisonResult("AMOUNT_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (input.errorCode === "PAYMENT_CURRENCY_MISMATCH") {
    return moneyComparisonResult("CURRENCY_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (!input.attempt) {
    return moneyComparisonResult("MISSING_ATTEMPT", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (input.signatureStatus === "INVALID" || input.processingStatus === "FAILED" || input.errorCode) {
    return moneyComparisonResult("NEEDS_REVIEW", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (providerStatus !== "PAID") {
    return moneyComparisonResult("NOT_PAID", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (!receivedAmount) {
    return moneyComparisonResult("AMOUNT_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
  if (!receivedCurrency || receivedCurrency !== expectedCurrency) {
    return moneyComparisonResult("CURRENCY_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }

  try {
    const difference = new Prisma.Decimal(receivedAmount).minus(new Prisma.Decimal(expectedAmount ?? "0"));
    return {
      ...moneyComparisonResult(difference.equals(0) ? "MATCHED" : "AMOUNT_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus),
      differenceAmount: difference.toString()
    };
  } catch {
    return moneyComparisonResult("AMOUNT_MISMATCH", expectedAmount, expectedCurrency, receivedAmount, receivedCurrency, providerStatus);
  }
}

function moneyComparisonResult(
  status: z.infer<typeof webhookMoneyStatusSchema>,
  expectedAmount: string | null,
  expectedCurrency: string | null,
  receivedAmount: string | null,
  receivedCurrency: string | null,
  providerStatus: ReturnType<typeof mapProviderPaymentStatus> | null
) {
  return {
    status,
    expectedAmount,
    expectedCurrency,
    receivedAmount,
    receivedCurrency,
    providerStatus,
    differenceAmount: null as string | null
  };
}

function decimalText(value: Prisma.Decimal | string | number) {
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  return new Prisma.Decimal(String(value)).toString();
}

function consultationAttemptIdempotencyKey(input: {
  provider: string;
  clientId: string;
  startsAt: Date;
  serviceCategory: string;
  mode: string;
  amount: string;
  currency: string;
  priceVersion: number;
}) {
  return createHash("sha256")
    .update([input.provider, input.clientId, input.startsAt.toISOString(), input.serviceCategory, input.mode, input.amount, input.currency, input.priceVersion].join("|"))
    .digest("hex");
}

function parseWebhookJson(rawBody: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Payment webhook payload is invalid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ApiError(400, "VALIDATION_ERROR", "Payment webhook payload is invalid.");
  }
  return parsed as Record<string, unknown>;
}

async function upsertWebhookEvent(input: {
  provider: string;
  eventId: string;
  payloadHash: string;
  payloadSnapshot: RedactableJson;
  signatureStatus: "VERIFIED" | "UNVERIFIED" | "INVALID";
  processingStatus: "PENDING" | "PROCESSED" | "FAILED" | "IGNORED";
  errorCode?: string;
  attemptId?: string;
  normalizedPayload?: NormalizedWebhookPayload;
}) {
  return prisma.paymentWebhookEvent.upsert({
    where: { provider_eventId: { provider: input.provider, eventId: input.eventId } },
    create: {
      provider: input.provider,
      eventId: input.eventId,
      payloadHash: input.payloadHash,
      payloadSnapshot: input.payloadSnapshot as Prisma.InputJsonValue,
      signatureStatus: input.signatureStatus,
      processingStatus: input.processingStatus,
      errorCode: input.errorCode ?? null,
      normalizedPayload: input.normalizedPayload ? (input.normalizedPayload as Prisma.InputJsonValue) : undefined,
      attemptId: isUuid(input.attemptId) ? input.attemptId : null
    },
    update: {
      payloadHash: input.payloadHash,
      payloadSnapshot: input.payloadSnapshot as Prisma.InputJsonValue,
      signatureStatus: input.signatureStatus,
      processingStatus: input.processingStatus,
      errorCode: input.errorCode ?? null,
      normalizedPayload: input.normalizedPayload ? (input.normalizedPayload as Prisma.InputJsonValue) : undefined,
      attemptId: isUuid(input.attemptId) ? input.attemptId : undefined
    }
  });
}

async function recordWebhookPayloadMismatch(input: {
  event: {
    id: string;
    provider: string;
    eventId: string;
    payloadHash: string;
    processingStatus: string;
  };
  payloadHash: string;
  payloadSnapshot: RedactableJson;
  request: Request;
  requestId: string;
}) {
  await appendAuditLogBestEffort({
    action: "payment.webhook_payload_mismatch",
    resourceType: "PaymentWebhookEvent",
    resourceId: input.event.id,
    clientId: null,
    metadata: {
      provider: input.event.provider,
      eventId: input.event.eventId,
      storedPayloadHash: input.event.payloadHash,
      receivedPayloadHash: input.payloadHash,
      receivedPayloadSnapshot: input.payloadSnapshot,
      processingStatus: input.event.processingStatus
    },
    request: input.request,
    requestId: input.requestId
  });
}

export function safeWebhookPayloadSnapshot(payload: Record<string, unknown>): RedactableJson {
  return redactMetadata(payload);
}

async function applyWebhookPaymentState(input: {
  eventId: string;
  provider: PaymentProviderName;
  payload: NormalizedWebhookPayload;
  request: Request;
  requestId: string;
}) {
  const attemptId = parseWithSchema(uuidSchema, input.payload.attemptId, "Payment attempt id is invalid.");
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        appointment: true,
        consultationRequest: true,
        payment: true
      }
    });

    if (!attempt) {
      throw new ApiError(404, "NOT_FOUND", "Payment attempt was not found.");
    }

    if (attempt.provider !== input.provider) {
      throw new ApiError(409, "CONFLICT", "Payment webhook provider does not match the original payment attempt provider.");
    }

    const paidPayloadProblem =
      input.payload.status === "PAID" ? paidWebhookPayloadProblem({ payload: input.payload, attempt }) : null;

    const transaction = await upsertPaymentTransaction(tx, {
      eventId: input.eventId,
      attemptId: attempt.id,
      provider: input.provider,
      providerTransactionId: input.payload.providerTransactionId,
      rawStatus: input.payload.rawStatus || null,
      status: paidPayloadProblem ? "FAILED" : paymentTransactionStatus(input.payload.status),
      amount: attempt.amount,
      currency: attempt.currency,
      paidAt: input.payload.status === "PAID" && !paidPayloadProblem ? new Date() : null
    });

    await tx.paymentWebhookEvent.update({
      where: { id: input.eventId },
      data: { attemptId: attempt.id, transactionId: transaction.id }
    });

    if (paidPayloadProblem) {
      await releaseFailedAttempt({ tx, attempt, status: "FAILED", failureCode: paidPayloadProblem.code });
      return tx.paymentWebhookEvent.update({
        where: { id: input.eventId },
        data: {
          processingStatus: "FAILED",
          errorCode: paidPayloadProblem.code,
          processedAt: new Date()
        }
      });
    }

    if (input.payload.status === "PAID") {
      await confirmPaidAttempt({ tx, attempt, transaction, request: input.request, requestId: input.requestId });
    } else if (input.payload.status === "FAILED" || input.payload.status === "EXPIRED" || input.payload.status === "CANCELLED") {
      await releaseFailedAttempt({ tx, attempt, status: input.payload.status, failureCode: input.payload.rawStatus || input.payload.status });
    } else {
      await updateOpenAttemptStatus({ tx, attempt, status: input.payload.status });
    }

    return tx.paymentWebhookEvent.update({
      where: { id: input.eventId },
      data: {
        processingStatus: "PROCESSED",
        errorCode: null,
        processedAt: new Date()
      }
    });
  });
}

async function upsertPaymentTransaction(
  tx: PaymentClient,
  input: {
    eventId: string;
    attemptId: string;
    provider: string;
    providerTransactionId: string | null;
    rawStatus: string | null;
    status: ReturnType<typeof paymentTransactionStatus>;
    amount: Prisma.Decimal;
    currency: "EGP" | "USD" | "EUR" | "SAR" | "AED";
    paidAt: Date | null;
  }
) {
  const existingEvent = await tx.paymentWebhookEvent.findUnique({
    where: { id: input.eventId },
    select: { transactionId: true }
  });

  if (existingEvent?.transactionId) {
    return tx.paymentTransaction.update({
      where: { id: existingEvent.transactionId },
      data: {
        rawStatus: input.rawStatus,
        status: input.status,
        amount: input.amount,
        currency: input.currency,
        paidAt: input.paidAt
      }
    });
  }

  if (input.providerTransactionId) {
    const existingTransaction = await tx.paymentTransaction.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: input.provider,
          providerTransactionId: input.providerTransactionId
        }
      }
    });

    if (existingTransaction) {
      if (existingTransaction.attemptId !== input.attemptId) {
        throw new ApiError(409, "CONFLICT", "Provider transaction is already linked to a different payment attempt.", [
          {
            path: "providerTransactionId",
            message: "Provider transaction is already linked to a different payment attempt.",
            code: "provider_transaction_attempt_mismatch"
          }
        ]);
      }

      return tx.paymentTransaction.update({
        where: { id: existingTransaction.id },
        data: {
          rawStatus: input.rawStatus,
          status: input.status,
          amount: input.amount,
          currency: input.currency,
          paidAt: input.paidAt
        }
      });
    }
  }

  return tx.paymentTransaction.create({
    data: {
      attemptId: input.attemptId,
      provider: input.provider,
      providerTransactionId: input.providerTransactionId,
      rawStatus: input.rawStatus,
      status: input.status,
      amount: input.amount,
      currency: input.currency,
      paidAt: input.paidAt
    }
  });
}

async function confirmPaidAttempt(input: {
  tx: PaymentClient;
  attempt: Prisma.PaymentAttemptGetPayload<{ include: { appointment: true; consultationRequest: true; payment: true } }>;
  transaction: { providerTransactionId: string | null; id: string };
  request: Request;
  requestId: string;
}) {
  if (input.attempt.payment || input.attempt.status === "PAID") {
    return;
  }

  const blocker = paidAttemptWebhookConfirmationBlocker({
    attemptStatus: input.attempt.status,
    expiresAt: input.attempt.expiresAt,
    appointmentStatus: input.attempt.appointment.status,
    consultationStatus: input.attempt.consultationRequest.status
  });
  if (blocker) {
    throw new ApiError(409, "CONFLICT", blocker);
  }

  const now = new Date();
  const invoiceNumber = gatewayInvoiceNumber(input.attempt.id, now);
  const payment = await input.tx.payment.create({
    data: {
      invoiceNumber,
      clientId: input.attempt.clientId,
      consultationRequestId: input.attempt.consultationRequestId,
      appointmentId: input.attempt.appointmentId,
      paymentAttemptId: input.attempt.id,
      issueDate: now,
      amount: input.attempt.amount,
      currency: input.attempt.currency,
      status: "PAID",
      paymentMethod: input.attempt.provider,
      receiptNumber: input.transaction.providerTransactionId || input.transaction.id,
      paidAt: now,
      notes: "Gateway-confirmed consultation booking payment."
    }
  });

  await input.tx.paymentAttempt.update({
    where: { id: input.attempt.id },
    data: {
      status: "PAID",
      providerPaymentId: input.transaction.providerTransactionId
    }
  });

  await input.tx.appointment.update({
    where: { id: input.attempt.appointmentId },
    data: {
      status: "SCHEDULED",
      notes: "Confirmed after trusted payment webhook."
    }
  });

  await input.tx.consultationRequest.update({
    where: { id: input.attempt.consultationRequestId },
    data: { status: "SCHEDULED" }
  });

  await createConsultationReviewNotifications({
    client: input.tx,
    consultationId: input.attempt.consultationRequestId
  });

  await appendAuditLog({
    client: input.tx,
    action: "payment.webhook_paid",
    resourceType: "PaymentAttempt",
    resourceId: input.attempt.id,
    clientId: input.attempt.clientId,
    appointmentId: input.attempt.appointmentId,
    paymentId: payment.id,
    metadata: {
      invoiceNumber,
      provider: input.attempt.provider,
      amount: input.attempt.amount.toString(),
      currency: input.attempt.currency
    },
    request: input.request,
    requestId: input.requestId
  });

  captureAnalyticsEventBestEffort({
    name: "payment.webhook_paid",
    source: "SERVER",
    outcome: "SUCCESS",
    properties: {
      provider: input.attempt.provider,
      serviceCategory: input.attempt.serviceCategory,
      mode: input.attempt.mode,
      currency: input.attempt.currency
    }
  });
}

async function releaseFailedAttempt(input: {
  tx: PaymentClient;
  attempt: Prisma.PaymentAttemptGetPayload<{ include: { appointment: true; consultationRequest: true; payment: true } }>;
  status: "FAILED" | "EXPIRED" | "CANCELLED";
  failureCode: string;
}) {
  if (input.attempt.payment || input.attempt.status === "PAID") {
    return;
  }

  await input.tx.paymentAttempt.update({
    where: { id: input.attempt.id },
    data: { status: input.status, failureCode: input.failureCode }
  });

  if (input.attempt.appointment.status === "RESERVED") {
    await input.tx.appointment.update({
      where: { id: input.attempt.appointmentId },
      data: {
        status: "CANCELLED",
        notes: `Payment attempt ended with ${input.status}.`
      }
    });
  }

  if (input.attempt.consultationRequest.status === "PAYMENT_PENDING") {
    await input.tx.consultationRequest.update({
      where: { id: input.attempt.consultationRequestId },
      data: { status: "REVIEWING" }
    });
  }
}

async function updateOpenAttemptStatus(input: {
  tx: PaymentClient;
  attempt: Prisma.PaymentAttemptGetPayload<{ include: { appointment: true; consultationRequest: true; payment: true } }>;
  status: ReturnType<typeof mapProviderPaymentStatus>;
}) {
  if (input.attempt.payment || input.attempt.status === "PAID") {
    return;
  }
  await input.tx.paymentAttempt.update({
    where: { id: input.attempt.id },
    data: { status: input.status }
  });
}

export function paidAttemptWebhookConfirmationBlocker(
  input: {
    attemptStatus: string;
    expiresAt: Date;
    appointmentStatus: string;
    consultationStatus: string;
  },
  now = new Date()
) {
  if (!confirmablePaidAttemptStatuses.includes(input.attemptStatus as (typeof confirmablePaidAttemptStatuses)[number])) {
    return "Payment attempt can no longer confirm this appointment.";
  }
  if (input.expiresAt <= now) {
    return "Payment attempt expired before trusted payment confirmation.";
  }
  if (input.appointmentStatus !== "RESERVED") {
    return "Payment attempt appointment is no longer reserved.";
  }
  if (input.consultationStatus !== "PAYMENT_PENDING") {
    return "Payment attempt consultation is no longer pending payment.";
  }
  return "";
}

function paymentTransactionStatus(status: ReturnType<typeof mapProviderPaymentStatus>) {
  if (status === "PAID") return "PAID";
  if (status === "REFUNDED") return "REFUNDED";
  if (status === "DISPUTED") return "DISPUTED";
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "PENDING") return "PENDING";
  return "FAILED";
}

function paymentWebhookProcessingErrorCode(error: unknown) {
  if (error instanceof ApiError) {
    return error.details?.[0]?.code?.toUpperCase() || error.code;
  }
  return "WEBHOOK_PROCESSING_FAILED";
}

export function paidWebhookPayloadProblem(input: {
  payload: NormalizedWebhookPayload;
  attempt: { amount: Prisma.Decimal; currency: string };
}) {
  const payloadCurrency = input.payload.currency.trim().toUpperCase();
  if (!payloadCurrency || payloadCurrency !== input.attempt.currency) {
    return {
      code: "PAYMENT_CURRENCY_MISMATCH",
      path: "currency",
      message: "Paid webhook currency does not match the reserved payment attempt."
    };
  }

  const payloadAmountText = input.payload.amount.trim();
  if (!payloadAmountText) {
    return {
      code: "PAYMENT_AMOUNT_MISMATCH",
      path: "amount",
      message: "Paid webhook amount is missing."
    };
  }

  try {
    const payloadAmount = new Prisma.Decimal(payloadAmountText);
    if (!payloadAmount.equals(input.attempt.amount)) {
      return {
        code: "PAYMENT_AMOUNT_MISMATCH",
        path: "amount",
        message: "Paid webhook amount does not match the reserved payment attempt."
      };
    }
  } catch {
    return {
      code: "PAYMENT_AMOUNT_MISMATCH",
      path: "amount",
      message: "Paid webhook amount is invalid."
    };
  }

  return null;
}

function gatewayInvoiceNumber(attemptId: string, paidAt: Date) {
  return `CONS-${paidAt.getUTCFullYear()}-${attemptId.slice(0, 8).toUpperCase()}`;
}

function paymentAttemptDto(
  attempt: Prisma.PaymentAttemptGetPayload<{
    include: {
      client: { select: { id: true; fullName: true; phone: true; email: true; userId: true } };
      appointment: { select: { id: true; title: true; startsAt: true; status: true } };
      consultationRequest: { select: { id: true; status: true; summary: true; urgency: true; preferredMode: true; serviceCategory: true; city: true } };
      payment: {
        select: {
          id: true;
          invoiceNumber: true;
          receiptNumber: true;
          amount: true;
          currency: true;
          status: true;
          paymentMethod: true;
          paidAt: true;
        };
      };
    };
  }>,
  options: { includeSensitive?: boolean } = {}
) {
  const includeSensitive = options.includeSensitive === true;
  return {
    id: attempt.id,
    provider: attempt.provider,
    status: attempt.status,
    amount: attempt.amount.toString(),
    currency: attempt.currency,
    access: { verified: includeSensitive },
    checkoutUrl: includeSensitive ? attempt.checkoutUrl : null,
    expiresAt: attempt.expiresAt.toISOString(),
    appointment: {
      id: attempt.appointment.id,
      title: attempt.appointment.title,
      startsAt: attempt.appointment.startsAt.toISOString(),
      status: attempt.appointment.status
    },
    consultation: publicPaymentAttemptConsultationDto(attempt.consultationRequest, includeSensitive),
    resumeDraft:
      includeSensitive && ["FAILED", "EXPIRED", "CANCELLED"].includes(attempt.status)
        ? {
            fullName: attempt.client.fullName,
            phone: attempt.client.phone,
            email: attempt.client.email ?? "",
            city: attempt.consultationRequest.city ?? "",
            serviceCategory: attempt.consultationRequest.serviceCategory || attempt.serviceCategory,
            urgency: attempt.consultationRequest.urgency,
            preferredMode: attempt.consultationRequest.preferredMode || attempt.mode,
            summary: attempt.consultationRequest.summary || "",
            startsAt: "",
            availabilityPreference: {
              date: "",
              label: "",
              timeWindow: "",
              fromTime: "",
              toTime: ""
            }
          }
        : null,
    client:
      includeSensitive && attempt.payment && attempt.status === "PAID"
        ? {
            fullName: attempt.client.fullName,
            phone: attempt.client.phone
          }
        : null,
    clientAccountSetup:
      includeSensitive && attempt.payment && attempt.status === "PAID" && attempt.payment.status === "PAID"
        ? publicClientAccountSetupTarget({
            client: attempt.client,
            consultationId: attempt.consultationRequest.id
          })
        : null,
    payment: attempt.payment
      ? {
          id: includeSensitive ? attempt.payment.id : null,
          invoiceNumber: includeSensitive ? attempt.payment.invoiceNumber : null,
          receiptNumber: includeSensitive ? attempt.payment.receiptNumber : null,
          amount: attempt.payment.amount.toString(),
          currency: attempt.payment.currency,
          status: attempt.payment.status,
          paymentMethod: attempt.payment.paymentMethod,
          paidAt: attempt.payment.paidAt?.toISOString() ?? null,
          receiptUrl:
            includeSensitive && attempt.status === "PAID" && attempt.payment.status === "PAID"
              ? publicPaymentReceiptUrl({ attemptId: attempt.id, paymentId: attempt.payment.id })
              : null
        }
      : null
  };
}

export function publicPaymentAttemptConsultationDto(
  consultation: {
    id: string;
    status: string;
    summary?: string | null;
    urgency?: string | null;
    preferredMode?: string | null;
    serviceCategory?: string | null;
    city?: string | null;
  },
  includeSensitive = false
) {
  if (includeSensitive) {
    return consultation;
  }

  return {
    id: consultation.id,
    status: consultation.status
  };
}

function parseStoredNormalizedPayload(value: Prisma.JsonValue | null): NormalizedWebhookPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  if (!attemptId || !status) {
    return null;
  }

  return {
    provider: typeof body.provider === "string" && ["paytabs", "paymob"].includes(body.provider) ? (body.provider as PaymentProviderName) : "paytabs",
    attemptId,
    providerTransactionId: typeof body.providerTransactionId === "string" ? body.providerTransactionId : null,
    rawStatus: typeof body.rawStatus === "string" ? body.rawStatus : "",
    status: mapProviderPaymentStatus(status),
    amount: typeof body.amount === "string" ? body.amount : "",
    currency: typeof body.currency === "string" ? body.currency : "EGP"
  };
}

function isUuid(value: unknown) {
  return typeof value === "string" && uuidSchema.safeParse(value).success;
}
