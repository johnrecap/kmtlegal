import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adminCalendarQuerySchema,
  adminCaseListQuerySchema,
  appointmentEndAt,
  appointmentRescheduleSchema,
  calendarAppointmentCreateSchema,
  canManageCalendarAppointment,
  canManageCaseSessions,
  canReadAdminCase,
  canUpdateAdminCase,
  appointmentScopeWhereForPrincipal,
  caseScopeWhereForPrincipal,
  caseSessionCreateSchema,
  caseStatusUpdateSchema,
  dateFromActionInput
} from "@/server/admin/case-operations-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const officeAdmin: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["case.read.any", "case.update.any", "session.manage.any", "appointment.manage.any"]
};

const assignedLawyer: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.lawyer,
  permissions: ["case.read.assigned", "case.update.assigned", "session.manage.assigned", "appointment.read.assigned"]
};

const otherLawyer: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.lawyer,
  permissions: ["case.read.assigned", "case.update.assigned", "session.manage.assigned", "appointment.read.assigned"]
};

const marketing: Principal = {
  id: "44444444-4444-4444-8444-444444444444",
  roleName: ROLES.marketingStaff,
  permissions: ["content.create.any"]
};

const assignedCase = {
  assignedLawyerId: assignedLawyer.id,
  client: { userId: "55555555-5555-4555-8555-555555555555" }
};

describe("admin cases contract", () => {
  it("scopes case reads by any or assigned-case permission", () => {
    expect(caseScopeWhereForPrincipal(officeAdmin)).toEqual({ deletedAt: null });
    expect(caseScopeWhereForPrincipal(assignedLawyer)).toEqual({ deletedAt: null, assignedLawyerId: assignedLawyer.id });

    try {
      caseScopeWhereForPrincipal(marketing);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("allows admin-any and only assigned lawyers to read/update/manage sessions", () => {
    expect(canReadAdminCase(officeAdmin, assignedCase)).toBe(true);
    expect(canReadAdminCase(assignedLawyer, assignedCase)).toBe(true);
    expect(canReadAdminCase(otherLawyer, assignedCase)).toBe(false);

    expect(canUpdateAdminCase(officeAdmin, assignedCase)).toBe(true);
    expect(canUpdateAdminCase(assignedLawyer, assignedCase)).toBe(true);
    expect(canUpdateAdminCase(otherLawyer, assignedCase)).toBe(false);

    expect(canManageCaseSessions(officeAdmin, assignedCase)).toBe(true);
    expect(canManageCaseSessions(assignedLawyer, assignedCase)).toBe(true);
    expect(canManageCaseSessions(otherLawyer, assignedCase)).toBe(false);
  });

  it("keeps calendar reschedule permission tied to admin-any or assigned case sessions", () => {
    expect(canManageCalendarAppointment(officeAdmin, { case: { assignedLawyerId: otherLawyer.id, deletedAt: null } })).toBe(true);
    expect(canManageCalendarAppointment(assignedLawyer, { case: { assignedLawyerId: assignedLawyer.id, deletedAt: null } })).toBe(true);
    expect(canManageCalendarAppointment(assignedLawyer, { case: { assignedLawyerId: otherLawyer.id, deletedAt: null } })).toBe(false);
    expect(canManageCalendarAppointment(assignedLawyer, { case: { assignedLawyerId: assignedLawyer.id, deletedAt: new Date() } })).toBe(false);
  });

  it("shares one calendar visibility scope with dashboard and list consumers", () => {
    expect(appointmentScopeWhereForPrincipal(officeAdmin)).toEqual({});
    expect(appointmentScopeWhereForPrincipal(assignedLawyer)).toEqual({
      OR: [
        { lawyerId: assignedLawyer.id },
        { case: { assignedLawyerId: assignedLawyer.id, deletedAt: null } }
      ]
    });

    expect(() => appointmentScopeWhereForPrincipal(marketing)).toThrowError(ApiError);
  });

  it("keeps create and reschedule checks, mutable rereads, writes, and audits in the transaction", () => {
    const source = readFileSync(join(process.cwd(), "src/server/admin/case-operations-service.ts"), "utf8");
    const createSource = source.slice(
      source.indexOf("export async function createAdminCalendarAppointment"),
      source.indexOf("export async function rescheduleAdminCalendarAppointment")
    );
    const rescheduleSource = source.slice(source.indexOf("export async function rescheduleAdminCalendarAppointment"));

    expect(createSource).toContain("APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry");
    expect(createSource).toContain("assertSessionManageAllowed(input.actor, body.caseId, tx)");
    expect(createSource).toContain("await assertNoAppointmentConflict");
    expect(createSource).toContain("appendAuditLog({");
    expect(createSource).toContain("client: tx");

    expect(rescheduleSource).toContain("APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt");
    expect(rescheduleSource).toContain("tx.appointment.findUnique");
    expect(rescheduleSource).toContain("canManageCalendarAppointment(input.actor, existing)");
    expect(rescheduleSource).toContain("excludeAppointmentId: appointmentId");
    expect(rescheduleSource).toContain("appendAuditLog({");
    expect(rescheduleSource).toContain("client: tx");
  });

  it("validates list, calendar, status, session, and appointment payloads", () => {
    const listQuery = adminCaseListQuerySchema.parse({
      q: "KMT-2026",
      status: "ACTIVE",
      priority: "HIGH",
      sortBy: "nextSessionAt",
      sortDirection: "asc",
      page: "2"
    });

    expect(listQuery.page).toBe(2);
    expect(listQuery.sortBy).toBe("nextSessionAt");

    const calendarQuery = adminCalendarQuerySchema.parse({
      from: "2026-06-23",
      to: "2026-07-23",
      status: "SCHEDULED",
      mode: "COURT"
    });

    expect(calendarQuery.status).toBe("SCHEDULED");
    expect(calendarQuery.mode).toBe("COURT");

    expect(caseStatusUpdateSchema.parse({ status: "CLOSED", confirmStatusChange: true }).status).toBe("CLOSED");
    expect(() => caseStatusUpdateSchema.parse({ status: "CLOSED", confirmStatusChange: false })).toThrow();

    expect(
      caseSessionCreateSchema.parse({
        sessionDate: "2026-06-24T10:00:00.000Z",
        nextSessionDate: "",
        decision: "Adjourned"
      }).decision
    ).toBe("Adjourned");

    expect(
      calendarAppointmentCreateSchema.parse({
        caseId: "66666666-6666-4666-8666-666666666666",
        title: "Court session",
        startsAt: "2026-06-24T10:00:00.000Z",
        durationMinutes: "45"
      }).durationMinutes
    ).toBe(45);

    expect(
      appointmentRescheduleSchema.parse({
        startsAt: "2026-06-25T10:00:00.000Z",
        durationMinutes: "90",
        mode: "ONLINE"
      }).mode
    ).toBe("ONLINE");
  });

  it("normalizes appointment end dates and rejects invalid action dates", () => {
    const startsAt = new Date("2026-06-23T10:00:00.000Z");
    expect(appointmentEndAt(startsAt, 75).toISOString()).toBe("2026-06-23T11:15:00.000Z");
    expect(dateFromActionInput("2026-06-23T10:00:00.000Z", "startsAt").toISOString()).toBe("2026-06-23T10:00:00.000Z");

    try {
      dateFromActionInput("not-a-date", "startsAt");
      throw new Error("expected validation failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });
});
