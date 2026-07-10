import { Prisma } from "@prisma/client";
import { redactMetadata, type RedactableJson } from "@/server/audit/redaction";
import { uuidSchema } from "@/server/validation/schemas";
import { mapProviderPaymentStatus, type NormalizedWebhookPayload } from "./payment-provider";
import type { PaymentProviderName } from "./payment-config";

export function safeWebhookPayloadSnapshot(payload: Record<string, unknown>): RedactableJson {
  return redactMetadata(payload);
}

export function parseStoredNormalizedPayload(value: Prisma.JsonValue | null): NormalizedWebhookPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  if (!attemptId || !status) return null;

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

export function isPaymentUuid(value: unknown) {
  return typeof value === "string" && uuidSchema.safeParse(value).success;
}
