import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { defaultConsultationAvailability } from "../../src/server/consultations/consultation-availability-service";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";

async function publishFixtureSchedule(admin: APIRequestContext, lawyerId: string) {
  const published = await admin.patch("/api/admin/consultation-availability", { data: { ...defaultConsultationAvailability, directBooking: { published: true, closures: [], roster: defaultConsultationAvailability.days.map(day => ({ weekday: day.weekday, lawyerIds: [lawyerId] })) } } });
  expect(published.status()).toBe(200);
}

test("synthetic HTTP: published roster, guest confirmation, lawyer access and cancellation", async ({ playwright, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable synthetic fixture database.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  const admin = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.admin.token}` } });
  const lawyer = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.lawyer.token}` } });
  const syntheticIp = `192.0.2.${crypto.getRandomValues(new Uint8Array(1))[0] % 200 + 20}`;
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, "x-real-ip": syntheticIp, "x-forwarded-for": syntheticIp } });
  const endpoint = "/api/public/assistant/conversation";
  const post = (data: Record<string, unknown>) => api.post(endpoint, { data });
  try {
    await publishFixtureSchedule(admin, fixture.users.lawyer.id);
    expect((await post({ action: "start", locale: "ar", service: "company-formation" })).status()).toBe(200);
    const ready = (await (await post({ action: "begin_booking" })).json()).data;
    const slots = (await (await post({ action: "booking_slots" })).json()).data.slots;
    expect(slots.length).toBe(3);
    const body = { action: "confirm_booking", key: crypto.randomUUID(), revision: ready.revision, confirmed: true, fullName: "عميل تجربة معزولة", phone: "01012345987", contactChannel: "WHATSAPP", startsAt: slots[0].startsAt };
    const confirmed = await post(body); expect(confirmed.status()).toBe(200);
    const state = (await confirmed.json()).data;
    expect(state.accountReady).toBe(false); expect(state.booking.status).toBe("SCHEDULED");
    expect(state.booking.appointments[0].lawyer.name).toBeTruthy();
    expect((await post(body)).status()).toBe(200);
    const list = await lawyer.get("/api/admin/consultations"); expect(list.status()).toBe(200);
    expect(JSON.stringify(await list.json())).toContain(state.booking.publicReference);
    const cancelled = await post({ action: "cancel_booking", key: crypto.randomUUID(), revision: state.revision, confirmed: true });
    expect(cancelled.status()).toBe(200); expect((await cancelled.json()).data.booking.appointments[0].status).toBe("CANCELLED");
  } finally { await api.dispose(); await lawyer.dispose(); await admin.dispose(); }
});

test("PLAN40 a committed HTTP booking survives a failed refresh without another confirmation", async ({ page, playwright, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable synthetic fixture database.");
  test.setTimeout(120_000);
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  const admin = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.admin.token}` } });
  await publishFixtureSchedule(admin, fixture.users.lawyer.id); await admin.dispose();
  const copy = directBookingCopy.ar;
  const endpoint = "/api/public/assistant/conversation";
  let committed: Record<string, any> | null = null;
  let confirmations = 0, failedReads = 0;
  await page.setExtraHTTPHeaders({ "x-real-ip": "192.0.2.211", "x-forwarded-for": "192.0.2.211" });
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() === "GET" && committed) {
      failedReads++;
      return route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } });
    }
    if (route.request().method() === "POST" && route.request().postDataJSON().action === "confirm_booking") {
      confirmations++;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      committed = (await response.json()).data;
      return route.fulfill({ response });
    }
    return route.continue();
  });
  try {
    await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: assistantPolicyCopy.ar.begin, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: copy.dialogTitle, exact: true });
    await expect(dialog).toBeVisible();
    await page.getByRole("radio").first().check();
    await page.getByLabel(copy.name, { exact: true }).fill("عميل اختبار فقد التحديث");
    await page.getByLabel(copy.number, { exact: true }).fill("01012345986");
    await page.getByLabel(copy.consent, { exact: true }).check();
    await dialog.getByRole("button", { name: copy.confirm, exact: true }).click();
    await expect.poll(() => !!committed?.booking).toBe(true);
    await expect(dialog.getByText(copy.confirmed, { exact: true })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect.poll(() => failedReads).toBeGreaterThan(0);
    await expect(dialog.getByText(copy.confirmed, { exact: true })).toBeVisible();
    await expect(dialog.getByText(copy.failed, { exact: true })).toHaveCount(0);
    expect(confirmations).toBe(1);
  } finally {
    await page.screenshot({ path: `.playwright/plan40/${process.env.PLAN40_CAPTURE_PHASE ?? "t008"}-booking-refresh.png`, fullPage: true });
    const saved = committed as Record<string, any> | null;
    if (saved?.booking) {
      const cancelled = await page.request.post(endpoint, { headers: { Origin: baseURL }, data: { action: "cancel_booking", key: crypto.randomUUID(), revision: saved.revision, confirmed: true } });
      expect(cancelled.status()).toBe(200);
    }
  }
});

test("published schedule editor is readable on mobile and desktop", async ({ page, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable synthetic fixture database.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  await page.context().addCookies([{ name: "kmt_session", value: fixture.users.admin.token, url: baseURL }]);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/consultation-availability", { waitUntil: "networkidle" });
    await expect(page.getByLabel("نشر الجدول والسماح بالتأكيد المباشر")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.waitForTimeout(700); // Allow the existing accordion entrance to settle before visual capture.
    await page.screenshot({ path: `.playwright/direct-booking/admin-${width}.png`, fullPage: true });
  }
});
