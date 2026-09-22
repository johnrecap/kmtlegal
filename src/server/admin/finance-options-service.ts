import { Prisma } from "@prisma/client";
import { z } from "zod";
import { canReadAdminFinance } from "./finance-report-service";
import { type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

export const financeOptionsQuerySchema = z.object({
  entity: z.enum(["clients", "cases"]),
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  selectedId: uuidSchema.optional().or(z.literal("")),
  clientId: uuidSchema.optional().or(z.literal(""))
});

export async function listFinanceOptions(actor: Principal, query: unknown) {
  if (!canReadAdminFinance(actor)) throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  const filters = parseWithSchema(financeOptionsQuerySchema, query, "Finance options query is invalid.");
  const pagination = { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize };
  if (filters.entity === "clients") {
    const where: Prisma.ClientWhereInput = { deletedAt: null, ...(filters.q ? { fullName: { contains: filters.q, mode: "insensitive" } } : {}) };
    const [clients, total, selected] = await Promise.all([
      prisma.client.findMany({ where, select: { id: true, fullName: true }, orderBy: [{ fullName: "asc" }, { id: "asc" }], ...pagination }),
      prisma.client.count({ where }),
      filters.selectedId ? prisma.client.findFirst({ where: { id: filters.selectedId, deletedAt: null }, select: { id: true, fullName: true } }) : null
    ]);
    return { items: clients.map(client => ({ id: client.id, label: client.fullName })), selected: selected ? { id: selected.id, label: selected.fullName } : null, total, page: filters.page, pageSize: filters.pageSize };
  }
  const base: Prisma.LegalCaseWhereInput = { deletedAt: null, ...(filters.clientId ? { clientId: filters.clientId } : {}) };
  const where: Prisma.LegalCaseWhereInput = { ...base, ...(filters.q ? { OR: [{ title: { contains: filters.q, mode: "insensitive" } }, { internalFileNumber: { contains: filters.q, mode: "insensitive" } }] } : {}) };
  const selection = { id: true, internalFileNumber: true, title: true } as const;
  const [cases, total, selected] = await Promise.all([
    prisma.legalCase.findMany({ where, select: selection, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], ...pagination }),
    prisma.legalCase.count({ where }),
    filters.selectedId ? prisma.legalCase.findFirst({ where: { ...base, id: filters.selectedId }, select: selection }) : null
  ]);
  const option = (legalCase: { id: string; internalFileNumber: string; title: string }) => ({ id: legalCase.id, label: `${legalCase.internalFileNumber} — ${legalCase.title}` });
  return { items: cases.map(option), selected: selected ? option(selected) : null, total, page: filters.page, pageSize: filters.pageSize };
}
