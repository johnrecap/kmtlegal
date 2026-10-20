import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { conversationCopy } from "../../src/content/conversation-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";

for (const locale of ["ar", "en"] as const) for (const theme of ["light", "dark"]) for (const width of [390, 1440]) {
  test(`recipients ${locale}-${theme}-${width}: routing, separate drafts, retry and optional follow-up`, async ({ page }) => {
    test.setTimeout(120_000);
    const copy = conversationCopy[locale];
    const state: Record<string, any> = { locale, handoffState: "CLAIMED", officeThreadStatus: "WAITING_CLIENT", officeContact: null, expiresAt: "2026-10-23T09:00:00Z", booking: null, draft: {}, revision: 1, accountReady: false, humanOwned: true, submitted: false,
      dialogue: { mode: "INQUIRY", consentAt: null, offerShown: true, accountAccess: false }, turns: [], staffMessages: [{ id: "staff-one", body: "Synthetic staff reply", createdAt: "2026-10-16T09:00:00Z" }] };
    const writes: any[] = [], errors: string[] = []; let failOnce = true;
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON(); writes.push(body);
        if (body.action === "message") {
          if (body.recipient === "OFFICE") {
            if (!state.turns.some((turn: any) => turn.messageId === body.messageId)) state.turns.push({ ...body, userText: body.message, assistantText: null, status: "HUMAN" });
            if (failOnce) { failOnce = false; return route.abort("failed"); }
          } else state.turns.push({ ...body, userText: body.message, assistantText: "Synthetic assistant reply", status: "COMPLETED" });
        }
        if (body.action === "set_office_contact") { state.officeContact = body.phone ? { phone: body.phone, contactChannel: body.contactChannel, consentedAt: new Date().toISOString() } : null; state.revision++; }
      }
      return route.fulfill({ json: { data: state } });
    });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    const input = page.getByLabel(copy.message, { exact: true });
    const assistant = page.getByRole("button", { name: copy.toAssistant, exact: true }), office = page.getByRole("button", { name: copy.toOffice, exact: true });
    await expect(assistant).toHaveAttribute("aria-pressed", "true");
    await input.fill("Assistant draft"); await office.click(); await expect(input).toHaveValue("");
    await input.fill("Office draft"); await assistant.click(); await expect(input).toHaveValue("Assistant draft");
    await office.click(); await page.getByRole("button", { name: copy.send, exact: true }).click();
    // PLAN-40: a protected read proves the lost office response succeeded; never resend it.
    await expect(page.getByText(copy.officeReceived, { exact: true })).toBeVisible();
    await expect(input).toHaveValue("");
    await assistant.click(); await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByRole("log").getByText("Synthetic assistant reply", { exact: true })).toBeVisible();
    await office.click(); await expect(input).toHaveValue("");
    await expect(page.getByRole("button", { name: copy.retry, exact: true })).toHaveCount(0);
    const officeWrites = writes.filter(body => body.action === "message" && body.recipient === "OFFICE");
    expect(officeWrites).toHaveLength(1);
    await expect(page.getByRole("log").getByText("Office draft", { exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: copy.followupDetails, exact: true }).click();
    let dialog = page.getByRole("dialog", { name: copy.contactTitle, exact: true });
    await expect(dialog.getByText(copy.guestFollowup, { exact: true })).toBeVisible();
    await dialog.getByLabel(copy.optionalPhone, { exact: true }).fill("01055551234");
    await dialog.getByLabel(copy.contactMethod, { exact: true }).selectOption("WHATSAPP");
    await expect(dialog.getByRole("button", { name: copy.contactSave, exact: true })).toBeDisabled();
    await dialog.getByLabel(copy.contactConsent, { exact: true }).check();
    await dialog.screenshot({ path: `.playwright/office-recipients/${locale}-${theme}-${width}-followup.png` });
    for (let n = 0; n < 12; n++) { await page.keyboard.press("Tab"); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
    await dialog.getByRole("button", { name: copy.contactSave, exact: true }).click(); await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: copy.followupDetails, exact: true })).toBeFocused();
    await page.reload({ waitUntil: "networkidle" }); await expect(assistant).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: copy.followupDetails, exact: true }).click();
    dialog = page.getByRole("dialog", { name: copy.contactTitle, exact: true });
    await expect(dialog.getByLabel(copy.optionalPhone, { exact: true })).toHaveValue("01055551234");
    await dialog.getByLabel(copy.optionalPhone, { exact: true }).fill("01055554321");
    await expect(dialog.getByLabel(copy.contactConsent, { exact: true })).not.toBeChecked();
    await dialog.getByLabel(copy.contactConsent, { exact: true }).check();
    await dialog.getByRole("button", { name: copy.contactSave, exact: true }).click();
    await page.getByRole("button", { name: copy.followupDetails, exact: true }).click();
    await dialog.getByRole("button", { name: copy.contactRemove, exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(copy.contactRemoved, { exact: true })).toBeVisible();
    expect(state.officeContact).toBeNull();
    state.closed = true; state.officeThreadStatus = "CLOSED"; state.revision++;
    const refreshed = page.waitForResponse(response => response.url().endsWith("/api/public/assistant/conversation") && response.request().method() === "GET");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await refreshed;
    await expect(page.getByText(copy.closed, { exact: true })).toBeVisible();
    await office.click(); await expect(input).toBeDisabled(); await assistant.click(); await expect(input).toBeEnabled();
    await input.fill(locale === "ar" ? "شرح خدمات المكتب" : "Explain office services");
    await expect(page.getByRole("button", { name: copy.send, exact: true })).toBeEnabled();
    await input.focus(); expect(await input.evaluate(element => getComputedStyle(element).boxShadow)).toBe("none");
    await page.locator(".consultation-chat").screenshot({ path: `.playwright/office-recipients/${locale}-${theme}-${width}-chat.png` });
    for (const size of [{ width: 360, height: 780 }, { width: 390, height: 600 }]) {
      await page.setViewportSize(size);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const box = await input.boundingBox(); expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
    }
    expect(writes.every(body => ["message", "set_office_contact"].includes(body.action))).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const locale of ["ar", "en"] as const) test(`${locale}: assistant reply after submission does not reopen booking details`, async ({ page }) => {
  const copy = conversationCopy[locale], direct = directBookingCopy[locale];
  const state: Record<string, any> = { locale, handoffState: "CLAIMED", officeThreadStatus: "WAITING_CLIENT", revision: 1, accountReady: false, humanOwned: true, submitted: true, draft: {}, turns: [], staffMessages: [],
    dialogue: { mode: "BOOKING", consentAt: new Date().toISOString(), offerShown: true, accountAccess: false },
    booking: { confirmationSource: "PUBLISHED_SLOT", publicReference: "CONS-SUBMITTED-SYNTHETIC", contactChannel: "PHONE", fullName: "Synthetic Guest", phone: "01000000000", status: "SCHEDULED", appointments: [{ id: "synthetic", startsAt: "2026-10-20T08:00:00Z", endsAt: "2026-10-20T09:00:00Z", status: "SCHEDULED", lawyer: { name: "Synthetic Lawyer" } }] } };
  const actions: string[] = [];
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON(); actions.push(body.action);
      if (body.action === "message") { state.dialogue = { ...state.dialogue, mode: "INQUIRY", consentAt: null }; state.turns.push({ ...body, userText: body.message, assistantText: "Synthetic reply after submission", status: "COMPLETED" }); }
    }
    return route.fulfill({ json: { data: state } });
  });
  await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
  const dialog = page.getByRole("dialog", { name: direct.dialogTitle, exact: true });
  await expect(dialog).toBeVisible(); await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  await page.getByLabel(copy.message, { exact: true }).fill("Explain office services");
  await page.getByRole("button", { name: copy.send, exact: true }).click();
  await expect(page.getByRole("log").getByText("Synthetic reply after submission", { exact: true })).toBeVisible();
  await expect(dialog).not.toBeVisible(); expect(actions).toEqual(["message"]);
  await page.getByRole("button", { name: direct.openDetails, exact: true }).click();
  await expect(dialog.getByText("CONS-SUBMITTED-SYNTHETIC", { exact: true })).toBeVisible();
});

