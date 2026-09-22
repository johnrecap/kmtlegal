// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientActionPanel } from "@/features/admin/clients/client-crm-forms";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

describe("FIX11 client action authority", () => {
  it("renders portal-account management without exposing CRM update, assignment, or archive actions", () => {
    Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
    const { queryByText, getByText } = render(
      <ClientActionPanel
        canManage={false}
        canManageAccount
        client={{
          id: "11111111-1111-4111-8111-111111111111",
          fullName: "عميل اختبار",
          phone: "+201000000000",
          status: "ACTIVE",
          assignedLawyerId: null,
          user: null
        }}
        lawyers={[]}
      />
    );

    expect(getByText("حساب بوابة العميل")).toBeTruthy();
    expect(queryByText("تعديل بيانات العميل")).toBeNull();
    expect(queryByText("تعيين المحامي")).toBeNull();
    expect(queryByText("أرشفة العميل")).toBeNull();
  });
});
