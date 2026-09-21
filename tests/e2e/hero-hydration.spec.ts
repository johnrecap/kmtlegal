import { expect, test } from "@playwright/test";

/**
 * P0 regression suite: the hero's server-rendered HTML and its hydrated
 * state must show the same visual composition. Entrance motion may play
 * after hydration, but it must animate FROM the correct layout — no mounted-
 * state swaps, no theme flash, no geometry jumps, no zeroed counters.
 */
test.describe("hero hydration parity", () => {
  test("SSR markup already contains the final hero composition", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status(), "home should SSR").toBeLessThan(400);
    const html = await response.text();

    // Headline, picker, and docket copy render server-side — no placeholders.
    expect(html).toContain("Structured Legal Support for Business and Private Matters");
    expect(html).toContain("Choose the matter closest to your request");
    expect(html).toContain("Request draft");
    expect(html).toContain("Select a matter to preview your request draft.");
    // Stats render their FINAL values server-side (initiallyStable counters).
    expect(html).toContain(">24</span>");
    // The animated headline (Magic TextAnimate, word-level) and beam/CTA
    // targets exist pre-hydration.
    expect(html).toContain("data-slot=\"text-animate\"");
    expect(html).toContain("data-testid=\"public-page-hero-image\"");
  });

  test("hydration changes nothing structural under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const hero = page.getByTestId("public-hero-parallax");
    const title = page.getByRole("heading", { level: 1 }).first();

    const heroBoxBefore = await hero.boundingBox();
    const titleBoxBefore = await title.boundingBox();
    const titleTextBefore = await title.textContent();

    // Theme tokens are already dark at first paint (no light flash).
    const canvasBefore = await page
      .getByTestId("public-shell")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(canvasBefore, "public canvas should be obsidian at first paint").toBe("rgb(5, 5, 5)");

    // Let hydration, observers, and springs settle.
    await page.waitForTimeout(2500);

    expect(await hero.boundingBox(), "hero geometry should survive hydration").toEqual(heroBoxBefore);
    expect(await title.boundingBox(), "headline geometry should survive hydration").toEqual(titleBoxBefore);
    expect(await title.textContent(), "headline text should survive hydration").toBe(titleTextBefore);
    const titleOpacity = await page
      .locator("[data-hero='title']")
      .evaluate((node) => getComputedStyle(node).opacity);
    expect(titleOpacity, "headline should be fully visible when settled").toBe("1");
  });

  test("normal motion settles into a stable hero composition", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const title = page.getByRole("heading", { level: 1 }).first();
    const textAtLoad = await title.textContent();

    // Entrance plays (transform/opacity), then the layout must hold still.
    await page.waitForTimeout(3000);
    const settledBox = await title.boundingBox();
    const settledText = await title.textContent();
    await page.waitForTimeout(1500);
    expect(await title.boundingBox(), "headline geometry should hold after entrance").toEqual(settledBox);
    expect(settledText, "headline text should match first paint").toBe(textAtLoad);
  });

  test("Arabic hero SSRs its final composition", async ({ request }) => {
    const response = await request.get("/ar");
    expect(response.status(), "arabic home should SSR").toBeLessThan(400);
    const html = await response.text();
    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("data-slot=\"text-animate\"");
    expect(html).toContain("data-testid=\"public-page-hero-image\"");
  });
});
