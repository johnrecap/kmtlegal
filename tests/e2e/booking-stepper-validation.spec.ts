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

    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toBeVisible();
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("booking-chat-shell")).toBeVisible();
    await expect(page.getByTestId("booking-chat-composer")).toBeVisible();
    await expect(page.getByTestId("booking-chat-log")).toHaveClass(/kmt-chat-scrollbar/);
    // Greeting + language prompt open the conversation; no external rail.
    await expect(page.getByTestId("booking-chat-log")).toContainText("أستطيع مساعدتك في حجز استشارة");
    await expect(page.getByTestId("booking-trust-rail")).toHaveCount(0);
    await expect(page.getByTestId("booking-language-choice")).toBeVisible();

    await page.getByTestId("booking-language-ar").click();
    await expect(page.getByTestId("booking-trust-rail")).toHaveCount(0);
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();

    await chat.locator('input[name="chatMessage"]').fill("will i win");
    // Stabilize viewport first: the contract is no page jump ON SUBMIT,
    // not where the 720px test viewport happens to rest after filling.
    await page.getByTestId("booking-chat-composer").scrollIntoViewIfNeeded();
    const pageScrollBeforeSubmit = await page.evaluate(() => window.scrollY);
    await chat.locator('button[type="submit"]').last().click();
    await expect(page.getByTestId("booking-quick-actions")).toBeVisible();
    expect(assistantCalls).toBe(0);
    const pageScrollAfterSubmit = await page.evaluate(() => window.scrollY);
    expect(Math.abs(pageScrollAfterSubmit - pageScrollBeforeSubmit)).toBeLessThanOrEqual(2);

    await page.getByTestId("booking-quick-book").click();
    // Booking starts: intent chips collapse, contextual matter chips appear.
    await expect(page.getByTestId("booking-quick-book")).toHaveCount(0);
    await expect(page.getByTestId("booking-matter-chip").first()).toBeVisible();
    await expect(page.getByTestId("booking-chat-step-card")).toHaveCount(0);
    await expect(chat.locator('input[name="fullName"]')).toHaveCount(0);
    await expect(chat.locator('input[name="phone"]')).toHaveCount(0);
    await expect(chat.locator('textarea[name="summary"]')).toHaveCount(0);
    await expect(chat.locator("#booking-consent")).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
  });

  test("guides matter selection inside the conversation", async ({ page }) => {
    await page.route("**/api/public/consultations/assistant", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: "تم.",
            draft: { serviceCategory: "corporate-business-services", preferredMode: "ONLINE" }
          }
        })
      });
    });

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("booking-stepper")).toHaveAttribute("data-hydrated", "true");
    await page.getByTestId("booking-language-ar").click();

    // Intent question + what-next info live inside the same console.
    const log = page.getByTestId("booking-chat-log");
    await expect(log).toContainText("كيف يمكننا مساعدتك اليوم؟");
    await expect(log).toContainText("ما الذي يحدث بعد ذلك");

    await page.getByTestId("booking-quick-book").click();
    const matter = page.getByTestId("booking-matter-chip");
    await expect(matter).toHaveCount(4);

    // Selection is recorded as a user message; options collapse.
    await matter.nth(1).click();
    await expect(matter).toHaveCount(0);
    await expect(log).toContainText("الشركات والعقود التجارية");
  });

  test("shows the public floating dock with consultation + WhatsApp only", async ({ page }) => {
    // The dock steps aside on the consultation route itself (it would
    // cover the composer), so verify it on a neighboring public route.
    await page.goto("/ar/", { waitUntil: "domcontentloaded" });
    const dock = page.getByTestId("public-floating-dock");
    await expect(dock).toBeVisible();
    const links = dock.locator("a:visible");
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute("href", "/ar/book-consultation");
    await expect(links.nth(1)).toHaveAttribute("target", "_blank");
    await expect(links.nth(1)).toHaveAttribute("rel", /noopener/);

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("booking-stepper")).toBeVisible();
    await expect(page.getByTestId("public-floating-dock")).toHaveCount(0);
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

  test("keeps contract-check wording inside booking instead of reference inquiry", async ({ page }) => {
    const payloads: unknown[] = [];
    await page.route("**/api/public/consultations/assistant", async (route) => {
      const payload = route.request().postDataJSON();
      payloads.push(payload);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: "اكتب الاسم ورقم الهاتف والموعد المناسب.",
            draft: {
              summary: payload.message,
              preferredMode: "ONLINE"
            },
            missingFields: ["fullName", "phone", "startsAt"]
          }
        })
      });
    });

    await page.goto("/ar/book-consultation", { waitUntil: "domcontentloaded" });
    const chat = page.getByTestId("booking-stepper");
    await expect(chat).toHaveAttribute("data-hydrated", "true");
    await page.getByTestId("booking-language-ar").click();
    await chat.locator('input[name="chatMessage"]').fill("عايز contract check");
    await chat.locator('button[type="submit"]').last().click();

    await expect.poll(() => payloads.length).toBe(1);
    expect(payloads[0]).toMatchObject({
      message: "عايز contract check"
    });
    expect(payloads[0]).not.toMatchObject({
      intent: "appointment_inquiry"
    });
  });
});
