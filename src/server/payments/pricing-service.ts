import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { currencyValues } from "@/lib/legal-finance";

const consultationModeSchema = z.enum(["PHONE", "ONLINE", "OFFICE"]);
const currencySchema = z.enum(currencyValues);
const optionalServiceCategorySchema = z.string().trim().max(80).optional().or(z.literal(""));
const optionalModeSchema = consultationModeSchema.optional().or(z.literal(""));

export const adminConsultationPricingRuleWriteSchema = z
  .object({
    serviceCategory: optionalServiceCategorySchema,
    mode: optionalModeSchema,
    amount: z.coerce
      .number()
      .positive()
      .max(999_999_999.99)
      .transform((value) => Math.round(value * 100) / 100),
    currency: currencySchema.default("EGP"),
    active: z.boolean().default(true),
    effectiveFrom: z.string().trim().min(1).max(60),
    version: z.coerce.number().int().min(1).max(9999).default(1),
    label: z.string().trim().max(120).optional().or(z.literal(""))
  })
  .strict();

export const adminConsultationPricingRuleQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional().or(z.literal("")),
  serviceCategory: optionalServiceCategorySchema,
  mode: optionalModeSchema
});

export type ConsultationPricingRuleWriteInput = z.infer<typeof adminConsultationPricingRuleWriteSchema>;

type PricingClient = Pick<Prisma.TransactionClient, "consultationPricingRule">;

export type ConsultationPriceSnapshot = {
  amount: Prisma.Decimal;
  amountText: string;
  currency: (typeof currencyValues)[number];
  pricingRuleId: string;
  priceVersion: number;
  serviceCategory: string;
  mode: "PHONE" | "ONLINE" | "OFFICE";
  label: string | null;
};

export function canManageConsultationPricing(actor: Principal) {
  return hasPermission(actor, "finance.manage.any") || hasPermission(actor, "settings.manage.any");
}

export function canReadConsultationPricing(actor: Principal) {
  return hasPermission(actor, "finance.read.any") || canManageConsultationPricing(actor);
}

function assertPricingRead(actor: Principal) {
  if (!canReadConsultationPricing(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  }
}

function assertPricingManage(actor: Principal) {
  if (!canManageConsultationPricing(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance management permission is required.");
  }
}

export async function listAdminConsultationPricingRules(input: { actor: Principal; query?: unknown }) {
  assertPricingRead(input.actor);
  const filters = parseWithSchema(adminConsultationPricingRuleQuerySchema, input.query ?? {}, "Pricing rule filters are invalid.");

  return prisma.consultationPricingRule.findMany({
    where: {
      ...(filters.active === "true" ? { active: true } : {}),
      ...(filters.active === "false" ? { active: false } : {}),
      ...(filters.serviceCategory ? { serviceCategory: filters.serviceCategory } : {}),
      ...(filters.mode ? { mode: filters.mode } : {})
    },
    include: { updatedBy: { select: { id: true, name: true, email: true } } },
    orderBy: [{ active: "desc" }, { effectiveFrom: "desc" }, { version: "desc" }, { createdAt: "desc" }],
    take: 100
  });
}

export async function createAdminConsultationPricingRule(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  assertPricingManage(input.actor);
  const body = parseWithSchema(adminConsultationPricingRuleWriteSchema, input.body, "Pricing rule payload is invalid.");
  const effectiveFrom = parseEffectiveFrom(body.effectiveFrom);

  const rule = await prisma.consultationPricingRule.create({
    data: pricingRuleData(body, effectiveFrom, input.actor.id),
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "payment.pricing_rule_create",
    resourceType: "ConsultationPricingRule",
    resourceId: rule.id,
    metadata: pricingRuleAuditMetadata(rule),
    request: input.request,
    requestId: input.requestId
  });

  return rule;
}

export async function updateAdminConsultationPricingRule(input: {
  actor: Principal;
  ruleId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  assertPricingManage(input.actor);
  const ruleId = parseWithSchema(uuidSchema, input.ruleId, "Pricing rule id is invalid.");
  const body = parseWithSchema(adminConsultationPricingRuleWriteSchema, input.body, "Pricing rule payload is invalid.");
  const effectiveFrom = parseEffectiveFrom(body.effectiveFrom);

  const existing = await prisma.consultationPricingRule.findUnique({ where: { id: ruleId } });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Pricing rule was not found.");
  }

  const rule = await prisma.consultationPricingRule.update({
    where: { id: ruleId },
    data: pricingRuleData(body, effectiveFrom, input.actor.id),
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "payment.pricing_rule_update",
    resourceType: "ConsultationPricingRule",
    resourceId: rule.id,
    metadata: {
      previous: pricingRuleAuditMetadata(existing),
      current: pricingRuleAuditMetadata(rule)
    },
    request: input.request,
    requestId: input.requestId
  });

  return rule;
}

export async function resolveConsultationPrice(input: {
  serviceCategory: string;
  mode: "PHONE" | "ONLINE" | "OFFICE";
  now?: Date;
  client?: PricingClient;
}): Promise<ConsultationPriceSnapshot> {
  const serviceCategory = input.serviceCategory.trim();
  const mode = consultationModeSchema.parse(input.mode);
  const now = input.now ?? new Date();
  const client = input.client ?? prisma;

  const rules = await client.consultationPricingRule.findMany({
    where: {
      active: true,
      effectiveFrom: { lte: now },
      OR: [
        { serviceCategory, mode },
        { serviceCategory, mode: null },
        { serviceCategory: null, mode },
        { serviceCategory: null, mode: null }
      ]
    },
    orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }, { createdAt: "desc" }],
    take: 20
  });

  const rule = rules.sort((left, right) => ruleSpecificity(right, serviceCategory, mode) - ruleSpecificity(left, serviceCategory, mode))[0];
  if (!rule) {
    throw new ApiError(409, "CONFLICT", "Consultation booking fee is not configured. Please contact the office.");
  }

  return {
    amount: rule.amount,
    amountText: rule.amount.toString(),
    currency: rule.currency,
    pricingRuleId: rule.id,
    priceVersion: rule.version,
    serviceCategory,
    mode,
    label: rule.label
  };
}

