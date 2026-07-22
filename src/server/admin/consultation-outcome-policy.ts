import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasPermission, ROLES, type Principal } from "@/server/auth/policy";
import { uuidSchema } from "@/server/validation/schemas";

export const CONSULTATION_OUTCOME_VIEWS = [
  "current",
  "awaiting_result",
  "missed",
  "successful",
  "no_show",
  "cancelled",
  "all"
] as const;

export const consultationOutcomeViewSchema = z.enum(CONSULTATION_OUTCOME_VIEWS);
export type ConsultationOutcomeView = z.infer<typeof consultationOutcomeViewSchema>;

export const FINAL_CONSULTATION_OUTCOMES = ["SUCCESSFUL", "NO_SHOW", "CANCELLED"] as const;
export const finalConsultationOutcomeSchema = z.enum(FINAL_CONSULTATION_OUTCOMES);
export type FinalConsultationOutcome = z.infer<typeof finalConsultationOutcomeSchema>;

export const INITIAL_OUTCOME_REASON_CODES = [
  "COMPLETED_AS_SCHEDULED",
  "CLIENT_NO_SHOW",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_OFFICE",
  "TECHNICAL_ISSUE",
  "OTHER"
] as const;

export const CORRECTION_OUTCOME_REASON_CODES = [
  "CORRECTED_OPERATOR_ERROR",
  "CORRECTED_AFTER_VERIFICATION",
  "CORRECTED_CLIENT_UPDATE",
  "OTHER"
] as const;

export const REOPEN_OUTCOME_REASON_CODES = [
  "REOPEN_CLIENT_REQUEST",
  "REOPEN_OFFICE_FOLLOW_UP",
  "REOPEN_SCHEDULING_ERROR",
  "OTHER"
] as const;

const outcomeReasonCodeSchema = z.enum([
  ...new Set([...INITIAL_OUTCOME_REASON_CODES, ...CORRECTION_OUTCOME_REASON_CODES])
] as [string, ...string[]]);

export const consultationOutcomeInputSchema = z
  .object({
    status: finalConsultationOutcomeSchema,
    expectedOutcomeVersion: z.coerce.number().int().min(0),
    reasonCode: outcomeReasonCodeSchema,
    note: z.string().trim().max(800).optional().or(z.literal(""))
  })
  .strict();

export const reopenConsultationInputSchema = z
  .object({
    assignedLawyerId: uuidSchema,
    startsAt: z.string().datetime(),
    durationMinutes: z.coerce.number().int().min(15).max(240),
    mode: z.enum(["OFFICE", "PHONE", "ONLINE"]),
    location: z.string().trim().max(180).optional().or(z.literal("")),
    reasonCode: z.enum(REOPEN_OUTCOME_REASON_CODES),
    note: z.string().trim().max(800).optional().or(z.literal("")),
    expectedOutcomeVersion: z.coerce.number().int().min(0)
  })
  .strict();

export type ConsultationOutcomeInput = z.infer<typeof consultationOutcomeInputSchema>;
export type ReopenConsultationInput = z.infer<typeof reopenConsultationInputSchema>;

export type ConsultationOutcomeValue =
  | "PENDING"
  | "AWAITING_RESULT"
  | "MISSED"
  | "SUCCESSFUL"
  | "NO_SHOW"
  | "CANCELLED";

export function canManageConsultationOutcome(actor: Principal) {
  const roleAllowed =
    actor.roleName === ROLES.secretary ||
    actor.roleName === ROLES.officeAdmin ||
    actor.roleName === ROLES.superAdmin;
  return (
    roleAllowed &&
    hasPermission(actor, "consultation.review.any") &&
    hasPermission(actor, "appointment.manage.any")
  );
}

export function classifyConsultationOutcome(
  input: {
    outcomeStatus: ConsultationOutcomeValue;
    endsAt: Date;
    assignedLawyerId?: string | null;
    secretaryReviewedAt?: Date | null;
  },
  now = new Date()
): "MISSED" | "AWAITING_RESULT" | null {
  if (input.outcomeStatus !== "PENDING" || input.endsAt.getTime() > now.getTime()) {
    return null;
  }

  return !input.assignedLawyerId && !input.secretaryReviewedAt ? "MISSED" : "AWAITING_RESULT";
}

export function appointmentStatusForConsultationOutcome(outcome: ConsultationOutcomeValue) {
  if (outcome === "SUCCESSFUL") return "COMPLETED" as const;
  if (outcome === "NO_SHOW") return "NO_SHOW" as const;
  if (outcome === "CANCELLED") return "CANCELLED" as const;
  return null;
}

export function consultationOutcomeViewWhere(
  view: ConsultationOutcomeView
): Prisma.ConsultationRequestWhereInput {
  const statusByView: Partial<Record<ConsultationOutcomeView, ConsultationOutcomeValue>> = {
    current: "PENDING",
    awaiting_result: "AWAITING_RESULT",
    missed: "MISSED",
    successful: "SUCCESSFUL",
    no_show: "NO_SHOW",
    cancelled: "CANCELLED"
  };
  const outcomeStatus = statusByView[view];
  return outcomeStatus ? { outcomeStatus } : {};
}

export function primaryConsultationAppointmentQuery(consultationRequestId: string) {
  return {
    where: {
      consultationRequestId,
      type: "CONSULTATION" as const,
      caseId: null
    },
    orderBy: [{ startsAt: "asc" as const }, { id: "asc" as const }]
  };
}

export function isCorrectionReasonCode(value: string) {
  return (CORRECTION_OUTCOME_REASON_CODES as readonly string[]).includes(value);
}
