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
      ["/api/client/assistant", "/api/client/assistant"],
      ["/api/admin/clients/[clientId]/account", "/api/admin/clients/{id}/account"],
      ["/api/admin/clients/[clientId]/account/password", "/api/admin/clients/{id}/account/password"]
    ]) {
      expect(routes).toContain(route);
      expect(contract).toContain(contractRoute);
    }

    expect(routes).not.toContain("/api/admin/invoices");
    expect(contract).toContain("Portal MVP is server-rendered except implemented JSON routes");
  });
});
