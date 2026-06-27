import { expect, test } from "@playwright/test";

test.describe("consultation booking validation", () => {
  test("shows recoverable Arabic validation before advancing from details on /ar", async ({ page }) => {
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

    await page.getByLabel("الاسم الكامل").fill("أحمد سعيد");
    await page.getByLabel("رقم الهاتف").fill("+201000000000");
    await page.getByRole("button", { name: "متابعة" }).click();

    await expect(page.getByLabel("ملخص الطلب")).toBeVisible();

    await page.getByLabel("ملخص الطلب").fill("رفع عليا وصل امانه");
    await page.getByRole("button", { name: "متابعة" }).click();
    await expect(page.getByText(/الملخص قصير/)).toBeVisible();

    await page.getByLabel("ملخص الطلب").fill("رفع عليا وصل أمانة بتاريخ واضح وأحتاج مراجعة قانونية");
    await page.getByRole("button", { name: "متابعة" }).click();

    await expect(page.getByText("مراجعة وإرسال")).toBeVisible();
    await expect(page.getByLabel(/أوافق على استخدام البيانات/)).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
