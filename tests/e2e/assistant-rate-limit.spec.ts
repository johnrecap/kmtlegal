import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";

let provider: Server | undefined;
let scenario: "recover" | "daily" = "recover";
let providerRequests = 0;

test.beforeAll(async ({ baseURL }) => {
  if (process.env.RUN_PHASE_FIVE_FIXTURES !== "true") return;
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  provider = createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const input = JSON.parse(raw);
    providerRequests += 1;
    response.setHeader("Content-Type", "application/json");
    if (scenario === "daily" || providerRequests === 1) {
      response.statusCode = 429;
      response.setHeader("Retry-After", "1");
      return response.end(JSON.stringify({ error: { code: 429, details: scenario === "daily" ? [{
        "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier", quotaValue: "20" }]
      }] : [] } }));
    }
    const name = input.tools?.[0]?.function?.name;
    if (name === "classify_company_message" || name === "review_company_reply") {
      const data = JSON.parse(input.messages[1].content);
      const locale = /[\u0600-\u06ff]/.test(data.message) ? "ar" : "en";
      const decision = name === "classify_company_message"
        ? { scope: "SOCIAL", intent: "NONE", evidence: "", locale, offerAppropriate: false, inScopeQuestion: "" }
        : { inScope: true, grounded: true, noPrematureContact: true, noBookingPressure: true, noFinalLegalAdvice: true, noFalseActionClaim: true };
      return response.end(JSON.stringify({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{
        id: name, type: "function", function: { name, arguments: JSON.stringify(decision) }
      }] } }] }));
    }
    response.end(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: "Synthetic office reply after recovery." } }] }));
  });
  await new Promise<void>((resolve, reject) => { provider!.once("error", reject); provider!.listen(55529, "127.0.0.1", resolve); });
});

test.afterAll(async () => { if (provider) await new Promise<void>((resolve, reject) => provider!.close(error => error ? reject(error) : resolve())); });

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: one click waits through provider 429 and displays one persisted reply`, async ({ page }) => {
    test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires isolated SQL and the synthetic provider endpoint.");
    scenario = "recover"; providerRequests = 0;
    const copy = conversationCopy[locale];
    const consoleErrors: string[] = [];
    page.on("pageerror", error => consoleErrors.push(error.message));
    const messageRequests: unknown[] = [];
    page.on("request", request => {
      if (request.url().endsWith("/api/public/assistant/conversation") && request.method() === "POST") {
        const body = request.postDataJSON(); if (body.action === "message") messageRequests.push(body);
      }
    });
    await page.setViewportSize(locale === "ar" ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto((locale === "ar" ? "/ar" : "") + "/book-consultation", { waitUntil: "networkidle" });
    const text = locale === "ar" ? "أهلا تجريبي" : "Hello synthetic";
    await page.getByLabel(copy.message, { exact: true }).fill(text);
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByText(copy.waitingHint, { exact: true })).toBeVisible();
    await expect(page.getByLabel(copy.message, { exact: true })).toBeDisabled();
    await page.screenshot({ path: `.playwright/assistant-rate-limit/${locale}-waiting.png`, fullPage: true });
    await expect(page.getByRole("log").getByText("Synthetic office reply after recovery.", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("log").getByText(text, { exact: true })).toHaveCount(1);
    await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue("");
    await expect(page.getByRole("button", { name: copy.retry, exact: true })).toHaveCount(0);
    expect(messageRequests).toHaveLength(1);
    const state = await (await page.request.get("/api/public/assistant/conversation")).json();
    expect(state.data.turns).toHaveLength(1); expect(state.data.turns[0].status).toBe("COMPLETED");
    expect(providerRequests).toBe(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `.playwright/assistant-rate-limit/${locale}-recovered.png`, fullPage: true });
  });

  test(`${locale}: terminal quota retains the text and reuses its ID on manual send`, async ({ page }) => {
    test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires isolated SQL and the synthetic provider endpoint.");
    scenario = "daily"; providerRequests = 0;
    const copy = conversationCopy[locale];
    const ids: string[] = [];
    page.on("request", request => {
      if (request.url().endsWith("/api/public/assistant/conversation") && request.method() === "POST") {
        const body = request.postDataJSON(); if (body.action === "message") ids.push(body.messageId);
      }
    });
    await page.setViewportSize(locale === "ar" ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    await page.goto((locale === "ar" ? "/ar" : "") + "/book-consultation", { waitUntil: "networkidle" });
    const text = locale === "ar" ? "رسالة تجريبية محفوظة" : "Retained synthetic message";
    await page.getByLabel(copy.message, { exact: true }).fill(text);
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByText(copy.rateLimited, { exact: true })).toBeVisible();
    await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue(text);
    expect(providerRequests).toBe(1);
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect.poll(() => providerRequests).toBe(2);
    await expect(page.getByText(copy.rateLimited, { exact: true })).toBeVisible();
    expect(ids).toHaveLength(2); expect(ids[1]).toBe(ids[0]);
    const state = await (await page.request.get("/api/public/assistant/conversation")).json();
    expect(state.data.turns).toHaveLength(1); expect(state.data.turns[0].status).toBe("FAILED");
    await page.route("**/api/public/assistant/conversation", route => {
      if (route.request().method() === "POST" && route.request().postDataJSON().action === "message") {
        return route.fulfill({ status: 429, contentType: "text/plain", body: "too many requests" });
      }
      return route.continue();
    });
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith("/api/public/assistant/conversation") && response.status() === 429),
      page.getByRole("button", { name: copy.retry, exact: true }).click()
    ]);
    await expect(page.getByRole("button", { name: copy.retry, exact: true })).toBeEnabled();
    await expect(page.getByText(copy.rateLimited, { exact: true })).toBeVisible();
    await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue(text);
    expect(ids).toHaveLength(3); expect(new Set(ids).size).toBe(1); expect(providerRequests).toBe(2);
    await page.screenshot({ path: `.playwright/assistant-rate-limit/${locale}-limited.png`, fullPage: true });
  });
}
