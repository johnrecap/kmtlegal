import { expect, test } from "@playwright/test";

test.describe("RTL select controls", () => {
  test("reserve space for the dropdown arrow away from selected text", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/product-system", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const select = page.locator('select[name="caseStatus"]');
    await expect(select).toBeVisible();

    const metrics = await select.evaluate((element) => {
      const arrow = element.parentElement?.querySelector('span[aria-hidden="true"]');
      const selectRect = element.getBoundingClientRect();
      const arrowRect = arrow?.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        appearance: style.appearance || style.getPropertyValue("-webkit-appearance"),
        paddingInlineEnd: Number.parseFloat(style.paddingInlineEnd),
        arrowOffsetFromLeft: arrowRect ? arrowRect.left - selectRect.left : null,
        arrowOffsetFromRight: arrowRect ? selectRect.right - arrowRect.right : null
      };
    });

    expect(metrics.appearance).toBe("none");
    expect(metrics.paddingInlineEnd).toBeGreaterThanOrEqual(40);
    expect(metrics.arrowOffsetFromLeft).not.toBeNull();
    expect(metrics.arrowOffsetFromLeft ?? 999).toBeLessThan(24);
    expect(metrics.arrowOffsetFromRight ?? 0).toBeGreaterThan(48);
    expect(consoleErrors).toEqual([]);
  });
});
