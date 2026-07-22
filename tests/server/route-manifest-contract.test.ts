import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function apiRoutes() {
  const root = path.join(process.cwd(), "src", "app", "api");
  const routes: string[] = [];
  walk(root, routes);
  return routes.sort();
}

function walk(directory: string, routes: string[]) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, routes);
      continue;
    }

    if (entry.name !== "route.ts") {
      continue;
    }

    const relative = path.relative(path.join(process.cwd(), "src", "app"), directory).replaceAll(path.sep, "/");
    routes.push(`/${relative}`);
  }
}

describe("route manifest contract", () => {
  it("documents the implemented MVP API route families", () => {
    const routes = apiRoutes();
    const contract = fs.readFileSync(path.join(process.cwd(), "specs/kmt-legal-platform/contracts/openapi-plan.md"), "utf8");

    for (const [route, contractRoute] of [
      ["/api/admin/finance", "/api/admin/finance"],
      ["/api/admin/reports", "/api/admin/reports"],
      ["/api/admin/calendar", "/api/admin/calendar"],
      ["/api/admin/documents/[documentId]/delete", "/api/admin/documents/{documentId}/delete"],
      ["/api/admin/users/[userId]/password", "/api/admin/users/{id}/password"],
      ["/api/admin/users/[userId]/client-profile", "/api/admin/users/{id}/client-profile"],
      ["/api/admin/contact-messages", "/api/admin/contact-messages"],
      ["/api/admin/contact-messages/[messageId]", "/api/admin/contact-messages/{messageId}"],
      ["/api/health", "/api/health"],
      ["/api/install/status", "/api/install/status"],
      ["/api/install/preflight", "/api/install/preflight"],
      ["/api/install/bootstrap-super-admin", "/api/install/bootstrap-super-admin"],
      ["/api/install/finish", "/api/install/finish"],
      ["/api/files/upload", "/api/files/upload"],
      ["/api/portal/profile", "/api/portal/profile"],
      ["/api/public/consultations", "/api/public/consultations"],
      ["/api/public/consultations/assistant", "/api/public/consultations/assistant"],
      ["/api/public/consultations/checkout", "/api/public/consultations/checkout"],
      ["/api/public/consultations/slots", "/api/public/consultations/slots"],
      ["/api/public/payments/status", "/api/public/payments/status"],
      ["/api/public/client-account/setup", "/api/public/client-account/setup"],
      ["/api/webhooks/paytabs", "/api/webhooks/paytabs"],
      ["/api/webhooks/paymob", "/api/webhooks/paymob"],
      ["/api/admin/notifications", "/api/admin/notifications"],
      ["/api/admin/notifications/[notificationId]/read", "/api/admin/notifications/{notificationId}/read"],
      ["/api/admin/consultations/[consultationId]/review", "/api/admin/consultations/{id}/review"],
      ["/api/admin/consultation-availability", "/api/admin/consultation-availability"],
      ["/api/client/assistant", "/api/client/assistant"],
      ["/api/client/messages", "/api/client/messages"],
      ["/api/client/messages/[threadId]", "/api/client/messages/{threadId}"],
      ["/api/client/messages/[threadId]/messages", "/api/client/messages/{threadId}/messages"],
      ["/api/admin/messages", "/api/admin/messages"],
      ["/api/admin/messages/[threadId]", "/api/admin/messages/{threadId}"],
      ["/api/admin/messages/[threadId]/messages", "/api/admin/messages/{threadId}/messages"],
      ["/api/admin/clients/[clientId]/account", "/api/admin/clients/{id}/account"],
      ["/api/admin/clients/[clientId]/account/password", "/api/admin/clients/{id}/account/password"],
      ["/api/admin/payments/pricing", "/api/admin/payments/pricing"],
      ["/api/admin/payments/pricing/[ruleId]", "/api/admin/payments/pricing/{ruleId}"],
      ["/api/admin/payments/settings", "/api/admin/payments/settings"],
      ["/api/admin/payments/attempts", "/api/admin/payments/attempts"],
      ["/api/admin/payments/webhooks", "/api/admin/payments/webhooks"],
      ["/api/admin/payments/webhooks/[eventId]/replay", "/api/admin/payments/webhooks/{eventId}/replay"]
    ]) {
      expect(routes).toContain(route);
      expect(contract).toContain(contractRoute);
    }

    expect(routes).not.toContain("/api/admin/invoices");
    expect(contract).toContain("Portal MVP is server-rendered except implemented JSON routes");
  });

  it("does not mask unknown admin or portal paths with catch-all routes", () => {
    const appRoot = path.join(process.cwd(), "src", "app", "(app-ar)");
    expect(fs.existsSync(path.join(appRoot, "admin", "[...section]", "page.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(appRoot, "portal", "[...section]", "page.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(appRoot, "loading.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(appRoot, "error.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(appRoot, "not-found.tsx"))).toBe(true);
  });

  it("keeps manual case create and core edit methods aligned with the permission contract", () => {
    const casesRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/cases/route.ts"),
      "utf8"
    );
    const caseDetailRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/cases/[caseId]/route.ts"),
      "utf8"
    );
    const contract = fs.readFileSync(
      path.join(
        process.cwd(),
        "specs/kmt-legal-platform/plan-35-admin-operations-remediation/contracts/admin-operations-contract.md"
      ),
      "utf8"
    );
    const policy = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src/server/auth/policy-data.json"), "utf8")
    ) as { permissions: string[] };

    expect(casesRoute).toMatch(/export async function POST\(/);
    expect(caseDetailRoute).toMatch(/export async function PATCH\(/);
    expect(contract).toContain("`POST /api/admin/cases`");
    expect(contract).toContain("`PATCH /api/admin/cases/{caseId}`");
    expect(contract).toContain("`case.create.any`");
    expect(policy.permissions).toContain("case.create.any");
  });
});
