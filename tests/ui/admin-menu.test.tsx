import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminRowActions } from "@/components/admin/admin-menu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

const entries = [
  {
    kind: "action" as const,
    action: { key: "view", label: "عرض", href: "/admin/cases/1" }
  },
  { kind: "separator" as const, key: "sep-1" },
  {
    kind: "action" as const,
    action: { key: "edit", label: "تعديل", onSelect: () => undefined, shortcut: "E" }
  },
  {
    kind: "action" as const,
    action: { key: "delete", label: "حذف", onSelect: () => undefined, destructive: true }
  }
];

describe("admin row-action Menu contract", () => {
  it("renders only the labelled trigger while closed (panel is lazy)", () => {
    const html = renderToStaticMarkup(
      <AdminRowActions entries={entries} label="إجراءات الصف" />
    );

    expect(html).toContain('aria-label="إجراءات الصف"');
    expect(html).not.toContain("عرض");
    expect(html).not.toContain("حذف");
  });

  it("keeps the panel lazy and the locked Menu wiring in source", () => {
    // Base UI v1.8 mounts popups only after open (verified by probe:
    // even defaultOpen renders closed in SSR static markup), so panel
    // content is covered by browser keyboard QA + captures, not SSR.
    const openHtml = renderToStaticMarkup(
      <AdminRowActions defaultOpen entries={entries} label="إجراءات الصف" />
    );
    expect(openHtml).toContain('aria-label="إجراءات الصف"');

    const source = readFileSync(
      join(process.cwd(), "src/components/admin/admin-menu.tsx"),
      "utf8"
    );

    expect(source).toContain("components/base/menu");
    expect(source).toContain("MenuPanel");
    expect(source).toContain("MenuItem");
    expect(source).toContain("MenuSeparator");
    expect(source).toContain("MenuShortcut");
    expect(source).toContain('"destructive"');
    expect(source).toContain("router.push");
    expect(source).toContain("variant={");
  });
});
