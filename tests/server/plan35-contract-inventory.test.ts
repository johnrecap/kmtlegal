import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import policyData from "@/server/auth/policy-data.json";
import { ADMIN_ROUTE_POLICIES } from "@/lib/admin-route-policy";
import {
  PLAN35_AUDIT_ACTIONS,
  auditActionOptionLabel,
  plan35AuditMetadataForStorage,
  plan35SafeAuditMetadata
} from "@/server/audit/audit-event-catalog";
import { canonicalApiErrorCode } from "@/server/http/errors";

const featureRoot = path.join(process.cwd(), "specs", "kmt-legal-platform", "plan-35-admin-operations-remediation");
const contractPath = path.join(featureRoot, "contracts", "admin-operations-contract.md");
const platformOpenApiPath = path.join(process.cwd(), "specs", "kmt-legal-platform", "contracts", "openapi-plan.md");

type AffectedRoute = { method: string; apiPath: string; planned: boolean; authorization: string };
type ContractRoute = {
  id: string;
  href: string;
  planned: boolean;
  requiredAnyPermissions: string[];
  requiredAllPermissions: string[];
  exactRole?: string;
  staffFallback: boolean;
};
type PlatformOperation = AffectedRoute & { stableErrors: string[]; consumerHref: string };

function section(source: string, startHeading: string, endHeading: string) {
  const start = source.indexOf(startHeading);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (start < 0 || end < 0) throw new Error(`Could not parse ${startHeading}`);
  return source.slice(start, end);
}

function cells(line: string) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

