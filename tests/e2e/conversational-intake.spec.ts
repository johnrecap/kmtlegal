import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: representative conversational intake presentation`, async ({ page }) => {
    test.setTimeout(180_000);
    const copy = conversationCopy[locale];
    const policy = assistantPolicyCopy[locale];
    let state: Record<string, unknown> | null = null;
    const posted: Array<Record<string, unknown>> = [];
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: state } });
      const input = route.request().postDataJSON();
      posted.push(input);
      if (input.action === "start") state = { draft: { service: input.service }, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false, turns: [] };
      if (input.action === "begin_booking") state = { ...state, dialogue: { mode: "BOOKING", consentAt: new Date().toISOString(), offerShown: true, accountAccess: false } };
      if (input.action === "return_inquiry") state = { ...state, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: true, accountAccess: false } };
      if (input.action === "account_access") state = { ...state, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: true } };
      if (input.action === "message") state = {
        ...state,
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
      await expect(page.getByLabel(copy.email, { exact: true })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: copy.review, exact: true })).toHaveCount(0);
      await page.screenshot({ path: `.playwright/company-assistant/${locale}-${theme}-${width}-inquiry.png`, fullPage: true });
      await page.getByRole("button", { name: policy.account, exact: true }).click();
      await expect(page.getByRole("heading", { name: policy.account, exact: true })).toBeFocused();
      await expect(page.getByRole("button", { name: copy.verify, exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: copy.recover, exact: true })).toBeVisible();
      await page.getByRole("button", { name: policy.begin, exact: true }).click();
      await expect(page.getByRole("heading", { name: copy.review, exact: true })).toBeFocused();
      await page.getByLabel(copy.message, { exact: true }).fill(locale === "ar" ? "عايز أؤسس شركة، اسمي عميل تجريبي ومحتاج استشارة أونلاين." : "I need to form a company. I am Synthetic Customer and prefer an online consultation.");
      await page.getByRole("button", { name: copy.send, exact: true }).click();
      await expect(page.getByRole("log")).toContainText(locale === "ar" ? "مسودة طلبك" : "Your draft is ready");
      await page.getByRole("button", { name: policy.back, exact: true }).click();
      await expect(page.getByLabel(copy.message, { exact: true })).toBeFocused();
      await expect(page.getByLabel(copy.email, { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: copy.submit, exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: policy.begin, exact: true }).click();
      await expect(page.getByText("customer@synthetic.invalid", { exact: true })).toBeVisible();
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
      await page.screenshot({ path: `.playwright/company-assistant/${locale}-${theme}-${width}-submitted.png`, fullPage: true });
    }
  });
}
