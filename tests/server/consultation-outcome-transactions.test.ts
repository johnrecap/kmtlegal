import { describe, expect, it, vi } from "vitest";
import {
  reopenMissedConsultation,
  setConsultationOutcome
} from "@/server/admin/consultation-outcome-service";
import { ROLES, type Principal } from "@/server/auth/policy";

const consultationId = "36000000-0000-4000-8000-000000000010";
const lawyerId = "36000000-0000-4000-8000-000000000020";
const appointmentClientId = "36000000-0000-4000-8000-000000000040";
const actor: Principal = {
  id: "36000000-0000-4000-8000-000000000001",
  roleName: ROLES.secretary,
  permissions: ["consultation.review.any", "appointment.manage.any", "notification.read.self"]
};
const endedAppointment = {
  id: "36000000-0000-4000-8000-000000000030",
  clientId: appointmentClientId,
  lawyerId,
  startsAt: new Date("2026-07-22T08:00:00.000Z"),
  endsAt: new Date("2026-07-22T09:00:00.000Z"),
  status: "SCHEDULED",
  mode: "ONLINE",
  location: null,
  title: "Consultation",
  type: "CONSULTATION",
  caseId: null,
  lawyer: { id: lawyerId, name: "Lawyer" }
};

function detailRow(outcomeStatus: string, outcomeVersion: number) {
  return {
    id: consultationId,
    clientId: null,
    client: null,
    fullName: "Applicant",
    phone: "+201000000000",
    email: null,
    city: null,
    serviceCategory: "Civil",
    summary: "Summary",
    opposingPartyName: null,
    urgency: "NORMAL",
    preferredMode: "ONLINE",
    status: "SCHEDULED",
    aiClassification: null,
    aiSummary: null,
    assignedLawyerId: lawyerId,
    assignedLawyer: { id: lawyerId, name: "Lawyer", email: "lawyer@example.test" },
    secretaryReviewedAt: new Date("2026-07-22T07:00:00.000Z"),
    secretaryReviewedById: actor.id,
    secretaryReviewedBy: { id: actor.id, name: "Secretary", email: "secretary@example.test" },
    secretaryReviewNote: null,
    outcomeStatus,
    outcomeAt: new Date("2026-07-22T10:00:00.000Z"),
    outcomeById: actor.id,
    outcomeBy: { id: actor.id, name: "Secretary" },
    outcomeReasonCode: "COMPLETED_AS_SCHEDULED",
    outcomeNote: null,
    outcomeVersion,
    appointments: [endedAppointment],
    convertedCase: null,
    createdAt: new Date("2026-07-21T07:00:00.000Z"),
    updatedAt: new Date("2026-07-22T10:00:00.000Z")
  };
}

function transactionRunner(tx: object) {
  return {
    $transaction: vi.fn(async (operation: (client: object) => Promise<unknown>) => operation(tx))
  };
}

describe("PLAN-36 atomic outcome writes", () => {
  it("updates the outcome, primary appointment, notification, and audit in one transaction", async () => {
    const consultationUpdate = vi.fn(async () => ({ count: 1 }));
    const appointmentUpdate = vi.fn(async () => endedAppointment);
    const notificationResolve = vi.fn(async () => ({ count: 1 }));
    const auditCreate = vi.fn(async ({ data }) => data);
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          assignedLawyerId: lawyerId,
          outcomeStatus: "AWAITING_RESULT",
          outcomeVersion: 3
        })),
        updateMany: consultationUpdate,
        findUniqueOrThrow: vi.fn(async () => detailRow("SUCCESSFUL", 4))
      },
      appointment: {
        findFirst: vi.fn(async () => endedAppointment),
        update: appointmentUpdate
      },
      notification: { updateMany: notificationResolve },
      auditLog: { create: auditCreate }
    };
    const runner = transactionRunner(tx);

    const result = await setConsultationOutcome({
      actor,
      consultationId,
      body: {
        status: "SUCCESSFUL",
        expectedOutcomeVersion: 3,
        reasonCode: "COMPLETED_AS_SCHEDULED",
        note: "internal-only note"
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: runner as never
    });

    expect(result.outcomeStatus).toBe("SUCCESSFUL");
    expect(consultationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ outcomeStatus: "AWAITING_RESULT", outcomeVersion: 3 }),
      data: expect.objectContaining({ outcomeStatus: "SUCCESSFUL", outcomeVersion: { increment: 1 } })
    }));
    expect(appointmentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: endedAppointment.id },
      data: { status: "COMPLETED" }
    }));
    expect(notificationResolve).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(runner.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rolls back the dependent writes when the optimistic update loses a race", async () => {
    const appointmentUpdate = vi.fn();
    const auditCreate = vi.fn();
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          assignedLawyerId: lawyerId,
          outcomeStatus: "AWAITING_RESULT",
          outcomeVersion: 3
        })),
        updateMany: vi.fn(async () => ({ count: 0 }))
      },
      appointment: {
        findFirst: vi.fn(async () => endedAppointment),
        update: appointmentUpdate
      },
      notification: { updateMany: vi.fn() },
      auditLog: { create: auditCreate }
    };

    await expect(setConsultationOutcome({
      actor,
      consultationId,
      body: {
        status: "NO_SHOW",
        expectedOutcomeVersion: 3,
        reasonCode: "CLIENT_NO_SHOW"
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    })).rejects.toMatchObject({ code: "CONSULTATION_STATE_CHANGED" });

    expect(appointmentUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("reopens only the primary booking and preserves the missed event through a new audit", async () => {
    const appointmentUpdate = vi.fn(async () => endedAppointment);
    const clientUpdate = vi.fn();
    const auditCreate = vi.fn(async ({ data }) => data);
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          status: "SCHEDULED",
          assignedLawyerId: null,
          secretaryReviewedAt: null,
          outcomeStatus: "MISSED",
          outcomeVersion: 1
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: vi.fn(async () => detailRow("PENDING", 2))
      },
      appointment: {
        findFirst: vi.fn(async ({ where }) =>
          "consultationRequestId" in where ? endedAppointment : null
        ),
        update: appointmentUpdate
      },
      client: { update: clientUpdate },
      user: { findFirst: vi.fn(async () => ({ id: lawyerId, name: "Lawyer" })) },
      notification: { updateMany: vi.fn(async () => ({ count: 1 })) },
      auditLog: { create: auditCreate }
    };

    const result = await reopenMissedConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: "2026-07-23T10:00:00.000Z",
        durationMinutes: 60,
        mode: "ONLINE",
        location: "",
        reasonCode: "REOPEN_CLIENT_REQUEST",
        note: "requested a new slot",
        expectedOutcomeVersion: 1
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    });

    expect(result.reopened).toBe(true);
    expect(appointmentUpdate).toHaveBeenCalledTimes(1);
    expect(appointmentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: endedAppointment.id },
      data: expect.objectContaining({ status: "RESCHEDULED", lawyerId })
    }));
    expect(clientUpdate).toHaveBeenCalledTimes(1);
    expect(clientUpdate).toHaveBeenCalledWith({
      where: { id: appointmentClientId },
      data: { assignedLawyerId: lawyerId }
    });
    expect(tx.appointment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([{ clientId: appointmentClientId }])
      })
    }));
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });
});
