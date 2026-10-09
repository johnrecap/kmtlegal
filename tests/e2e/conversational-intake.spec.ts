import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: representative conversational intake presentation`, async ({ page }) => {
    test.setTimeout(180_000);
    const copy = conversationCopy[locale];
    let state: Record<string, unknown> | null = null;
    const posted: Array<Record<string, unknown>> = [];
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: state } });
      const input = route.request().postDataJSON();
      posted.push(input);
      if (input.action === "start") state = { draft: { service: input.service }, revision: 0, accountReady: false, humanOwned: false, submitted: false, turns: [] };
      if (input.action === "message") state = {
        draft: { service: "company-formation", fullName: locale === "ar" ? "عميل تجريبي" : "Synthetic Customer", phone: "01117416666", email: "customer@synthetic.invalid", preferredMode: "ONLINE", summary: locale === "ar" ? "أحتاج إلى مراجعة مستندات تأسيس شركة." : "I need a review of company formation documents." },
        revision: 1, accountReady: false, humanOwned: false, submitted: false,
        turns: [{ messageId: input.messageId, userText: input.message, assistantText: locale === "ar" ? "جهزت مسودة طلبك. راجع البيانات، ثم تحقق من بريدك لإرسالها إلى المكتب." : "Your draft is ready. Review the details and verify your email before submitting to the office.", status: "COMPLETED" }]
      };
      if (input.action === "verify") return route.fulfill({ json: { data: { accepted: true } } });
      if (input.action === "attach") state = { ...state, accountReady: true };
      if (input.action === "submit") state = { ...state, submitted: true };
      return route.fulfill({ json: { data: state } });
    });
    for (const theme of ["dark", "light"]) for (const width of [360, 390, 768, 1024, 1440]) {
      state = null;
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation?service=company-formation`, { waitUntil: "networkidle" });
      await page.getByLabel(copy.message, { exact: true }).fill(locale === "ar" ? "عايز أؤسس شركة، اسمي عميل تجريبي ومحتاج استشارة أونلاين." : "I need to form a company. I am Synthetic Customer and prefer an online consultation.");
      await page.getByRole("button", { name: copy.send, exact: true }).click();
      await expect(page.getByRole("log")).toContainText(locale === "ar" ? "مسودة طلبك" : "Your draft is ready");
      expect(posted.find(item => item.action === "start")?.service).toBe("company-formation");
      await expect(page.getByRole("button", { name: copy.submit })).toBeDisabled();
      await page.getByLabel(copy.email, { exact: true }).fill("customer@synthetic.invalid");
      await page.getByRole("button", { name: copy.verify, exact: true }).click();
      await expect(page.getByText(copy.emailSent)).toBeVisible();
      await page.getByRole("button", { name: copy.attach }).click();
      await page.getByLabel(copy.consent).check();
      await page.getByRole("button", { name: copy.submit }).click();
      await expect(page.getByText(copy.submitted)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `.playwright/phase-five/${locale}-${theme}-${width}.png`, fullPage: true });
    }
  });
}
