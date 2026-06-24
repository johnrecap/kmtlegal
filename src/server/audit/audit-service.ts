import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { getIpAddress, getUserAgent } from "@/server/auth/session-store";
import { redactMetadata } from "./redaction";

export type AuditEventInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: unknown;
  request?: Request;
};

export async function appendAuditLog(input: AuditEventInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: redactMetadata(input.metadata) as Prisma.InputJsonValue,
      ipAddress: input.request ? getIpAddress(input.request) : null,
      userAgent: input.request ? getUserAgent(input.request) : null
    }
  });
}
