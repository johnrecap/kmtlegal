import { Prisma } from "@prisma/client";
import { plan35ApiErrorSourceMessages } from "@/lib/ui-copy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";

export const ACTIVE_APPOINTMENT_STATUSES = ["RESERVED", "SCHEDULED", "RESCHEDULED"] as const;

export const APPOINTMENT_TRANSACTION_MODES = {
  databaseCreateBoundedRetry: "database-create-bounded-retry",
  existingUpdateSingleAttempt: "existing-update-single-attempt",
  externalSideEffectSingleAttempt: "external-side-effect-single-attempt"
} as const;

type AppointmentConflictScope =
  | { kind: "office-consultation" }
  | { kind: "lawyer"; lawyerId: string }
  | { kind: "client"; clientId: string };

type AppointmentConflictInput = {
  startsAt: Date;
  endsAt: Date;
  scope: AppointmentConflictScope;
  excludeAppointmentId?: string;
};

type AppointmentConflictClient = Pick<Prisma.TransactionClient, "appointment">;

type AppointmentTransactionMode =
  (typeof APPOINTMENT_TRANSACTION_MODES)[keyof typeof APPOINTMENT_TRANSACTION_MODES];

type AppointmentTransactionRunner = {
  $transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    options: { isolationLevel: Prisma.TransactionIsolationLevel }
  ): Promise<T>;
};

const DATABASE_CREATE_MAX_ATTEMPTS = 3;

export function appointmentIntervalsOverlap(
  leftStartsAt: Date,
  leftEndsAt: Date,
  rightStartsAt: Date,
  rightEndsAt: Date
) {
  return leftStartsAt.getTime() < rightEndsAt.getTime() && rightStartsAt.getTime() < leftEndsAt.getTime();
}

export function appointmentConflictWhere(input: AppointmentConflictInput): Prisma.AppointmentWhereInput {
  assertValidAppointmentInterval(input.startsAt, input.endsAt);

  const scope: Prisma.AppointmentWhereInput = input.scope.kind === "office-consultation"
    ? { type: "CONSULTATION" }
    : input.scope.kind === "client"
      ? { clientId: input.scope.clientId }
      : {
          OR: [
            { lawyerId: input.scope.lawyerId },
            { lawyerId: null, consultationRequestId: { not: null } }
          ]
        };

  return {
    AND: [
      { status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
      { startsAt: { lt: input.endsAt } },
      { endsAt: { gt: input.startsAt } },
      ...(input.excludeAppointmentId ? [{ id: { not: input.excludeAppointmentId } }] : []),
      scope
    ]
  };
}

export async function assertNoAppointmentConflict(
  input: AppointmentConflictInput & { client?: AppointmentConflictClient }
) {
  const client = input.client ?? prisma;
  const conflict = await client.appointment.findFirst({
    where: appointmentConflictWhere(input),
    select: { id: true }
  });

  if (conflict) {
    throw appointmentConflictError();
  }
}

export async function runAppointmentConflictTransaction<T>(input: {
  mode: AppointmentTransactionMode;
  operation: (tx: Prisma.TransactionClient) => Promise<T>;
  client?: AppointmentTransactionRunner;
  serializationConflictError?: () => Error;
}) {
  const client: AppointmentTransactionRunner =
    input.client ?? (prisma as unknown as AppointmentTransactionRunner);
  const maxAttempts =
    input.mode === APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry
      ? DATABASE_CREATE_MAX_ATTEMPTS
      : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await client.$transaction(input.operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      if (!isPrismaSerializationConflict(error)) {
        throw error;
      }
      if (attempt === maxAttempts) {
        throw input.serializationConflictError?.() ?? appointmentConflictError();
      }
    }
  }

  throw appointmentConflictError();
}

function assertValidAppointmentInterval(startsAt: Date, endsAt: Date) {
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    endsAt.getTime() <= startsAt.getTime()
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", "Appointment end time must be after its start time.");
  }
}

function isPrismaSerializationConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function appointmentConflictError() {
  return new ApiError(
    409,
    "APPOINTMENT_CONFLICT",
    plan35ApiErrorSourceMessages.APPOINTMENT_CONFLICT
  );
}
