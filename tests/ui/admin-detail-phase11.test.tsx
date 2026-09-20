// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useInvalidFieldAccordion } from "@/components/admin/use-invalid-field-accordion";

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), ...relativePath.split("/")), "utf8");
}

const detailFiles = [
  "src/app/(app-ar)/admin/cases/[caseId]/page.tsx",
  "src/app/(app-ar)/admin/calendar/page.tsx",
  "src/app/(app-ar)/admin/tasks/page.tsx",
  "src/app/(app-ar)/admin/documents/page.tsx",
  "src/app/(app-ar)/admin/content/page.tsx",
  "src/app/(app-ar)/admin/settings/page.tsx",
  "src/app/(app-ar)/admin/audit-log/page.tsx",
  "src/features/admin/task-documents/task-document-forms.tsx",
  "src/features/admin/cases/case-action-forms.tsx",
  "src/features/admin/cases/manual-case-form.tsx",
  "src/features/admin/clients/client-crm-forms.tsx",
  "src/features/admin/consultations/consultation-action-panel.tsx",
  "src/features/admin/consultations/consultation-availability-form.tsx",
  "src/features/admin/contact-messages/contact-message-inbox.tsx"
] as const;

describe("Phase 11 admin detail/form migration contracts", () => {
  it("leaves zero native details/summary on migrated detail/form surfaces", () => {
    for (const file of detailFiles) {
      const source = read(file);
      expect(source).not.toContain("<details");
      expect(source).not.toContain("<summary");
    }
  });

  it("gates every migrated destructive action behind an AdminDialog confirmation", () => {
    const taskDocs = read("src/features/admin/task-documents/task-document-forms.tsx");
    expect(taskDocs).toContain("AdminDialog");
    expect(taskDocs).toContain('variant="destructive"');
    expect(taskDocs).toContain("requestSubmit");

    const clients = read("src/features/admin/clients/client-crm-forms.tsx");
    expect(clients).toContain("AdminDialog");
    expect(clients).toContain("تأكيد أرشفة العميل");
    expect(clients).toContain("تأكيد تحديث كلمة المرور");

    const panel = read("src/features/admin/consultations/consultation-action-panel.tsx");
    expect(panel).toContain("تأكيد تحويل الطلب إلى قضية");
    expect(panel).toContain("تأكيد رفض الطلب");

    const users = read("src/features/admin/governance/governance-forms.tsx");
    expect(users).toContain("تأكيد حذف المستخدم");
    expect(users).toContain("تأكيد تغيير كلمة المرور");

    const inbox = read("src/features/admin/contact-messages/contact-message-inbox.tsx");
    expect(inbox).toContain("تأكيد أرشفة الرسالة");
  });

  it("uses StatefulButton for genuine async form submits with preserved feedback", () => {
    const submitters = [
      "src/features/admin/task-documents/task-document-forms.tsx",
      "src/features/admin/cases/case-action-forms.tsx",
      "src/features/admin/cases/manual-case-form.tsx",
      "src/features/admin/clients/client-crm-forms.tsx",
      "src/features/admin/consultations/consultation-action-panel.tsx",
      "src/features/admin/consultations/consultation-schedule-form.tsx",
      "src/features/admin/consultations/consultation-outcome-form.tsx",
      "src/features/admin/consultations/consultation-reopen-form.tsx",
      "src/features/admin/consultations/consultation-availability-form.tsx",
      "src/features/admin/governance/governance-forms.tsx",
      "src/features/admin/governance/role-permission-form.tsx",
      "src/features/admin/content/content-forms.tsx",
      "src/features/admin/finance/finance-forms.tsx"
    ] as const;
    for (const file of submitters) {
      const source = read(file);
      expect(source).toContain("StatefulButton");
      expect(source).toContain("aria-busy");
    }
  });

  it("consumes the single owner-approved File Upload file for admin document intake", () => {
    const taskDocs = read("src/features/admin/task-documents/task-document-forms.tsx");
    expect(taskDocs).toContain('from "@/components/ui/file-upload"');
    expect(taskDocs).not.toContain("react-dropzone");
  });

  it("opens the accordion group holding the first invalid field on submit", () => {
    // The hook contract: any native `invalid` event inside a
    // `[data-form-group]` opens that group. (Radix unmounts closed panel
    // content, so the group-state transition — not Radix internals — is
    // what's unit-tested here; end-to-end open states are browser-covered.)
    function Harness() {
      const groups = useInvalidFieldAccordion({ type: "single" });
      return (
        <form onInvalidCapture={groups.onInvalidCapture}>
          <div data-form-group="details-group" data-open={groups.value === "details-group" ? "yes" : "no"}>
            <input aria-label="Required field" required />
          </div>
        </form>
      );
    }

    const { container } = render(<Harness />);
    const input = container.querySelector('input[aria-label="Required field"]');
    if (!input) throw new Error("harness input missing");
    const group = input.closest("[data-form-group]");
    expect(group?.getAttribute("data-open")).toBe("no");
    fireEvent.invalid(input);
    expect(group?.getAttribute("data-open")).toBe("yes");
  });
});
