import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/health/runtime-readiness", () => ({
  getApplicationReadiness: vi.fn(async () => ({
    ready: false,
    checkedAt: "2026-06-24T00:00:00.000Z",
    checks: [
      {
        id: "database.connection",
        ok: false,
        blocking: true,
        label: "Database connection",
        message: "PostgreSQL is not reachable from the app process."
      }
    ]
  }))
}));

describe("health route", () => {
  it("returns service unavailable with no-store caching when readiness is blocked", async () => {
    const previousAppEnv = process.env.APP_ENV;
    const previousAppRelease = process.env.APP_RELEASE;
    process.env.APP_ENV = "test";
    process.env.APP_RELEASE = "test-release";

    const { GET } = await import("@/app/api/health/route");

    try {
      const response = await GET(new Request("https://kmt.example/api/health", { headers: { "x-request-id": "req_health" } }));
      const payload = await response.json();

      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("X-App-Release")).toBe("test-release");
      expect(payload.requestId).toBe("req_health");
      expect(payload.data.status).toBe("blocked");
      expect(payload.data.deployment).toEqual({ environment: "test", release: "test-release" });
      expect(JSON.stringify(payload)).not.toContain("postgresql://");
    } finally {
      if (previousAppEnv) {
        process.env.APP_ENV = previousAppEnv;
      } else {
        Reflect.deleteProperty(process.env, "APP_ENV");
      }

      if (previousAppRelease) {
        process.env.APP_RELEASE = previousAppRelease;
      } else {
        Reflect.deleteProperty(process.env, "APP_RELEASE");
      }
    }
  });
});
