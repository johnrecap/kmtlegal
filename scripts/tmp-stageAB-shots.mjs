import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const path of ["/ar", "/"]) {
  await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: "load", timeout: 60000 }).catch(() => null);
  await page.waitForTimeout(1500);
  const info = await page.getByTestId("public-page-hero-image").first().evaluate((node) => {
    const cs = getComputedStyle(node);
    return { position: cs.objectPosition, classes: node.className };
  });
  console.log(path, JSON.stringify(info));
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  console.log(path, "overflow:", JSON.stringify(overflow));
}
await browser.close();
