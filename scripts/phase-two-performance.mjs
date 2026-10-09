import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const stage = process.argv[2];
if (!['before', 'after'].includes(stage)) throw new Error('Expected before or after');
const output = `docs/reviews/2026-10-09/phase-two/${stage}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const results = [];
try {
  for (const path of ['/', '/ar']) for (const width of [390, 1440]) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('kmt-theme', 'dark');
        window.__phaseMetrics = { lcp: 0, cls: 0 };
        new PerformanceObserver(list => { for (const e of list.getEntries()) window.__phaseMetrics.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__phaseMetrics.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      const page = await context.newPage();
      await page.route('**/api/analytics/events', route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
      await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      results.push({ path, width, run, ...await page.evaluate(() => ({ ...window.__phaseMetrics,
        imageBytes: performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img').reduce((sum, r) => sum + r.encodedBodySize, 0),
        transferredBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0),
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      })) });
      if (run === 1) await page.screenshot({ path: `${output}/home-${path === '/' ? 'en' : 'ar'}-${width}.png`, fullPage: true });
      await context.close();
    }
  }
} finally { await browser.close(); }
await writeFile(`${output}/performance.json`, JSON.stringify({ note: 'Unthrottled local Chrome, fresh context each run; compare medians, not field Core Web Vitals.', results }, null, 2));
console.log(JSON.stringify(results));
