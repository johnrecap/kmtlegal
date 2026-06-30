import { expect, test } from "@playwright/test";

test.describe("consultation booking chat", () => {
  test("refuses legal advice and keeps Arabic booking as chat-only intake", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
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
    await expect(page.getByTestId("booking-language-choice")).toBeVisible();

    await page.getByTestId("booking-language-ar").click();

    await chat.locator('input[name="chatMessage"]').fill("هل هكسب القضية؟");
    const pageScrollBeforeSubmit = await page.evaluate(() => window.scrollY);
    await chat.locator('button[type="submit"]').last().click();
    await expect(chat.getByText(/لا أستطيع تقديم رأي قانوني/)).toBeVisible();
    const pageScrollAfterSubmit = await page.evaluate(() => window.scrollY);
    expect(Math.abs(pageScrollAfterSubmit - pageScrollBeforeSubmit)).toBeLessThanOrEqual(2);

    await page.getByTestId("booking-quick-book").click();
    await expect(page.getByTestId("booking-chat-step-card")).toHaveCount(0);
    await expect(chat.locator('input[name="fullName"]')).toHaveCount(0);
    await expect(chat.locator('input[name="phone"]')).toHaveCount(0);
    await expect(chat.locator('textarea[name="summary"]')).toHaveCount(0);
    await expect(chat.locator("#booking-consent")).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });
});
