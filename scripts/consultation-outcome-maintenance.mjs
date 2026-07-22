import { readFileSync } from "node:fs";

const runtimeCopy = JSON.parse(
  readFileSync(new URL("../src/lib/plan36-runtime-copy.json", import.meta.url), "utf8")
);

const PRIMARY_APPOINTMENT_WHERE = {
  type: "CONSULTATION",
  caseId: null
};
const TERMINAL_APPOINTMENT_OUTCOMES = {
  COMPLETED: ["SUCCESSFUL", "BACKFILL_APPOINTMENT_COMPLETED"],
  NO_SHOW: ["NO_SHOW", "BACKFILL_APPOINTMENT_NO_SHOW"],
  CANCELLED: ["CANCELLED", "BACKFILL_APPOINTMENT_CANCELLED"]
};
const OVERDUE_UNBOOKED_MS = 72 * 60 * 60 * 1_000;
const ACTIVE_UNBOOKED_WORKFLOW_STATUSES = ["NEW", "REVIEWING", "PAYMENT_PENDING", "SCHEDULED"];

export function emptyConsultationOutcomeMaintenanceSummary() {
  return {
    scanned: 0,
    transitioned: 0,
    awaitingResult: 0,
    missed: 0,
    successful: 0,
    noShow: 0,
    cancelled: 0,
    lostRace: 0,
    missingPrimary: 0,
    overdueUnbooked: 0,
    overdueNotificationsCreatedOrRefreshed: 0
  };
}

export function determineHistoricalOutcome(row, now = new Date(), source = "RECONCILIATION") {
  if (row.outcomeStatus !== "PENDING") {
    return null;
  }
  if (row.workflowStatus === "REJECTED") {
    return {
      status: "CANCELLED",
      reasonCode: "BACKFILL_CONSULTATION_REJECTED",
      ...(row.primaryAppointment ? { appointmentStatus: "CANCELLED" } : {})
    };
  }
  if (!row.primaryAppointment && row.workflowStatus === "CONVERTED") {
    return {
      status: "AWAITING_RESULT",
      reasonCode: "BACKFILL_CONVERTED_WITHOUT_PRIMARY"
    };
  }
  if (!row.primaryAppointment) {
    return { skipReason: "MISSING_PRIMARY_APPOINTMENT" };
  }

  const terminal = TERMINAL_APPOINTMENT_OUTCOMES[row.primaryAppointment.status];
  if (terminal) {
    return { status: terminal[0], reasonCode: terminal[1] };
  }
  if (row.primaryAppointment.endsAt.getTime() > now.getTime()) {
    return null;
  }

  const reviewedOrAssigned = Boolean(row.assignedLawyerId || row.secretaryReviewedAt);
  if (source === "WORKER") {
    return reviewedOrAssigned
      ? { status: "AWAITING_RESULT", reasonCode: "AUTO_ENDED_ASSIGNED_OR_REVIEWED" }
      : { status: "MISSED", reasonCode: "AUTO_ENDED_UNASSIGNED_UNREVIEWED" };
  }
  return reviewedOrAssigned
    ? { status: "AWAITING_RESULT", reasonCode: "BACKFILL_ENDED_ASSIGNED_OR_REVIEWED" }
    : { status: "MISSED", reasonCode: "BACKFILL_ENDED_UNASSIGNED_UNREVIEWED" };
}

