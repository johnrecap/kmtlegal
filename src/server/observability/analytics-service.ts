import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  analyticsEventNameValues,
  bookingStepValues,
  clientAnalyticsEventNameValues,
  type AnalyticsEventName
} from "@/lib/analytics-events";
import { redactMetadata } from "@/server/audit/redaction";
import { type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema } from "@/server/validation/schemas";

const analyticsEventNameSchema = z.enum(analyticsEventNameValues);
const clientAnalyticsEventNameSchema = z.enum(clientAnalyticsEventNameValues);
const analyticsSourceSchema = z.enum(["PUBLIC", "PORTAL", "ADMIN", "SERVER"]);
const analyticsOutcomeSchema = z.enum(["INFO", "SUCCESS", "FAILURE"]);
const bookingStepSchema = z.enum(bookingStepValues);
const safeSlugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/i);
const errorCodeSchema = z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/);
const statusSchema = z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/);
const fileTypeSchema = z.enum([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "unknown"
]);

const analyticsPropertySchemas = {
  "booking.step_viewed": z
    .object({
      step: bookingStepSchema,
      stepIndex: z.number().int().min(0).max(2),
      serviceCategory: safeSlugSchema.optional()
    })
    .strict(),
  "booking.submit_attempted": z
    .object({
      serviceCategory: safeSlugSchema,
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"])
    })
    .strict(),
  "booking.submit_failed": z
    .object({
      step: bookingStepSchema.optional(),
      errorCode: errorCodeSchema,
      httpStatus: z.number().int().min(400).max(599).optional()
    })
    .strict(),
  "consultation.submitted": z
    .object({
      serviceCategory: safeSlugSchema,
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]),
      organizerStatus: z.enum(["ready", "unavailable"]),
      clientEmailDelivery: z.enum(["sent", "queued", "failed", "skipped"]),
      staffEmailDelivery: z.enum(["sent", "queued", "failed", "skipped"])
    })
    .strict(),
  "consultation.converted_to_case": z
    .object({
      previousStatus: statusSchema,
      status: z.literal("CONVERTED"),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      appointmentCreated: z.boolean(),
      assignedLawyerChanged: z.boolean()
    })
    .strict(),
  "document.upload_succeeded": z
    .object({
      fileType: fileTypeSchema,
      sizeBucket: z.enum(["0-1MB", "1-3MB", "3-5MB", "5MB+"]),
      category: statusSchema,
      visibility: statusSchema,
      actorScope: z.enum(["client", "staff"]),
      hasCase: z.boolean(),
      hasOwnerClient: z.boolean()
    })
    .strict(),
  "document.upload_failed": z
    .object({
      errorCode: errorCodeSchema,
      httpStatus: z.number().int().min(400).max(599),
      fileType: fileTypeSchema.optional(),
      sizeBucket: z.enum(["0-1MB", "1-3MB", "3-5MB", "5MB+", "unknown"]).optional(),
      category: statusSchema.optional(),
      actorScope: z.enum(["client", "staff", "unknown"]).optional()
    })
    .strict(),
  "case.status_updated": z
    .object({
      previousStatus: statusSchema,
      status: statusSchema,
      actorScope: z.enum(["lawyer", "admin"])
    })
    .strict(),
  "observability.error_captured": z
    .object({
      routeGroup: z.enum(["public", "portal", "admin", "auth", "files", "system"]),
      method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
      errorCode: errorCodeSchema,
      httpStatus: z.number().int().min(400).max(599)
    })
    .strict()
} satisfies Record<AnalyticsEventName, z.ZodTypeAny>;

export const analyticsClientEventSchema = z
  .object({
    name: clientAnalyticsEventNameSchema,
    source: z.literal("PUBLIC").default("PUBLIC"),
    properties: z.record(z.string(), z.unknown()).default({})
  })
  .strict();

export type AnalyticsEventInput = {
  name: AnalyticsEventName;
  source: "PUBLIC" | "PORTAL" | "ADMIN" | "SERVER";
  outcome?: "INFO" | "SUCCESS" | "FAILURE";
  properties?: unknown;
  requestId?: string | null;
  actor?: Principal | null;
};

export class AnalyticsPrivacyError extends ApiError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "AnalyticsPrivacyError";
  }
}

