import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CalendarPage from "@/app/(app-ar)/admin/calendar/page";

vi.mock("@/server/auth/page-guards", () => ({
  requireAdminRoutePage: async () => ({ status: "allowed", context: { user: { name: "Synthetic" }, principal: { id: "staff", roleName: "Office Admin", permissions: ["appointment.manage.any"] } } }),
  AdminPermissionBlocked: () => null
}));
vi.mock("@/server/admin/case-operations-service", () => ({
  listAdminCalendarAppointments: async ({ query }: { query: Record<string, string> }) => ({ items: [], total: 0, page: 1, pageSize: 80, filters: query, from: new Date(`${query.from}T00:00:00Z`), to: new Date(`${query.to}T00:00:00Z`) }),
  listCalendarCaseOptions: async () => [],
  getAdminCaseFilterOptions: async () => ({ lawyers: [], canManage: false }),
  canManageCalendarAppointment: () => false
}));
afterEach(() => vi.useRealTimers());

function link(node: React.ReactNode, label: string): string | undefined {
  for (const child of React.Children.toArray(node)) {
    if (!React.isValidElement<{ href?: string; children?: React.ReactNode }>(child)) continue;
    if (child.props.children === label && child.props.href) return child.props.href;
    const nested = link(child.props.children, label);
    if (nested) return nested;
  }
}
describe("FIX23 calendar navigation contracts", () => {
  const filters = { display: "agenda", from: "2026-11-17", to: "2026-11-24", lawyerId: "lawyer", clientId: "client", caseId: "case", mode: "ONLINE", status: "RESCHEDULED" };
  it("preserves permission-scoped filters and uses the selected date for day/week links", async () => {
    const page = await CalendarPage({ searchParams: Promise.resolve(filters) });
    for (const [label, display, from, to] of [["الأسبوع", "week", "2026-11-15", "2026-11-22"], ["اليوم", "day", "2026-11-17", "2026-11-18"]]) {
      const url = new URL(link(page, label)!, "https://example.test");
      expect(Object.fromEntries(url.searchParams)).toMatchObject({ ...filters, display, from, to, anchor: "2026-11-17" });
    }
  });
  it("moves the agenda anchor and range only when Today is clicked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T23:30:00Z"));
    const page = await CalendarPage({ searchParams: Promise.resolve(filters) });
    const url = new URL(link(page, "اذهب إلى اليوم")!, "https://example.test");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ ...filters, from: "2026-09-23", to: "2026-10-23", anchor: "2026-09-23" });
  });
});