test("real HTTP guest: office delivery, staff reply, AI continuity and private contact", async ({ page, playwright, baseURL }) => {
  test.skip(process.env.RUN_RECIPIENT_FIXTURES !== "true", "Requires the disposable SQL and loopback provider fixtures.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Synthetic local target required.");
  test.setTimeout(180_000);
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  const admin = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.admin.token}` } });
  const copy = conversationCopy.ar, marker = `synthetic-office-${crypto.randomUUID()}`;
  // Represent a separate proxied visitor in the production rate-limit lane.
  const headers = { Origin: baseURL, "x-real-ip": `192.0.2.${crypto.getRandomValues(new Uint8Array(1))[0] % 200 + 20}` };
  await page.setExtraHTTPHeaders(headers);
  try {
    const before = (await (await page.request.get("http://127.0.0.1:55479/stats")).json()).calls;
    await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: copy.toOffice, exact: true }).click();
    await page.getByLabel(copy.message, { exact: true }).fill(marker);
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByText(copy.officeReceived, { exact: true })).toBeVisible();
    const endpoint = "/api/public/assistant/conversation";
    const initial = (await (await page.request.get(endpoint)).json()).data;
    const original = initial.turns[0];
    expect((await page.request.post(endpoint, { headers, data: { action: "message", recipient: "OFFICE", messageId: original.messageId, message: marker, locale: "ar" } })).status()).toBe(200);
    expect((await page.request.post(endpoint, { headers, data: { action: "message", recipient: "ASSISTANT", messageId: original.messageId, message: marker, locale: "ar" } })).status()).toBe(409);
    expect((await (await page.request.get("http://127.0.0.1:55479/stats")).json()).calls).toBe(before);
    const list = await admin.get(`/api/admin/messages?q=${marker}`); expect(list.status()).toBe(200);
    const thread = (await list.json()).data.items[0]; expect(thread).toBeTruthy();
    expect((await admin.post(`/api/admin/messages/${thread.id}/messages`, { data: { message: "رد حقيقي من موظف التجربة" } })).status()).toBe(200);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("log").getByText("رد حقيقي من موظف التجربة", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: copy.toAssistant, exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel(copy.message, { exact: true }).fill("اشرح خدمات المكتب");
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByRole("log").getByText("يمكنني شرح خدمات المكتب، ومنها تأسيس الشركات ومراجعة العقود.", { exact: true })).toBeVisible();
    const stats = await (await page.request.get("http://127.0.0.1:55479/stats")).json(); expect(stats.calls - before).toBe(3); expect(stats.reasoningDisabled).toBe(true);
    await page.getByRole("button", { name: copy.followupDetails, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: copy.contactTitle, exact: true });
    await dialog.getByLabel(copy.optionalPhone, { exact: true }).fill("01055551234");
    await dialog.getByLabel(copy.contactConsent, { exact: true }).check();
    await dialog.getByRole("button", { name: copy.contactSave, exact: true }).click(); await expect(dialog).not.toBeVisible();
    const detail = await admin.get(`/api/admin/messages/${thread.id}`); expect(detail.status()).toBe(200);
    const current = (await detail.json()).data;
    expect(current.officeContact.phone).toBe("+201055551234"); expect(current.client.email).toBeNull();
    expect(current.messages.filter((message: any) => message.body === marker)).toHaveLength(1);
    expect(current.status).toBe("WAITING_CLIENT");
    const saved = (await (await page.request.get(endpoint)).json()).data;
    expect(saved.booking).toBeNull();
    expect((await page.request.post(endpoint, { headers, data: { action: "set_office_contact", revision: saved.revision, phone: "01055551234", contactChannel: "PHONE", consent: false } })).status()).toBe(400);
    const removed = await page.request.post(endpoint, { headers, data: { action: "set_office_contact", revision: saved.revision, phone: null, contactChannel: null, consent: false } });
    expect(removed.status()).toBe(200); expect((await removed.json()).data.officeContact).toBeNull();
    const anonymous = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
    try {
      expect((await anonymous.post(endpoint, { data: { action: "set_office_contact", revision: 0, phone: null, contactChannel: null, consent: false } })).status()).toBe(401);
    } finally { await anonymous.dispose(); }
  } finally { await admin.dispose(); }
});
