import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSACTION_MODES,
  appointmentConflictWhere,
  appointmentIntervalsOverlap,
  assertNoAppointmentConflict,
  runAppointmentConflictTransaction
} from "@/server/appointments/appointment-conflict-service";

const startsAt = new Date("2026-07-22T10:00:00.000Z");
const endsAt = new Date("2026-07-22T11:00:00.000Z");

function serializationConflict() {
  return new Prisma.PrismaClientKnownRequestError("write conflict", {
    code: "P2034",
    clientVersion: "7.8.0"
  });
}

describe("appointment conflict service", () => {
  it("uses half-open intervals so touching boundaries pass and real overlaps block", () => {
    expect(appointmentIntervalsOverlap(startsAt, endsAt, endsAt, new Date("2026-07-22T12:00:00.000Z"))).toBe(false);
    expect(appointmentIntervalsOverlap(startsAt, endsAt, new Date("2026-07-22T09:00:00.000Z"), startsAt)).toBe(false);
    expect(appointmentIntervalsOverlap(startsAt, endsAt, new Date("2026-07-22T10:30:00.000Z"), new Date("2026-07-22T11:30:00.000Z"))).toBe(true);
    expect(appointmentIntervalsOverlap(startsAt, endsAt, new Date("2026-07-22T09:00:00.000Z"), new Date("2026-07-22T12:00:00.000Z"))).toBe(true);
  });

  it("builds one active lawyer scope with public-reservation symmetry and self exclusion", () => {
    expect(
      appointmentConflictWhere({
        startsAt,
        endsAt,
        scope: { kind: "lawyer", lawyerId: "35000000-0000-4000-8000-000000000001" },
        excludeAppointmentId: "35000000-0000-4000-8000-000000000099"
      })
    ).toEqual({
      AND: [
        { status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
        { startsAt: { lt: endsAt } },
        { endsAt: { gt: startsAt } },
        { id: { not: "35000000-0000-4000-8000-000000000099" } },
        {
          OR: [
            { lawyerId: "35000000-0000-4000-8000-000000000001" },
            { lawyerId: null, consultationRequestId: { not: null } }
          ]
        }
      ]
    });
  });

  it("keeps public consultation reservations office-wide while allowing different assigned lawyers", () => {
    expect(
      appointmentConflictWhere({
        startsAt,
        endsAt,
        scope: { kind: "office-consultation" }
      })
    ).toEqual({
      AND: [
        { status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
        { startsAt: { lt: endsAt } },
        { endsAt: { gt: startsAt } },
        { type: "CONSULTATION" }
      ]
    });
  });

  it("returns the stable appointment conflict without leaking the conflicting record", async () => {
    const findFirst = vi.fn(async () => ({ id: "hidden-conflict" }));

    await expect(
      assertNoAppointmentConflict({
        startsAt,
        endsAt,
        scope: { kind: "lawyer", lawyerId: "35000000-0000-4000-8000-000000000001" },
        client: { appointment: { findFirst } } as never
      })
    ).rejects.toMatchObject({ status: 409, code: "APPOINTMENT_CONFLICT" });
    expect(findFirst).toHaveBeenCalledWith({
      where: expect.any(Object),
      select: { id: true }
    });
  });

  it("retries only database-create callbacks and bounds exhausted serialization conflicts", async () => {
    const operation = vi.fn(async () => "created");
    const transaction = vi.fn(async (callback: (client: never) => Promise<string>) => {
      await callback({} as never);
      if (transaction.mock.calls.length < 3) {
        throw serializationConflict();
      }
      return "created";
    });

    await expect(
      runAppointmentConflictTransaction({
        mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry,
        operation,
        client: { $transaction: transaction } as never
      })
    ).resolves.toBe("created");
    expect(operation).toHaveBeenCalledTimes(3);

    const exhausted = vi.fn(async (callback: (client: never) => Promise<string>) => {
      await callback({} as never);
      throw serializationConflict();
    });
    await expect(
      runAppointmentConflictTransaction({
        mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry,
        operation: async () => "never-commits",
        client: { $transaction: exhausted } as never
      })
    ).rejects.toMatchObject({ status: 409, code: "APPOINTMENT_CONFLICT" });
    expect(exhausted).toHaveBeenCalledTimes(3);
  });

  it.each([
    APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    APPOINTMENT_TRANSACTION_MODES.externalSideEffectSingleAttempt
  ])("never replays %s callbacks", async (mode) => {
    const operation = vi.fn(async () => "uncommitted");
    const transaction = vi.fn(async (callback: (client: never) => Promise<string>) => {
      await callback({} as never);
      throw serializationConflict();
    });

    await expect(
      runAppointmentConflictTransaction({ mode, operation, client: { $transaction: transaction } as never })
    ).rejects.toMatchObject({ status: 409, code: "APPOINTMENT_CONFLICT" });
    expect(operation).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("propagates non-serialization failures without retrying or masking rollback errors", async () => {
    const auditFailure = new Error("audit write failed");
    const operation = vi.fn(async () => {
      throw auditFailure;
    });
    const transaction = vi.fn(async (callback: (client: never) => Promise<string>) => callback({} as never));

    await expect(
      runAppointmentConflictTransaction({
        mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry,
        operation,
        client: { $transaction: transaction } as never
      })
    ).rejects.toBe(auditFailure);
    expect(operation).toHaveBeenCalledOnce();
  });
});
