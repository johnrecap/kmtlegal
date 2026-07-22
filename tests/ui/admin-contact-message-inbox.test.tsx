import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ContactMessageInbox,
  type ContactMessageInboxData
} from "@/features/admin/contact-messages/contact-message-inbox";

const longMixedMessage =
  "أحتاج مراجعة المستندات الخاصة بعقد التوريد — Contract reference ABC-2026-VERY-LONG-REFERENCE — مع توضيح الخطوات التالية دون قص محتوى الرسالة.";

const initialData = {
  items: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      fullName: "عميل اختبار طويل الاسم",
      email: "contact@example.test",
      phone: "+201000000000",
      topic: "documents",
      message: longMixedMessage,
      status: "NEW" as const,
      createdAt: "2026-07-22T08:00:00.000Z",
      reviewedAt: null,
      reviewedBy: null
    }
  ],
  total: 1,
  filters: {
    q: "",
    status: "" as const,
    topic: "" as const,
    sortBy: "createdAt" as const,
    sortDirection: "desc" as const,
    page: 1,
    pageSize: 30
  },
  page: 1,
  pageSize: 30
} satisfies ContactMessageInboxData;

describe("admin contact message inbox UI", () => {
  it("renders a responsive, named queue with mixed-direction safe contact details", () => {
    const html = renderToStaticMarkup(<ContactMessageInbox canManage initialData={initialData} />);

    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="فلاتر رسائل التواصل"');
    expect(html).toContain("رسائل التواصل الواردة");
    expect(html).toContain("hidden md:block");
    expect(html).toContain("md:hidden");
    expect(html).toContain('dir="auto"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain(longMixedMessage);
    expect(html).not.toContain("contact.manage.any");
  });

  it("exposes native keyboard actions only to managers and keeps feedback announced", () => {
    const managerHtml = renderToStaticMarkup(<ContactMessageInbox canManage initialData={initialData} />);
    const readerHtml = renderToStaticMarkup(<ContactMessageInbox canManage={false} initialData={initialData} />);
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/contact-messages/contact-message-inbox.tsx"),
      "utf8"
    );

    expect(managerHtml).toContain("تحديد كمراجعة");
    expect(managerHtml).toContain("أرشفة");
    expect(readerHtml).not.toContain("تحديد كمراجعة");
    expect(readerHtml).not.toContain("أرشفة");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("disabled={isBusy}");
    expect(source).toContain("/api/admin/contact-messages/");
  });

  it("renders an explicit empty state without losing filters", () => {
    const html = renderToStaticMarkup(
      <ContactMessageInbox
        canManage
        initialData={{ ...initialData, items: [], total: 0, filters: { ...initialData.filters, status: "ARCHIVED" as const } }}
      />
    );

    expect(html).toContain("لا توجد رسائل مطابقة للفلاتر الحالية");
    expect(html).toContain('name="status"');
    expect(html).toContain('value="ARCHIVED" selected=""');
  });
});
