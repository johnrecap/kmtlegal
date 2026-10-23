import { expect, test } from "@playwright/test";
import { legalAssistantCopy } from "../../src/content/legal-assistant-copy";

for (const locale of ["ar", "en"] as const) for (const width of [360, 1440]) {
  test(`persisted assistant formatting ${locale} ${width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 850 });
    const heading = locale === "ar" ? "الوقائع" : "Payment";
    const body = locale === "ar" ? "**الوقائع**\\n- شريكك سلّم المبلغ.\\n- الطرف الآخر استلمه.\n\n**الخطوة العملية:**\nاحتفظ بصورة الاتفاق."
      : `${legalAssistantCopy.en.draft}\n\n**Payment (preliminary)**\n1. Pay **[AMOUNT]** by [DATE].\n2. Method: [METHOD].`;
    const state = { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
      dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null, accountAccess: false },
      turns: [{ messageId: "20000000-0000-4000-8000-000000000019", userText: "Keep **my** literal text", assistantText: body, status: "COMPLETED" }] };
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { error: { code: "AUTH_REQUIRED" } } }));
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", route => route.fulfill({ json: { data: state } }));
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    const response = page.locator(".consultation-response").last();
    await expect(response.locator(".consultation-response-heading").first()).toHaveText(heading);
    await expect(response.locator("li")).toHaveCount(2);
    await expect(response).not.toContainText("\\n");
    await expect(response).not.toContainText("**");
    await expect(page.getByText("Keep **my** literal text", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.playwright/assistant-formatting/${locale}-${width}.png` });
    await page.reload({ waitUntil: "networkidle" });
    await expect(response.locator("li")).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}
