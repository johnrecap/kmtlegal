import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { parseWithSchema, uuidSchema, emailSchema } from "@/server/validation/schemas";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import {
  PORTAL_DUE_PAYMENT_STATUSES,
  PORTAL_HIDDEN_APPOINTMENT_TYPES,
  PORTAL_VISIBLE_PAYMENT_STATUSES,
  isPortalVisiblePaymentStatus
} from "@/lib/portal-visibility";

export const portalProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal(""))
});

export const clientPreferenceSchema = z
  .object({
    locale: z.enum(["ar", "en"])
  })
  .strict();

export type PortalProfileUpdateInput = z.infer<typeof portalProfileUpdateSchema>;
export type ClientPreferenceInput = z.infer<typeof clientPreferenceSchema>;
type ClientPreferenceWriter = Pick<Prisma.TransactionClient, "client" | "user">;

export function assertClientPortalAccess(actor: Principal) {
  if (!hasPermission(actor, "client.read.self") || !actor.clientId) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client portal access is required.");
  }

  return actor.clientId;
}

export function ownClientWhere(actor: Principal) {
  return { id: assertClientPortalAccess(actor), userId: actor.id };
}

export function ownCaseWhere(actor: Principal, caseId?: string): Prisma.LegalCaseWhereInput {
  const clientId = assertClientPortalAccess(actor);
  return {
    clientId,
    deletedAt: null,
    ...(caseId ? { id: caseId } : {})
  };
}

export function ownVisiblePortalAppointmentWhere(actor: Principal): Prisma.AppointmentWhereInput {
  const clientId = assertClientPortalAccess(actor);

  return {
    clientId,
    ...portalVisibleAppointmentWhere(),
    OR: [{ caseId: null }, { case: { deletedAt: null } }]
  };
}

export function portalVisibleAppointmentWhere(): Prisma.AppointmentWhereInput {
  return { type: { notIn: [...PORTAL_HIDDEN_APPOINTMENT_TYPES] } };
}

export function portalVisiblePaymentWhere(clientId: string): Prisma.PaymentWhereInput {
  return {
    clientId,
    status: { in: [...PORTAL_VISIBLE_PAYMENT_STATUSES] }
  };
}

export function portalDuePaymentWhere(clientId: string): Prisma.PaymentWhereInput {
  return {
    clientId,
    status: { in: [...PORTAL_DUE_PAYMENT_STATUSES] }
  };
}

export function clientVisibleDocumentWhere(clientId: string): Prisma.DocumentWhereInput {
  return {
    deletedAt: null,
    visibility: "CLIENT_VISIBLE",
    OR: [{ ownerClientId: clientId }, { case: { clientId } }]
  };
}

export async function getPortalDashboard(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  const caseWhere = ownCaseWhere(actor);
  const appointmentWhere: Prisma.AppointmentWhereInput = {
    AND: [
      ownVisiblePortalAppointmentWhere(actor),
      { startsAt: { gte: new Date() } },
      { status: { in: ["SCHEDULED", "RESCHEDULED"] } }
    ]
  };
  const [
    client,
    cases,
    casesCount,
    appointments,
    appointmentsCount,
    documentsCount,
    payments,
    dueBalances,
    nextDuePayment
  ] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        assignedLawyer: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.legalCase.findMany({
      where: caseWhere,
      orderBy: [{ nextSessionAt: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        assignedLawyer: { select: { id: true, name: true } }
      }
    }),
    prisma.legalCase.count({ where: caseWhere }),
    prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        consultationRequest: { select: { id: true, status: true, assignedLawyerId: true } },
        lawyer: { select: { id: true, name: true } },
        case: { select: { id: true, title: true, internalFileNumber: true } }
      },
      orderBy: { startsAt: "asc" },
      take: 5
    }),
    prisma.appointment.count({ where: appointmentWhere }),
    prisma.document.count({
      where: clientVisibleDocumentWhere(clientId)
    }),
    prisma.payment.findMany({
      where: portalVisiblePaymentWhere(clientId),
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take: 5
    }),
    prisma.payment.groupBy({
      by: ["currency"],
      where: portalDuePaymentWhere(clientId),
      _sum: { amount: true },
      orderBy: { currency: "asc" }
    }),
    prisma.payment.findFirst({
      where: portalDuePaymentWhere(clientId),
      orderBy: [{ dueDate: "asc" }, { issueDate: "asc" }, { createdAt: "asc" }]
    })
  ]);

  if (!client) {
    throw new ApiError(404, "NOT_FOUND", "Client profile was not found.");
  }

  return {
    client,
    cases,
    casesCount,
    appointments,
    appointmentsCount,
    documentsCount,
    payments,
    dueBalances: dueBalances.map((balance) => ({
      currency: balance.currency,
      amount: balance._sum.amount ?? new Prisma.Decimal(0)
    })),
    nextDuePayment
  };
}

export async function listPortalCases(actor: Principal) {
  return prisma.legalCase.findMany({
    where: ownCaseWhere(actor),
    include: {
      assignedLawyer: { select: { id: true, name: true } }
    },
    orderBy: [{ nextSessionAt: "asc" }, { createdAt: "desc" }]
  });
}

