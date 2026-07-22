import { describe, expect, it } from "vitest";
import { ROLES, type Principal } from "@/server/auth/policy";
import {
  CONSULTATION_OUTCOME_VIEWS,
  canManageConsultationOutcome,
  consultationOutcomeInputSchema,
  consultationOutcomeNotReadyError,
  consultationReopenRequiredError,
  consultationStateChangedError,
  consultationOutcomeViewSchema,
  reopenConsultationInputSchema,
  scheduleConsultationInputSchema,
  toAdminConsultationListItem
} from "@/server/admin/consultation-outcome-service";
import {
  assertExistingConsultationMutationAllowed,
  rejectConsultationSchema
} from "@/server/admin/consultation-review-service";

const actor = (roleName: string, permissions: string[] = []): Principal => ({
  id: "36000000-0000-4000-8000-000000000001",
  roleName,
  permissions
});

describe("PLAN-36 outcome contract", () => {
  it("accepts exactly the eight shareable outcome views", () => {
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

    for (const view of CONSULTATION_OUTCOME_VIEWS) {
      expect(consultationOutcomeViewSchema.parse(view)).toBe(view);
    }
    expect(() => consultationOutcomeViewSchema.parse("overdue")).toThrow();
  });

  it("requires the intersection of consultation and appointment permissions", () => {
    expect(
      canManageConsultationOutcome(
        actor(ROLES.secretary, ["consultation.review.any", "appointment.manage.any"])
      )
    ).toBe(true);
    expect(canManageConsultationOutcome(actor(ROLES.officeAdmin, ["consultation.review.any"]))).toBe(false);
    expect(
      canManageConsultationOutcome(
        actor(ROLES.lawyer, ["consultation.review.any", "appointment.manage.any"])
      )
    ).toBe(false);
    expect(canManageConsultationOutcome(actor(ROLES.lawyer, ["appointment.manage.any"]))).toBe(false);
    expect(canManageConsultationOutcome(actor(ROLES.marketingStaff, []))).toBe(false);
    expect(canManageConsultationOutcome(actor(ROLES.superAdmin))).toBe(true);
  });

  it("validates final outcome and optimistic version payloads", () => {
    expect(
      consultationOutcomeInputSchema.parse({
        status: "SUCCESSFUL",
        expectedOutcomeVersion: 2,
        reasonCode: "COMPLETED_AS_SCHEDULED",
        note: "  verified internally  "
      })
    ).toEqual({
      status: "SUCCESSFUL",
      expectedOutcomeVersion: 2,
      reasonCode: "COMPLETED_AS_SCHEDULED",
      note: "verified internally"
    });

    expect(() =>
      consultationOutcomeInputSchema.parse({ status: "AWAITING_RESULT", expectedOutcomeVersion: 0 })
    ).toThrow();
    expect(() =>
      consultationOutcomeInputSchema.parse({ status: "NO_SHOW", expectedOutcomeVersion: -1 })
    ).toThrow();
  });

  it("requires every field needed for audited future rescheduling", () => {
    const parsed = reopenConsultationInputSchema.parse({
      assignedLawyerId: "36000000-0000-4000-8000-000000000002",
      startsAt: "2026-07-23T10:00:00.000Z",
      durationMinutes: "60",
      mode: "ONLINE",
      location: "",
      reasonCode: "REOPEN_CLIENT_REQUEST",
      note: " follow up ",
      expectedOutcomeVersion: 1
    });

    expect(parsed).toMatchObject({
      durationMinutes: 60,
      mode: "ONLINE",
      reasonCode: "REOPEN_CLIENT_REQUEST",
      note: "follow up",
      expectedOutcomeVersion: 1
    });
    expect(() => reopenConsultationInputSchema.parse({})).toThrow();
    expect(() =>
      reopenConsultationInputSchema.parse({ ...parsed, durationMinutes: 10 })
    ).toThrow();
  });

  it("validates the atomic initial-scheduling payload", () => {
    const parsed = scheduleConsultationInputSchema.parse({
      assignedLawyerId: "36000000-0000-4000-8000-000000000002",
      startsAt: "2026-07-23T10:00:00.000Z",
      durationMinutes: "45",
      mode: "PHONE",
      location: "",
      expectedOutcomeVersion: "3"
    });

    expect(parsed).toMatchObject({
      durationMinutes: 45,
      mode: "PHONE",
      expectedOutcomeVersion: 3
    });
    expect(() => scheduleConsultationInputSchema.parse({ ...parsed, durationMinutes: 241 })).toThrow();
    expect(() => scheduleConsultationInputSchema.parse({ ...parsed, mode: "COURT" })).toThrow();
  });

  it("guards legacy actions without allowing a missed request to bypass reopen", () => {
    expect(() => assertExistingConsultationMutationAllowed("assign", "PENDING")).not.toThrow();
    expect(() => assertExistingConsultationMutationAllowed("review", "AWAITING_RESULT")).not.toThrow();
    expect(() => assertExistingConsultationMutationAllowed("convert", "SUCCESSFUL")).not.toThrow();

    expect(() => assertExistingConsultationMutationAllowed("assign", "MISSED")).toThrowError(
      expect.objectContaining({ code: "CONSULTATION_REOPEN_REQUIRED" })
    );
    expect(() => assertExistingConsultationMutationAllowed("review", "NO_SHOW")).toThrowError(
      expect.objectContaining({ code: "CONSULTATION_STATE_CHANGED" })
    );
    expect(() => assertExistingConsultationMutationAllowed("convert", "PENDING")).toThrowError(
      expect.objectContaining({ code: "CONSULTATION_STATE_CHANGED" })
    );
  });

  it("accepts a categorized, versioned rejection while preserving the legacy body", () => {
    expect(
      rejectConsultationSchema.parse({
        expectedOutcomeVersion: "4",
        reasonCode: "CANCELLED_BY_OFFICE",
        reason: " duplicate intake "
      })
    ).toEqual({
      expectedOutcomeVersion: 4,
      reasonCode: "CANCELLED_BY_OFFICE",
      reason: "duplicate intake"
    });
    expect(rejectConsultationSchema.parse({ reason: "legacy rejection" })).toEqual({
      reasonCode: "CANCELLED_BY_OFFICE",
      reason: "legacy rejection"
    });
  });

  it("returns the documented nested secretary-review projection without internal notes", () => {
    const reviewedAt = new Date("2026-07-19T08:00:00.000Z");
    const asOf = new Date("2026-07-22T08:00:00.000Z");
    const item = toAdminConsultationListItem({
      id: "36000000-0000-4000-8000-000000000010",
      fullName: "Test applicant",
      phone: "+201000000000",
      email: null,
      serviceCategory: "legal-consultation",
      urgency: "NORMAL",
      preferredMode: "ONLINE",
      status: "SCHEDULED",
      assignedLawyerId: null,
      assignedLawyer: null,
      secretaryReviewedAt: reviewedAt,
      secretaryReviewedBy: {
        id: "36000000-0000-4000-8000-000000000001",
        name: "Secretary"
      },
      outcomeStatus: "PENDING",
      outcomeAt: null,
      outcomeBy: null,
      outcomeReasonCode: null,
      outcomeVersion: 0,
      convertedCase: null,
      appointments: [],
      createdAt: reviewedAt,
      updatedAt: reviewedAt
    } as never, asOf);

    expect(item.secretaryReview).toEqual({
      reviewedAt,
      reviewedBy: {
        id: "36000000-0000-4000-8000-000000000001",
        name: "Secretary"
      }
    });
    expect(item).not.toHaveProperty("secretaryReviewNote");
    expect(item).not.toHaveProperty("outcomeNote");
    expect(item.operationalTiming).toEqual({
      isOverdueUnbooked: true,
      overdueAt: new Date("2026-07-22T08:00:00.000Z")
    });
  });

  it("exposes the three stable lifecycle errors", () => {
    expect(consultationOutcomeNotReadyError().code).toBe("CONSULTATION_OUTCOME_NOT_READY");
    expect(consultationStateChangedError().code).toBe("CONSULTATION_STATE_CHANGED");
    expect(consultationReopenRequiredError().code).toBe("CONSULTATION_REOPEN_REQUIRED");
  });
});
