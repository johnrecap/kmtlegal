import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { serviceRequestCopy } from "../../src/content/service-request-copy";
test.describe.configure({ mode: "serial" });
test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires the isolated synthetic fixture database.");
type Fixture = { users: Record<string, { id: string; clientId?: string; token: string }> };
const fixture = () => JSON.parse(readFileSync(".playwright/phase-five/fixtures.json", "utf8")) as Fixture;
for (const locale of ["ar", "en"] as const) test(`${locale}: contract request, staff proposal, client acceptance, own access and responsive portal`, async ({ page, browser, baseURL }) => {
  test.setTimeout(480_000); if (new URL(baseURL!).hostname !== "127.0.0.1") throw new Error("Local synthetic test target required.");
  const users = fixture().users; const copy = serviceRequestCopy[locale];
  await page.context().addCookies([{ name: "kmt_session", value: users[locale].token, url: baseURL! }]);
  const staff = await browser.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
  await staff.addCookies([{ name: "kmt_session", value: users.admin.token, url: baseURL! }]);
  await page.goto("/client/requests", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: copy.create, exact: true }).click();
  await expect(page).toHaveURL(/\/client\/requests\/services\//);
  const id = page.url().split("/").at(-1)!;
  await page.getByLabel(copy.name, { exact: true }).fill(locale === "ar" ? "عقد توريد تجريبي" : "Synthetic supply contract");
  await page.getByLabel(copy.purpose, { exact: true }).fill(locale === "ar" ? "أطلب صياغة عقد توريد بناءً على المستندات التي يراجعها المكتب." : "Please prepare a supply contract based on the office review.");
  await page.getByRole("button", { name: copy.save, exact: true }).click();
  await expect(page.getByRole("button", { name: copy.submit, exact: true })).toBeEnabled();
  await page.getByRole("button", { name: copy.submit, exact: true }).click();
  await expect(page.getByText(copy.statuses.RECEIVED, { exact: true })).toBeVisible();
  const response = await staff.request.get(`/api/service-requests/${id}`); expect(response.status()).toBe(200); const row = (await response.json()).data;
  const quote = await staff.request.post(`/api/service-requests/${id}`, { data: { action: "quote", revision: row.revision, quote: { amount: "10000", currency: "EGP", scope: "Synthetic office-reviewed contract scope for testing only.", durationDays: 5 } } }); expect(quote.status()).toBe(200);
  await page.reload({ waitUntil: "networkidle" }); await page.getByRole("button", { name: copy.accept, exact: true }).click();
  await expect(page.getByText(copy.statuses.IN_PROGRESS, { exact: true })).toBeVisible();
  const accepted = (await (await staff.request.get(`/api/service-requests/${id}`)).json()).data;
  for (const [index, amount] of ["3000", "2000"].entries()) {
    const result = await staff.request.post(`/api/admin/finance/${accepted.paymentId}/entries`, { data: { idempotencyKey: randomUUID(), kind: "SETTLEMENT", amount, currency: "EGP", method: "CASH", receiptNumber: `${locale}-${id}-${index}`, occurredAt: new Date().toISOString() } }); expect(result.status()).toBe(200);
  }
  const other = await browser.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } }); await other.addCookies([{ name: "kmt_session", value: users.other.token, url: baseURL! }]);
  expect((await other.request.get(`/api/service-requests/${id}`)).status()).toBe(404);
  expect((await other.request.post(`/api/admin/finance/${accepted.paymentId}/entries`, { data: { idempotencyKey: randomUUID(), kind: "SETTLEMENT", amount: "1", currency: "EGP", method: "CASH", receiptNumber: "forbidden", occurredAt: new Date().toISOString() } })).status()).toBe(403);
  const scan = await page.request.post("/api/files/upload", { headers: { Origin: baseURL! }, multipart: { serviceRequestId: id, file: { name: "synthetic.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 synthetic fixture") } } }); expect(scan.status()).toBe(503); expect((await scan.json()).error.code).toBe("MALWARE_SCANNER_UNAVAILABLE");
  for (const target of [`/client/requests/services/${id}`, "/client/payments", "/client/requests", "/client/assistant"]) for (const theme of ["light", "dark"]) for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    await page.goto(target, { waitUntil: "networkidle" }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    if ([390, 1440].includes(width)) await page.screenshot({ path: `.playwright/phase-five/services-${locale}-${target.includes('/services/') ? 'detail' : target.split("/")[2]}-${theme}-${width}.png`, fullPage: true });
  }
  const adminPage = await staff.newPage(); await adminPage.setViewportSize({ width: 390, height: 900 }); await adminPage.goto(`/admin/service-requests/${id}`, { waitUntil: "networkidle" });
  await expect(adminPage.locator("main")).toContainText("CONTRACT-"); expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await adminPage.screenshot({ path: `.playwright/phase-five/admin-service-${locale}-390.png`, fullPage: true });
  await other.close(); await staff.close();
});
