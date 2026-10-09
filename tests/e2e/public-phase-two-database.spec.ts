import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPublicContent } from "../../src/content/public-content";

test.describe.configure({ mode: "serial" });
test.skip(process.env.RUN_PHASE_TWO_FIXTURES !== "true", "Requires the isolated in-memory fixture server.");
type Fixtures = { databaseUrl: string; users: Record<string, { id: string; roleId: string; token: string }>; articles: Record<string, string> };
let fixture: Fixtures;
let prisma: PrismaClient;
test.beforeAll(async ({ baseURL }) => {
  if (new URL(baseURL!).hostname !== "127.0.0.1") throw new Error("Local test target required.");
  fixture = JSON.parse(readFileSync(".playwright/phase-two-fixtures.json", "utf8"));
  const dbUrl = new URL(fixture.databaseUrl);
  if (dbUrl.hostname !== "127.0.0.1" || dbUrl.port !== "55449") throw new Error("Wrong fixture database.");
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: fixture.databaseUrl, max: 1 }) });
  const rows = await prisma.$queryRawUnsafe<Array<{ marker: string }>>("SELECT marker FROM phase_two_fixture_marker");
  if (rows[0]?.marker !== "memory-only-synthetic-phase-two") throw new Error("Synthetic marker missing.");
});
test.afterAll(async () => { await prisma?.$disconnect(); });

