import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClientPortalMetric, ClientPortalPanel, ClientSiteShell, DashboardShell, clientPortalTableClass } from "@/components/layout";
import { ClientPortalSelect } from "@/components/layout/client-portal-select";
import { Badge, Button, DataRecordCard, DataTable, Select, StateBlock, Tabs, TextInput } from "@/components/ui";

describe("product UI primitives", () => {
  it("renders button states and accessible text", () => {
    const html = renderToStaticMarkup(
      <Button disabled loading>
        حفظ الطلب
      </Button>
    );

    expect(html).toContain("disabled");
    expect(html).toContain("حفظ الطلب");
  });

  it("renders form field labels and validation wiring", () => {
    const html = renderToStaticMarkup(
      <TextInput error="هذا الحقل مطلوب" hint="اكتب الاسم القانوني" label="اسم العميل" name="clientName" />
    );

    expect(html).toContain("اسم العميل");
    expect(html).toContain("aria-invalid");
    expect(html).toContain("هذا الحقل مطلوب");
  });

  it("renders selects with reserved arrow spacing for RTL fields", () => {
    const html = renderToStaticMarkup(
      <Select defaultValue="client" label="الدور" name="roleId">
        <option value="client">Client</option>
      </Select>
    );

    expect(html).toContain("appearance-none");
    expect(html).toContain("pe-12");
    expect(html).toContain("z-10");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("aria-hidden=\"true\"");
  });

  it("renders client portal selects as dark custom listboxes with stable form values", () => {
    const html = renderToStaticMarkup(
      <ClientPortalSelect
        defaultValue="OTHER"
        label="تصنيف المستند"
        name="category"
        options={[
          { value: "CONTRACT", label: "عقد" },
          { value: "OTHER", label: "أخرى" }
        ]}
      />
    );
    const componentSource = readFileSync(join(process.cwd(), "src/components/layout/client-portal-select.tsx"), "utf8");
    const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(html).toContain("type=\"hidden\"");
    expect(html).toContain("name=\"category\"");
    expect(html).toContain("value=\"OTHER\"");
    expect(html).toContain("aria-haspopup=\"listbox\"");
    expect(html).toContain("bg-black/25");
    expect(html).toContain("text-[#c79a52]");
    expect(componentSource).toContain("role=\"listbox\"");
    expect(componentSource).toContain("bg-[#090806]");
    expect(componentSource).toContain("bg-kmt-gold text-[#120d07]");
    expect(globalStyles).toContain(".client-portal-shell .client-portal-panel select option");
    expect(globalStyles).toContain("background: #090806");
  });

  it("renders native date and time inputs with picker spacing in RTL layouts", () => {
    const html = renderToStaticMarkup(<TextInput label="وقت الموعد" name="appointmentStartsAt" type="datetime-local" />);

    expect(html).toContain("type=\"datetime-local\"");
    expect(html).toContain("dir=\"ltr\"");
    expect(html).toContain("pe-11");
    expect(html).toContain("text-left");
  });

  it("renders semantic status badges", () => {
    const html = renderToStaticMarkup(<Badge tone="active">نشطة</Badge>);

    expect(html).toContain("نشطة");
    expect(html).toContain("bg-blue-50");
  });

  it("renders empty table state", () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={[{ key: "name", header: "الاسم", render: (row: { id: string; name: string }) => row.name }]}
        emptyClassName="client-portal-table-empty"
        rows={[]}
      />
    );

    expect(html).toContain("لا توجد بيانات");
    expect(html).toContain("client-portal-table-empty");
  });

  it("renders optional mobile cards while keeping the desktop table", () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={[{ key: "name", header: "الاسم", render: (row: { id: string; name: string }) => row.name }]}
        rows={[
          { id: "client-1", name: "عميل تجريبي" },
          { id: "client-2", name: "عميل ثان" }
        ]}
        mobileRender={(row) => <article>{row.name}</article>}
      />
    );

    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).toContain("<article>عميل تجريبي</article>");
    expect(html).toContain("<article>عميل ثان</article>");
    expect(html).toContain("<table");
  });

  it("renders mobile data record cards with labels, badges, and action areas", () => {
    const html = renderToStaticMarkup(
      <DataRecordCard
        title="ملف عميل"
        description="0100000000"
        badges={<Badge tone="active">نشط</Badge>}
        fields={[
          { label: "المصدر", value: "يدوي" },
          { label: "المحامي", value: "سارة" }
        ]}
        action={<a className="min-h-11" href="/admin/clients/1">فتح</a>}
      />
    );

    expect(html).toContain("ملف عميل");
    expect(html).toContain("المصدر");
    expect(html).toContain("يدوي");
    expect(html).toContain("min-h-11");
  });

  it("renders recoverable state blocks", () => {
    const html = renderToStaticMarkup(
      <StateBlock description="يمكن إعادة المحاولة لاحقًا." title="تعذر تحميل البيانات" tone="error" />
    );

    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("تعذر تحميل البيانات");
  });

  it("renders distinct dashboard navigation routes", () => {
    const html = renderToStaticMarkup(
      <DashboardShell
        eyebrow="Product System"
        navItems={[
          { label: "لوحة التحكم", href: "/product-system", icon: "dashboard", group: "تشغيل المكتب", active: true },
          { label: "العملاء", href: "/product-system/clients", icon: "groups", group: "تشغيل المكتب" },
          { label: "القضايا", href: "/product-system/cases", icon: "folder_open", group: "الملفات" }
        ]}
        title="نظام واجهة KMT Legal"
        userLabel="سارة - مدير المكتب"
      >
        <div>content</div>
      </DashboardShell>
    );

    expect(html).toContain("href=\"/product-system/clients\"");
    expect(html).toContain("href=\"/product-system/cases\"");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("scrollbar-hide");
    expect(html).toContain("تشغيل المكتب");
    expect(html).toContain("الملفات");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).toContain("action=\"/api/auth/logout\"");
    expect(html).toContain("تسجيل الخروج");
  });

  it("renders the client portal shell with the public dark visual language and no card motion", () => {
    const html = renderToStaticMarkup(
      <ClientSiteShell
        navItems={[
          { label: "الرئيسية", href: "/client", icon: "home", active: true },
          { label: "الملفات", href: "/client/files", icon: "folder" }
        ]}
        title="مرحبًا عميل"
        userLabel="client@example.com"
      >
        <div className="space-y-4">
          <ClientPortalMetric icon="gavel" label="القضايا" value="2" />
          <ClientPortalPanel title="ملفاتي">
            <DataTable
              className={clientPortalTableClass}
              columns={[{ key: "name", header: "الاسم", render: (row: { id: string; name: string }) => row.name }]}
              rows={[{ id: "doc-1", name: "عقد" }]}
            />
          </ClientPortalPanel>
        </div>
      </ClientSiteShell>
    );

    expect(html).toContain("data-testid=\"client-portal-shell\"");
    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("bg-[#070604]/95");
    expect(html).toContain("بوابة العميل");
    expect(html).toContain("href=\"/client/files\"");
    expect(html).toContain("client-portal-panel");
    expect(html).toContain("client-portal-table");
    expect(html).not.toContain("kmt-motion-card");
    expect(html).not.toContain("kmt-motion-card-beam");
  });

  it("keeps the client files page wired to the upload form after portal redirects", () => {
    const source = readFileSync(join(process.cwd(), "src/app/client/files/page.tsx"), "utf8");

    expect(source).toContain("DocumentUploadForm");
    expect(source).toContain("listPortalCases");
    expect(source).toContain("listPortalDocuments");
    expect(source).toContain("/api/files/");
  });

  it("uses scoped consultation chat surfaces without transcript persistence", () => {
    const publicPageSource = readFileSync(join(process.cwd(), "src/features/public-site/public-pages.tsx"), "utf8");
    const publicChatSource = readFileSync(join(process.cwd(), "src/features/public-site/consultation-booking-chat.tsx"), "utf8");
    const clientChatSource = readFileSync(join(process.cwd(), "src/features/client/client-assistant-panel.tsx"), "utf8");
    const publicContentEn = readFileSync(join(process.cwd(), "src/content/public-content.en.ts"), "utf8");
    const publicContentAr = readFileSync(join(process.cwd(), "src/content/public-content.ar.ts"), "utf8");

    expect(publicPageSource).toContain("ConsultationBookingChat");
    expect(publicPageSource).not.toContain("<BookingStepper");
    expect(publicPageSource).not.toContain("<ConsultationAssistantPanel");
    expect(publicChatSource).toContain("content.bookingChat");
    expect(publicChatSource).toContain('data-testid="booking-chat-shell"');
    expect(publicChatSource).not.toContain("const chatCopy");
    expect(publicContentEn).toContain("bookingChat");
    expect(publicContentEn).toContain("I cannot provide a legal opinion");
    expect(publicContentAr).toContain("bookingChat");
    expect(publicContentAr).toContain("لا أستطيع تقديم رأي قانوني");
    expect(clientChatSource).toContain("KMT Client Assistant");
    expect(clientChatSource).toContain("لا أقدم رأيًا قانونيًا");
    expect(`${publicChatSource}\n${clientChatSource}`).not.toContain("localStorage");
    expect(`${publicChatSource}\n${clientChatSource}`).not.toContain("sessionStorage");
  });

  it("renders Tabs as a pressed button group, not incomplete ARIA tabs", () => {
    const html = renderToStaticMarkup(
      <Tabs
        activeValue="articles"
        items={[
          { value: "articles", label: "المقالات" },
          { value: "cases", label: "دراسات الحالة" }
        ]}
      />
    );

    expect(html).toContain("role=\"group\"");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).not.toContain("role=\"tablist\"");
    expect(html).not.toContain("role=\"tab\"");
  });

  it("keeps targeted admin content labels localized", () => {
    const source = readFileSync(join(process.cwd(), "src/app/admin/content/page.tsx"), "utf8");

    expect(source).not.toContain('["articles", "Articles"]');
    expect(source).not.toContain('["case-studies", "Case Studies"]');
    expect(source).not.toContain('["social", "Social Posts"]');
    expect(source).not.toContain('["pending", "Pending Approval"]');
    expect(source).not.toContain("AI Draft Panel");
    expect(source).not.toContain("Media/Social");
    expect(source).not.toContain("read-only");
  });

  it("keeps the finance submit form reference stable across async requests", () => {
    const source = readFileSync(join(process.cwd(), "src/features/admin/finance/finance-forms.tsx"), "utf8");

    expect(source).toContain("const form = event.currentTarget;");
    expect(source).toContain("paymentPayloadFromForm(form)");
    expect(source).toContain("form.reset()");
    expect(source).not.toContain("event.currentTarget.reset()");
  });

  it("keeps the admin audit log page on client-friendly DTO fields", () => {
    const source = readFileSync(join(process.cwd(), "src/app/admin/audit-log/page.tsx"), "utf8");

    expect(source).toContain("row.event.label");
    expect(source).toContain("row.summary");
    expect(source).toContain("TechnicalDetails");
    expect(source).not.toContain("JSON.stringify(metadata)");
    expect(source).not.toContain("shortMetadata");
  });
});
