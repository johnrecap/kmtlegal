import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  DocumentActionForm,
  DocumentDeleteForm,
  TaskUpdateForm
} from "@/features/admin/task-documents/task-document-forms";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

const convergenceFormFiles = [
  "src/features/admin/task-documents/task-document-forms.tsx",
  "src/features/admin/cases/case-action-forms.tsx",
  "src/features/admin/clients/client-crm-forms.tsx",
  "src/features/admin/consultations/consultation-action-panel.tsx",
  "src/features/admin/consultations/consultation-availability-form.tsx",
  "src/features/admin/consultations/consultation-outcome-form.tsx",
  "src/features/admin/consultations/consultation-reopen-form.tsx",
  "src/features/admin/content/content-forms.tsx",
  "src/features/admin/finance/finance-forms.tsx",
  "src/features/admin/governance/governance-forms.tsx"
] as const;

const tableFiles = [
  "src/app/(app-ar)/admin/audit-log/page.tsx",
  "src/app/(app-ar)/admin/cases/page.tsx",
  "src/app/(app-ar)/admin/clients/page.tsx",
  "src/app/(app-ar)/admin/consultations/page.tsx",
  "src/app/(app-ar)/admin/content/page.tsx",
  "src/app/(app-ar)/admin/documents/page.tsx",
  "src/app/(app-ar)/admin/finance/page.tsx",
  "src/app/(app-ar)/admin/messages/page.tsx",
  "src/app/(app-ar)/admin/reports/page.tsx",
  "src/app/(app-ar)/admin/users/[userId]/page.tsx",
  "src/app/(app-ar)/admin/users/page.tsx",
  "src/app/(app-ar)/product-system/_components/product-system-demo.tsx",
  "src/features/admin/contact-messages/contact-message-inbox.tsx"
] as const;

const filterFiles = [
  "src/app/(app-ar)/admin/audit-log/page.tsx",
  "src/app/(app-ar)/admin/calendar/page.tsx",
  "src/app/(app-ar)/admin/cases/page.tsx",
  "src/app/(app-ar)/admin/clients/page.tsx",
  "src/app/(app-ar)/admin/consultations/page.tsx",
  "src/app/(app-ar)/admin/content/page.tsx",
  "src/app/(app-ar)/admin/documents/page.tsx",
  "src/app/(app-ar)/admin/finance/page.tsx",
  "src/app/(app-ar)/admin/messages/page.tsx",
  "src/app/(app-ar)/admin/reports/page.tsx",
  "src/app/(app-ar)/admin/tasks/page.tsx",
  "src/app/(app-ar)/admin/users/page.tsx",
  "src/app/(app-ar)/product-system/_components/product-system-demo.tsx",
  "src/features/admin/contact-messages/contact-message-inbox.tsx"
] as const;

const searchFiles = filterFiles.filter((file) => !file.endsWith("/calendar/page.tsx") && !file.endsWith("/reports/page.tsx"));

describe("PLAN-35 admin UI/RTL convergence", () => {
  it("renders repeated task and document forms with deterministic unique control IDs", () => {
    const assignees = [{ id: "staff-1", name: "سارة" }];
    const cases = [{ id: "case-1", internalFileNumber: "KMT-1", title: "قضية تجريبية" }];
    const html = renderToStaticMarkup(
      <>
        <TaskUpdateForm assignees={assignees} cases={cases} task={{ id: "task-a", title: "مهمة أولى" }} />
        <TaskUpdateForm assignees={assignees} cases={cases} task={{ id: "task-b", title: "مهمة ثانية" }} />
        <DocumentActionForm canManage document={{ id: "doc-a", status: "NEW", category: "OTHER", visibility: "STAFF_ONLY" }} />
        <DocumentActionForm canManage document={{ id: "doc-b", status: "NEW", category: "OTHER", visibility: "STAFF_ONLY" }} />
        <DocumentDeleteForm canManage documentId="doc-a" />
        <DocumentDeleteForm canManage documentId="doc-b" />
      </>
    );
    const controlTags = Array.from(html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g), (match) => match[0]);
    const ids = controlTags.map((tag) => tag.match(/\bid="([^"]+)"/)?.[1]);

    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(html).toContain('id="task-update-task-a-title"');
    expect(html).toContain('id="document-action-doc-a-status"');
    expect(html).toContain('id="document-delete-doc-a-reason"');
    expect(html).toContain('id="document-delete-doc-a-confirmDelete"');
    expect(html.match(/name="title"/g)).toHaveLength(2);
    expect(html.match(/name="status"/g)).toHaveLength(4);
  });

  it("adopts prefixed field relationships and semantic feedback in every migrated form file", () => {
    for (const file of convergenceFormFiles) {
      const source = sourceOf(file);
      const fieldCount = occurrences(source, /<(?:TextInput|Textarea|Select)\b/g);
      const prefixCount = occurrences(source, /\bidPrefix=/g);
      const unprefixedFields = source.match(/<(?:TextInput|Textarea|Select)\b(?![^>]*\bidPrefix=)[^>]*>/g) ?? [];

      expect(fieldCount, file).toBeGreaterThan(0);
      expect(prefixCount, file).toBeGreaterThanOrEqual(fieldCount);
      expect(unprefixedFields, file).toEqual([]);
      expect(source, file).toContain("InlineFeedback");
      expect(source, file).not.toMatch(/\b(?:bg|border|text)-(?:red|blue|amber|green|emerald)-\d{2,3}\b/);
      expect(source, file).not.toContain("function StatusMessage");
      expect(source, file).not.toContain("function FormMessage");
    }
  });

  it("names every migrated table and keeps an explicit mobile record alternative", () => {
    for (const file of tableFiles) {
      const source = sourceOf(file);
      const tableCount = occurrences(source, /<DataTable\b/g);

      expect(tableCount, file).toBeGreaterThan(0);
      expect(occurrences(source, /\bcaption=/g), file).toBe(tableCount);
      expect(occurrences(source, /\bmobileRender=/g), file).toBe(tableCount);
    }
  });

  it("gives every migrated filter and search landmark a purpose-specific Arabic name", () => {
    for (const file of filterFiles) {
      const source = sourceOf(file);
      const filters = source.match(/<FilterBar\b[^>]*>/g) ?? [];
      expect(filters.length, file).toBeGreaterThan(0);
      expect(filters.every((tag) => tag.includes("ariaLabel=")), file).toBe(true);
    }

    for (const file of searchFiles) {
      const source = sourceOf(file);
      const searches = source.match(/<SearchInput\b[^>]*>/g) ?? [];
      expect(searches.length, file).toBeGreaterThan(0);
      expect(searches.every((tag) => tag.includes("ariaLabel=")), file).toBe(true);
    }
  });
});

function sourceOf(relativePath: string) {
  return readFileSync(join(process.cwd(), ...relativePath.split("/")), "utf8");
}

function occurrences(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}