export async function reconcileConsultationOutcomes({
  client,
  now = new Date(),
  source = "WORKER",
  batchSize = 100,
  maxBatches = 10,
  notificationRecipientIds
}) {
  const summary = emptyConsultationOutcomeMaintenanceSummary();
  const recipients = notificationRecipientIds ?? await findOutcomeNotificationRecipients(client);
  const scannedIds = new Set();

  summary.missingPrimary = await client.consultationRequest.count({
    where: {
      outcomeStatus: "PENDING",
      appointments: { none: PRIMARY_APPOINTMENT_WHERE }
    }
  });

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const rows = await client.consultationRequest.findMany({
      where: {
        outcomeStatus: "PENDING",
        ...(scannedIds.size ? { id: { notIn: [...scannedIds] } } : {}),
        OR: [
          { status: "REJECTED" },
          {
            AND: [
              { status: "CONVERTED" },
              { appointments: { none: PRIMARY_APPOINTMENT_WHERE } }
            ]
          },
          {
            appointments: {
              some: {
                ...PRIMARY_APPOINTMENT_WHERE,
                status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED"] }
              }
            }
          },
          {
            appointments: {
              some: {
                ...PRIMARY_APPOINTMENT_WHERE,
                endsAt: { lte: now }
              }
            }
          }
        ]
      },
      select: consultationOutcomeMaintenanceSelect(),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize
    });

    if (!rows.length) break;
    summary.scanned += rows.length;

    for (const row of rows) {
      scannedIds.add(row.id);
      const transition = await reconcileOneConsultation({
        client,
        row,
        now,
        source,
        notificationRecipientIds: recipients
      });
      if (transition === "LOST_RACE") {
        summary.lostRace += 1;
        continue;
      }
      if (!transition) continue;

      summary.transitioned += 1;
      incrementOutcomeCounter(summary, transition);
    }

    if (rows.length < batchSize) break;
  }

  const overdue = await syncOverdueUnbookedNotifications({
    client,
    now,
    recipientIds: recipients,
    limit: batchSize * maxBatches
  });
  summary.overdueUnbooked = overdue.eligible;
  summary.overdueNotificationsCreatedOrRefreshed = overdue.createdOrRefreshed;

  return summary;
}

async function reconcileOneConsultation({ client, row, now, source, notificationRecipientIds }) {
  try {
    return await client.$transaction(
      async (tx) => {
        const current = await tx.consultationRequest.findUnique({
          where: { id: row.id },
          select: consultationOutcomeMaintenanceSelect()
        });
        if (!current) return null;

        const primaryAppointment = current.appointments[0] ?? null;
        const decision = determineHistoricalOutcome(
          {
            workflowStatus: current.status,
            outcomeStatus: current.outcomeStatus,
            assignedLawyerId: current.assignedLawyerId,
            secretaryReviewedAt: current.secretaryReviewedAt,
            primaryAppointment
          },
          now,
          source
        );
        if (!decision || decision.skipReason) return null;

        const updated = await tx.consultationRequest.updateMany({
          where: {
            id: current.id,
            outcomeStatus: "PENDING",
            outcomeVersion: current.outcomeVersion,
            assignedLawyerId: current.assignedLawyerId,
            secretaryReviewedAt: current.secretaryReviewedAt
          },
          data: {
            outcomeStatus: decision.status,
            outcomeAt: now,
            outcomeById: null,
            outcomeReasonCode: decision.reasonCode,
            outcomeNote: null,
            outcomeVersion: { increment: 1 }
          }
        });
        if (updated.count !== 1) return "LOST_RACE";

        if (
          decision.appointmentStatus &&
          primaryAppointment &&
          primaryAppointment.status !== decision.appointmentStatus
        ) {
          await tx.appointment.update({
            where: { id: primaryAppointment.id },
            data: { status: decision.appointmentStatus }
          });
        }

        await syncOutcomeNotifications({
          client: tx,
          consultationId: current.id,
          outcomeStatus: decision.status,
          recipientIds: notificationRecipientIds,
          now
        });
        await tx.auditLog.create({
          data: {
            actorId: null,
            action: auditActionForOutcome(decision.status, source, decision.reasonCode),
            resourceType: "ConsultationRequest",
            resourceId: current.id,
            clientId: current.clientId,
            lawyerId: current.assignedLawyerId,
            appointmentId: primaryAppointment?.id ?? null,
            metadata: {
              fromOutcome: "PENDING",
              toOutcome: decision.status,
              reasonCode: decision.reasonCode,
              outcomeVersion: current.outcomeVersion + 1,
              source,
              ...(primaryAppointment ? { primaryAppointmentId: primaryAppointment.id } : {}),
              ...(current.assignedLawyerId ? { assignedLawyerId: current.assignedLawyerId } : {})
            }
          }
        });

        return decision.status;
      },
      { isolationLevel: "Serializable" }
    );
  } catch (error) {
    if (error && typeof error === "object" && error.code === "P2034") {
      return "LOST_RACE";
    }
    throw error;
  }
}

function consultationOutcomeMaintenanceSelect() {
  return {
    id: true,
    clientId: true,
    status: true,
    assignedLawyerId: true,
    secretaryReviewedAt: true,
    outcomeStatus: true,
    outcomeVersion: true,
    createdAt: true,
    appointments: {
      where: PRIMARY_APPOINTMENT_WHERE,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take: 1,
      select: { id: true, status: true, startsAt: true, endsAt: true }
    }
  };
}

