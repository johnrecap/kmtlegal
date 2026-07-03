import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema } from "@/server/validation/schemas";
import {
  DEFAULT_PAYMENT_PROVIDER,
  SUPPORTED_PAYMENT_PROVIDERS,
  assertProviderReadyForActivation,
  normalizePaymentProvider,
  paymentProvider,
  paymentProviderReadiness,
  type PaymentProviderName
} from "./payment-config";

export const PAYMENT_GATEWAY_SETTING_KEY = "payment.gateway";

export const adminPaymentGatewaySettingsSchema = z
  .object({
    activeProvider: z.enum(SUPPORTED_PAYMENT_PROVIDERS)
  })
  .strict();

type PaymentSettingsClient = Pick<Prisma.TransactionClient, "systemSetting">;

export function canReadPaymentGatewaySettings(actor: Principal) {
  return hasPermission(actor, "finance.read.any") || hasPermission(actor, "finance.manage.any") || hasPermission(actor, "settings.manage.any");
}

export function canManagePaymentGatewaySettings(actor: Principal) {
  return hasPermission(actor, "finance.manage.any") || hasPermission(actor, "settings.manage.any");
}

export async function getActivePaymentGateway(input: { client?: PaymentSettingsClient } = {}) {
  const client = input.client ?? prisma;
  const setting = await client.systemSetting.findUnique({
    where: { key: PAYMENT_GATEWAY_SETTING_KEY }
  });

  return activeProviderFromValue(setting?.value);
}

export async function getAdminPaymentGatewaySettings(input: { actor: Principal }) {
  if (!canReadPaymentGatewaySettings(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key: PAYMENT_GATEWAY_SETTING_KEY },
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });
  const activeProvider = activeProviderFromValue(setting?.value);

  return {
    activeProvider,
    providers: SUPPORTED_PAYMENT_PROVIDERS.map((provider) => ({
      ...providerReadinessDto(provider),
      active: provider === activeProvider
    })),
    updatedAt: setting?.updatedAt?.toISOString() ?? null,
    updatedBy: setting?.updatedBy ?? null
  };
}

export async function updateAdminPaymentGatewaySettings(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  if (!canManagePaymentGatewaySettings(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance management permission is required.");
  }

  const body = parseWithSchema(adminPaymentGatewaySettingsSchema, input.body, "Payment gateway setting payload is invalid.");
  assertProviderReadyForActivation(body.activeProvider);

  const setting = await prisma.$transaction(async (tx) => {
    const updated = await tx.systemSetting.upsert({
      where: { key: PAYMENT_GATEWAY_SETTING_KEY },
      create: {
        key: PAYMENT_GATEWAY_SETTING_KEY,
        value: { activeProvider: body.activeProvider },
        updatedById: input.actor.id
      },
      update: {
        value: { activeProvider: body.activeProvider },
        updatedById: input.actor.id
      },
      include: { updatedBy: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "settings.update",
      resourceType: "SystemSetting",
      resourceId: updated.id,
      metadata: {
        key: PAYMENT_GATEWAY_SETTING_KEY,
        activeProvider: body.activeProvider
      },
      request: input.request,
      requestId: input.requestId
    });

    return updated;
  });

  return {
    activeProvider: body.activeProvider,
    providers: SUPPORTED_PAYMENT_PROVIDERS.map((provider) => ({
      ...providerReadinessDto(provider),
      active: provider === body.activeProvider
    })),
    updatedAt: setting.updatedAt.toISOString(),
    updatedBy: setting.updatedBy
  };
}

export function activeProviderFromValue(value: Prisma.JsonValue | null | undefined): PaymentProviderName {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configured = (value as Record<string, unknown>).activeProvider;
    if (typeof configured === "string") {
      try {
        return normalizePaymentProvider(configured);
      } catch {
        // Fall back below if a legacy or manually edited setting contains an unsupported provider.
      }
    }
  }

  try {
    return paymentProvider();
  } catch {
    return DEFAULT_PAYMENT_PROVIDER;
  }
}

function providerReadinessDto(provider: PaymentProviderName) {
  const readiness = paymentProviderReadiness(provider);
  return {
    provider,
    label: provider === "paymob" ? "Paymob" : "PayTabs",
    configured: readiness.configured,
    missing: readiness.missing,
    checkoutMode: readiness.checkoutMode
  };
}
