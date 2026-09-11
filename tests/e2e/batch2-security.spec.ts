import { expect, test } from "@playwright/test";

test.describe("batch 2 isolated auth routes", () => {
  test.skip(process.env.BATCH2_ISOLATED_DB !== "true", "Requires the dedicated disposable database");
  test.beforeAll(({ baseURL }) => {
    const url = new URL(process.env.DATABASE_URL || "");
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.port).toBe("55437");
    expect(url.pathname).toBe("/kmt_batch2");
    expect(process.env.APP_ENV).toBe("local");
    expect(new URL(baseURL!).origin).toBe("http://127.0.0.1:3109");
  });

  test("malformed-cookie logout clears the cookie instead of returning 500", async ({ request, baseURL }) => {
    const response = await request.post("/api/auth/logout", { headers: { Origin: baseURL!, Cookie: "kmt_session=%FF" } });
    expect(response.status()).toBe(200);
    expect(response.headers()["set-cookie"]).toContain("Max-Age=0");
  });

  test("unhydrated login cannot submit credentials into a URL", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto("/login");
      await expect(page.locator('form')).toHaveAttribute("method", "post");
      await expect(page.locator('input[name="email"]')).toBeDisabled();
      await expect(page.locator('input[name="password"]')).toBeDisabled();
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      expect(new URL(page.url()).searchParams.has("password")).toBe(false);
    } finally { await context.close(); }
  });

  test("a real client session cannot use the staff client directory", async ({ request, baseURL }) => {
    expect((await request.get("/api/admin/clients")).status()).toBe(401);
    const login = await request.post("/api/auth/login", { headers: { Origin: baseURL! }, data: { email: "client@kmt.local", password: "KmtLocalDev!2026" } });
    expect(login.status()).toBe(200);
    expect((await request.get("/api/auth/me")).status()).toBe(200);
    expect((await request.get("/api/admin/clients")).status()).toBe(403);
    await request.post("/api/auth/logout", { headers: { Origin: baseURL! } });
    expect((await request.get("/api/auth/me")).status()).toBe(401);
  });
});
