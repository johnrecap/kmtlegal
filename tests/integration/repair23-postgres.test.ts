import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { describe, expect, it, vi } from "vitest";
import { createRepair23Fixtures } from "../fixtures/repair23-db-fixtures";

const holder = vi.hoisted(() => ({ current: null as unknown as Prisma.TransactionClient }));
vi.mock("@/server/db/prisma", () => ({ prisma: new Proxy({}, { get: (_target, key) => Reflect.get(holder.current, key) }) }));
import { getPortalDashboard, getPortalCaseDetail, listPortalAppointments } from "@/server/portal/client-portal-service";
import { listAdminTasks } from "@/server/admin/task-document-service";
import { listFinanceOptions } from "@/server/admin/finance-options-service";
import { listAdminPayments } from "@/server/admin/finance-report-service";

const url = process.env.REPAIR23_DATABASE_URL;
const enabled = process.env.RUN_REPAIR23_POSTGRES === "true";
describe.skipIf(!enabled)("FIX-23 rollback-only PostgreSQL acceptance", () => {
  it("isolates clients, counts complete results, groups currencies and paginates beyond preview limits", async () => {
    if (!url || !new URL(url).pathname.endsWith("/kmt_repair23_test") || process.env.APP_ENV === "production") {
      throw new Error("An explicitly disposable kmt_repair23_test database URL is required; production is forbidden.");
    }
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    const rollback = new Error("REPAIR23_ROLLBACK_SUCCESS");
    try {
      // Refuse a database containing application records, even when its name looks safe.
      const existing = await Promise.all([db.client.count(), db.user.count(), db.legalCase.count(), db.payment.count(), db.task.count()]);
      if (existing.some(Boolean)) throw new Error("Acceptance requires an empty migrated disposable database.");
      await expect(db.$transaction(async tx => {
        holder.current = tx;
        const { actors, clientIds, caseIds } = await createRepair23Fixtures(tx);
        const dashboard = await getPortalDashboard(actors.client);
        expect(dashboard.cases).toHaveLength(5);
        expect(dashboard.casesCount).toBe(8);
        expect(dashboard.appointments).toHaveLength(5);
        expect(dashboard.appointmentsCount).toBe(7);
        expect(dashboard.dueBalances.map(row => [row.currency, row.amount.toString()])).toEqual([["EGP", "120.03"], ["USD", "10.03"]]);
        expect(dashboard.payments.every(row => row.status !== "DRAFT")).toBe(true);
        expect(dashboard.nextDuePayment).not.toBeNull();
        expect((await listPortalAppointments(actors.client)).some(row => row.type === "INTERNAL_MEETING")).toBe(false);
        await expect(getPortalCaseDetail(actors.otherClient, caseIds[0])).rejects.toMatchObject({ status: 404 });
        const board = await listAdminTasks({ actor: actors.taskReader, query: { display: "board", status: "NEW" } });
        expect(board.boardColumns).toHaveLength(1);
        expect(board.boardColumns?.[0].items).toHaveLength(12);
        expect(board.statusTotals.NEW).toBe(13);
        expect(board.statusTotals.COMPLETED).toBe(13);
        expect(board.items.every(row => !row.canUpdate && row.case === null)).toBe(true);
        const secondPage = await listAdminTasks({ actor: actors.taskReader, query: { status: "NEW", page: 2, pageSize: 12 } });
        expect(secondPage.items).toHaveLength(1);
        const choices = await listFinanceOptions({ ...actors.officeAdmin, permissions: ["finance.read.any"] }, { entity: "clients", page: 8, selectedId: clientIds[151] });
        expect(choices.total).toBe(152);
        expect(choices.items).toHaveLength(12);
        expect(choices.selected?.id).toBe(clientIds[151]);
        const finance = await listAdminPayments({ actor: actors.officeAdmin, query: {} });
        expect(finance.summary.byCurrency.find(row => row.currency === "EGP")?.openAmount).toBe("120.03");
        expect(finance.summary.byCurrency.find(row => row.currency === "USD")?.openAmount).toBe("10.03");
        throw rollback;
      }, { timeout: 60000 })).rejects.toBe(rollback);
      expect(await db.client.count()).toBe(0);
    } finally {
      await db.$disconnect();
    }
  }, 90000);
});