export async function getPortalCaseDetail(actor: Principal, caseIdInput: string) {
  const caseId = parseWithSchema(uuidSchema, caseIdInput, "Case id is invalid.");
  const legalCase = await prisma.legalCase.findFirst({
    where: ownCaseWhere(actor, caseId),
    include: {
      assignedLawyer: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, fullName: true } },
      sessions: {
        orderBy: { sessionDate: "desc" },
        select: {
          id: true,
          courtName: true,
          sessionDate: true,
          decision: true,
          nextSessionDate: true
        }
      },
      appointments: {
        where: portalVisibleAppointmentWhere(),
        orderBy: { startsAt: "asc" }
      },
      documents: {
        where: { visibility: "CLIENT_VISIBLE", deletedAt: null },
        orderBy: { createdAt: "desc" }
      },
      payments: {
        where: { status: { in: [...PORTAL_VISIBLE_PAYMENT_STATUSES] } },
        orderBy: { issueDate: "desc" }
      }
    }
  });

  if (!legalCase) {
    throw new ApiError(404, "NOT_FOUND", "Case was not found.");
  }

  return legalCase;
}

export async function listPortalDocuments(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  return prisma.document.findMany({
    where: clientVisibleDocumentWhere(clientId),
    include: {
      case: { select: { id: true, title: true, internalFileNumber: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function listPortalAppointments(actor: Principal) {
  return prisma.appointment.findMany({
    where: ownVisiblePortalAppointmentWhere(actor),
    include: {
      lawyer: { select: { id: true, name: true } },
      case: { select: { id: true, title: true, internalFileNumber: true } },
      consultationRequest: { select: { id: true, status: true, assignedLawyerId: true } }
    },
    orderBy: { startsAt: "asc" }
  });
}

export async function listPortalPayments(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  return prisma.payment.findMany({
    where: portalVisiblePaymentWhere(clientId),
    include: {
      case: { select: { id: true, title: true, internalFileNumber: true } },
      paymentAttempt: { select: { id: true, provider: true, providerOrderId: true, status: true, failureCode: true, checkoutUrl: true, expiresAt: true, providerPaymentId: true } }
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
  });
}

export async function getPortalDueBalances(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  const balances = await prisma.payment.groupBy({
    by: ["currency"],
    where: portalDuePaymentWhere(clientId),
    _sum: { amount: true },
    orderBy: { currency: "asc" }
  });

  return balances.map((balance) => ({
    currency: balance.currency,
    amount: balance._sum.amount ?? new Prisma.Decimal(0)
  }));
}

export async function listPortalPaymentAttempts(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  const attempts = await prisma.paymentAttempt.findMany({
    where: { clientId, appointment: ownVisiblePortalAppointmentWhere(actor) },
    include: {
      appointment: { select: { id: true, title: true, startsAt: true, status: true } },
      payment: { select: { id: true, invoiceNumber: true, status: true, paidAt: true } }
    },
    orderBy: [{ createdAt: "desc" }],
    take: 20
  });

  return attempts.map((attempt) => ({
    ...attempt,
    payment: attempt.payment && isPortalVisiblePaymentStatus(attempt.payment.status)
      ? attempt.payment
      : null
  }));
}

export async function getPortalProfile(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  if (!client || client.userId !== actor.id) {
    throw new ApiError(404, "NOT_FOUND", "Client profile was not found.");
  }

  return client;
}

export async function updatePortalProfile(input: { actor: Principal; body: unknown }) {
  const clientId = assertClientPortalAccess(input.actor);
  const body = parseWithSchema(portalProfileUpdateSchema, input.body, "Profile payload is invalid.");
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, userId: true }
  });

  if (!client || client.userId !== input.actor.id) {
    throw new ApiError(404, "NOT_FOUND", "Client profile was not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updatedClient = await tx.client.update({
      where: { id: clientId },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        phoneCanonical: canonicalPhone(body.phone),
        email: body.email || null,
        city: body.city || null
      }
    });

    await tx.user.update({
      where: { id: input.actor.id },
      data: {
        name: body.fullName,
        phone: body.phone
      }
    });

    return updatedClient;
  });
}

export async function updateClientPreferences(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
  client?: ClientPreferenceWriter;
  audit?: typeof appendAuditLogBestEffort;
}) {
  const clientId = assertClientPortalAccess(input.actor);
  const body = parseWithSchema(clientPreferenceSchema, input.body, "Client preference payload is invalid.");
  const client = input.client ?? prisma;
  const linkedClient = await client.client.findFirst({
    where: {
      id: clientId,
      userId: input.actor.id,
      status: "ACTIVE",
      deletedAt: null
    },
    select: { id: true }
  });

  if (!linkedClient) {
    throw new ApiError(404, "NOT_FOUND", "Client profile was not found.");
  }

  const updated = await client.user.update({
    where: { id: input.actor.id },
    data: { locale: body.locale },
    select: { locale: true }
  });
  const audit = input.audit ?? appendAuditLogBestEffort;
  await audit({
    actorId: input.actor.id,
    action: "client.preference_update",
    resourceType: "User",
    resourceId: input.actor.id,
    metadata: { locale: body.locale },
    request: input.request,
    requestId: input.requestId
  });

  return { locale: updated.locale };
}