async function findOutcomeNotificationRecipients(client) {
  const users = await client.user.findMany({
    where: { status: "ACTIVE", deletedAt: null, role: { status: "ACTIVE" } },
    select: {
      id: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { key: true } } } }
        }
      }
    }
  });

  return users
    .filter((user) => {
      if (user.role.name === "Super Admin") return true;
      if (user.role.name !== "Secretary" && user.role.name !== "Office Admin") return false;
      const permissions = new Set(user.role.permissions.map(({ permission }) => permission.key));
      return permissions.has("consultation.review.any") &&
        permissions.has("appointment.manage.any") &&
        permissions.has("notification.read.self");
    })
    .map((user) => user.id);
}

async function syncOutcomeNotifications({ client, consultationId, outcomeStatus, recipientIds, now }) {
  await client.notification.updateMany({
    where: {
      type: "CONSULTATION",
      resourceType: "ConsultationRequest",
      resourceId: consultationId,
      readAt: null
    },
    data: { readAt: now }
  });

  if (outcomeStatus !== "AWAITING_RESULT" && outcomeStatus !== "MISSED") return;
  const copy = outcomeStatus === "MISSED"
    ? {
        title: runtimeCopy.notifications.missedTitle,
        body: runtimeCopy.notifications.missedBody
      }
    : {
        title: runtimeCopy.notifications.awaitingTitle,
        body: runtimeCopy.notifications.awaitingBody
      };

  await Promise.all(
    recipientIds.map((userId) => client.notification.upsert({
      where: {
        userId_type_resourceType_resourceId: {
          userId,
          type: "CONSULTATION",
          resourceType: "ConsultationRequest",
          resourceId: consultationId
        }
      },
      update: {
        title: copy.title,
        body: copy.body,
        actionUrl: `/admin/consultations/${consultationId}`,
        readAt: null,
        createdAt: now
      },
      create: {
        userId,
        type: "CONSULTATION",
        title: copy.title,
        body: copy.body,
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        actionUrl: `/admin/consultations/${consultationId}`,
        readAt: null,
        createdAt: now
      }
    }))
  );
}

async function syncOverdueUnbookedNotifications({ client, now, recipientIds, limit }) {
  const cutoff = new Date(now.getTime() - OVERDUE_UNBOOKED_MS);
  const rows = await client.consultationRequest.findMany({
    where: {
      outcomeStatus: "PENDING",
      status: { in: ACTIVE_UNBOOKED_WORKFLOW_STATUSES },
      createdAt: { lte: cutoff },
      appointments: { none: PRIMARY_APPOINTMENT_WHERE }
    },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit
  });

  await Promise.all(
    rows.flatMap((row) =>
      recipientIds.map((userId) =>
        client.notification.upsert({
          where: {
            userId_type_resourceType_resourceId: {
              userId,
              type: "CONSULTATION",
              resourceType: "ConsultationRequest",
              resourceId: row.id
            }
          },
          update: {
            title: runtimeCopy.notifications.overdueTitle,
            body: runtimeCopy.notifications.overdueBody,
            actionUrl: `/admin/consultations/${row.id}`,
            readAt: null
          },
          create: {
            userId,
            type: "CONSULTATION",
            title: runtimeCopy.notifications.overdueTitle,
            body: runtimeCopy.notifications.overdueBody,
            resourceType: "ConsultationRequest",
            resourceId: row.id,
            actionUrl: `/admin/consultations/${row.id}`,
            readAt: null,
            createdAt: now
          }
        })
      )
    )
  );

  return {
    eligible: rows.length,
    createdOrRefreshed: rows.length * recipientIds.length
  };
}

function auditActionForOutcome(status, source, reasonCode) {
  if (
    source === "RECONCILIATION" ||
    reasonCode?.startsWith("BACKFILL_") ||
    ["SUCCESSFUL", "NO_SHOW", "CANCELLED"].includes(status)
  ) {
    return "consultation.outcome.backfilled";
  }
  if (status === "AWAITING_RESULT") return "consultation.outcome.awaiting_result";
  return "consultation.outcome.missed";
}

function incrementOutcomeCounter(summary, status) {
  if (status === "AWAITING_RESULT") summary.awaitingResult += 1;
  if (status === "MISSED") summary.missed += 1;
  if (status === "SUCCESSFUL") summary.successful += 1;
  if (status === "NO_SHOW") summary.noShow += 1;
  if (status === "CANCELLED") summary.cancelled += 1;
}
