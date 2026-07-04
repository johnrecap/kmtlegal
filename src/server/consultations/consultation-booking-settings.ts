import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";

export const CONSULTATION_BOOKING_SETTING_KEY = "consultation.booking";

export const consultationBookingModeValues = ["AI_CHAT_PAID", "AI_CHAT_FREE"] as const;
export const legacyConsultationBookingModeValues = ["PAID_CHAT", "MANUAL_REVIEW"] as const;
export const consultationBookingModeInputValues = [
  ...consultationBookingModeValues,
  ...legacyConsultationBookingModeValues
] as const;
export const consultationBookingModeSchema = z.enum(consultationBookingModeValues);
export const consultationBookingModeInputSchema = z.enum(consultationBookingModeInputValues).transform((mode) => normalizeConsultationBookingMode(mode));
export type ConsultationBookingMode = z.infer<typeof consultationBookingModeSchema>;

export const DEFAULT_CONSULTATION_BOOKING_MODE: ConsultationBookingMode = "AI_CHAT_PAID";

export const consultationBookingSettingSchema = z
  .object({
    mode: consultationBookingModeInputSchema.default(DEFAULT_CONSULTATION_BOOKING_MODE)
  })
  .strict();

type ConsultationBookingSettingsClient = Pick<Prisma.TransactionClient, "systemSetting">;

export function consultationBookingModeFromValue(value: Prisma.JsonValue | null | undefined): ConsultationBookingMode {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configured = (value as Record<string, unknown>).mode;
    if (typeof configured === "string") {
      const parsed = consultationBookingModeInputSchema.safeParse(configured);
      if (parsed.success) {
        return parsed.data;
      }
    }
  }

  return DEFAULT_CONSULTATION_BOOKING_MODE;
}

export function consultationBookingFlags(mode: ConsultationBookingMode) {
  return {
    bookingMode: mode,
    paymentEnabled: mode === "AI_CHAT_PAID",
    aiChatEnabled: true
  };
}

export async function getConsultationBookingMode(input: { client?: ConsultationBookingSettingsClient } = {}) {
  const client = input.client ?? prisma;
  const setting = await client.systemSetting.findUnique({
    where: { key: CONSULTATION_BOOKING_SETTING_KEY }
  });

  return consultationBookingModeFromValue(setting?.value);
}

export async function getPublicConsultationBookingMode(input: { client?: ConsultationBookingSettingsClient } = {}) {
  if (!process.env.DATABASE_URL && !input.client) {
    return DEFAULT_CONSULTATION_BOOKING_MODE;
  }

  try {
    return await getConsultationBookingMode(input);
  } catch {
    return DEFAULT_CONSULTATION_BOOKING_MODE;
  }
}

export async function assertPaidChatBookingEnabled(input: { client?: ConsultationBookingSettingsClient } = {}) {
  const mode = await getConsultationBookingMode(input);
  if (mode !== "AI_CHAT_PAID") {
    throw new ApiError(409, "FEATURE_DISABLED", "Paid booking is disabled. Use the consultation assistant without payment.");
  }
}

export async function assertAiChatBookingEnabled(input: { client?: ConsultationBookingSettingsClient } = {}) {
  const mode = await getConsultationBookingMode(input);
  if (!consultationBookingFlags(mode).aiChatEnabled) {
    throw new ApiError(409, "FEATURE_DISABLED", "Consultation assistant booking is disabled.");
  }
}

export async function assertManualReviewBookingEnabled(input: { client?: ConsultationBookingSettingsClient } = {}) {
  await getConsultationBookingMode(input);
  throw new ApiError(409, "FEATURE_DISABLED", "Manual consultation form is disabled. Use the consultation assistant.");
}

function normalizeConsultationBookingMode(mode: (typeof consultationBookingModeInputValues)[number]): ConsultationBookingMode {
  if (mode === "PAID_CHAT") {
    return "AI_CHAT_PAID";
  }
  if (mode === "MANUAL_REVIEW") {
    return "AI_CHAT_FREE";
  }
  return mode;
}
