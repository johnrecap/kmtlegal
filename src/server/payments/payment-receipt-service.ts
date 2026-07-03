import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";

const uuidSchema = z.string().uuid();
const tokenPayloadSchema = z.object({
  v: z.literal(1),
  attemptId: uuidSchema,
  paymentId: uuidSchema
});

const LOCAL_RECEIPT_SIGNING_SECRET = "local-dev-only-payment-receipt-secret-do-not-use-in-production";

export type PaymentReceiptView = Awaited<ReturnType<typeof getPublicConsultationPaymentReceipt>>;

export function publicPaymentReceiptUrl(input: { attemptId: string; paymentId: string }) {
  const params = new URLSearchParams({
    attemptId: input.attemptId,
    token: createPaymentReceiptToken(input)
  });

  return `/payment/consultation/receipt?${params.toString()}`;
}

export function createPaymentReceiptToken(input: { attemptId: string; paymentId: string }, env: NodeJS.ProcessEnv = process.env) {
  const payload = encodePayload({
    v: 1,
    attemptId: uuidSchema.parse(input.attemptId),
    paymentId: uuidSchema.parse(input.paymentId)
  });
  const signature = signPayload(payload, receiptSigningSecret(env));
  return `v1.${payload}.${signature}`;
}

export function verifyPaymentReceiptToken(input: { attemptId: string; token: string }, env: NodeJS.ProcessEnv = process.env) {
  const attemptId = uuidSchema.safeParse(input.attemptId);
  if (!attemptId.success) {
    return null;
  }

  const parts = input.token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !parts[1] || !parts[2]) {
    return null;
  }

  const expectedSignature = signPayload(parts[1], receiptSigningSecret(env));
  if (!safeEqual(parts[2], expectedSignature)) {
    return null;
  }

  const payload = decodePayload(parts[1]);
  if (!payload || payload.attemptId !== attemptId.data) {
    return null;
  }

  return payload;
}

export async function getPublicConsultationPaymentReceipt(input: { attemptId: string; token: string }) {
  const verified = verifyPaymentReceiptToken(input);
  if (!verified) {
    throw new ApiError(404, "NOT_FOUND", "Payment receipt was not found.");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: verified.paymentId,
      paymentAttemptId: verified.attemptId,
      status: "PAID",
      paymentAttempt: {
        id: verified.attemptId,
        status: "PAID"
      }
    },
    include: {
      client: { select: { fullName: true, phone: true, email: true } },
      appointment: { select: { id: true, title: true, startsAt: true, endsAt: true, mode: true, status: true } },
      consultationRequest: { select: { id: true, serviceCategory: true, preferredMode: true, summary: true } },
      paymentAttempt: {
        select: {
          id: true,
          provider: true,
          providerPaymentId: true,
          serviceCategory: true,
          mode: true,
          startsAt: true,
          endsAt: true
        }
      }
    }
  });

  if (!payment || !payment.paymentAttempt) {
    throw new ApiError(404, "NOT_FOUND", "Payment receipt was not found.");
  }

  return {
    id: payment.id,
    invoiceNumber: payment.invoiceNumber,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount.toString(),
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod ?? payment.paymentAttempt.provider,
    provider: payment.paymentAttempt.provider,
    providerPaymentId: payment.paymentAttempt.providerPaymentId,
    issueDate: payment.issueDate.toISOString(),
    paidAt: payment.paidAt?.toISOString() ?? null,
    client: {
      name: payment.client.fullName,
      phone: payment.client.phone,
      email: payment.client.email
    },
    consultation: payment.consultationRequest
      ? {
          id: payment.consultationRequest.id,
          serviceCategory: payment.consultationRequest.serviceCategory,
          preferredMode: payment.consultationRequest.preferredMode,
          summary: payment.consultationRequest.summary
        }
      : null,
    appointment: payment.appointment
      ? {
          id: payment.appointment.id,
          title: payment.appointment.title,
          startsAt: payment.appointment.startsAt.toISOString(),
          endsAt: payment.appointment.endsAt.toISOString(),
          mode: payment.appointment.mode,
          status: payment.appointment.status
        }
      : {
          id: payment.paymentAttempt.id,
          title: "استشارة قانونية",
          startsAt: payment.paymentAttempt.startsAt.toISOString(),
          endsAt: payment.paymentAttempt.endsAt.toISOString(),
          mode: payment.paymentAttempt.mode,
          status: "SCHEDULED"
        },
    attempt: {
      id: payment.paymentAttempt.id,
      serviceCategory: payment.paymentAttempt.serviceCategory,
      mode: payment.paymentAttempt.mode
    }
  };
}

function encodePayload(payload: z.infer<typeof tokenPayloadSchema>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  try {
    return tokenPayloadSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function receiptSigningSecret(env: NodeJS.ProcessEnv) {
  const secret = env.PAYMENT_RECEIPT_SIGNING_SECRET || env.AUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
    throw new Error("PAYMENT_RECEIPT_SIGNING_SECRET or AUTH_SECRET is required for payment receipt links.");
  }

  return LOCAL_RECEIPT_SIGNING_SECRET;
}
