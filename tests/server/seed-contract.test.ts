import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const seedPath = path.join(process.cwd(), "prisma", "seed.mjs");
const policyPath = path.join(process.cwd(), "src", "server", "auth", "policy-data.json");
const plan35MigrationPath = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260722120000_plan_35_admin_operations",
  "migration.sql"
);

describe("database seed contract", () => {
  it("uses rerunnable write patterns for demo records", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("prisma.role.upsert");
    expect(source).toContain("prisma.permission.upsert");
    expect(source).toContain("prisma.user.upsert");
    expect(source).toContain("findOrCreate(");
    expect(source.match(/\.upsert\(/g)?.length ?? 0).toBeGreaterThanOrEqual(10);
  });

  it("keeps seed data fake and readable in Arabic", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("@kmt.local");
    expect(source).toContain("محكمة القاهرة الاقتصادية");
    expect(source).toContain("استشارات حسب المجال");
    expect(source).toContain("المطالبات المالية والتسويات");
    expect(source).not.toContain("ظ…");
    expect(source).not.toContain("ط§ظ");
  });
  it("keeps production bootstrap separate from local demo data", () => {
    const source = fs.readFileSync(seedPath, "utf8");

    expect(source).toContain("Production seed must not receive demo credentials.");
    expect(source).toContain("Production bootstrap completed");
    expect(source).toContain("if (isProduction)");
    expect(source).toContain("ensureSeedDocumentFile");
    expect(source).toContain('path.join(root, "_workspace", "uploads")');
  });

  it("catalogs case creation and own-notification defaults for the intended staff roles", () => {
    const policy = JSON.parse(fs.readFileSync(policyPath, "utf8")) as {
      permissions: string[];
      rolePermissions: Record<string, string[]>;
    };

    expect(policy.permissions.filter((key) => key === "case.create.any")).toHaveLength(1);
    expect(policy.rolePermissions.Secretary).toContain("case.create.any");
    expect(policy.rolePermissions["Office Admin"]).toContain("case.create.any");
    expect(policy.rolePermissions.Lawyer).not.toContain("case.create.any");
    for (const role of ["Lawyer", "Secretary", "Office Admin", "Marketing Staff"]) {
      expect(policy.rolePermissions[role], `${role} needs own notifications`).toContain("notification.read.self");
    }
  });

  it("snapshots existing assignments before PLAN-35 grants and marks only an initialized database", () => {
    const migration = fs.readFileSync(plan35MigrationPath, "utf8");
    const snapshotIndex = migration.indexOf('SELECT 1 FROM "role_permissions"');
    const grantIndex = migration.indexOf('INSERT INTO "role_permissions"');
    const markerIndex = migration.indexOf('auth.rbac_assignments_bootstrap');

    expect(snapshotIndex).toBeGreaterThan(-1);
    expect(grantIndex).toBeGreaterThan(snapshotIndex);
    expect(markerIndex).toBeGreaterThan(grantIndex);
    expect(migration).toMatch(/IF had_existing_assignments THEN[\s\S]+auth\.rbac_assignments_bootstrap/);
    expect(migration).toContain("ON CONFLICT (\"roleId\", \"permissionId\") DO NOTHING");
  });

  it("installs defaults only before the durable RBAC bootstrap marker exists", () => {
    const source = fs.readFileSync(seedPath, "utf8");
    const markerLookup = source.indexOf("RBAC_ASSIGNMENTS_BOOTSTRAP_KEY");
    const conditional = source.indexOf("if (shouldInstallDefaultAssignments)");
    const assignmentWrite = source.indexOf("prisma.rolePermission.upsert", conditional);
    const markerWrite = source.indexOf("prisma.systemSetting.upsert", conditional);

    expect(markerLookup).toBeGreaterThan(-1);
    expect(conditional).toBeGreaterThan(markerLookup);
    expect(assignmentWrite).toBeGreaterThan(conditional);
    expect(markerWrite).toBeGreaterThan(assignmentWrite);
    expect(source).toContain("const shouldInstallDefaultAssignments = !bootstrapMarker");
  });

  it("does not restore removed assignments or reactivate roles on a marked repeat seed", () => {
    const source = fs.readFileSync(seedPath, "utf8");
    const roleUpdater = source.match(/async function upsertRole[\s\S]+?\n}/)?.[0] ?? "";
    const conditionalStart = source.indexOf("if (shouldInstallDefaultAssignments)");
    const conditionalEnd = source.indexOf("return roleRows", conditionalStart);
    const assignmentWrites = [...source.matchAll(/prisma\.rolePermission\.upsert/g)].map((match) => match.index ?? -1);

    expect(roleUpdater).not.toMatch(/update:\s*\{[^}]*status:\s*"ACTIVE"/);
    expect(assignmentWrites.length).toBeGreaterThan(0);
    expect(assignmentWrites.every((index) => index > conditionalStart && index < conditionalEnd)).toBe(true);
  });
});
