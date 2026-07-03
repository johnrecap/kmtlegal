import { expect, test } from "@playwright/test";

test.describe("consultation booking chat", () => {
  test("refuses legal advice and keeps Arabic booking as chat-only intake", async ({ page }) => {
    const consoleErrors: string[] = [];
    let assistantCalls = 0;

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("request", (request) => {
      if (request.url().includes("/api/public/consultations/assistant")) {
        assistantCalls += 1;
      }
    });

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("nextjs-portal")).toHaveCount(0);

    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toBeVisible();
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("booking-chat-shell")).toBeVisible();
    await expect(page.getByTestId("booking-chat-composer")).toBeVisible();
    await expect(page.getByTestId("booking-chat-log")).toHaveClass(/kmt-chat-scrollbar/);
    await expect(page.getByTestId("booking-trust-rail")).toBeVisible();
    await expect(page.getByTestId("booking-language-choice")).toBeVisible();

    await page.getByTestId("booking-language-ar").click();
    await expect(page.getByTestId("booking-trust-rail")).toHaveCount(0);
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();

    await chat.locator('input[name="chatMessage"]').fill("will i win");
    const pageScrollBeforeSubmit = await page.evaluate(() => window.scrollY);
    await chat.locator('button[type="submit"]').last().click();
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();
    expect(assistantCalls).toBe(0);
    const pageScrollAfterSubmit = await page.evaluate(() => window.scrollY);
    expect(Math.abs(pageScrollAfterSubmit - pageScrollBeforeSubmit)).toBeLessThanOrEqual(2);

    await page.getByTestId("booking-quick-book").click();
    await expect(page.getByTestId("booking-quick-actions")).toHaveCount(0);
    await expect(page.getByTestId("booking-chat-step-card")).toHaveCount(0);
    await expect(chat.locator('input[name="fullName"]')).toHaveCount(0);
    await expect(chat.locator('input[name="phone"]')).toHaveCount(0);
    await expect(chat.locator('textarea[name="summary"]')).toHaveCount(0);
    await expect(chat.locator("#booking-consent")).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test("hides quick actions after the second free-text message", async ({ page }) => {
    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });

    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await page.getByTestId("booking-language-ar").click();
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();

    await chat.locator('input[name="chatMessage"]').fill("will i win");
    await chat.locator('button[type="submit"]').last().click();
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();

    await chat.locator('input[name="chatMessage"]').fill("what should i do");
    await chat.locator('button[type="submit"]').last().click();
    await expect(page.getByTestId("booking-quick-actions")).toHaveCount(0);
  });

  test("shows localized payment review labels instead of service slugs", async ({ page }) => {
    await page.route("**/api/public/consultations/assistant", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: "ready",
            draft: {
              serviceCategory: "claims-collections",
              preferredMode: "ONLINE",
              startsAt: "2026-07-05T10:00:00.000Z"
            },
            readyToCheckout: true,
            paymentReview: {
              amount: "1500",
              currency: "EGP",
              pricingRuleId: "test-rule",
              priceVersion: 1,
              serviceCategory: "claims-collections",
              mode: "ONLINE",
              label: null
            }
          }
        })
      });
    });

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });
    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await page.getByTestId("booking-language-ar").click();
    await chat.locator('input[name="chatMessage"]').fill("book collections consultation");
    await chat.locator('button[type="submit"]').last().click();

    const review = page.getByTestId("booking-payment-review");
    await expect(review).toBeVisible();
    await expect(review).not.toContainText("claims-collections");
  });
});
