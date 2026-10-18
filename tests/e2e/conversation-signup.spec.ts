import { test, expect } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import { getAuthContent } from "../../src/content/auth-content";
import { serviceRequestCopy } from "../../src/content/service-request-copy";

test.beforeEach(async ({ baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires the isolated memory-only fixture server, SMTP disabled.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
});

for (const locale of ["ar", "en"] as const) for (const width of [390, 1440]) {
  test(`${locale} ${width}: direct signup, secret cleanup and authenticated own requests`, async ({ page }) => {
    test.setTimeout(180000);
    const copy = conversationCopy[locale], policy = assistantPolicyCopy[locale];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" && !/401|503/.test(message.text())) errors.push(message.text()); });
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(theme => localStorage.setItem("kmt-theme", theme), width === 390 ? "light" : "dark");
    await page.setExtraHTTPHeaders({ "x-real-ip": `192.0.2.${width === 390 ? 10 : 20}${locale === "ar" ? 1 : 2}` });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: policy.account, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: copy.register, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: copy.attach, exact: true })).toHaveCount(0);
    const name = locale === "ar" ? "عميل تسجيل تجريبي" : "Synthetic Signup Client";
    const email = `browser-${crypto.randomUUID()}@signup.invalid`, password = "Synthetic-browser-signup-2026";
    await page.getByLabel(copy.accountFields.fullName, { exact: true }).fill(name);
    await page.getByLabel(copy.accountFields.phone, { exact: true }).fill("01012345678");
    await page.getByLabel(copy.email, { exact: true }).fill(email);
    await page.getByLabel(copy.signupPassword, { exact: true }).fill(password);
    await page.getByLabel(copy.confirmPassword, { exact: true }).fill(password);
    await page.getByRole("button", { name: getAuthContent(locale).login.showPassword, exact: true }).click();
    await expect(page.getByLabel(copy.signupPassword, { exact: true })).toHaveAttribute("type", "text");
    await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
    await page.getByRole("button", { name: policy.account, exact: true }).click();
    await expect(page.getByLabel(copy.email, { exact: true })).toHaveValue(email);
    await expect(page.getByLabel(copy.signupPassword, { exact: true })).toHaveValue("");
    await expect(page.getByLabel(copy.signupPassword, { exact: true })).toHaveAttribute("type", "password");
    await page.getByLabel(copy.signupPassword, { exact: true }).fill(password);
    await page.getByLabel(copy.confirmPassword, { exact: true }).fill("Synthetic-mismatch-2026");
    await page.getByRole("button", { name: copy.registerSubmit, exact: true }).click();
    await expect(page.getByText(copy.passwordMismatch, { exact: true })).toBeVisible();
    await page.getByLabel(copy.confirmPassword, { exact: true }).fill(password);
    await page.getByRole("button", { name: copy.forgotPassword, exact: true }).click();
    await expect(page.getByText(copy.recoveryHelp, { exact: true })).toBeVisible();
    await page.screenshot({ path: `.playwright/signup/${locale}-${width}-form.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    // Simulate a response lost after the actual registration committed and set its cookie.
    let registrations = 0;
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "POST" && route.request().postDataJSON().action === "register") {
        registrations++;
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        if (width === 390) { await route.abort("failed"); return; }
        await route.fulfill({ response }); return;
      }
      await route.continue();
    });
    await page.getByRole("button", { name: copy.registerSubmit, exact: true }).click();
    await expect(page.getByText(copy.registered, { exact: true })).toBeVisible();
    expect(registrations).toBe(1);
    const identity = await page.request.get("/api/auth/me"); expect(identity.status()).toBe(200);
    expect((await identity.json()).user.role).toBe("Client");
    expect(await page.locator('input[name="password"]').count()).toBe(0);
    expect(await page.evaluate(value => JSON.stringify({ ...localStorage, ...sessionStorage }).includes(value), password)).toBe(false);
    await page.screenshot({ path: `.playwright/signup/${locale}-${width}-success.png`, fullPage: true });
    await page.getByRole("link", { name: copy.requests, exact: true }).click();
    await expect(page).toHaveURL(/\/client\/requests$/);
    await expect(page.getByRole("heading", { name: serviceRequestCopy[locale].newRequest, exact: true })).toBeVisible();
    expect((await page.request.get("/api/auth/me")).status()).toBe(200);
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    await page.getByLabel(copy.message, { exact: true }).fill("Synthetic service question");
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByText(copy.unavailable, { exact: true })).toBeVisible();
    expect(errors).toEqual(width === 390 ? ["Failed to load resource: net::ERR_FAILED"] : []);
  });
}

test("existing email remains recoverable, guest booking is prefilled and attaches only after signup", async ({ page }) => {
  const locale = "ar", copy = conversationCopy.ar;
  await page.setExtraHTTPHeaders({ "x-real-ip": "192.0.2.230" });
  const post = (data: Record<string, unknown>) => page.request.post("/api/public/assistant/conversation", { data });
  expect((await post({ action: "start", locale })).status()).toBe(200);
  const state = (await (await post({ action: "begin_booking" })).json()).data;
  const response = await post({ action: "request_callback", revision: state.revision, key: crypto.randomUUID(), confirmed: true, fullName: "حجز زائر تجريبي", phone: "01055556789", contactChannel: "WHATSAPP" });
  expect(response.status()).toBe(200);
  const guest = (await response.json()).data;
  const reference = guest.booking.publicReference;
  // Office follow-up polls in the background; readiness is the visible account dialog.
  await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel(copy.accountFields.fullName, { exact: true })).toHaveValue("حجز زائر تجريبي");
  await expect(page.getByLabel(copy.accountFields.phone, { exact: true })).toHaveValue("01055556789");
  await page.getByLabel(copy.email, { exact: true }).fill("admin@phase-five.invalid");
  await page.getByLabel(copy.signupPassword, { exact: true }).fill("Synthetic-browser-signup-2026");
  await page.getByLabel(copy.confirmPassword, { exact: true }).fill("Synthetic-browser-signup-2026");
  await page.getByRole("button", { name: copy.registerSubmit, exact: true }).click();
  await expect(page.getByText(copy.accountUnavailable, { exact: true })).toBeVisible();
  await expect(page.getByLabel(copy.email, { exact: true })).toHaveValue("admin@phase-five.invalid");
  // No navigation or clearing the ordinary draft on an account conflict.
  await page.getByLabel(copy.email, { exact: true }).fill(`after-booking-${crypto.randomUUID()}@signup.invalid`);
  await page.getByRole("button", { name: copy.registerSubmit, exact: true }).click();
  await expect(page.getByText(copy.registered, { exact: true })).toBeVisible();
  expect((await (await page.request.get("/api/public/assistant/conversation")).json()).data.booking.publicReference).toBe(reference);
  await page.getByRole("dialog").getByRole("link", { name: copy.requests, exact: true }).click();
  await expect(page.getByRole("heading", { name: reference, exact: true })).toBeVisible();
});
