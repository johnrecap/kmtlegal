import { expect, test } from "@playwright/test";
import { assistantActionCopy } from "../../src/content/assistant-action-copy";
import { conversationCopy } from "../../src/content/conversation-copy";

for (const locale of ["ar", "en"] as const) for (const width of [360, 1440]) {
  test(`assistant proposal ${locale} ${width}: review, keyboard confirmation, cancellation and stale state`, async ({ page }) => {
    const errors: string[] = [], sent: unknown[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 850 });
    await page.addInitScript(() => localStorage.setItem("kmt-theme", "dark"));
    const c = assistantActionCopy[locale];
    const proposalId = "10000000-0000-4000-8000-000000000001", messageId = "20000000-0000-4000-8000-000000000001";
    const state = { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: true, humanOwned: false, submitted: false,
      dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null, accountAccess: false },
      turns: [{ messageId, userText: locale === "ar" ? "عدل مدينتي إلى القاهرة" : "Change my city to Cairo", assistantText: c.pending, status: "COMPLETED" }],
      proposals: [{ id: proposalId, messageId, preview: { title: c.kinds.PROFILE, lines: [locale === "ar" ? "المدينة: الإسكندرية → القاهرة" : "City: Alexandria → Cairo"] }, status: "PENDING", expiresAt: new Date(Date.now() + 900000).toISOString() }] };
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { error: { code: "AUTH_REQUIRED" } } }));
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", route => {
      const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
      if (body?.action === "confirm_action" || body?.action === "cancel_action") {
        sent.push(body); state.proposals[0].status = body.action === "confirm_action" ? "COMPLETED" : "CANCELLED";
      }
      return route.fulfill({ json: { data: state } });
    });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    const card = page.getByRole("region", { name: c.kinds.PROFILE });
    await expect(card).toBeVisible(); expect(sent).toEqual([]);
    const confirm = card.getByRole("button", { name: c.confirm, exact: true });
    await confirm.focus(); await expect(confirm).toBeFocused();
    await page.screenshot({ path: `.playwright/assistant-repair/proposal-${locale}-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.keyboard.press("Enter");
    await expect(card.getByRole("status")).toHaveText(c.completed);
    expect(sent).toEqual([{ action: "confirm_action", proposalId, confirmed: true }]);
    state.proposals[0].status = "PENDING";
    await page.reload({ waitUntil: "networkidle" });
    await card.getByRole("button", { name: c.cancel, exact: true }).click();
    await expect(card.getByRole("status")).toHaveText(c.cancelled);
    state.proposals[0].status = "STALE";
    await page.reload({ waitUntil: "networkidle" });
    await expect(card.getByRole("status")).toHaveText(c.stale);
    await expect(card.getByRole("button", { name: c.confirm, exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("a reopened rejected reply explains the technical failure and retries the original message ID", async ({ page }) => {
  const messageId = "20000000-0000-4000-8000-000000000009", message = "معايا إيصال أمانة على بياض";
  const sent: Array<Record<string, unknown>> = [];
  const state = { locale: "ar", revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null, accountAccess: false },
    turns: [{ messageId, userText: message, assistantText: null as string | null, status: "FAILED", errorCode: "AI_OUTPUT_INVALID" as string | null }] };
  await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { error: { code: "AUTH_REQUIRED" } } }));
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON(); sent.push(body);
      state.turns[0] = { ...state.turns[0], status: "COMPLETED", errorCode: null, assistantText: "هل تسلم الموقّع مالًا بالفعل؟" };
      state.revision++;
    }
    return route.fulfill({ json: { data: state } });
  });
  await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
  await expect(page.getByText(conversationCopy.ar.replyInvalid, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: conversationCopy.ar.retry, exact: true }).click();
  await expect(page.getByText("هل تسلم الموقّع مالًا بالفعل؟", { exact: true })).toBeVisible();
  expect(sent).toHaveLength(1); expect(sent[0]).toMatchObject({ action: "message", messageId, message });
});
