import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";

export const CONSULTATION_BOOKING_SETTING_KEY = "consultation.booking";

export const consultationBookingModeValues = ["PAID_CHAT", "MANUAL_REVIEW"] as const;
export const consultationBookingModeSchema = z.enum(consultationBookingModeValues);
export type ConsultationBookingMode = z.infer<typeof consultationBookingModeSchema>;

export const DEFAULT_CONSULTATION_BOOKING_MODE: ConsultationBookingMode = "PAID_CHAT";

export const consultationBookingSettingSchema = z
  .object({
    mode: consultationBookingModeSchema.default(DEFAULT_CONSULTATION_BOOKING_MODE)
  })
  .strict();

type ConsultationBookingSettingsClient = Pick<Prisma.TransactionClient, "systemSetting">;

export function consultationBookingModeFromValue(value: Prisma.JsonValue | null | undefined): ConsultationBookingMode {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configured = (value as Record<string, unknown>).mode;
    if (typeof configured === "string") {
      const parsed = consultationBookingModeSchema.safeParse(configured);
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
    paymentEnabled: mode === "PAID_CHAT",
    aiChatEnabled: mode === "PAID_CHAT"
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
  if (mode !== "PAID_CHAT") {
    throw new ApiError(409, "FEATURE_DISABLED", "Paid booking chat is disabled. Use the manual consultation request form.");
  }
}

export async function assertManualReviewBookingEnabled(input: { client?: ConsultationBookingSettingsClient } = {}) {
  const mode = await getConsultationBookingMode(input);
  if (mode !== "MANUAL_REVIEW") {
    throw new ApiError(409, "FEATURE_DISABLED", "Manual consultation requests are disabled while paid booking chat is active.");
  }
}
