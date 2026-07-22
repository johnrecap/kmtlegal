import { describe, expect, it, vi } from "vitest";
import {
  reopenMissedConsultation,
  setConsultationOutcome
} from "@/server/admin/consultation-outcome-service";
import { scheduleConsultation } from "@/server/admin/consultation-review-service";
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

describe("PLAN-37 atomic initial scheduling", () => {
  it("creates the client, primary appointment, assignment, review, audit, and notification atomically", async () => {
    const startsAt = new Date("2026-07-23T10:00:00.000Z");
    const endsAt = new Date("2026-07-23T11:00:00.000Z");
    const clientId = "36000000-0000-4000-8000-000000000050";
    const appointment = {
      ...endedAppointment,
      id: "36000000-0000-4000-8000-000000000060",
      clientId,
      startsAt,
      endsAt,
      status: "SCHEDULED"
    };
    const clientCreate = vi.fn(async () => ({ id: clientId }));
    const appointmentCreate = vi.fn(async () => appointment);
    const consultationUpdate = vi.fn(async () => ({ count: 1 }));
    const notificationResolve = vi.fn(async () => ({ count: 1 }));
    const auditCreate = vi.fn(async ({ data }) => data);
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          fullName: "Applicant",
          phone: "+201000000000",
          email: null,
          city: "Cairo",
          status: "NEW",
          assignedLawyerId: null,
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING",
          outcomeVersion: 2
        })),
        updateMany: consultationUpdate,
        findUniqueOrThrow: vi.fn(async () => ({
          ...detailRow("PENDING", 3),
          clientId,
          client: { id: clientId, fullName: "Applicant", phone: "+201000000000", email: null },
          appointments: [appointment]
        }))
      },
      appointment: {
        findFirst: vi.fn(async ({ where }) =>
          "consultationRequestId" in where ? null : null
        ),
        create: appointmentCreate
      },
      client: {
        findFirst: vi.fn(async () => null),
        create: clientCreate,
        update: vi.fn()
      },
      user: { findFirst: vi.fn(async () => ({ id: lawyerId, name: "Lawyer" })) },
      notification: { updateMany: notificationResolve },
      auditLog: { create: auditCreate }
    };

    const result = await scheduleConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: startsAt.toISOString(),
        durationMinutes: 60,
        mode: "ONLINE",
        location: "",
        expectedOutcomeVersion: 2
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    });

    expect(result.scheduled).toBe(true);
    expect(clientCreate).toHaveBeenCalledTimes(1);
    expect(appointmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        clientId,
        lawyerId,
        consultationRequestId: consultationId,
        caseId: null,
        startsAt,
        endsAt,
        status: "SCHEDULED"
      })
    }));
    expect(consultationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ outcomeStatus: "PENDING", outcomeVersion: 2 }),
      data: expect.objectContaining({
        clientId,
        assignedLawyerId: lawyerId,
        status: "SCHEDULED",
        outcomeVersion: { increment: 1 }
      })
    }));
    expect(notificationResolve).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects a stale schedule before creating a client or appointment", async () => {
    const clientCreate = vi.fn();
    const appointmentCreate = vi.fn();
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          fullName: "Applicant",
          phone: "+201000000000",
          email: null,
          city: null,
          status: "NEW",
          assignedLawyerId: null,
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING",
          outcomeVersion: 4
        }))
      },
      appointment: { findFirst: vi.fn(), create: appointmentCreate },
      client: { findFirst: vi.fn(), create: clientCreate },
      user: { findFirst: vi.fn() },
      notification: { updateMany: vi.fn() },
      auditLog: { create: vi.fn() }
    };

    await expect(scheduleConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: "2026-07-23T10:00:00.000Z",
        durationMinutes: 60,
        mode: "ONLINE",
        expectedOutcomeVersion: 3
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    })).rejects.toMatchObject({ code: "CONSULTATION_STATE_CHANGED" });

    expect(clientCreate).not.toHaveBeenCalled();
    expect(appointmentCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-future schedule before opening a transaction", async () => {
    const runner = transactionRunner({});

    await expect(scheduleConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: "2026-07-22T10:00:00.000Z",
        durationMinutes: 60,
        mode: "ONLINE",
        expectedOutcomeVersion: 2
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: runner as never
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(runner.$transaction).not.toHaveBeenCalled();
  });

  it("rechecks that the slot is still future when the transaction begins", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-22T10:00:00.000Z"));
      const runner = {
        $transaction: vi.fn(async (operation: (client: object) => Promise<unknown>) => {
          vi.setSystemTime(new Date("2026-07-22T10:00:02.000Z"));
          return operation({});
        })
      };

      await expect(scheduleConsultation({
        actor,
        consultationId,
        body: {
          assignedLawyerId: lawyerId,
          startsAt: "2026-07-22T10:00:01.000Z",
          durationMinutes: 60,
          mode: "ONLINE",
          expectedOutcomeVersion: 2
        },
        transactionClient: runner as never
      })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      expect(runner.$transaction).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects scheduling when a primary appointment already exists", async () => {
    const appointmentCreate = vi.fn();
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          fullName: "Applicant",
          phone: "+201000000000",
          email: null,
          city: null,
          status: "NEW",
          assignedLawyerId: null,
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING",
          outcomeVersion: 2
        }))
      },
      appointment: {
        findFirst: vi.fn(async () => endedAppointment),
        create: appointmentCreate
      },
      client: { findFirst: vi.fn(), create: vi.fn() },
      user: { findFirst: vi.fn() },
      notification: { updateMany: vi.fn() },
      auditLog: { create: vi.fn() }
    };

    await expect(scheduleConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: "2026-07-23T10:00:00.000Z",
        durationMinutes: 60,
        mode: "ONLINE",
        expectedOutcomeVersion: 2
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    })).rejects.toMatchObject({ code: "CONSULTATION_STATE_CHANGED" });

    expect(appointmentCreate).not.toHaveBeenCalled();
    expect(tx.client.create).not.toHaveBeenCalled();
  });

  it.each([
    ["lawyer", 2],
    ["client", 3]
  ])("returns the stable conflict error for a %s overlap", async (_scope, conflictCall) => {
    let appointmentLookup = 0;
    const appointmentCreate = vi.fn();
    const auditCreate = vi.fn();
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: null,
          fullName: "Applicant",
          phone: "+201000000000",
          email: null,
          city: null,
          status: "NEW",
          assignedLawyerId: null,
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING",
          outcomeVersion: 2
        }))
      },
      appointment: {
        findFirst: vi.fn(async () => {
          appointmentLookup += 1;
          return appointmentLookup === conflictCall
            ? { id: "36000000-0000-4000-8000-000000000099" }
            : null;
        }),
        create: appointmentCreate
      },
      client: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: appointmentClientId }))
      },
      user: { findFirst: vi.fn(async () => ({ id: lawyerId, name: "Lawyer" })) },
      notification: { updateMany: vi.fn() },
      auditLog: { create: auditCreate }
    };

    await expect(scheduleConsultation({
      actor,
      consultationId,
      body: {
        assignedLawyerId: lawyerId,
        startsAt: "2026-07-23T10:00:00.000Z",
        durationMinutes: 60,
        mode: "ONLINE",
        expectedOutcomeVersion: 2
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    })).rejects.toMatchObject({ code: "APPOINTMENT_CONFLICT" });

    expect(appointmentCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("denies Lawyer and Marketing Staff even when permission keys are supplied", async () => {
    for (const roleName of [ROLES.lawyer, ROLES.marketingStaff]) {
      const runner = transactionRunner({});
      await expect(scheduleConsultation({
        actor: {
          id: lawyerId,
          roleName,
          permissions: ["consultation.review.any", "appointment.manage.any"]
        },
        consultationId,
        body: {
          assignedLawyerId: lawyerId,
          startsAt: "2026-07-23T10:00:00.000Z",
          durationMinutes: 60,
          mode: "ONLINE",
          expectedOutcomeVersion: 2
        },
        now: new Date("2026-07-22T10:00:00.000Z"),
        transactionClient: runner as never
      })).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      expect(runner.$transaction).not.toHaveBeenCalled();
    }
  });
});

