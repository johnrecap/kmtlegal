import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  MANUAL_CASE_PARTY_TYPES,
  ManualCaseCreateForm,
  ManualCaseEditForm
} from "@/features/admin/cases/manual-case-form";
import { plan35ApiErrorCopy, plan35ManualCaseUiCopy } from "@/lib/ui-copy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

const clients = [
  { id: "72000000-0000-4000-8000-000000000001", fullName: "عميل نشط", phone: "+201000000000" }
];
const lawyers = [
  { id: "71000000-0000-4000-8000-000000000002", name: "المحامي المسؤول" },
  { id: "71000000-0000-4000-8000-000000000003", name: "محامٍ آخر" }
];
const requestToken = "73000000-0000-4000-8000-000000000001";

describe("admin manual case form UI", () => {
  it("renders unique labelled controls, Arabic validation copy, and canonical party choices", () => {
    const html = renderToStaticMarkup(
      <ManualCaseCreateForm
        clients={clients}
        initialRequestToken={requestToken}
        lawyers={lawyers}
      />
    );
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const labels = [...html.matchAll(/<label[^>]+for="([^"]+)"/g)].map((match) => match[1]);

    expect(new Set(ids).size).toBe(ids.length);
    expect(labels.every((id) => ids.includes(id))).toBe(true);
    expect(html).toContain("إنشاء قضية يدوية");
    expect(html).toContain("البحث عن العميل");
    expect(html).toContain('dir="ltr"');
    for (const partyType of MANUAL_CASE_PARTY_TYPES) {
      expect(html).toContain(`value="${partyType}"`);
    }
    expect(plan35ManualCaseUiCopy.validation.required).toMatch(/[\u0600-\u06FF]/);
    expect(html).not.toContain("case.create.any");
  });

  it("keeps submit, success, conflict, and explicit new-token retry states recoverable", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/cases/manual-case-form.tsx"),
      "utf8"
    );

    expect(source).toContain("loading={isBusy}");
    expect(source).toContain("replayed");
    expect(source).toContain("CASE_REFERENCE_CONFLICT");
    expect(source).toContain("crypto.randomUUID()");
    expect(source).toContain("submitCreate(lastPayload, nextToken)");
    expect(source).toContain('aria-live="polite"');
    expect(plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.preservesEnteredValues).toBe(true);
    expect(plan35ManualCaseUiCopy.feedback.creating).toMatch(/[\u0600-\u06FF]/);
    expect(plan35ManualCaseUiCopy.feedback.created).toMatch(/[\u0600-\u06FF]/);
  });

  it("uses native keyboard form controls and hides reassignment from assigned-only editors", () => {
    const html = renderToStaticMarkup(
      <ManualCaseEditForm
        canTransfer={false}
        caseRecord={{
          id: requestToken,
          assignedLawyerId: lawyers[0].id,
          assignedLawyerName: lawyers[0].name,
          title: "نزاع عقد توريد",
          caseType: "تجاري",
          courtName: "محكمة القاهرة الاقتصادية",
          externalCaseNumber: "2026/35",
          priority: "HIGH",
          summary: "ملخص القضية",
          updatedAt: "2026-07-22T10:00:00.000Z"
        }}
        lawyers={lawyers}
      />
    );
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/cases/manual-case-form.tsx"),
      "utf8"
    );

    expect(html).toContain("تعديل البيانات الأساسية");
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('name="assignedLawyerId"');
    expect(source).toContain('method: "PATCH"');
    expect(source).toContain("disabled={isBusy}");
  });
});