function tokens(value: string) {
  return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function isPermission(value: string) {
  return /^[a-z][A-Za-z]*\.[a-z][A-Za-z]*\.[a-z][A-Za-z]*$/.test(value);
}

function parseAffectedRoutes(source: string): AffectedRoute[] {
  return section(source, "## Affected route inventory", "## GET `/api/admin/dashboard`")
    .split(/\r?\n/)
    .flatMap((line) => {
      const row = cells(line);
      const operation = row[0]?.match(/^`(GET|POST|PATCH|PUT|DELETE) ([^`]+)`$/);
      return operation && row.length === 4
        ? [{ method: operation[1], apiPath: operation[2], planned: row[1].includes("Planned"), authorization: row[3] }]
        : [];
    });
}

function parseAdminRoutes(source: string): ContractRoute[] {
  return section(source, "## Canonical admin route policy", "### Protected child-route inventory")
    .split(/\r?\n/)
    .flatMap((line) => {
      const row = cells(line);
      const [id] = tokens(row[0] ?? "");
      const [href] = tokens(row[1] ?? "");
      if (!id || !href || row.length !== 4) return [];
      let permissions = tokens(row[2]).filter(isPermission);
      if (id === "content.home") {
        permissions = policyData.permissions.filter((key) => /^(content|caseStudy|socialDraft)\.(create|approve)\.any$/.test(key));
      }
      const requiresAll = id === "roles.list";
      return [{
        id,
        href,
        planned: row[3].includes("Planned"),
        requiredAnyPermissions: requiresAll ? [] : permissions,
        requiredAllPermissions: requiresAll ? permissions : [],
        exactRole: requiresAll ? "Super Admin" : undefined,
        staffFallback: id === "dashboard.home"
      }];
    });
}

function parsePlatformOperations(source: string): PlatformOperation[] {
  return section(source, "## PLAN-35 Admin Operations Matrix", "## Request and Response Rules")
    .split(/\r?\n/)
    .flatMap((line) => {
      const row = cells(line);
      const method = row[0]?.match(/^`(GET|POST|PATCH|PUT|DELETE)`$/)?.[1];
      const [apiPath] = tokens(row[1] ?? "");
      const [consumerHref] = tokens(row[5] ?? "");
      if (!method || !apiPath || !consumerHref || row.length !== 6) return [];
      return [{
        method,
        apiPath,
        planned: false,
        authorization: row[3],
        stableErrors: tokens(row[4] ?? "").filter((token) => /^[A-Z][A-Z0-9_]+$/.test(token)),
        consumerHref
      }];
    });
}

function routeFile(apiPath: string) {
  const generic = apiPath === "/api/admin/settings/storage.policy"
    ? "/api/admin/settings/[key]"
    : apiPath.replaceAll(/\{([^}]+)\}/g, "[$1]");
  return path.join(process.cwd(), "src", "app", ...generic.split("/").filter(Boolean), "route.ts");
}

function exportedMethods(file: string) {
  if (!fs.existsSync(file)) return [];
  return [...fs.readFileSync(file, "utf8").matchAll(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/g)].map((match) => match[1]);
}

describe("PLAN-35 affected contract inventory", () => {
  const contract = fs.readFileSync(contractPath, "utf8");
  const platformOpenApi = fs.readFileSync(platformOpenApiPath, "utf8");
  const affected = parseAffectedRoutes(contract);
  const routes = parseAdminRoutes(contract);
  const platformOperations = parsePlatformOperations(platformOpenApi);

  it("parses one unique affected method/path row with no remaining planned operation", () => {
    const operations = affected.map(({ method, apiPath }) => `${method} ${apiPath}`);
    expect(affected).toHaveLength(23);
    expect(new Set(operations).size).toBe(23);
    expect(affected.filter(({ planned }) => planned)).toEqual([]);
  });

  it("matches current and planned operations to handlers in both directions", () => {
    const byFile = new Map<string, AffectedRoute[]>();
    for (const row of affected) {
      const file = routeFile(row.apiPath);
      byFile.set(file, [...(byFile.get(file) ?? []), row]);
      const methods = exportedMethods(file);
      if (row.planned) expect(methods).not.toContain(row.method);
      else expect(methods, `${row.method} ${row.apiPath}`).toContain(row.method);
    }
    for (const [file, rows] of byFile) {
      for (const method of exportedMethods(file)) expect(rows.map(({ method }) => method)).toContain(method);
    }
  });

  it("matches the platform OpenAPI operation, authorization, error, and consumer map bidirectionally", () => {
    const affectedByOperation = new Map(affected.map((row) => [`${row.method} ${row.apiPath}`, row]));
    const platformByOperation = new Map(platformOperations.map((row) => [`${row.method} ${row.apiPath}`, row]));
    expect(platformOperations).toHaveLength(23);
    expect([...platformByOperation.keys()].sort()).toEqual([...affectedByOperation.keys()].sort());

    for (const [operation, documented] of platformByOperation) {
      const feature = affectedByOperation.get(operation);
      expect(feature, operation).toBeDefined();
      expect(tokens(documented.authorization).filter(isPermission).sort(), operation)
        .toEqual(tokens(feature?.authorization ?? "").filter(isPermission).sort());
      expect(documented.consumerHref, operation).toMatch(/^\/(login|admin(?:\/|$))/);
      if (documented.consumerHref.startsWith("/admin")) {
        expect(
          ADMIN_ROUTE_POLICIES.some(({ href }) => documented.consumerHref === href || documented.consumerHref.startsWith(`${href}/`)),
          `${operation} -> ${documented.consumerHref}`
        ).toBe(true);
      }
    }

    expect(Object.fromEntries(
      platformOperations
        .filter(({ stableErrors }) => stableErrors.length > 0)
        .map(({ method, apiPath, stableErrors }) => [`${method} ${apiPath}`, stableErrors])
    )).toEqual({
      "POST /api/admin/calendar": ["APPOINTMENT_CONFLICT"],
      "POST /api/admin/calendar/{appointmentId}/reschedule": ["APPOINTMENT_CONFLICT"],
      "POST /api/admin/consultations/{consultationId}/assign": ["APPOINTMENT_CONFLICT"],
      "POST /api/admin/cases": ["CASE_REFERENCE_CONFLICT"],
      "PATCH /api/admin/settings/storage.policy": ["SETTING_READ_ONLY"]
    });
  });

  it("keeps every contract permission in the canonical catalog", () => {
    const permissionKeys = new Set<string>();
    affected.forEach(({ authorization }) => tokens(authorization).filter(isPermission).forEach((key) => permissionKeys.add(key)));
    routes.forEach((route) => [...route.requiredAnyPermissions, ...route.requiredAllPermissions].forEach((key) => permissionKeys.add(key)));
    expect(permissionKeys).toContain("case.create.any");
    expect(permissionKeys).toContain("report.read.any");
    for (const key of permissionKeys) expect(policyData.permissions).toContain(key);
  });

  it("matches the executable registry to implemented contract rows bidirectionally", () => {
    const implemented = routes.filter(({ planned }) => !planned);
    const planned = routes.filter(({ planned }) => planned);
    expect(ADMIN_ROUTE_POLICIES.map(({ id }) => id)).toEqual(implemented.map(({ id }) => id));
    for (const expected of implemented) {
      const actual = ADMIN_ROUTE_POLICIES.find(({ id }) => id === expected.id);
      expect(actual?.href).toBe(expected.href);
      expect([...(actual?.requiredAnyPermissions ?? [])].sort()).toEqual([...expected.requiredAnyPermissions].sort());
      expect([...(actual?.requiredAllPermissions ?? [])].sort()).toEqual([...expected.requiredAllPermissions].sort());
      expect(actual?.exactRole).toBe(expected.exactRole);
      expect(Boolean(actual?.staffFallback)).toBe(expected.staffFallback);
    }
    for (const expected of planned) expect(ADMIN_ROUTE_POLICIES.some(({ id }) => id === expected.id)).toBe(false);
  });

  it("keeps canonical authentication and PLAN-35 conflict codes", () => {
    const errors = fs.readFileSync(path.join(process.cwd(), "src", "server", "http", "errors.ts"), "utf8");
    for (const code of ["AUTH_REQUIRED", "PERMISSION_DENIED", "APPOINTMENT_CONFLICT", "CASE_REFERENCE_CONFLICT", "SETTING_READ_ONLY"]) {
      expect(contract).toContain(code);
      expect(errors).toContain(`"${code}"`);
    }
    expect(canonicalApiErrorCode("UNAUTHENTICATED")).toBe("AUTH_REQUIRED");
  });

  it("catalogs PLAN-35 mutations and strips sensitive metadata before storage", () => {
    for (const action of Object.values(PLAN35_AUDIT_ACTIONS)) expect(auditActionOptionLabel(action)).not.toBe("حدث تدقيق");
    const safe = plan35SafeAuditMetadata(PLAN35_AUDIT_ACTIONS.caseCoreUpdate, {
      changedFields: ["title", "summary", "requestToken", "passwordHash"],
      assignedLawyerId: "lawyer-after",
      priority: "HIGH",
      reasonCode: "ADMIN_CORE_EDIT",
      summary: "private narrative",
      rawError: "Prisma exception"
    });
    expect(safe).toEqual({ changedFields: ["title", "summary"], assignedLawyerId: "lawyer-after", priority: "HIGH", reasonCode: "ADMIN_CORE_EDIT" });
    expect(JSON.stringify(safe)).not.toMatch(/private narrative|Prisma exception/);
    expect(plan35AuditMetadataForStorage(PLAN35_AUDIT_ACTIONS.manualCaseCreate, {
      requestHash: "a".repeat(64), source: "manual", requestToken: "secret", rawError: "SQL"
    })).toEqual({ requestHash: "a".repeat(64), source: "manual" });
  });
});
