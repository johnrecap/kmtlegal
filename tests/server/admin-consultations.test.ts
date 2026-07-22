import { describe, expect, it } from "vitest";
import {
  appointmentEndAt,
  canReviewConsultation,
  adminConsultationListQuerySchema,
  consultationInternalFileNumber,
  consultationScopeWhereForPrincipal,
  convertConsultationSchema,
  priorityFromUrgency,
  reviewConsultationSchema
} from "@/server/admin/consultation-review-service";
import { unreviewedConsultationWhere } from "@/server/admin/notification-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const officeAdmin: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["consultation.review.any"]
};

const assignedLawyer: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.lawyer,
  permissions: ["consultation.review.assigned"]
};

const client: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.client,
  permissions: ["client.read.self"],
  clientId: "44444444-4444-4444-8444-444444444444"
};

describe("admin consultation review contract", () => {
  it("scopes consultation lists by review permission", () => {
    expect(consultationScopeWhereForPrincipal(officeAdmin)).toEqual({});
    expect(consultationScopeWhereForPrincipal(assignedLawyer)).toEqual({ assignedLawyerId: assignedLawyer.id });

    try {
      consultationScopeWhereForPrincipal(client);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("allows any-review staff and only the assigned lawyer to review", () => {
    expect(canReviewConsultation(officeAdmin, { assignedLawyerId: null })).toBe(true);
    expect(canReviewConsultation(assignedLawyer, { assignedLawyerId: assignedLawyer.id })).toBe(true);
    expect(canReviewConsultation(assignedLawyer, { assignedLawyerId: officeAdmin.id })).toBe(false);
    expect(canReviewConsultation(client, { assignedLawyerId: assignedLawyer.id })).toBe(false);
  });

  it("normalizes urgency into case priority and appointment end times", () => {
    expect(priorityFromUrgency("URGENT")).toBe("URGENT");
    expect(priorityFromUrgency("HIGH")).toBe("HIGH");
    expect(priorityFromUrgency("LOW")).toBe("LOW");
    expect(priorityFromUrgency("anything-else")).toBe("NORMAL");

    const startsAt = new Date("2026-06-23T10:00:00.000Z");
    expect(appointmentEndAt(startsAt, 90).toISOString()).toBe("2026-06-23T11:30:00.000Z");
  });

  it("creates deterministic internal file numbers from consultation ids", () => {
    expect(
      consultationInternalFileNumber("12345678-0000-4000-8000-000000000000", new Date("2026-06-23T12:00:00.000Z"))
    ).toBe("KMT-2026-12345678");
  });

  it("validates conversion payloads with optional appointment data", () => {
    const parsed = convertConsultationSchema.parse({
      assignedLawyerId: assignedLawyer.id,
      caseTitle: "مراجعة عقد توريد",
      caseType: "corporate",
      priority: "HIGH",
      appointmentStartsAt: "2026-06-24T10:00:00.000Z",
      appointmentMode: "ONLINE",
      appointmentLocation: "https://meet.example/legal",
      appointmentDurationMinutes: "45"
    });

    expect(parsed.appointmentDurationMinutes).toBe(45);
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.appointmentMode).toBe("ONLINE");
  });

  it("supports secretary review filters and notes", () => {
    expect(adminConsultationListQuerySchema.parse({ review: "unreviewed", status: "PAYMENT_PENDING" })).toMatchObject({
      review: "unreviewed",
      status: "PAYMENT_PENDING"
    });

    expect(reviewConsultationSchema.parse({ note: "  reviewed by phone  " })).toEqual({ note: "reviewed by phone" });
    expect(reviewConsultationSchema.parse({ note: "" })).toEqual({ note: "" });
  });

  it("scopes secretary review notifications to scheduled unreviewed consultations", () => {
    expect(unreviewedConsultationWhere(officeAdmin)).toEqual({
      AND: [
        {},
        {
          status: "SCHEDULED",
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING"
        }
      ]
    });
    expect(unreviewedConsultationWhere(assignedLawyer)).toEqual({
      AND: [
        { assignedLawyerId: assignedLawyer.id },
        {
          status: "SCHEDULED",
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING"
        }
      ]
    });
  });
});
