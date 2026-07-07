import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { expireOpenConsultationPaymentAttempts } from "@/server/payments/payment-service";
import { parseWithSchema } from "@/server/validation/schemas";

export const CONSULTATION_AVAILABILITY_SETTING_KEY = "consultation.availability";
export const CONSULTATION_TIMEZONE = "Africa/Cairo";

const appointmentModeSchema = z.enum(["PHONE", "ONLINE", "OFFICE"]);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must use HH:mm format.");

export const consultationAvailabilityDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    start: timeSchema,
    end: timeSchema,
    modes: z.array(appointmentModeSchema).min(1)
  })
  .superRefine((value, context) => {
    if (minutesFromTime(value.end) <= minutesFromTime(value.start)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time.",
        path: ["end"]
      });
    }
  });

export const consultationAvailabilitySchema = z.object({
  timezone: z.literal(CONSULTATION_TIMEZONE).default(CONSULTATION_TIMEZONE),
  slotDurationMinutes: z.number().int().min(15).max(240).default(60),
  minLeadHours: z.number().int().min(0).max(168).default(4),
  bookingWindowDays: z.number().int().min(1).max(60).default(14),
  days: z.array(consultationAvailabilityDaySchema).length(7)
});

export type ConsultationAvailability = z.infer<typeof consultationAvailabilitySchema>;
export type ConsultationMode = z.infer<typeof appointmentModeSchema>;
export type PublicConsultationSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: ConsultationMode;
};

export type PublicConsultationSlotFilter = {
  date?: string;
  fromTime?: string;
  toTime?: string;
};

type ExistingAppointment = {
  startsAt: Date;
  endsAt: Date;
};

export const defaultConsultationAvailability: ConsultationAvailability = consultationAvailabilitySchema.parse({
  timezone: CONSULTATION_TIMEZONE,
  slotDurationMinutes: 60,
  minLeadHours: 4,
  bookingWindowDays: 14,
  days: [
    { weekday: 0, enabled: true, start: "10:00", end: "17:00", modes: ["ONLINE", "PHONE", "OFFICE"] },
    { weekday: 1, enabled: true, start: "10:00", end: "17:00", modes: ["ONLINE", "PHONE", "OFFICE"] },
    { weekday: 2, enabled: true, start: "10:00", end: "17:00", modes: ["ONLINE", "PHONE", "OFFICE"] },
    { weekday: 3, enabled: true, start: "10:00", end: "17:00", modes: ["ONLINE", "PHONE", "OFFICE"] },
    { weekday: 4, enabled: true, start: "10:00", end: "17:00", modes: ["ONLINE", "PHONE", "OFFICE"] },
    { weekday: 5, enabled: false, start: "10:00", end: "17:00", modes: ["ONLINE"] },
    { weekday: 6, enabled: false, start: "10:00", end: "17:00", modes: ["ONLINE"] }
  ]
});

export function canManageConsultationAvailability(actor: Principal) {
  return hasPermission(actor, "appointment.manage.any") || hasPermission(actor, "settings.manage.any");
}

export async function getConsultationAvailability() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY }
  });

  return normalizeAvailability(setting?.value);
}

export async function getAdminConsultationAvailability(input: { actor: Principal }) {
  assertCanManageAvailability(input.actor);
  const setting = await prisma.systemSetting.findUnique({
    where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY },
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });

  return {
    value: normalizeAvailability(setting?.value),
    updatedAt: setting?.updatedAt?.toISOString() ?? null,
    updatedBy: setting?.updatedBy ?? null
  };
}

export async function updateAdminConsultationAvailability(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  assertCanManageAvailability(input.actor);
  const value = parseWithSchema(consultationAvailabilitySchema, input.body, "Consultation availability payload is invalid.");

  const updated = await prisma.systemSetting.upsert({
    where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY },
    create: {
      key: CONSULTATION_AVAILABILITY_SETTING_KEY,
      value: value as unknown as Prisma.InputJsonValue,
      updatedById: input.actor.id
    },
    update: {
      value: value as unknown as Prisma.InputJsonValue,
      updatedById: input.actor.id
    },
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "settings.update",
    resourceType: "SystemSetting",
    resourceId: updated.id,
    metadata: { key: CONSULTATION_AVAILABILITY_SETTING_KEY },
    request: input.request,
    requestId: input.requestId
  });

  return {
    value: normalizeAvailability(updated.value),
    updatedAt: updated.updatedAt.toISOString(),
    updatedBy: updated.updatedBy
  };
}

export async function listPublicConsultationSlots(input: {
  mode?: ConsultationMode;
  now?: Date;
  limit?: number;
  date?: string;
  fromTime?: string;
  toTime?: string;
} = {}) {
  await expireOpenConsultationPaymentAttempts(input.now ?? new Date(), { limit: 500 });
  const availability = await getConsultationAvailability();
  const window = consultationSlotWindow(availability, input.now ?? new Date());
  const appointments = await prisma.appointment.findMany({
    where: {
      type: "CONSULTATION",
      status: { in: ["RESERVED", "SCHEDULED", "RESCHEDULED"] },
      startsAt: { lt: window.endsAt },
      endsAt: { gt: window.startsAt }
    },
    select: { startsAt: true, endsAt: true }
  });

  return generateConsultationSlots({
    availability,
    appointments,
    mode: input.mode,
    now: input.now ?? new Date(),
    limit: input.limit ?? 12,
    date: input.date,
    fromTime: input.fromTime,
    toTime: input.toTime
  });
}

