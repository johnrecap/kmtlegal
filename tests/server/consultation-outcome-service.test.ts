import { describe, expect, it } from "vitest";
import {
  CONSULTATION_OUTCOME_VIEWS,
  CONSULTATION_OVERDUE_UNBOOKED_MS,
  appointmentStatusForConsultationOutcome,
  classifyConsultationOutcome,
  consultationOperationalTiming,
  consultationOutcomeViewWhere,
  primaryConsultationAppointmentQuery
} from "@/server/admin/consultation-outcome-service";

const now = new Date("2026-07-22T10:00:00.000Z");

describe("PLAN-36 outcome domain", () => {
  it("keeps a booking pending before endsAt and classifies at the exact boundary", () => {
    const base = {
      outcomeStatus: "PENDING" as const,
      assignedLawyerId: null,
      secretaryReviewedAt: null
    };

    expect(
      classifyConsultationOutcome({ ...base, endsAt: new Date("2026-07-22T10:00:00.001Z") }, now)
    ).toBeNull();
    expect(
      classifyConsultationOutcome({ ...base, endsAt: new Date("2026-07-22T10:00:00.000Z") }, now)
    ).toBe("MISSED");
    expect(
      classifyConsultationOutcome({ ...base, endsAt: new Date("2026-07-22T09:59:59.999Z") }, now)
    ).toBe("MISSED");
  });

  it("uses AND for missed and OR for awaiting result", () => {
    const ended = new Date("2026-07-22T09:00:00.000Z");

    expect(
      classifyConsultationOutcome({
        outcomeStatus: "PENDING",
        endsAt: ended,
        assignedLawyerId: "36000000-0000-4000-8000-000000000002",
        secretaryReviewedAt: null
      }, now)
    ).toBe("AWAITING_RESULT");
    expect(
      classifyConsultationOutcome({
        outcomeStatus: "PENDING",
        endsAt: ended,
        assignedLawyerId: null,
        secretaryReviewedAt: new Date("2026-07-22T08:30:00.000Z")
      }, now)
    ).toBe("AWAITING_RESULT");
    expect(
      classifyConsultationOutcome({
        outcomeStatus: "AWAITING_RESULT",
        endsAt: ended,
        assignedLawyerId: null,
        secretaryReviewedAt: null
      }, now)
    ).toBeNull();
  });

  it("selects the oldest non-case consultation appointment deterministically", () => {
    expect(primaryConsultationAppointmentQuery("36000000-0000-4000-8000-000000000010")).toEqual({
      where: {
        consultationRequestId: "36000000-0000-4000-8000-000000000010",
        type: "CONSULTATION",
        caseId: null
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }]
    });
  });

  it("maps final outcomes to terminal appointment statuses", () => {
    expect(appointmentStatusForConsultationOutcome("SUCCESSFUL")).toBe("COMPLETED");
    expect(appointmentStatusForConsultationOutcome("NO_SHOW")).toBe("NO_SHOW");
    expect(appointmentStatusForConsultationOutcome("CANCELLED")).toBe("CANCELLED");
    expect(appointmentStatusForConsultationOutcome("MISSED")).toBeNull();
  });

  it("builds mutually exclusive current and overdue-unbooked predicates from one asOf", () => {
    const cutoff = new Date(now.getTime() - CONSULTATION_OVERDUE_UNBOOKED_MS);
    const primary = { type: "CONSULTATION", caseId: null };
    const activeStatuses = { in: ["NEW", "REVIEWING", "PAYMENT_PENDING", "SCHEDULED"] };

    expect(CONSULTATION_OUTCOME_VIEWS).toEqual([
      "current",
      "overdue_unbooked",
      "awaiting_result",
      "missed",
      "successful",
      "no_show",
      "cancelled",
      "all"
    ]);
    expect(consultationOutcomeViewWhere("current", now)).toEqual({
      outcomeStatus: "PENDING",
      OR: [
        {
          AND: [
            { appointments: { some: { ...primary, endsAt: { gt: now } } } },
            { appointments: { none: { ...primary, endsAt: { lte: now } } } }
          ]
        },
        {
          AND: [
            { appointments: { none: primary } },
            { status: activeStatuses },
            { createdAt: { gt: cutoff } }
          ]
        }
      ]
    });
    expect(consultationOutcomeViewWhere("overdue_unbooked", now)).toEqual({
      outcomeStatus: "PENDING",
      status: activeStatuses,
      createdAt: { lte: cutoff },
      appointments: { none: primary }
    });
    expect(consultationOutcomeViewWhere("awaiting_result", now)).toEqual({ outcomeStatus: "AWAITING_RESULT" });
    expect(consultationOutcomeViewWhere("missed", now)).toEqual({ outcomeStatus: "MISSED" });
    expect(consultationOutcomeViewWhere("successful", now)).toEqual({ outcomeStatus: "SUCCESSFUL" });
    expect(consultationOutcomeViewWhere("no_show", now)).toEqual({ outcomeStatus: "NO_SHOW" });
    expect(consultationOutcomeViewWhere("cancelled", now)).toEqual({ outcomeStatus: "CANCELLED" });
    expect(consultationOutcomeViewWhere("all", now)).toEqual({});
  });

  it("uses the exact 72-hour boundary for operational timing without changing outcome", () => {
    const createdAt = new Date(now.getTime() - CONSULTATION_OVERDUE_UNBOOKED_MS);
    const input = {
      createdAt,
      status: "NEW",
      outcomeStatus: "PENDING",
      hasPrimaryAppointment: false
    } as const;

    expect(consultationOperationalTiming(input, new Date(now.getTime() - 1))).toEqual({
      isOverdueUnbooked: false,
      overdueAt: now
    });
    expect(consultationOperationalTiming(input, now)).toEqual({
      isOverdueUnbooked: true,
      overdueAt: now
    });
    expect(consultationOperationalTiming(input, new Date(now.getTime() + 1))).toEqual({
      isOverdueUnbooked: true,
      overdueAt: now
    });
    expect(consultationOperationalTiming({ ...input, hasPrimaryAppointment: true }, now)).toEqual({
      isOverdueUnbooked: false,
      overdueAt: null
    });
    expect(consultationOperationalTiming({ ...input, status: "CONVERTED" }, now)).toEqual({
      isOverdueUnbooked: false,
      overdueAt: null
    });
  });
});
