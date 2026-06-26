import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { parseWithSchema, uuidSchema, emailSchema } from "@/server/validation/schemas";

export const portalProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal(""))
});

export type PortalProfileUpdateInput = z.infer<typeof portalProfileUpdateSchema>;

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

export function clientVisibleDocumentWhere(clientId: string): Prisma.DocumentWhereInput {
  return {
    deletedAt: null,
    visibility: "CLIENT_VISIBLE",
    OR: [{ ownerClientId: clientId }, { case: { clientId } }]
  };
}

export async function getPortalDashboard(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  const [client, cases, appointments, documentsCount, payments] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        assignedLawyer: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.legalCase.findMany({
      where: ownCaseWhere(actor),
      orderBy: [{ nextSessionAt: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        assignedLawyer: { select: { id: true, name: true } }
      }
    }),
    prisma.appointment.findMany({
      where: {
        clientId,
        startsAt: { gte: new Date() },
        status: { in: ["SCHEDULED", "RESCHEDULED"] }
      },
      orderBy: { startsAt: "asc" },
      take: 5
    }),
    prisma.document.count({
      where: clientVisibleDocumentWhere(clientId)
    }),
    prisma.payment.findMany({
      where: { clientId },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take: 5
    })
  ]);

  if (!client) {
    throw new ApiError(404, "NOT_FOUND", "Client profile was not found.");
  }

  return {
    client,
    cases,
    appointments,
    documentsCount,
    payments
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
        orderBy: { startsAt: "asc" }
      },
      documents: {
        where: { visibility: "CLIENT_VISIBLE", deletedAt: null },
        orderBy: { createdAt: "desc" }
      },
      payments: {
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
  const clientId = assertClientPortalAccess(actor);
  return prisma.appointment.findMany({
    where: { clientId },
    include: {
      lawyer: { select: { id: true, name: true } },
      case: { select: { id: true, title: true, internalFileNumber: true } }
    },
    orderBy: { startsAt: "asc" }
  });
}

export async function listPortalPayments(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  return prisma.payment.findMany({
    where: { clientId },
    include: {
      case: { select: { id: true, title: true, internalFileNumber: true } }
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }]
  });
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