export function analyticsEnvironment() {
  return process.env.APP_ENV || process.env.NODE_ENV || "local";
}

export function analyticsRelease() {
  return process.env.APP_RELEASE || null;
}

export function analyticsEnabled() {
  return process.env.ANALYTICS_ENABLED !== "false";
}

export function actorHash(actor: Principal | null | undefined) {
  if (!actor?.id) {
    return null;
  }

  const salt = process.env.AUTH_SECRET || "kmt-local-analytics-salt";
  return createHash("sha256").update(`${salt}:${actor.id}`).digest("hex");
}

export function fileSizeBucket(sizeBytes: number | undefined | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return "unknown";
  }
  const mb = sizeBytes / (1024 * 1024);
  if (mb <= 1) return "0-1MB";
  if (mb <= 3) return "1-3MB";
  if (mb <= 5) return "3-5MB";
  return "5MB+";
}

export function safeFileType(mimeType: string | undefined | null) {
  return fileTypeSchema.safeParse(mimeType).success ? mimeType : "unknown";
}

export function buildAnalyticsEventData(input: AnalyticsEventInput) {
  const name = parseWithSchema(analyticsEventNameSchema, input.name, "Analytics event name is invalid.");
  const source = parseWithSchema(analyticsSourceSchema, input.source, "Analytics event source is invalid.");
  const outcome = parseWithSchema(analyticsOutcomeSchema, input.outcome ?? "INFO", "Analytics event outcome is invalid.");
  const properties = sanitizeAnalyticsProperties(name, input.properties ?? {});

  return {
    name,
    source,
    outcome,
    properties: properties as Prisma.InputJsonValue,
    requestId: input.requestId ?? null,
    actorHash: actorHash(input.actor),
    actorRole: input.actor?.roleName ?? null,
    environment: analyticsEnvironment(),
    release: analyticsRelease()
  };
}

export function sanitizeAnalyticsProperties(name: AnalyticsEventName, properties: unknown) {
  const parsed = parseWithSchema(analyticsPropertySchemas[name], properties, "Analytics event properties are invalid.");
  assertNoForbiddenAnalyticsData(parsed);
  return redactMetadata(parsed);
}

export async function captureAnalyticsEvent(input: AnalyticsEventInput) {
  if (!analyticsEnabled()) {
    return null;
  }

  const data = buildAnalyticsEventData(input);
  return prisma.analyticsEvent.create({ data });
}

export function captureAnalyticsEventBestEffort(input: AnalyticsEventInput) {
  void captureAnalyticsEvent(input).catch(() => {
    // Observability must not break product flows.
  });
}

export function parseClientAnalyticsEvent(input: unknown) {
  const body = parseWithSchema(analyticsClientEventSchema, input, "Analytics event payload is invalid.");
  return {
    name: body.name,
    source: body.source,
    properties: body.properties
  };
}

function assertNoForbiddenAnalyticsData(value: unknown) {
  const findings: string[] = [];
  scanForbidden(value, "$", findings);
  if (findings.length > 0) {
    throw new AnalyticsPrivacyError(`Analytics payload contains disallowed private data at ${findings[0]}.`);
  }
}

function scanForbidden(value: unknown, path: string, findings: string[]) {
  if (findings.length > 0) {
    return;
  }

  if (typeof value === "string") {
    if (looksLikeEmail(value) || looksLikePhone(value) || looksLikeInternalCaseIdentifier(value)) {
      findings.push(path);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbidden(entry, `${path}[${index}]`, findings));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (isForbiddenAnalyticsKey(key)) {
        findings.push(`${path}.${key}`);
        return;
      }
      scanForbidden(entry, `${path}.${key}`, findings);
    }
  }
}

function isForbiddenAnalyticsKey(key: string) {
  return /(name|fullName|clientName|lawyerName|email|phone|mobile|address|city|summary|caseSummary|legalSummary|content|document|fileName|notes|prompt|raw|password|token|cookie|authorization|secret|apiKey|otp|totp)/i.test(
    key
  );
}

function looksLikeEmail(value: string) {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function looksLikePhone(value: string) {
  return /\+?\d[\d\s().-]{8,}\d/.test(value);
}

function looksLikeInternalCaseIdentifier(value: string) {
  return /KMT-\d{4}-[A-Z0-9]+/i.test(value);
}
