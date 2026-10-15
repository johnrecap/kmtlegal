import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root = path.resolve('design-preview/consultation');
const data = { window: {} };
for (const file of ['catalogs.js', 'preview-copy.js', 'fixtures.js']) vm.runInNewContext(await readFile(path.join(root, 'shared', file), 'utf8'), data);
const fixture = data.window.KMT_FIXTURE, catalogs = data.window.KMT_CATALOGS;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir(path.join(root, 'images'), { recursive: true });
try {
  for (const locale of ['ar', 'en']) for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const copy = data.window.KMT_PREVIEW[locale];
    const state = { locale, handoffState: 'NONE', booking: null, draft: { service: 'company-formation' }, dialogue: { mode: 'INQUIRY', consentAt: null, offerShown: true, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false,
      turns: [{ messageId: 'baseline-a', userText: copy.question, assistantText: copy.answer, status: 'COMPLETED', createdAt: '2026-10-15T06:00:00Z', updatedAt: '2026-10-15T06:00:01Z' }, { messageId: 'baseline-b', userText: copy.followup, assistantText: copy.response, status: 'COMPLETED', createdAt: '2026-10-15T06:00:02Z', updatedAt: '2026-10-15T06:00:03Z' }] };
    const apiRequests = [];
    await page.addInitScript(theme => localStorage.setItem('kmt-theme', theme), theme);
    await page.route('**/api/analytics/events', route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route('**/api/public/assistant/conversation', route => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { data: state } });
      const input = route.request().postDataJSON(); apiRequests.push(input.action);
      if (input.action === 'booking_slots') return route.fulfill({ json: { data: fixture.availability(input.date) } });
      if (input.action === 'begin_booking') state.dialogue = { ...state.dialogue, mode: 'BOOKING', consentAt: fixture.now };
      // No production handlers, provider calls or booking writes are reached.
      return route.fulfill({ json: { data: state } });
    });
    await page.goto((locale === 'ar' ? 'http://127.0.0.1:3107/ar' : 'http://127.0.0.1:3107') + '/book-consultation', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const region = page.getByRole('region', { name: catalogs.chat[locale].title, exact: true });
    await expect(region).toBeVisible();
    await region.screenshot({ path: path.join(root, 'images', `baseline-${locale}-${theme}-${width}-chat.png`) });
    await page.getByRole('button', { name: catalogs.policy[locale].begin, exact: true }).click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radio').first()).toBeVisible();
    await dialog.screenshot({ path: path.join(root, 'images', `baseline-${locale}-${theme}-${width}-booking.png`) });
    await dialog.getByRole('radio').first().check();
    await dialog.getByLabel(catalogs.booking[locale].name, { exact: true }).fill(copy.syntheticName);
    await dialog.getByLabel(catalogs.booking[locale].number, { exact: true }).fill('01000000000');
    await dialog.getByLabel(catalogs.booking[locale].consent, { exact: true }).check();
    await dialog.getByText(catalogs.booking[locale].review, { exact: true }).scrollIntoViewIfNeeded();
    await dialog.screenshot({ path: path.join(root, 'images', `baseline-${locale}-${theme}-${width}-review.png`) });
    results.push({ locale, theme, width, state: 'captured', apiRequests, realBookingWrites: 0, providerCalls: 0 });
    console.log('CAPTURED', locale, theme, width);
    await context.close();
  }
} finally { await browser.close(); await writeFile(path.join(root, 'qa/baseline-results.json'), JSON.stringify({ release: 'dbdc9268b4286fe10c3893f7eab1fb1c09d9b533', source: 'Actual unchanged Next application with intercepted synthetic assistant/availability responses', results }, null, 2)); }
