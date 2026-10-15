import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve('design-preview/consultation');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [], issues = [];
async function images(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) { image.loading = 'eager'; await image.decode(); }
  });
}
try {
  for (const locale of ['ar', 'en']) for (const theme of ['light', 'dark']) for (const width of [360, 390, 1440]) {
    const label = `${locale}-${theme}-${width}`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== '127.0.0.1') { external.push(url.origin); return route.abort(); }
      return route.continue();
    });
    try {
      await page.goto(`http://127.0.0.1:3417/?lang=${locale}&theme=${theme}`);
      await expect(page.locator('.direction-card')).toHaveCount(5);
      await expect(page.locator('#compare-direction')).toHaveValue('02');
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await images(page);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Gallery horizontal overflow');
      const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => a.href).filter(href => !href.includes('#')));
      for (const link of new Set(links)) { const response = await page.request.get(link); if (!response.ok()) throw new Error('Broken link ' + link); }
      for (const id of ['01', '02', '03', '04', '05']) {
        await page.selectOption('#compare-direction', id);
        for (const scene of ['chat', 'booking', 'review']) {
          await page.selectOption('#compare-view', scene);
          await page.selectOption('#compare-viewport', width === 1440 ? '1440' : '390');
          await images(page);
          await expect(page.locator('#after-image')).toHaveAttribute('src', new RegExp(`direction-${id}-${locale}-${theme}`));
        }
      }
      await page.selectOption('#compare-direction', '02'); await page.selectOption('#compare-view', 'booking');
      if (locale === 'ar' && ((theme === 'light' && width === 1440) || (theme === 'dark' && width === 390))) {
        await page.screenshot({ path: path.join(root, 'images', `gallery-${label}.png`), fullPage: true });
      }
      await page.locator('[data-action=language]').click();
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'ar' ? 'en' : 'ar');
      await page.locator('[data-action=theme]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
      await images(page);
      if (errors.length || external.length) throw new Error(JSON.stringify({ errors, external }));
      results.push({ label, status: 'PASS', checks: ['five-directions', 'selected-02', 'links', 'all-comparison-scenes', 'images', 'RTL', 'theme-language', 'no-overflow', 'no-console-external'] });
      console.log('PASS gallery', label);
    } catch (error) { issues.push({ label, message: error.message }); console.log('FAIL gallery', label, error.message); }
    finally { await context.close(); }
  }
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await expect(page.locator('.direction-card')).toHaveCount(5); await images(page);
  await page.goto(pathToFileURL(path.join(root, 'direction-02/index.html')).href);
  await expect(page.locator('#open-booking')).toBeVisible(); await page.locator('#open-booking').click();
  await expect(page.locator('dialog')).toBeVisible();
  results.push({ label: 'file-direct-open', status: 'PASS', checks: ['gallery', 'selected-chat', 'selected-dialog'] });
} catch (error) { issues.push({ label: 'file-direct-open', message: error.message }); }
finally {
  await browser.close();
  await writeFile(path.join(root, 'qa/gallery-results.json'), JSON.stringify({ date: '2026-10-15', results, issues, summary: { passed: results.length, failed: issues.length } }, null, 2));
  console.log(JSON.stringify({ passed: results.length, failed: issues.length }));
  if (issues.length) process.exitCode = 1;
}
