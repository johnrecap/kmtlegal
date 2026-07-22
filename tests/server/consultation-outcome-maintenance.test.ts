import { describe, expect, it } from "vitest";
// @ts-expect-error The production maintenance helper is an ESM script with a narrow runtime export.
import { determineHistoricalOutcome, emptyConsultationOutcomeMaintenanceSummary, reconcileConsultationOutcomes } from "../../scripts/consultation-outcome-maintenance.mjs";

const now = new Date("2026-07-22T10:00:00.000Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    workflowStatus: "SCHEDULED",
    outcomeStatus: "PENDING",
    assignedLawyerId: null,
    secretaryReviewedAt: null,
    primaryAppointment: {
      id: "36000000-0000-4000-8000-000000000010",
      status: "SCHEDULED",
      endsAt: new Date("2026-07-22T09:00:00.000Z")
    },
    ...overrides
  };
}

describe("PLAN-36 historical reconciliation policy", () => {
  it.each([
    ["COMPLETED", "SUCCESSFUL", "BACKFILL_APPOINTMENT_COMPLETED"],
    ["NO_SHOW", "NO_SHOW", "BACKFILL_APPOINTMENT_NO_SHOW"],
    ["CANCELLED", "CANCELLED", "BACKFILL_APPOINTMENT_CANCELLED"]
  ])("maps terminal appointment %s to %s", (appointmentStatus, status, reasonCode) => {
    expect(
      determineHistoricalOutcome(
        row({
          primaryAppointment: {
            id: "36000000-0000-4000-8000-000000000010",
            status: appointmentStatus,
            endsAt: new Date("2026-07-22T09:00:00.000Z")
          }
        }),
        now
      )
    ).toEqual({ status, reasonCode });
  });

  it("prioritizes rejected consultations as cancelled", () => {
    expect(determineHistoricalOutcome(row({ workflowStatus: "REJECTED" }), now)).toEqual({
      status: "CANCELLED",
      reasonCode: "BACKFILL_CONSULTATION_REJECTED",
      appointmentStatus: "CANCELLED"
    });
  });

  it("uses the ended assignment-review rule for historical active bookings", () => {
    expect(determineHistoricalOutcome(row(), now)).toEqual({
      status: "MISSED",
      reasonCode: "BACKFILL_ENDED_UNASSIGNED_UNREVIEWED"
    });
    expect(
      determineHistoricalOutcome(
        row({ assignedLawyerId: "36000000-0000-4000-8000-000000000002" }),
        now
      )
    ).toEqual({
      status: "AWAITING_RESULT",
      reasonCode: "BACKFILL_ENDED_ASSIGNED_OR_REVIEWED"
    });
    expect(determineHistoricalOutcome(row({ secretaryReviewedAt: new Date("2026-07-22T08:00:00.000Z") }), now)).toEqual({
      status: "AWAITING_RESULT",
      reasonCode: "BACKFILL_ENDED_ASSIGNED_OR_REVIEWED"
    });
  });

  it("leaves future and already reconciled records unchanged", () => {
    expect(
      determineHistoricalOutcome(
        row({
          primaryAppointment: {
            id: "36000000-0000-4000-8000-000000000010",
            status: "SCHEDULED",
            endsAt: new Date("2026-07-22T10:00:00.001Z")
          }
        }),
        now
      )
    ).toBeNull();
    expect(determineHistoricalOutcome(row({ outcomeStatus: "MISSED" }), now)).toBeNull();
  });

  it("reports a missing primary without guessing from follow-up data", () => {
    expect(determineHistoricalOutcome(row({ primaryAppointment: null }), now)).toEqual({
      skipReason: "MISSING_PRIMARY_APPOINTMENT"
    });
  });

  it("starts with a privacy-safe structured counter shape", () => {
    expect(emptyConsultationOutcomeMaintenanceSummary()).toEqual({
      scanned: 0,
      transitioned: 0,
      awaitingResult: 0,
      missed: 0,
      successful: 0,
      noShow: 0,
      cancelled: 0,
      lostRace: 0,
      missingPrimary: 0
    });
  });

  it("is idempotent across repeated worker cycles and creates one audit only", async () => {
    const state = {
      id: "36000000-0000-4000-8000-000000000050",
      clientId: null,
      status: "SCHEDULED",
      assignedLawyerId: null,
      secretaryReviewedAt: null,
      outcomeStatus: "PENDING",
      outcomeVersion: 0,
      createdAt: new Date("2026-07-21T10:00:00.000Z"),
      appointments: [{
        id: "36000000-0000-4000-8000-000000000051",
        status: "SCHEDULED",
        startsAt: new Date("2026-07-22T08:00:00.000Z"),
        endsAt: new Date("2026-07-22T09:00:00.000Z")
      }]
    };
    const audits: unknown[] = [];
    let notificationResolutions = 0;
    const tx = {
      consultationRequest: {
        findUnique: async () => ({ ...state, appointments: [...state.appointments] }),
        updateMany: async () => {
          if (state.outcomeStatus !== "PENDING") return { count: 0 };
          state.outcomeStatus = "MISSED";
          state.outcomeVersion += 1;
          return { count: 1 };
        }
      },
      appointment: { update: async () => ({}) },
      notification: {
        updateMany: async () => {
          notificationResolutions += 1;
          return { count: 0 };
        },
        upsert: async () => ({})
      },
      auditLog: {
        create: async ({ data }: { data: unknown }) => {
          audits.push(data);
          return data;
        }
      }
    };
    const client = {
      consultationRequest: {
        count: async () => 0,
        findMany: async () => state.outcomeStatus === "PENDING"
          ? [{ ...state, appointments: [...state.appointments] }]
          : []
      },
      $transaction: async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)
    };

    const first = await reconcileConsultationOutcomes({
      client,
      now,
      source: "WORKER",
      notificationRecipientIds: []
    });
    const second = await reconcileConsultationOutcomes({
      client,
      now,
      source: "WORKER",
      notificationRecipientIds: []
    });

    expect(first).toMatchObject({ scanned: 1, transitioned: 1, missed: 1, lostRace: 0 });
    expect(second).toMatchObject({ scanned: 0, transitioned: 0, missed: 0, lostRace: 0 });
    expect(audits).toHaveLength(1);
    expect(notificationResolutions).toBe(1);
  });

  it("counts a lost race without writing audit or notifications", async () => {
    const current = {
      id: "36000000-0000-4000-8000-000000000060",
      clientId: null,
      status: "SCHEDULED",
      assignedLawyerId: null,
      secretaryReviewedAt: null,
      outcomeStatus: "PENDING",
      outcomeVersion: 0,
      createdAt: new Date("2026-07-21T10:00:00.000Z"),
      appointments: [{
        id: "36000000-0000-4000-8000-000000000061",
        status: "SCHEDULED",
        startsAt: new Date("2026-07-22T08:00:00.000Z"),
        endsAt: new Date("2026-07-22T09:00:00.000Z")
      }]
    };
    let auditWrites = 0;
    let notificationWrites = 0;
    const tx = {
      consultationRequest: {
        findUnique: async () => current,
        updateMany: async () => ({ count: 0 })
      },
      appointment: { update: async () => ({}) },
      notification: {
        updateMany: async () => {
          notificationWrites += 1;
          return { count: 0 };
        },
        upsert: async () => ({})
      },
      auditLog: {
        create: async () => {
          auditWrites += 1;
          return {};
        }
      }
    };
    let delivered = false;
    const client = {
      consultationRequest: {
        count: async () => 0,
        findMany: async () => {
          if (delivered) return [];
          delivered = true;
          return [current];
        }
      },
      $transaction: async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)
    };

    const summary = await reconcileConsultationOutcomes({
      client,
      now,
      source: "WORKER",
      notificationRecipientIds: []
    });

    expect(summary).toMatchObject({ scanned: 1, transitioned: 0, lostRace: 1 });
    expect(auditWrites).toBe(0);
    expect(notificationWrites).toBe(0);
  });
});
