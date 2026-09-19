import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClientPortalMetric, ClientPortalPanel, ClientSiteShell, DashboardShell, clientPortalTableClass } from "@/components/layout";
import { ClientPortalSelect } from "@/components/layout/client-portal-select";
import { Badge, Button, DataRecordCard, DataTable, MaterialSymbol, Select, StateBlock, Tabs, TextInput } from "@/components/ui";
import { adminNavForPath } from "@/app/(app-ar)/admin/admin-navigation";
import { LoginForm } from "@/features/auth/login-form";
import { ClientAssistantPanel } from "@/features/client/client-assistant-panel";
import { DocumentUploadForm } from "@/features/portal/document-upload-form";
import { ProfileForm } from "@/features/portal/profile-form";
import { PLAN35_ROLE_FIXTURES } from "../fixtures/plan35-role-fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

describe("product UI primitives", () => {
  it("renders the mobile navigation menu icon instead of the unknown-icon fallback", () => {
    const menuIcon = renderToStaticMarkup(<MaterialSymbol name="menu" />);
    const fallbackIcon = renderToStaticMarkup(<MaterialSymbol name="unknown-icon" />);

    expect(menuIcon).not.toBe(fallbackIcon.replace("unknown-icon", "menu"));
    expect(menuIcon).toContain('d="M5 7h14M5 12h14M5 17h14"');
  });

  it("renders button states and accessible text", () => {
    const html = renderToStaticMarkup(
      <Button disabled loading>
        حفظ الطلب
      </Button>
    );

    expect(html).toContain("disabled");
    expect(html).toContain("aria-busy=\"true\"");
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
    expect(html).toContain("bg-[var(--kmt-client-surface)]");
    expect(html).toContain("text-[var(--kmt-client-gold)]");
    expect(componentSource).toContain("role=\"listbox\"");
    expect(componentSource).toContain("bg-[var(--kmt-client-surface)]");
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
    expect(html).toContain("bg-success-surface");
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
        eyebrow="لوحة المكتب"
        navItems={[
          { label: "لوحة التحكم", href: "/admin", icon: "dashboard", group: "تشغيل المكتب", active: true },
          { label: "العملاء", href: "/admin/clients", icon: "groups", group: "تشغيل المكتب" },
          { label: "القضايا", href: "/admin/cases", icon: "folder_open", group: "الملفات" }
        ]}
        title="إدارة مكتب KMT Legal"
        userLabel="سارة - مدير المكتب"
      >
        <div>content</div>
      </DashboardShell>
    );

    expect(html).toContain("href=\"/admin/clients\"");
    expect(html).toContain("href=\"/admin/cases\"");
    expect(html).toContain("data-testid=\"dashboard-mobile-navigation-trigger\"");
    expect(html).not.toContain("<dialog");
    expect(html).toContain("data-testid=\"dashboard-desktop-navigation\"");
    expect(html).toContain("max-lg:hidden");
    expect(html).toContain("aria-label=\"لوحة التحكم\"");
    expect(html).toContain("aria-label=\"العملاء\"");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).toContain("/brand/kmt-logo-mark.webp");
    expect(html).toContain("action=\"/api/auth/logout\"");
    expect(html).toContain("تسجيل الخروج");
  });

  it("filters the admin workspace before rendering desktop and mobile navigation", () => {
    const principal = PLAN35_ROLE_FIXTURES.marketingStaff.principal;
    const navItems = adminNavForPath("/admin/content");
    const groupTransitions = navItems
      .map(({ group }) => group)
      .filter((group, index, groups) => index === 0 || group !== groups[index - 1]);
    const html = renderToStaticMarkup(
      <DashboardShell
        action={<span>إدارة الإعدادات</span>}
        actionRouteId="settings.home"
        eyebrow="مساحة العمل"
        navItems={navItems}
        principal={principal}
        title="المحتوى"
        userLabel="مسؤول التسويق"
      >
        <div>content</div>
      </DashboardShell>
    );

    expect(groupTransitions).toEqual(["تشغيل المكتب", "الملفات والمالية", "الإدارة"]);
    expect(html).toContain("href=\"/admin\"");
    expect(html).toContain("href=\"/admin/content\"");
    expect(html).not.toContain("href=\"/admin/clients\"");
    expect(html).not.toContain("href=\"/admin/settings\"");
    expect(html).not.toContain("إدارة الإعدادات");
    expect(html).not.toContain("case.read.any");
  });

  it("keeps only safe navigation and user labels in the persisted admin access context", () => {
    const contextSource = readFileSync(join(process.cwd(), "src/features/admin/shell/admin-access-context.tsx"), "utf8");
    const layoutSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/layout.tsx"), "utf8");

    expect(contextSource).toContain("createContext");
    expect(contextSource).toContain("usePathname");
    expect(contextSource).toContain("navItems");
    expect(contextSource).toContain("userLabel");
    expect(contextSource).not.toContain("permissions:");
    expect(layoutSource).toContain("AdminAccessProvider");
    expect(layoutSource).not.toContain("permissions={");
  });

  it("preserves authorized navigation across admin loading, error, and not-found boundaries", () => {
    const stateSource = readFileSync(join(process.cwd(), "src/components/layout/admin-shell-state.tsx"), "utf8");
    const loadingSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/loading.tsx"), "utf8");
    const errorSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/error.tsx"), "utf8");
    const notFoundSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/not-found.tsx"), "utf8");

    for (const source of [loadingSource, errorSource, notFoundSource]) expect(source).toContain("AdminShellState");
    expect(stateSource).toContain("useAdminAccess");
    expect(errorSource).toContain('"use client"');
    expect(errorSource).toContain("reset");
    expect(errorSource).not.toContain("error.message");
    expect(errorSource).not.toContain("error.digest");
  });

  it("uses an Animate Sheet mobile nav with focus trap, close on navigation, and RTL side", () => {
    const mobileNavSource = readFileSync(join(process.cwd(), "src/components/admin/admin-mobile-nav.tsx"), "utf8");

    expect(mobileNavSource).toContain("Sheet");
    expect(mobileNavSource).toContain("onOpenChange");
    expect(mobileNavSource).toContain("setOpen(false)");
    expect(mobileNavSource).toContain('side="right"');
    expect(mobileNavSource).toContain("aria-label");
    expect(mobileNavSource).toContain("dashboard-mobile-navigation-trigger");
    expect(mobileNavSource).toContain("dashboard-mobile-navigation");
    expect(mobileNavSource).not.toContain("<dialog");
    expect(mobileNavSource).not.toContain("showModal()");
  });

  it("renders the client portal shell with the public dark visual language and no card motion", () => {
    const html = renderToStaticMarkup(
      <ClientSiteShell
        locale="ar"
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
    expect(html).toContain("bg-[var(--kmt-client-header)]");
    expect(html).toContain("/brand/kmt-logo-mark.webp");
    expect(html).toContain("بوابة العميل");
    expect(html).toContain("href=\"/client/files\"");
    expect(html).toContain("client-portal-panel");
    expect(html).toContain("client-portal-table");
    expect(html).not.toContain("kmt-motion-card");
    expect(html).not.toContain("kmt-motion-card-beam");
  });

  it("renders the client shell and account forms from the English catalog", () => {
    const shell = renderToStaticMarkup(
      <ClientSiteShell
        locale="en"
        navItems={[
          { label: "Home", href: "/client", icon: "home", active: true },
          { label: "Files", href: "/client/files", icon: "folder" }
        ]}
        title="Welcome"
        userLabel="client@example.com"
      >
        <div>content</div>
      </ClientSiteShell>
    );
    const profile = renderToStaticMarkup(
      <ProfileForm
        locale="en"
        profile={{
          fullName: "Test Client",
          email: "client@example.com",
          phone: "+201000000000"
        }}
      />
    );
    const upload = renderToStaticMarkup(<DocumentUploadForm cases={[]} locale="en" />);

    expect(shell).toContain('dir="ltr"');
    expect(shell).toContain("Client Portal");
    expect(shell).toContain("Sign out");
    expect(profile).toContain("Profile details");
    expect(profile).toContain("Save details");
    expect(upload).toContain("Upload a new document");
    expect(upload).toContain("No specific case");
  });

  it("renders login and assistant entry states in both supported languages", () => {
    const englishLogin = renderToStaticMarkup(<LoginForm locale="en" />);
    const arabicLogin = renderToStaticMarkup(<LoginForm locale="ar" />);
    const englishAssistant = renderToStaticMarkup(<ClientAssistantPanel locale="en" />);
    const arabicAssistant = renderToStaticMarkup(<ClientAssistantPanel locale="ar" />);

    expect(englishLogin).toContain("Sign in");
    expect(englishLogin).toContain("Email address");
    expect(arabicLogin).toContain("تسجيل الدخول");
    expect(arabicLogin).toContain("البريد الإلكتروني");
    expect(englishAssistant).toContain("KMT Client Assistant");
    expect(arabicAssistant).toContain("المساعد التنظيمي");
  });

  it("keeps the canonical client files page wired to the upload form", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(client)/client/files/page.tsx"), "utf8");

    expect(source).toContain("DocumentUploadForm");
    expect(source).toContain("listPortalCases");
    expect(source).toContain("listPortalDocuments");
    expect(source).toContain("/api/files/");
  });

  it("uses scoped consultation booking surfaces without transcript persistence", () => {
    const publicPageSource = readFileSync(join(process.cwd(), "src/features/public-site/public-pages.tsx"), "utf8");
    const publicChatSource = readFileSync(join(process.cwd(), "src/features/public-site/consultation-booking-chat.tsx"), "utf8");
    const clientChatSource = readFileSync(join(process.cwd(), "src/features/client/client-assistant-panel.tsx"), "utf8");
    const teamChatSource = readFileSync(join(process.cwd(), "src/features/client/client-team-chat-panel.tsx"), "utf8");
    const brandLogoSource = readFileSync(join(process.cwd(), "src/components/brand/kmt-brand-logo.tsx"), "utf8");
    const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const publicContentEn = readFileSync(join(process.cwd(), "src/content/public-content.en.ts"), "utf8");
    const publicContentAr = readFileSync(join(process.cwd(), "src/content/public-content.ar.ts"), "utf8");
    const clientContent = readFileSync(join(process.cwd(), "src/content/client-content.ts"), "utf8");

    expect(publicPageSource).toContain("ConsultationBookingChat");
    expect(publicPageSource).not.toContain("BookingStepperFromQuery");
    expect(publicPageSource).toContain("getPublicConsultationBookingMode");
    expect(publicPageSource).not.toContain("<ConsultationAssistantPanel");
    expect(publicChatSource).toContain("content.bookingChat");
    expect(publicChatSource).toContain('data-testid="booking-chat-shell"');
    expect(publicChatSource).toContain('data-testid="booking-chat-log"');
    expect(publicChatSource).toContain("overscroll-contain");
    expect(publicChatSource).toContain("SlotChoicePanel");
    expect(publicChatSource).toContain("booking-slot-choice-panel");
    expect(publicChatSource).toContain("booking-language-choice");
    expect(publicChatSource).toContain("setChatLocale");
    expect(publicChatSource).toContain("activeLocale");
    expect(publicChatSource).toContain("logScrollRef");
    expect(publicChatSource).toContain("kmt-chat-scrollbar");
    expect(publicChatSource).not.toContain("scrollIntoView");
    expect(globalStyles).toContain(".kmt-chat-scrollbar::-webkit-scrollbar-track");
    expect(globalStyles).toContain("scrollbar-color: rgb(199 154 82 / 72%) transparent");
    expect(globalStyles).toContain(".kmt-chat-scrollbar::-webkit-scrollbar-button");
    expect(publicChatSource).toContain("KmtBrandLogo");
    expect(publicChatSource).not.toContain("booking-chat-step-card");
    expect(publicChatSource).not.toContain('name="fullName"');
    expect(publicChatSource).not.toContain('name="phone"');
    expect(publicChatSource).not.toContain('textarea[name="summary"]');
    expect(publicChatSource).not.toContain('type="datetime-local"');
    expect(publicChatSource).not.toContain('name="balance"');
    expect(publicChatSource).not.toContain("const chatCopy");
    expect(publicContentEn).toContain("bookingChat");
    expect(publicContentEn).toContain("languagePrompt");
    expect(publicContentEn).toContain("languagePendingPlaceholder");
    expect(publicContentEn).toContain("I cannot provide a legal opinion");
    expect(publicContentAr).toContain("bookingChat");
    expect(publicContentAr).toContain("languagePrompt");
    expect(publicContentAr).toContain("languagePendingPlaceholder");
    expect(publicContentAr).toContain("لا أستطيع تقديم رأي قانوني");
    expect(clientContent).toContain("KMT Client Assistant");
    expect(clientChatSource).toContain("KmtBrandLogo");
    expect(teamChatSource).toContain("KmtBrandLogo");
    expect(brandLogoSource).toContain("/brand/kmt-logo-mark.webp");
    expect(brandLogoSource).toContain("/brand/kmt-logo-full.webp");
    expect(clientContent).toContain("لا أقدم رأيًا قانونيًا");
    expect(`${publicChatSource}\n${clientChatSource}\n${teamChatSource}`).not.toContain("localStorage");
    expect(`${clientChatSource}\n${teamChatSource}`).not.toContain("sessionStorage");
    // Public booking has a one-use language-navigation draft handoff, not a transcript store.
    expect(publicChatSource).toContain('sessionStorage.removeItem(languageTransferKey)');
    const transferStart = publicChatSource.indexOf('const raw = JSON.stringify({');
    const transferEnd = publicChatSource.indexOf('} catch', transferStart);
    const transfer = publicChatSource.slice(transferStart, transferEnd);
    expect(transfer).toContain('draft, flow, selectedSlot, result: latestResult');
    expect(transfer).not.toContain("messages");
    expect(transfer).not.toContain("paymentReview");
    expect(transfer).not.toContain("readyToConfirm");
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
    const source = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/content/page.tsx"), "utf8");

    expect(source).not.toContain('["articles", "Articles"]');
    expect(source).not.toContain('["case-studies", "Case Studies"]');
    expect(source).not.toContain('["social", "Social Posts"]');
    expect(source).not.toContain('["pending", "Pending Approval"]');
    expect(source).not.toContain("AI Draft Panel");
    expect(source).not.toContain("Media/Social");
    expect(source).not.toContain("read-only");
  });

  it("keeps admin consultation AI summaries useful for old public chat bookings", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/consultations/[consultationId]/page.tsx"), "utf8");

    expect(source).toContain("adminConsultationOfficeBrief");
    expect(source).toContain("genericBookingSummaryPatterns");
    expect(source).toContain("ملخص AI للفريق");
    expect(source).toContain("تعيين محامي مناسب");
    expect(source).not.toContain("{consultation.aiSummary ? <p");
  });

  it("keeps the finance submit form reference stable across async requests", () => {
    const source = readFileSync(join(process.cwd(), "src/features/admin/finance/finance-forms.tsx"), "utf8");

    expect(source).toContain("const form = event.currentTarget;");
    expect(source).toContain("paymentPayloadFromForm(form)");
    expect(source).toContain("form.reset()");
    expect(source).not.toContain("event.currentTarget.reset()");
  });

  it("keeps admin finance wired as the payment operations center", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/finance/page.tsx"), "utf8");

    expect(source).toContain("attemptQ");
    expect(source).toContain("attemptStatus");
    expect(source).toContain("attemptPage");
    expect(source).toContain("webhookQ");
    expect(source).toContain("webhookStatus");
    expect(source).toContain("webhookProvider");
    expect(source).toContain("webhookMoneyStatus");
    expect(source).toContain("webhookPage");
    expect(source).toContain("paymentOperationsPageSize = 20");
    expect(source).toContain("paymentIssueText");
    expect(source).toContain("WEBHOOK_PAYLOAD_HASH_MISMATCH");
    expect(source).toContain("المبلغ المطلوب من العميل");
    expect(source).toContain("المبلغ الواصل من الويب هوك");
    expect(source).toContain("مطابقة الأموال");
    expect(source).not.toContain("pageSize: 8");
    expect(source).not.toContain("attempts.slice(0, 8)");
    expect(source).not.toContain("webhookEvents.slice(0, 8)");
    expect(source).toContain("WebhookReplayButton");
  });

  it("keeps public payment return text localized through content files", () => {
    const returnPageSource = readFileSync(join(process.cwd(), "src/app/(public-ar)/payment/consultation/return/page.tsx"), "utf8");
    const publicContentEn = readFileSync(join(process.cwd(), "src/content/public-content.en.ts"), "utf8");
    const publicContentAr = readFileSync(join(process.cwd(), "src/content/public-content.ar.ts"), "utf8");

    expect(returnPageSource).toContain("paymentReturnCopy.eyebrow");
    expect(returnPageSource).toContain("copy.statusTones");
    expect(returnPageSource).toContain("formatPaymentDate(result.appointment.startsAt, locale)");
    expect(returnPageSource).not.toContain("formatCairoDate");
    expect(publicContentEn).toContain("Payment confirmed");
    expect(publicContentEn).toContain("Payment link is incomplete");
    expect(publicContentAr).toContain("تم تأكيد الدفع");
    expect(publicContentAr).toContain("رابط الدفع غير مكتمل");
  });

  it("keeps the admin audit log page on client-friendly DTO fields", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/audit-log/page.tsx"), "utf8");

    expect(source).toContain("row.event.label");
    expect(source).toContain("row.summary");
    expect(source).toContain("TechnicalDetails");
    expect(source).not.toContain("JSON.stringify(metadata)");
    expect(source).not.toContain("shortMetadata");
  });

  it("keeps admin-user pages on the purpose-built safe DTO contract", () => {
    const listSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/users/page.tsx"), "utf8");
    const detailSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin/users/[userId]/page.tsx"), "utf8");
    const formSource = readFileSync(join(process.cwd(), "src/features/admin/governance/governance-forms.tsx"), "utf8");

    expect(listSource).toContain("row.counts.sessions");
    expect(detailSource).toContain("user.rolePermissionKeys");
    expect(detailSource).toContain("user.safeSessions");
    expect(detailSource).toContain("user.safeAuditRows");
    expect(formSource).toContain("updatedAt: user.updatedAt");
    expect(`${listSource}\n${detailSource}`).not.toContain("user.role.permissions");
    expect(`${listSource}\n${detailSource}`).not.toContain("user._count");
  });
});
