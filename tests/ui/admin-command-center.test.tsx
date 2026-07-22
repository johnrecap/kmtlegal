import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminCommandCenter } from "@/features/admin/dashboard/admin-command-center";
import {
  plan35DashboardMetricCopy,
  plan35DashboardSectionCopy,
  plan35DashboardUiCopy
} from "@/lib/ui-copy";
import type { DashboardSnapshotV1 } from "@/server/admin/dashboard-service";
import { PLAN35_PRINCIPALS } from "../fixtures/plan35-role-fixtures";

const snapshot = {
  version: 1,
  generatedAt: "2026-07-22T10:00:00.000Z",
  metrics: [
    {
      key: "appointments.today",
      state: "ready",
      value: 3,
      labelKey: "admin.dashboard.metrics.appointmentsToday.label",
      definitionKey: "admin.dashboard.metrics.appointmentsToday.definition",
      timeframe: "cairo-today",
      timeframeLabelKey: "admin.dashboard.timeframe.cairoToday",
      scopeKey: "office-wide",
      scopeLabelKey: "admin.dashboard.scope.officeWide",
      href: "/admin/calendar?from=2026-07-21T21:00:00.000Z&to=2026-07-22T21:00:00.000Z"
    },
    {
      key: "tasks.overdue",
      state: "unavailable",
      value: null,
      labelKey: "admin.dashboard.metrics.overdueTasks.label",
      definitionKey: "admin.dashboard.metrics.overdueTasks.definition",
      timeframe: "before-generated-at",
      timeframeLabelKey: "admin.dashboard.timeframe.beforeGeneratedAt",
      scopeKey: "office-wide",
      scopeLabelKey: "admin.dashboard.scope.officeWide",
      href: "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc",
      recoveryKey: "admin.dashboard.metricUnavailable"
    }
  ],
  prioritySections: [
    {
      key: "tasks.overdue",
      state: "unavailable",
      items: [],
      href: "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc",
      recoveryKey: "admin.dashboard.sectionUnavailable"
    },
    {
      key: "appointments.today",
      state: "ready",
      items: [
        {
          kind: "appointment",
          id: "95000000-0000-4000-8000-000000000001",
          title: { text: "جلسة مراجعة", dir: "auto" },
          status: "SCHEDULED",
          mode: "OFFICE",
          startsAt: "2026-07-22T12:00:00.000Z",
          clientDisplayName: { text: "عميل تجريبي", dir: "auto" },
          href: "/admin/calendar?from=2026-07-21T21:00:00.000Z&to=2026-07-22T21:00:00.000Z"
        }
      ],
      href: "/admin/calendar?from=2026-07-21T21:00:00.000Z&to=2026-07-22T21:00:00.000Z"
    }
  ],
  quickActionRouteIds: ["cases.create", "calendar.list", "contacts.list"],
  recentActivity: []
} satisfies DashboardSnapshotV1;

describe("admin role-aware command center", () => {
  it("renders priority work before metrics and makes the first permitted action primary", () => {
    const html = renderToStaticMarkup(
      <AdminCommandCenter principal={PLAN35_PRINCIPALS.officeAdmin} snapshot={snapshot} />
    );

    expect(html.indexOf(plan35DashboardUiCopy.priorityTitle)).toBeLessThan(
      html.indexOf(plan35DashboardUiCopy.metricsTitle)
    );
    expect(html).toContain('href="/admin/cases/new"');
    expect(html).toContain('data-primary="true"');
    expect(html).toContain(plan35DashboardSectionCopy["appointments.today"].title);
  });

  it("renders every metric as a semantic drill-down link with timeframe and scope copy", () => {
    const html = renderToStaticMarkup(
      <AdminCommandCenter principal={PLAN35_PRINCIPALS.officeAdmin} snapshot={snapshot} />
    );

    expect(html).toContain(
      'href="/admin/calendar?from=2026-07-21T21:00:00.000Z&amp;to=2026-07-22T21:00:00.000Z"'
    );
    expect(html).toContain(plan35DashboardMetricCopy["appointments.today"].label);
    expect(html).toContain("اليوم بتوقيت القاهرة");
    expect(html).toContain("كل المكتب ضمن صلاحياتك");
  });

  it("keeps an unavailable section recoverable while leaving ready sections usable", () => {
    const html = renderToStaticMarkup(
      <AdminCommandCenter principal={PLAN35_PRINCIPALS.officeAdmin} snapshot={snapshot} />
    );

    expect(html).toContain(plan35DashboardSectionCopy["tasks.overdue"].title);
    expect(html).toContain(plan35DashboardUiCopy.retrySection);
    expect(html).toContain("جلسة مراجعة");
    expect(html).toContain('role="status"');
  });

  it("omits forbidden widgets and client search rather than rendering permission placeholders", () => {
    const marketingSnapshot = {
      ...snapshot,
      metrics: [],
      prioritySections: [],
      quickActionRouteIds: ["content.home"] as const
    } satisfies DashboardSnapshotV1;
    const html = renderToStaticMarkup(
      <AdminCommandCenter principal={PLAN35_PRINCIPALS.marketingStaff} snapshot={marketingSnapshot} />
    );

    expect(html).toContain('href="/admin/content"');
    expect(html).not.toContain(plan35DashboardSectionCopy["tasks.overdue"].title);
    expect(html).not.toContain(plan35DashboardMetricCopy["appointments.today"].label);
    expect(html).not.toContain('action="/admin/clients"');
    expect(html).not.toContain("غير متاح لحسابك");
  });
});
