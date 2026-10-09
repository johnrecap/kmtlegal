import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { defaultConsultationAvailability } from "../../src/server/consultations/consultation-availability-service";

test("synthetic HTTP: published roster, guest confirmation, lawyer access and cancellation", async ({ playwright, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable synthetic fixture database.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  const admin = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.admin.token}` } });
  const lawyer = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.lawyer.token}` } });
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, "x-forwarded-for": "192.0.2.41" } });
  const endpoint = "/api/public/assistant/conversation";
  const post = (data: Record<string, unknown>) => api.post(endpoint, { data });
  try {
    const published = await admin.patch("/api/admin/consultation-availability", { data: { ...defaultConsultationAvailability, directBooking: { published: true, closures: [], roster: defaultConsultationAvailability.days.map(d => ({ weekday: d.weekday, lawyerIds: [fixture.users.lawyer.id] })) } } });
    expect(published.status()).toBe(200);
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
