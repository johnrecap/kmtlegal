import { randomUUID } from "node:crypto";
import type { Prisma, PaymentStatus } from "@prisma/client";
import { permissionsForRole, ROLES, type Principal } from "@/server/auth/policy";

// Only called inside the rollback-only transaction of repair23-postgres.test.ts.
export async function createRepair23Fixtures(tx: Prisma.TransactionClient) {
  const marker = `repair23-${randomUUID()}`;
  const actors: Record<string, Principal> = {};
  for (const [key, name] of Object.entries(ROLES)) {
    const role = await tx.role.upsert({ where: { name }, create: { name }, update: {} });
    const user = await tx.user.create({ data: { roleId: role.id, name: `${marker}:${key}`, email: `${key}.${marker}@example.invalid`, status: "ACTIVE" } });
    actors[key] = { id: user.id, roleName: name, permissions: [...permissionsForRole(name)] };
  }
  const customRole = await tx.role.create({ data: { name: `${marker}:custom` } });
  for (const [key, permissions] of Object.entries({ taskReader: ["task.read.assigned"], accountManager: ["client.read.any", "client.account.manage"] })) {
    const user = await tx.user.create({ data: { roleId: customRole.id, name: `${marker}:${key}`, email: `${key}.${marker}@example.invalid`, status: "ACTIVE" } });
    actors[key] = { id: user.id, roleName: ROLES.officeAdmin, permissions };
  }
  const clientIds = Array.from({ length: 152 }, () => randomUUID());
  await tx.client.createMany({ data: clientIds.map((id, index) => ({ id, fullName: `${marker} client ${String(index).padStart(3, "0")}`, phone: `synthetic-${index}`, status: "ACTIVE", source: marker, assignedLawyerId: actors.lawyer.id })) });
  const caseIds = Array.from({ length: 160 }, () => randomUUID());
  await tx.legalCase.createMany({ data: caseIds.map((id, index) => ({ id, internalFileNumber: `${marker}-${index}`, clientId: clientIds[index < 8 ? 0 : 1], title: `${marker} case ${index}`, caseType: "synthetic", assignedLawyerId: actors.lawyer.id })) });
  for (const status of ["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED", "OVERDUE", "ARCHIVED"] as const) {
    await tx.task.createMany({ data: Array.from({ length: 13 }, (_, index) => ({ title: `${marker}:${status}:${index}`, status, assignedToId: actors.taskReader.id, createdById: actors.officeAdmin.id, caseId: caseIds[0] })) });
  }
  const upcoming = new Date(Date.now() + 7 * 86400000);
  await tx.appointment.createMany({ data: Array.from({ length: 8 }, (_, index) => ({ clientId: clientIds[0], caseId: caseIds[0], lawyerId: actors.lawyer.id, title: `${marker}:appointment:${index}`, type: index === 7 ? "INTERNAL_MEETING" : "CONSULTATION", mode: "OFFICE", startsAt: upcoming, endsAt: new Date(upcoming.getTime() + 3600000), status: index === 6 ? "RESCHEDULED" : "SCHEDULED" })) });
  const invoices: { status: PaymentStatus; amount: string; currency: "EGP" | "USD"; old?: boolean }[] = [
    { status: "ISSUED", amount: "100.01", currency: "EGP", old: true },
    { status: "OVERDUE", amount: "20.02", currency: "EGP" },
    { status: "PENDING", amount: "10.03", currency: "USD" },
    { status: "DRAFT", amount: "9999", currency: "EGP" },
    ...Array.from({ length: 6 }, () => ({ status: "PAID" as const, amount: "50", currency: "EGP" as const })),
    { status: "CANCELLED", amount: "80", currency: "USD" }
  ];
  await tx.payment.createMany({ data: invoices.map((invoice, index) => ({ invoiceNumber: `${marker}:invoice:${index}`, clientId: clientIds[0], caseId: caseIds[0], status: invoice.status, amount: invoice.amount, currency: invoice.currency, issueDate: new Date(invoice.old ? "2020-01-01" : Date.now()), dueDate: new Date("2020-02-01") })) });
  actors.client = { ...actors.client, clientId: clientIds[0], permissions: ["client.read.self"] };
  // A second distinct client principal tests cross-client object authorization.
  const secondUser = await tx.user.create({ data: { roleId: customRole.id, name: `${marker}:second-client`, email: `second.${marker}@example.invalid`, status: "ACTIVE" } });
  actors.otherClient = { id: secondUser.id, roleName: ROLES.client, clientId: clientIds[1], permissions: ["client.read.self"] };
  await tx.client.update({ where: { id: clientIds[0] }, data: { userId: actors.client.id } });
  await tx.client.update({ where: { id: clientIds[1] }, data: { userId: secondUser.id } });
  return { actors, clientIds, caseIds };
}
