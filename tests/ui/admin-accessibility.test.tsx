import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataTable, FilterBar, SearchInput, Select, Skeleton, StateBlock, Textarea, TextInput, Toast } from "@/components/ui";
import { kmtStateCssVariables, kmtTokens } from "@/lib/design-system/tokens";

describe("PLAN-35 shared admin accessibility contracts", () => {
  it("keeps repeated names stable while DOM relationships remain unique", () => {
    const html = renderToStaticMarkup(
      <>
        <TextInput hint="يظهر الرقم في ملف القضية." idPrefix="create-case" label="رقم المرجع" name="reference" />
        <TextInput error="رقم المرجع مطلوب." idPrefix="edit-case" label="رقم المرجع" name="reference" />
        <TextInput label="رقم آخر" name="reference" />
        <TextInput label="رقم أخير" name="reference" />
      </>
    );
    expect(inputIds(html).slice(0, 2)).toEqual(["create-case-reference", "edit-case-reference"]);
    expect(new Set(allIds(html)).size).toBe(allIds(html).length);
    expect(html.match(/name="reference"/g)).toHaveLength(4);
    expect(html).toContain('aria-describedby="create-case-reference-hint"');
    expect(html).toContain('aria-errormessage="edit-case-reference-error"');
  });

  it("applies explicit and prefixed IDs across controls and preserves caller ARIA references", () => {
    const html = renderToStaticMarkup(
      <>
        <TextInput aria-errormessage="external-input-error" id="explicit-reference" label="رقم المرجع" name="reference" />
        <Textarea aria-describedby="external-description" idPrefix="case-notes" label="ملخص القضية" name="summary" />
        <Select aria-errormessage="external-select-error" idPrefix="case-form" label="الأولوية" name="priority">
          <option value="NORMAL">عادية</option>
        </Select>
      </>
    );
    expect(html).toContain('id="explicit-reference"');
    expect(html).toContain('aria-errormessage="external-input-error"');
    expect(html).toContain('id="case-notes-summary"');
    expect(html).toContain('aria-describedby="external-description"');
    expect(html).toContain('id="case-form-priority"');
    expect(html).toContain('aria-errormessage="external-select-error"');
  });

  it("gives tables captions and column scopes, including empty state naming", () => {
    const columns = [{ key: "reference", header: "رقم المرجع", render: (row: { id: string; reference: string }) => row.reference }];
    const table = renderToStaticMarkup(<DataTable caption="القضايا النشطة" columns={columns} rows={[{ id: "1", reference: "KMT-35" }]} />);
    const empty = renderToStaticMarkup(<DataTable caption="القضايا النشطة" columns={columns} rows={[]} />);
    expect(table).toMatch(/<caption[^>]*>القضايا النشطة<\/caption>/);
    expect(table).toMatch(/<th[^>]*scope="col"/);
    expect(empty).toContain('role="status"');
    expect(empty).toContain("القضايا النشطة");
  });

  it("names filter and search regions distinctly", () => {
    const html = renderToStaticMarkup(
      <FilterBar ariaLabel="فلاتر القضايا">
        <SearchInput ariaLabel="البحث في القضايا" name="q" placeholder="ابحث برقم المرجع" />
      </FilterBar>
    );
    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="فلاتر القضايا"');
    expect(html).toContain('aria-label="البحث في القضايا"');
  });

  it("uses assertive alerts for errors and polite statuses otherwise", () => {
    const errorToast = renderToStaticMarkup(<Toast description="حاول مرة أخرى." title="تعذر الحفظ" tone="error" />);
    const successToast = renderToStaticMarkup(<Toast title="تم الحفظ" tone="success" />);
    const loading = renderToStaticMarkup(<StateBlock description="لحظات." title="جارٍ التحميل" tone="loading" />);
    expect(errorToast).toContain('role="alert"');
    expect(errorToast).toContain('aria-live="assertive"');
    expect(successToast).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
  });

  it("projects state colors from one token source without raw feedback utilities", () => {
    const feedback = ["badge.tsx", "button.tsx", "state.tsx", "toast.tsx", "inline-feedback.tsx"]
      .map((file) => readFileSync(join(process.cwd(), "src", "components", "ui", file), "utf8"))
      .join("\n");
    const tailwind = readFileSync(join(process.cwd(), "tailwind.config.ts"), "utf8");
    const globals = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    expect(feedback).not.toMatch(/\b(?:bg|border|text)-(?:red|amber|green|blue)-\d{2,3}\b/);
    expect(feedback).not.toMatch(/#[\da-f]{6}/i);
    expect(kmtStateCssVariables["--kmt-state-info"]).toBe(kmtTokens.state.info.foreground);
    expect(kmtStateCssVariables["--kmt-state-success-surface"]).toBe(kmtTokens.state.success.surface);
    expect(kmtStateCssVariables["--kmt-state-danger-strong"]).toBe(kmtTokens.state.danger.strong);
    expect(tailwind).toContain("kmtStateCssVariables");
    expect(globals).not.toMatch(/--kmt-state-(?:info|success|warning|danger)\s*:/);
  });

  it("announces loading skeletons and respects reduced motion", () => {
    const html = renderToStaticMarkup(<Skeleton label="جارٍ تحميل القضايا" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("جارٍ تحميل القضايا");
    expect(html).toContain("motion-safe:animate-pulse");
  });
});

function inputIds(html: string) {
  return Array.from(html.matchAll(/<input[^>]*\sid="([^"]+)"/g), (match) => match[1]);
}

function allIds(html: string) {
  return Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
}
