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
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(new Request("https://kmt.example/api/health", { headers: { "x-request-id": "req_health" } }));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.requestId).toBe("req_health");
    expect(payload.data.status).toBe("blocked");
    expect(JSON.stringify(payload)).not.toContain("postgresql://");
  });
});