describe("PLAN-37 converted legacy outcome", () => {
  it("allows a manual final result only for the reconciled converted record without a fake appointment", async () => {
    const appointmentUpdate = vi.fn();
    const auditCreate = vi.fn(async ({ data }) => data);
    const tx = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          clientId: appointmentClientId,
          status: "CONVERTED",
          assignedLawyerId: lawyerId,
          outcomeStatus: "AWAITING_RESULT",
          outcomeReasonCode: "BACKFILL_CONVERTED_WITHOUT_PRIMARY",
          outcomeVersion: 5,
          convertedCase: { id: "36000000-0000-4000-8000-000000000070" }
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: vi.fn(async () => ({
          ...detailRow("SUCCESSFUL", 6),
          status: "CONVERTED",
          appointments: [],
          convertedCase: {
            id: "36000000-0000-4000-8000-000000000070",
            internalFileNumber: "KMT-2026-LEGACY",
            title: "Converted case",
            status: "ACTIVE"
          }
        }))
      },
      appointment: {
        findFirst: vi.fn(async () => null),
        update: appointmentUpdate
      },
      notification: { updateMany: vi.fn(async () => ({ count: 1 })) },
      auditLog: { create: auditCreate }
    };

    const result = await setConsultationOutcome({
      actor,
      consultationId,
      body: {
        status: "SUCCESSFUL",
        expectedOutcomeVersion: 5,
        reasonCode: "COMPLETED_AS_SCHEDULED"
      },
      now: new Date("2026-07-22T10:00:00.000Z"),
      transactionClient: transactionRunner(tx) as never
    });

    expect(result.outcomeStatus).toBe("SUCCESSFUL");
    expect(appointmentUpdate).not.toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ appointmentId: null })
    }));
  });
});
