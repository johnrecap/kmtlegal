import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import {
  CONSULTATION_BOOKING_SETTING_KEY,
  consultationBookingFlags,
  consultationBookingModeFromValue,
  consultationBookingModeInputSchema,
  type ConsultationBookingMode
} from "@/server/consultations/consultation-booking-settings";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema } from "@/server/validation/schemas";
import { hasActiveConsultationPricingRule } from "./pricing-service";
import {
  DEFAULT_PAYMENT_PROVIDER,
  SUPPORTED_PAYMENT_PROVIDERS,
  assertProviderReadyForActivation,
  normalizePaymentProvider,
  paymentProviderEnabled,
  paymentProvider,
  paymentProviderReadiness,
  type PaymentProviderName
} from "./payment-config";

export const PAYMENT_GATEWAY_SETTING_KEY = "payment.gateway";

export const adminPaymentGatewaySettingsSchema = z
  .object({
    activeProvider: z.enum(SUPPORTED_PAYMENT_PROVIDERS),
    bookingMode: consultationBookingModeInputSchema.optional()
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
  const bookingSetting = await prisma.systemSetting.findUnique({
    where: { key: CONSULTATION_BOOKING_SETTING_KEY },
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });
  const bookingMode = consultationBookingModeFromValue(bookingSetting?.value);
  const hasActivePricingRule = await hasActiveConsultationPricingRule();

  return {
    activeProvider,
    ...consultationBookingFlags(bookingMode),
    hasActivePricingRule,
    readyForPaidChat: providerReadinessDto(activeProvider).configured && hasActivePricingRule,
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
  const currentBookingMode = await getStoredBookingMode();
  const nextBookingMode = body.bookingMode ?? currentBookingMode;
  if (nextBookingMode === "AI_CHAT_PAID") {
    assertProviderReadyForActivation(body.activeProvider);
    if (!(await hasActiveConsultationPricingRule())) {
      throw new ApiError(409, "CONFLICT", "An active consultation pricing rule is required before enabling paid booking chat.", [
        {
          path: "bookingMode",
          code: "MISSING_ACTIVE_PRICING_RULE",
          message: "Create an active consultation pricing rule before enabling paid booking chat."
        }
      ]);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const gatewaySetting = await tx.systemSetting.upsert({
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
    const bookingSetting = await tx.systemSetting.upsert({
      where: { key: CONSULTATION_BOOKING_SETTING_KEY },
      create: {
        key: CONSULTATION_BOOKING_SETTING_KEY,
        value: { mode: nextBookingMode },
        updatedById: input.actor.id
      },
      update: {
        value: { mode: nextBookingMode },
        updatedById: input.actor.id
      },
      include: { updatedBy: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "settings.update",
      resourceType: "SystemSetting",
      resourceId: gatewaySetting.id,
      metadata: {
        key: PAYMENT_GATEWAY_SETTING_KEY,
        activeProvider: body.activeProvider,
        bookingSettingKey: CONSULTATION_BOOKING_SETTING_KEY,
        bookingMode: nextBookingMode
      },
      request: input.request,
      requestId: input.requestId
    });

    return { gatewaySetting, bookingSetting };
  });
  const hasActivePricingRule = await hasActiveConsultationPricingRule();

  return {
    activeProvider: body.activeProvider,
    ...consultationBookingFlags(nextBookingMode),
    hasActivePricingRule,
    readyForPaidChat: providerReadinessDto(body.activeProvider).configured && hasActivePricingRule,
    providers: SUPPORTED_PAYMENT_PROVIDERS.map((provider) => ({
      ...providerReadinessDto(provider),
      active: provider === body.activeProvider
    })),
    updatedAt: result.gatewaySetting.updatedAt.toISOString(),
    updatedBy: result.gatewaySetting.updatedBy,
    bookingUpdatedAt: result.bookingSetting.updatedAt.toISOString(),
    bookingUpdatedBy: result.bookingSetting.updatedBy
  };
}

export function activeProviderFromValue(
  value: Prisma.JsonValue | null | undefined,
  env: NodeJS.ProcessEnv = process.env
): PaymentProviderName {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configured = (value as Record<string, unknown>).activeProvider;
    if (typeof configured === "string") {
      try {
        const provider = normalizePaymentProvider(configured);
        if (paymentProviderEnabled(provider, env)) {
          return provider;
        }
      } catch {
        // Fall back below if a legacy or manually edited setting contains an unsupported provider.
      }
    }
  }

  try {
    const provider = paymentProvider(env);
    return paymentProviderEnabled(provider, env) ? provider : DEFAULT_PAYMENT_PROVIDER;
  } catch {
    return DEFAULT_PAYMENT_PROVIDER;
  }
}

function providerReadinessDto(provider: PaymentProviderName) {
  const readiness = paymentProviderReadiness(provider);
  return {
    provider,
    label: provider === "paymob" ? "Paymob" : "PayTabs",
    enabled: readiness.enabled,
    activationStatus: (!readiness.enabled ? "standby_disabled" : readiness.configured ? "ready" : "missing_config") as
      | "standby_disabled"
      | "ready"
      | "missing_config",
    configured: readiness.configured,
    missing: readiness.missing,
    checkoutMode: readiness.checkoutMode
  };
}

async function getStoredBookingMode(): Promise<ConsultationBookingMode> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: CONSULTATION_BOOKING_SETTING_KEY }
  });
  return consultationBookingModeFromValue(setting?.value);
}
