import { describe, expect, it } from "vitest";
import {
  appointmentStatusForConsultationOutcome,
  classifyConsultationOutcome,
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

  it("builds one canonical predicate for every outcome view", () => {
    expect(consultationOutcomeViewWhere("current")).toEqual({ outcomeStatus: "PENDING" });
    expect(consultationOutcomeViewWhere("awaiting_result")).toEqual({ outcomeStatus: "AWAITING_RESULT" });
    expect(consultationOutcomeViewWhere("missed")).toEqual({ outcomeStatus: "MISSED" });
    expect(consultationOutcomeViewWhere("successful")).toEqual({ outcomeStatus: "SUCCESSFUL" });
    expect(consultationOutcomeViewWhere("no_show")).toEqual({ outcomeStatus: "NO_SHOW" });
    expect(consultationOutcomeViewWhere("cancelled")).toEqual({ outcomeStatus: "CANCELLED" });
    expect(consultationOutcomeViewWhere("all")).toEqual({});
  });
});
