import { expect, test } from "@playwright/test";

test.describe("consultation booking chat", () => {
  test("refuses legal advice and advances through Arabic booking chat details", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("nextjs-portal")).toHaveCount(0);

    const headerIconBox = await page.locator('header a[href="/ar/book-consultation"] .material-symbols-outlined').boundingBox();
    expect(headerIconBox?.width ?? 0).toBeLessThanOrEqual(24);

    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toBeVisible();
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("booking-chat-shell")).toBeVisible();
    await expect(page.getByTestId("booking-chat-composer")).toBeVisible();

    await chat.locator('input[name="chatMessage"]').fill("هل هكسب القضية؟");
    await chat.locator('button[type="submit"]').last().click();
    await expect(chat.getByText(/لا أستطيع تقديم رأي قانوني/)).toBeVisible();

    await page.getByTestId("booking-quick-book").click();
    const stepCard = page.getByTestId("booking-chat-step-card");
    await expect(stepCard).toBeVisible();
    await chat.locator('input[name="fullName"]').fill("أحمد سعيد");
    await chat.locator('input[name="phone"]').fill("+201000000000");
    await stepCard.locator('button[type="submit"]').click();

    await expect(chat.locator('textarea[name="summary"]')).toBeVisible();
    await chat.locator('textarea[name="summary"]').fill("رفع عليا وصل أمانة بتاريخ واضح وأحتاج حجز استشارة لمراجعة الطلب مع فريق المكتب.");
    await stepCard.locator('button[type="submit"]').click();

    await expect(chat.locator("#booking-consent")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
