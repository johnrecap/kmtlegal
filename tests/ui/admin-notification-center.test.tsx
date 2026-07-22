import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AdminNotificationCenter,
  AdminNotificationPopover
} from "@/features/admin/notifications/admin-notification-popover";

const snapshot = {
  genericUnreadCount: 2,
  consultationReviewCount: 1,
  attentionCount: 2,
  nextCursor: "opaque-next-page",
  items: [
    {
      kind: "generic" as const,
      id: "62000000-0000-4000-8000-000000000001",
      type: "CASE" as const,
      title: "تم تحديث القضية",
      body: "راجع آخر تحديث متاح لك.",
      href: "/admin/cases",
      readAt: null,
      createdAt: "2026-07-22T12:00:00.000Z"
    },
    {
      kind: "consultation-review" as const,
      id: "62000000-0000-4000-8000-000000000002",
      reference: "CONS-62000000",
      applicantDisplayName: "طالب استشارة",
      href: "/admin/consultations/62000000-0000-4000-8000-000000000002",
      startsAt: "2026-07-23T10:00:00.000Z",
      createdAt: "2026-07-22T11:00:00.000Z"
    }
  ]
};

describe("admin notification bell and center UI", () => {
  it("renders generic and consultation items under one truthful attention count", () => {
    const html = renderToStaticMarkup(<AdminNotificationPopover initialSnapshot={snapshot} />);

    expect(html).toContain("تم تحديث القضية");
    expect(html).toContain("CONS-62000000");
    expect(html).toContain(">2<");
    expect(html).toContain('href="/admin/cases"');
    expect(html).toContain("تحديد كمقروء");
    expect(html).toContain('href="/admin/notifications"');
    expect(html).not.toContain("notification.read.self");
  });

  it("keeps mark-read, retry, and live count updates accessible", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/notifications/admin-notification-popover.tsx"),
      "utf8"
    );
    const bellSource = readFileSync(
      join(process.cwd(), "src/features/admin/notifications/admin-notification-bell.tsx"),
      "utf8"
    );
    const copySource = readFileSync(join(process.cwd(), "src/lib/ui-copy.ts"), "utf8");

    expect(source).toContain("/api/admin/notifications/");
    expect(source).toContain("/read");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("copy.retry");
    expect(copySource).toContain('retry: "إعادة المحاولة"');
    expect(source).toContain("setAttentionCount");
    expect(bellSource).toContain("AdminNotificationPopover");
  });

  it("loads center pages by opaque cursor and removes load-more when exhausted", () => {
    const paged = renderToStaticMarkup(<AdminNotificationCenter initialSnapshot={snapshot} />);
    const exhausted = renderToStaticMarkup(
      <AdminNotificationCenter initialSnapshot={{ ...snapshot, nextCursor: null }} />
    );
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/notifications/admin-notification-popover.tsx"),
      "utf8"
    );
    const copySource = readFileSync(join(process.cwd(), "src/lib/ui-copy.ts"), "utf8");

    expect(paged).toContain("تحميل المزيد");
    expect(exhausted).not.toContain("تحميل المزيد");
    expect(source).toContain("pageSize");
    expect(source).toContain("nextCursor");
    expect(source).toContain("encodeURIComponent");
    expect(source).toContain("copy.loadMoreFailed");
    expect(copySource).toContain('loadMoreFailed: "تعذر تحميل المزيد من الإشعارات."');
  });
});
