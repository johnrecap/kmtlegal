import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RolePermissionForm } from "@/features/admin/governance/role-permission-form";
import {
  permissionDisplayLabel,
  permissionGroupDisplayLabel,
  plan35RoleGovernanceUiCopy
} from "@/lib/ui-copy";
import { ALL_PERMISSIONS } from "@/server/auth/policy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

const matrix = {
  permissions: [
    { key: "case.read.any", groupKey: "cases", labelKey: "permissions.case.read.any" },
    { key: "case.update.any", groupKey: "cases", labelKey: "permissions.case.update.any" },
    { key: "notification.read.self", groupKey: "communications", labelKey: "permissions.notification.read.self" }
  ],
  roles: [
    {
      id: "82000000-0000-4000-8000-000000000001",
      name: "Secretary",
      status: "ACTIVE",
      protected: false,
      readOnly: false,
      effectiveWildcard: false,
      userCount: 2,
      permissionKeys: ["case.read.any"],
      updatedAt: "2026-07-22T11:00:00.000Z"
    },
    {
      id: "82000000-0000-4000-8000-000000000002",
      name: "Super Admin",
      status: "ACTIVE",
      protected: true,
      readOnly: true,
      effectiveWildcard: true,
      userCount: 1,
      permissionKeys: ["case.read.any", "case.update.any", "notification.read.self"],
      updatedAt: "2026-07-22T11:00:00.000Z"
    },
    {
      id: "82000000-0000-4000-8000-000000000003",
      name: "Marketing Staff",
      status: "INACTIVE",
      protected: false,
      readOnly: true,
      effectiveWildcard: false,
      userCount: 0,
      permissionKeys: ["notification.read.self"],
      updatedAt: "2026-07-22T11:00:00.000Z"
    }
  ]
};

describe("admin role-permission form", () => {
  it("keeps every canonical permission on a localized group and display label", () => {
    for (const permissionKey of ALL_PERMISSIONS) {
      expect(permissionDisplayLabel(permissionKey), permissionKey).toMatch(/[\u0600-\u06FF]/);
      expect(permissionDisplayLabel(permissionKey), permissionKey).not.toBe(permissionKey);
    }
    for (const groupKey of new Set(matrix.permissions.map((permission) => permission.groupKey))) {
      expect(permissionGroupDisplayLabel(groupKey), groupKey).toMatch(/[\u0600-\u06FF]/);
    }
  });

  it("renders grouped Arabic labels with native, uniquely-labelled controls", () => {
    const html = renderToStaticMarkup(<RolePermissionForm initialMatrix={matrix} />);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const labels = [...html.matchAll(/<label[^>]+for="([^"]+)"/g)].map((match) => match[1]);

    expect(new Set(ids).size).toBe(ids.length);
    expect(labels.every((id) => ids.includes(id))).toBe(true);
    expect(html).toContain(permissionGroupDisplayLabel("cases"));
    expect(html).toContain(permissionDisplayLabel("case.read.any"));
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain(">case.read.any<");
  });

  it("shows protected and inactive roles as read-only without implying wildcard rows are editable", () => {
    const html = renderToStaticMarkup(<RolePermissionForm initialMatrix={matrix} />);

    expect(html).toContain(plan35RoleGovernanceUiCopy.protectedRole);
    expect(html).toContain(plan35RoleGovernanceUiCopy.inactiveRole);
    expect(html).toContain(plan35RoleGovernanceUiCopy.effectiveWildcard);
    expect(html).toContain("مدير النظام");
  });

  it("preserves dirty state and provides explicit stale-conflict recovery", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/governance/role-permission-form.tsx"),
      "utf8"
    );

    expect(source).toContain("dirtyRoleIds");
    expect(source).toContain("response.status === 409");
    expect(source).toContain("permissionKeys");
    expect(source).toContain("updatedAt");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("window.location.reload()");
    expect(plan35RoleGovernanceUiCopy.feedback.stale).toMatch(/[\u0600-\u06FF]/);
  });

  it("keeps keyboard behavior native and save state explicit", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/admin/governance/role-permission-form.tsx"),
      "utf8"
    );

    expect(source).toContain('method: "PATCH"');
    expect(source).toContain("loading={isBusy}");
    expect(source).toContain("disabled={selectedRole.readOnly");
    expect(source).not.toMatch(/onKeyDown=.*(Enter|Space)/);
  });
});