export async function hasActiveConsultationPricingRule(input: { now?: Date; client?: PricingClient } = {}) {
  const now = input.now ?? new Date();
  const client = input.client ?? prisma;
  const count = await client.consultationPricingRule.count({
    where: {
      active: true,
      effectiveFrom: { lte: now }
    }
  });

  return count > 0;
}

export function consultationPriceDto(price: ConsultationPriceSnapshot) {
  return {
    amount: price.amountText,
    currency: price.currency,
    pricingRuleId: price.pricingRuleId,
    priceVersion: price.priceVersion,
    serviceCategory: price.serviceCategory,
    mode: price.mode,
    label: price.label
  };
}

function ruleSpecificity(
  rule: { serviceCategory: string | null; mode: "PHONE" | "ONLINE" | "OFFICE" | null },
  serviceCategory: string,
  mode: "PHONE" | "ONLINE" | "OFFICE"
) {
  const categoryScore = rule.serviceCategory === serviceCategory ? 2 : rule.serviceCategory === null ? 0 : -10;
  const modeScore = rule.mode === mode ? 1 : rule.mode === null ? 0 : -10;
  return categoryScore + modeScore;
}

function parseEffectiveFrom(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "effectiveFrom is invalid.");
  }
  return date;
}

function pricingRuleData(body: ConsultationPricingRuleWriteInput, effectiveFrom: Date, actorId: string) {
  return {
    serviceCategory: body.serviceCategory || null,
    mode: body.mode || null,
    amount: new Prisma.Decimal(body.amount.toFixed(2)),
    currency: body.currency,
    active: body.active,
    effectiveFrom,
    version: body.version,
    label: body.label || null,
    updatedById: actorId
  };
}

function pricingRuleAuditMetadata(rule: {
  serviceCategory: string | null;
  mode: string | null;
  amount: Prisma.Decimal | number | string;
  currency: string;
  active: boolean;
  effectiveFrom: Date;
  version: number;
  label: string | null;
}) {
  return {
    serviceCategory: rule.serviceCategory,
    mode: rule.mode,
    amount: rule.amount.toString(),
    currency: rule.currency,
    active: rule.active,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    version: rule.version,
    label: rule.label
  };
}
