import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardShell } from "@/components/layout";
import { Badge, Button, DataTable, Select, StateBlock, TextInput } from "@/components/ui";

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
    expect(html).toContain("pe-10");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("aria-hidden=\"true\"");
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
      <DataTable columns={[{ key: "name", header: "الاسم", render: (row: { id: string; name: string }) => row.name }]} rows={[]} />
    );

    expect(html).toContain("لا توجد بيانات");
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
          { label: "لوحة التحكم", href: "/product-system", icon: "dashboard", active: true },
          { label: "العملاء", href: "/product-system/clients", icon: "groups" },
          { label: "القضايا", href: "/product-system/cases", icon: "folder_open" }
        ]}
        title="نظام واجهة KMT Legal"
        userLabel="سارة - مدير المكتب"
      >
        <div>content</div>
      </DashboardShell>
    );

    expect(html).toContain("href=\"/product-system/clients\"");
    expect(html).toContain("href=\"/product-system/cases\"");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("action=\"/api/auth/logout\"");
    expect(html).toContain("تسجيل الخروج");
  });
});