export async function assertPublicConsultationSlotAvailable(input: {
  startsAt: Date;
  mode: ConsultationMode;
  now?: Date;
}) {
  const slots = await listPublicConsultationSlots({ mode: input.mode, now: input.now, limit: 500 });
  const match = slots.find((slot) => slot.startsAt === input.startsAt.toISOString());
  if (!match) {
    throw new ApiError(409, "CONFLICT", "This consultation slot is no longer available. Please choose another time.");
  }

  return match;
}

export function generateConsultationSlots(input: {
  availability: ConsultationAvailability;
  appointments: ExistingAppointment[];
  mode?: ConsultationMode;
  now?: Date;
  limit?: number;
  date?: string;
  fromTime?: string;
  toTime?: string;
}) {
  const now = input.now ?? new Date();
  const availableFrom = new Date(now.getTime() + input.availability.minLeadHours * 60 * 60_000);
  const availableUntil = new Date(availableFrom.getTime() + input.availability.bookingWindowDays * 24 * 60 * 60_000);
  const slots: PublicConsultationSlot[] = [];
  const mode = input.mode ?? "ONLINE";
  const duration = input.availability.slotDurationMinutes;
  const limit = input.limit ?? 12;
  const firstDate = normalizeSlotDate(input.date) || cairoDateString(now);
  const daysToScan = input.date ? 1 : input.availability.bookingWindowDays;
  const fromMinutes = input.fromTime ? minutesFromTime(input.fromTime) : null;
  const toMinutes = input.toTime ? minutesFromTime(input.toTime) : null;

  for (let offset = 0; offset < daysToScan && slots.length < limit; offset += 1) {
    const date = addCairoDays(firstDate, offset);
    const weekday = cairoWeekday(date);
    const day = input.availability.days.find((item) => item.weekday === weekday);
    if (!day?.enabled || !day.modes.includes(mode)) {
      continue;
    }

    const startMinutes = minutesFromTime(day.start);
    const endMinutes = minutesFromTime(day.end);
    for (let minute = startMinutes; minute + duration <= endMinutes && slots.length < limit; minute += duration) {
      if (fromMinutes !== null && minute < fromMinutes) {
        continue;
      }
      if (toMinutes !== null && minute + duration > toMinutes) {
        continue;
      }
      const startsAt = cairoDateTime(date, minute);
      const endsAt = new Date(startsAt.getTime() + duration * 60_000);
      if (startsAt < availableFrom) {
        continue;
      }
      if (startsAt >= availableUntil) {
        continue;
      }
      if (input.appointments.some((appointment) => appointmentsOverlap(startsAt, endsAt, appointment.startsAt, appointment.endsAt))) {
        continue;
      }
      slots.push({
        id: `slot-${startsAt.toISOString()}`,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        mode
      });
    }
  }

  return slots;
}

function normalizeSlotDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }
  return value;
}

function assertCanManageAvailability(actor: Principal) {
  if (!canManageConsultationAvailability(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Managing consultation availability requires appointment management permission.");
  }
}

function normalizeAvailability(value: Prisma.JsonValue | undefined) {
  if (!value || typeof value !== "object") {
    return defaultConsultationAvailability;
  }

  const candidate = value as Record<string, unknown>;
  return consultationAvailabilitySchema.parse({
    ...defaultConsultationAvailability,
    ...candidate,
    days: normalizeDays(candidate.days)
  });
}

function normalizeDays(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  return defaultConsultationAvailability.days.map((defaultDay) => {
    const matching = rows.find((row) => typeof row === "object" && row !== null && (row as { weekday?: unknown }).weekday === defaultDay.weekday);
    return { ...defaultDay, ...(matching && typeof matching === "object" ? matching : {}) };
  });
}

function consultationSlotWindow(availability: ConsultationAvailability, now: Date) {
  const startsAt = new Date(now.getTime() + availability.minLeadHours * 60 * 60_000);
  const endsAt = new Date(startsAt.getTime() + availability.bookingWindowDays * 24 * 60 * 60_000);
  return { startsAt, endsAt };
}

function appointmentsOverlap(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function timeFromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function cairoDateTime(date: string, minutes: number) {
  return new Date(`${date}T${timeFromMinutes(minutes)}:00+03:00`);
}

function cairoDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONSULTATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addCairoDays(date: string, offset: number) {
  const base = new Date(`${date}T12:00:00+03:00`);
  base.setUTCDate(base.getUTCDate() + offset);
  return cairoDateString(base);
}

function cairoWeekday(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONSULTATION_TIMEZONE,
    weekday: "short"
  }).formatToParts(new Date(`${date}T12:00:00+03:00`));
  const day = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}
