import { expect, test } from "@playwright/test";
import { getPublicContent } from "../../src/content/public-content";

test("malformed session cookies return unauthorized from the real auth endpoint", async ({ request }) => {
  for (const value of ["%", "%E0%A4%A", "%FF"]) {
    const response = await request.get("/api/auth/me", { headers: { Cookie: `kmt_session=${value}` } });
    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "AUTH_REQUIRED" } });
  }
});

for (const width of [390, 768, 1440]) {
for (const locale of ["ar", "en"] as const) {
test.describe(`${locale} at ${width}px`, () => {
  test.use({ viewport: { width, height: 900 }, contextOptions: { reducedMotion: "reduce" } });
  const bookingPath = locale === "ar" ? "/ar/book-consultation" : "/book-consultation";
  const copy = getPublicContent(locale).bookingChat;
  test.beforeEach(async ({ page }) => {
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  });

if (width === 390) {
  for (const failure of ["http", "json", "shape", "missing-draft"] as const) {
    test(`reports payment resume ${failure} failure with a contact action`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/api/public/payments/status?**", route => route.fulfill(
        failure === "http" ? { status: 500, json: { error: {} } } :
        failure === "json" ? { status: 200, contentType: "application/json", body: "{invalid" } :
        failure === "shape" ? { json: { data: {} } } :
        { json: { data: { status: "FAILED", access: { verified: true }, resumeDraft: null } } }
      ));
      await page.goto(`${bookingPath}?resumeAttemptId=test-resume&token=test-token`);
      const log = page.getByTestId("booking-chat-log");
      await expect(log).toContainText(copy.fallbackError);
      await expect(log.getByRole("link", { name: copy.whatsappFallbackLabel })).toHaveAttribute("href", locale === "ar" ? "/ar/contact" : "/contact");
      expect(errors).toEqual([]);
      if (failure === "http") await page.screenshot({ path: testInfo.outputPath(`resume-error-${locale}.png`), fullPage: true });
    });
  }

  test("accepts intentionally withheld drafts without reporting a retrieval error", async ({ page }) => {
    for (const data of [
      { status: "PAID", access: { verified: true }, resumeDraft: null },
      { status: "PENDING", access: { verified: true }, resumeDraft: null },
      { status: "FAILED", access: { verified: false }, resumeDraft: null }
    ]) {
      await page.route("**/api/public/payments/status?**", route => route.fulfill({ json: { data } }));
      const response = page.waitForResponse("**/api/public/payments/status?**");
      await page.goto(`${bookingPath}?resumeAttemptId=test-resume&token=test-token`);
      await response;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.getByTestId("booking-chat-log")).not.toContainText(copy.fallbackError);
      await expect(page.getByTestId("booking-chat-log")).not.toContainText(copy.resumePaymentDraft);
      await page.unroute("**/api/public/payments/status?**");
    }
  });

  test("restores a verified failed attempt and clears its old appointment", async ({ page }) => {
    await page.route("**/api/public/payments/status?**", route => route.fulfill({ json: { data: {
      status: "FAILED", access: { verified: true }, resumeDraft: { fullName: "Example Client", startsAt: "2099-10-01T09:00:00.000Z" }
    } } }));
    await page.goto(`${bookingPath}?resumeAttemptId=test-resume&token=test-token`);
    await expect(page.getByTestId("booking-chat-log")).toContainText(copy.resumePaymentDraft);
    await page.route("**/api/public/consultations/assistant", async route => {
      const payload = route.request().postDataJSON();
      expect(payload.draft.fullName).toBe("Example Client");
      expect(payload.draft.startsAt).toBe("");
      expect(payload.selectedSlot).toBe("");
      await route.fulfill({ json: { data: { message: "Restored request checked", draft: payload.draft } } });
    });
    await page.locator('input[name="chatMessage"]').fill("Choose another appointment");
    await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();
    await expect(page.getByTestId("booking-chat-log")).toContainText("Restored request checked");
  });
}

test("clears an invalidated appointment instead of resending it", async ({ page }) => {
  const requests: Array<{ selectedSlot?: string; message?: string }> = [];
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, body: "{}" }));
  await page.route("**/api/public/consultations/assistant", async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { data: requests.length === 1 ? {
      message: "Review appointment", draft: { startsAt: "2099-10-01T09:00:00.000Z" }, readyToConfirm: true
    } : { message: "Choose another appointment", draft: { startsAt: "" }, missingFields: ["startsAt"] } } });
  });
  await page.goto(bookingPath);
  await expect(page.getByTestId("consultation-assistant")).toHaveAttribute("data-hydrated", "true");
  await page.getByTestId(`booking-language-${locale}`).click();
  const input = page.locator('input[name="chatMessage"]');
  const submit = page.getByTestId("booking-chat-composer").locator('button[type="submit"]');
  for (const message of ["Book an appointment", "Change appointment", "Tomorrow afternoon"]) {
    await input.fill(message);
    await submit.click();
    await expect(input).toBeEnabled();
  }
  expect(requests).toHaveLength(3);
  expect(requests[1].selectedSlot).toBe("2099-10-01T09:00:00.000Z");
  expect(requests[2].selectedSlot).toBe("");
});

test("reports a failed payment-resume request without an unhandled error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/public/payments/status?**", route => route.abort("failed"));
  await page.goto(`${bookingPath}?resumeAttemptId=test-resume&token=test-token`);
  await expect(page.getByTestId("consultation-assistant")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByTestId("booking-chat-log")).toContainText(copy.fallbackError);
  expect(errors).toEqual([]);
});

test("does not report a payment page ready when checkout returns no payment attempt", async ({ page }) => {
  await page.route("**/api/public/consultations/assistant", route => route.fulfill({ json: { data: {
    message: "Review payment", draft: { startsAt: "2099-10-01T09:00:00.000Z", serviceCategory: "corporate-business-services", preferredMode: "ONLINE" }, readyToCheckout: true,
    paymentReview: { amount: "1500", currency: "EGP", pricingRuleId: "test", priceVersion: 1, serviceCategory: "corporate-business-services", mode: "ONLINE", label: null }
  } } }));
  await page.route("**/api/public/consultations/checkout", route => route.fulfill({ json: { data: {} } }));
  await page.goto(bookingPath);
  await expect(page.getByTestId("consultation-assistant")).toHaveAttribute("data-hydrated", "true");
  await page.getByTestId(`booking-language-${locale}`).click();
  await page.getByTestId("booking-quick-book").click();
  await page.getByTestId("booking-pay-booking").click();
  await expect(page.getByTestId("booking-chat-log")).toContainText(copy.fallbackError);
  await expect(page.getByTestId("booking-chat-log")).not.toContainText(copy.checkoutCreated);
  await expect(page.getByTestId("booking-pay-booking")).toBeEnabled();
});
});
}
}
