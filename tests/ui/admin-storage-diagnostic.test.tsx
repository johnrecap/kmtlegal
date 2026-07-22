import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StorageRuntimeDiagnosticPanel } from "@/features/admin/governance/governance-forms";
import { plan35StorageDiagnosticUiCopy } from "@/lib/ui-copy";
import type { StorageRuntimeDiagnostic } from "@/server/storage/runtime-diagnostic";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() })
}));

const diagnostic = {
  source: "environment",
  status: "configured",
  driver: "vps-filesystem",
  maxUploadMb: 5,
  allowedTypes: ["application/pdf", "image/png"],
  uploadsPathConfigured: true,
  rootStatus: "valid-writable",
  scannerMode: "required",
  scannerStatus: "reachable",
  checkedAt: "2026-07-22T10:00:00.000Z",
  editable: false
} satisfies StorageRuntimeDiagnostic;

describe("admin storage runtime diagnostic", () => {
  it("renders an Arabic read-only readiness summary without an editable path or save action", () => {
    const html = renderToStaticMarkup(<StorageRuntimeDiagnosticPanel diagnostic={diagnostic} />);

    expect(html).toContain(plan35StorageDiagnosticUiCopy.configured);
    expect(html).toContain(plan35StorageDiagnosticUiCopy.readOnly);
    expect(html).toContain(plan35StorageDiagnosticUiCopy.rootStatuses["valid-writable"]);
    expect(html).toContain(plan35StorageDiagnosticUiCopy.scannerStatuses.reachable);
    expect(html).not.toContain("UPLOADS_DIR");
    expect(html).not.toContain("storage.policy");
    expect(html).not.toContain("مسار التخزين الخاص");
    expect(html).not.toContain("type=\"submit\"");
  });

  it("shows actionable degraded and unavailable recovery without exposing implementation details", () => {
    const degraded = renderToStaticMarkup(
      <StorageRuntimeDiagnosticPanel
        diagnostic={{ ...diagnostic, status: "degraded", scannerMode: "optional-disabled", scannerStatus: "disabled" }}
      />
    );
    const unavailable = renderToStaticMarkup(
      <StorageRuntimeDiagnosticPanel
        diagnostic={{ ...diagnostic, status: "unavailable", rootStatus: "unwritable", scannerStatus: "unreachable" }}
      />
    );

    expect(degraded).toContain(plan35StorageDiagnosticUiCopy.remediation.degraded);
    expect(unavailable).toContain(plan35StorageDiagnosticUiCopy.remediation.unavailable);
    expect(`${degraded}${unavailable}`).not.toMatch(/secret|private database|stack|exception/i);
  });
});
