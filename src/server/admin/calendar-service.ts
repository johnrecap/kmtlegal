import type { ConsultationOutcomeValue } from "./consultation-outcome-policy";

type CalendarConsultationProjection = {
  type: string;
  caseId: string | null;
  endsAt: Date | string;
  consultationRequest?: { outcomeStatus: ConsultationOutcomeValue } | null;
};

export function effectiveConsultationOutcome(
  appointment: CalendarConsultationProjection
): ConsultationOutcomeValue | null {
  if (
    appointment.type !== "CONSULTATION" ||
    appointment.caseId !== null ||
    !appointment.consultationRequest
  ) {
    return null;
  }
  return appointment.consultationRequest.outcomeStatus;
}

export function canUseGenericCalendarReschedule(
  appointment: CalendarConsultationProjection,
  now = new Date()
) {
  const outcome = effectiveConsultationOutcome(appointment);
  return outcome === null || (
    outcome === "PENDING" &&
    new Date(appointment.endsAt).getTime() > now.getTime()
  );
}
