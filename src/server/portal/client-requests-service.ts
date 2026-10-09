import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { assertClientPortalAccess } from "./client-portal-service";
import { z } from "zod";
import { parseWithSchema } from "@/server/validation/schemas";
import { ApiError } from "@/server/http/errors";
import { assertPublicConsultationSlotAvailable } from "@/server/consultations/consultation-availability-service";
import { appendAuditLog } from "@/server/audit/audit-service";

export async function listOwnConsultationRequests(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  return prisma.consultationRequest.findMany({ where: { clientId, client: { userId: actor.id, deletedAt: null } },
    orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, publicReference: true, status: true, confirmationSource: true, contactChannel: true, outcomeStatus: true, serviceCategory: true, createdAt: true, requestedStartsAt: true, outcomeVersion: true, preferredMode: true,
      appointments: { where: { status: { in: ["SCHEDULED", "RESCHEDULED"] } }, select: { startsAt: true, endsAt: true, mode: true }, orderBy: { startsAt: "asc" } }
    }
  });
}

export const alternativeTimeSchema = z.object({ startsAt: z.iso.datetime(), mode: z.enum(["PHONE", "ONLINE", "OFFICE"]), version: z.number().int().nonnegative() }).strict();
export async function requestAlternativeTime(actor: Principal, id: string, input: unknown) {
  const clientId = assertClientPortalAccess(actor); const body = parseWithSchema(alternativeTimeSchema, input);
  const slot = await assertPublicConsultationSlotAvailable({ startsAt: new Date(body.startsAt), mode: body.mode });
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM consultation_requests WHERE "id" = ${id}::uuid FOR UPDATE`;
    const row = await tx.consultationRequest.findFirst({ where: { id, clientId, client: { userId: actor.id, deletedAt: null }, assistantSession: { isNot: null } } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    if (row.outcomeVersion !== body.version || !["NEW", "REVIEWING"].includes(row.status)) throw new ApiError(409, "CONFLICT", "The appointment request changed.");
    await tx.consultationRequest.update({ where: { id }, data: { requestedStartsAt: new Date(slot.startsAt), requestedEndsAt: new Date(slot.endsAt), preferredMode: body.mode, outcomeVersion: { increment: 1 } } });
    await appendAuditLog({ client: tx, actorId: actor.id, clientId, action: "consultation.alternative.requested", resourceType: "ConsultationRequest", resourceId: id });
    return { requested: true, confirmed: false };
  });
}