test("published/due API content, private states and sitemap", async ({ request }) => {
  for (const locale of ["ar", "en"]) {
    const response = await request.get(`/api/public/articles?locale=${locale}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.map((article: { slug: string }) => article.slug).sort()).toEqual(locale === "ar" ? ["phase-two-published"] : ["phase-two-english-only", "phase-two-published"]);
    expect(JSON.stringify(body)).not.toContain("@phase-two.invalid");
    for (const kind of ["draft", "future", "archived", "missing"]) expect((await request.get(`/api/public/articles/phase-two-${kind}?locale=${locale}`)).status()).toBe(404);
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/ar/articles/phase-two-published");
  expect(sitemap).not.toMatch(/phase-two-(draft|future|archived)/);
  expect(sitemap).not.toContain("/ar/articles/phase-two-english-only");
  expect(sitemap).toContain("/our-firm");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
});

for (const locale of ["ar", "en"] as const) test(`${locale}: article search, reading and responsive details`, async ({ page }, info) => {
  test.setTimeout(180_000);
  const prefix = locale === "ar" ? "/ar" : "";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.goto(`${prefix}/articles`, { waitUntil: "networkidle" });
  if (locale === "en") {
    await page.getByRole("button", { name: "Consultations", exact: true }).click();
    await expect(page.locator('main a[href="/articles/phase-two-english-only"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/articles/phase-two-published"]')).toHaveCount(0);
    await page.getByRole("button", { name: getPublicContent(locale).directoryFilter.all, exact: true }).click();
  }
  await page.getByLabel(getPublicContent(locale).articlesPage.searchLabel).fill("no-matching-article");
  await expect(page.getByText(getPublicContent(locale).articlesPage.emptyTitle)).toBeVisible();
  await page.getByLabel(getPublicContent(locale).articlesPage.searchLabel).fill("published");
  await page.locator(`main a[href="${prefix}/articles/phase-two-published"]`).first().click();
  await expect(page.locator("h1")).toContainText("published");
  for (const theme of ["dark", "light"]) for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(value => localStorage.setItem("kmt-theme", value), theme);
    await page.reload({ waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[hreflang="ar"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await page.screenshot({ path: info.outputPath(`article-${theme}-${width}.png`) });
  }
  if (locale === "en") {
    await page.goto("/articles/phase-two-english-only", { waitUntil: "networkidle" });
    await expect(page.getByTestId("public-language-switch")).toHaveCount(0);
    await expect(page.locator('link[hreflang="ar"]')).toHaveCount(0);
  }
  expect((await page.goto(`${prefix}/articles/phase-two-draft`))?.status()).toBe(404);
});

test("CMS withdrawal and restoration invalidate public content", async ({ request }) => {
  const id = fixture.articles["en-published"];
  const headers = { cookie: `kmt_session=${fixture.users.reviewer.token}`, origin: "http://127.0.0.1:3000" };
  const payload = { title: "Synthetic article published", slug: "phase-two-published", locale: "en", excerpt: "Synthetic article used for controlled publication lifecycle checks.", content: "Synthetic content only, used to verify publication and cache invalidation.", category: "contracts", status: "ARCHIVED", publishedAt: "2026-01-01" };
  expect((await request.get("/articles/phase-two-published")).status()).toBe(200);
  const archived = await request.patch(`/api/admin/content/articles/${id}`, { headers, data: payload });
  expect(archived.status(), await archived.text()).toBe(200);
  expect((await request.get("/api/public/articles/phase-two-published?locale=en")).status()).toBe(404);
  expect((await request.get("/articles/phase-two-published")).status()).toBe(404);
  const restored = await request.patch(`/api/admin/content/articles/${id}`, { headers, data: { ...payload, status: "PUBLISHED" } });
  expect(restored.status(), await restored.text()).toBe(200);
  expect((await request.get("/api/public/articles/phase-two-published?locale=en")).status()).toBe(200);
  expect((await request.get("/articles/phase-two-published")).status()).toBe(200);
});

test("telemetry persistence, privacy and authorized aggregate report", async ({ request, page, context }, info) => {
  test.setTimeout(120_000);
  await prisma.analyticsEvent.deleteMany({ where: { name: { startsWith: "public." } } });
  const event = { name: "public.contact_clicked", properties: { page: "contact", locale: "ar", placement: "footer", channel: "whatsapp" } };
  expect((await request.post("/api/analytics/events", { data: { ...event, properties: { ...event.properties, email: "private@example.invalid" } } })).status()).toBe(400);
  expect((await request.post("/api/analytics/events", { data: event })).status()).toBe(202);
  await expect.poll(() => prisma.analyticsEvent.count({ where: { name: "public.contact_clicked" } })).toBe(1);
  const stored = await prisma.analyticsEvent.findFirstOrThrow({ where: { name: "public.contact_clicked" } });
  expect(stored.actorHash).toBeNull();
  expect(stored.requestId).toBeNull();
  await context.addCookies([{ name: "kmt_session", value: fixture.users.reviewer.token, url: "http://127.0.0.1:3000" }]);
  await page.goto("/admin/reports", { waitUntil: "networkidle" });
  const report = page.getByTestId("public-traffic-report");
  await expect(report).toBeVisible();
  await expect(report).not.toContainText("تعذّر تحميل");
  await expect(report).toContainText("ضغطات واتساب");
  await expect(report.getByText("ضغطات واتساب", { exact: true }).locator("..").locator("p").nth(1)).toHaveText("١");
  await expect(report.getByText("رسائل التواصل المسجلة", { exact: true }).locator("..").locator("p").nth(1)).toHaveText("١");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await report.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`traffic-${width}.png`) });
  }
  await page.goto("/admin/reports?dateFrom=2000-01-01&dateTo=2000-01-02", { waitUntil: "networkidle" });
  const emptyPeriod = page.getByTestId("public-traffic-report");
  await expect(emptyPeriod.getByText("ضغطات واتساب", { exact: true }).locator("..").locator("p").nth(1)).toHaveText("٠");
  await expect(emptyPeriod.getByText("رسائل التواصل المسجلة", { exact: true }).locator("..").locator("p").nth(1)).toHaveText("٠");
  await context.clearCookies();
  await page.goto("/admin/reports");
  await expect(page).toHaveURL(/\/login/);
  await context.addCookies([{ name: "kmt_session", value: fixture.users.denied.token, url: "http://127.0.0.1:3000" }]);
  await page.goto("/admin/reports");
  await expect(page.getByTestId("public-traffic-report")).toHaveCount(0);
});
