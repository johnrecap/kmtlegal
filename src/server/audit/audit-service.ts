import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { getIpAddress, getUserAgent } from "@/server/auth/session-store";
import { safeLog } from "@/server/observability/safe-log";
import { plan35AuditMetadataForStorage } from "./audit-event-catalog";
import { redactMetadata } from "./redaction";

export type AuditEventInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  clientId?: string | null;
  caseId?: string | null;
  lawyerId?: string | null;
  appointmentId?: string | null;
  documentId?: string | null;
  paymentId?: string | null;
  metadata?: unknown;
  request?: Request;
  requestId?: string;
  client?: Pick<Prisma.TransactionClient, "auditLog">;
};

export async function appendAuditLog(input: AuditEventInput) {
  const client = input.client ?? prisma;
  return client.auditLog.create({
    data: auditLogCreateData(input)
  });
}

export async function appendAuditLogBestEffort(input: Omit<AuditEventInput, "client">) {
  try {
    return await appendAuditLog(input);
  } catch {
    safeLog("warn", "audit.write_failed", {
      requestId: input.requestId ?? null,
      action: input.action,
      resourceType: input.resourceType
    });
    return null;
  }
}

export function auditLogCreateData(input: AuditEventInput): Prisma.AuditLogUncheckedCreateInput {
  return {
    actorId: input.actorId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    clientId: input.clientId ?? null,
    caseId: input.caseId ?? null,
    lawyerId: input.lawyerId ?? null,
    appointmentId: input.appointmentId ?? null,
    documentId: input.documentId ?? null,
    paymentId: input.paymentId ?? null,
    metadata: redactMetadata(plan35AuditMetadataForStorage(input.action, input.metadata)) as Prisma.InputJsonValue,
    ipAddress: input.request ? getIpAddress(input.request) : null,
    userAgent: input.request ? getUserAgent(input.request) : null
  };
}
