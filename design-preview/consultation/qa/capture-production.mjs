// Current application UI, local synthetic responses only; does not submit bookings.
import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const root = path.resolve('design-preview/consultation'), data = { window: {} };
for (const file of ['catalogs.js', 'preview-copy.js', 'fixtures.js']) vm.runInNewContext(await readFile(path.join(root, 'shared', file), 'utf8'), data);
const fixture = data.window.KMT_FIXTURE, catalogs = data.window.KMT_CATALOGS;
const browser = await chromium.launch({ channel: 'chrome', headless: true }), results = [];
try {
  for (const locale of ['ar', 'en']) for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [], copy = data.window.KMT_PREVIEW[locale];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const state = { locale, handoffState: 'NONE', booking: null, draft: {}, dialogue: { mode: 'INQUIRY', consentAt: null, offerShown: true, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false,
      turns: [{ messageId: 'visual-a', userText: copy.question, assistantText: copy.answer, createdAt: fixture.now }, { messageId: 'visual-b', userText: copy.followup, assistantText: copy.response, createdAt: '2026-10-15T06:00:02Z' }] };
    await page.addInitScript(value => localStorage.setItem('kmt-theme', value), theme);
    await page.route('**/api/analytics/events', route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route('**/api/public/assistant/conversation', route => {
      if (route.request().method() === 'POST') {
        const input = route.request().postDataJSON();
        if (input.action === 'booking_slots') return route.fulfill({ json: { data: fixture.availability(input.date) } });
        if (input.action === 'begin_booking') state.dialogue = { ...state.dialogue, mode: 'BOOKING', consentAt: fixture.now };
        if (['confirm_booking', 'reschedule_booking', 'request_callback', 'cancel_booking'].includes(input.action)) throw new Error('Capture must not submit a booking');
      }
      return route.fulfill({ json: { data: state } });
    });
    await page.goto(`http://127.0.0.1:3107${locale === 'ar' ? '/ar' : ''}/book-consultation`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const ratios = await page.locator('.kmt-consultation').evaluate(root => {
      const probe = document.createElement('span'); root.append(probe);
      const rgb = token => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number); };
      const lum = rgb => rgb.map(v => { const x = v / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [.2126, .7152, .0722][i], 0);
      const pairs = [['--kmt-public-text', '--consultation-surface'], ['--consultation-muted', '--consultation-surface'], ['--consultation-gold', '--consultation-tint'], ['--consultation-on-action', '--consultation-action']];
      const result = pairs.map(pair => { const a = lum(rgb(pair[0])), b = lum(rgb(pair[1])); return { pair: pair.join('/'), ratio: Number(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2)) }; });
      probe.remove(); return result;
    });
    if (ratios.some(pair => pair.ratio < 4.5)) throw new Error('Actual text contrast failure: ' + JSON.stringify(ratios));
    const reducedMotion = await page.locator('.consultation-composer button').evaluate(button => getComputedStyle(button).transitionDuration);
    if (reducedMotion !== '0s') throw new Error('Reduced motion failed');
    await page.locator('.kmt-consultation').screenshot({ path: path.join(root, 'images', `production-${locale}-${theme}-${width}-chat.png`) });
    await page.getByRole('button', { name: catalogs.policy[locale].begin, exact: true }).click();
    const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('radio').first()).toBeVisible();
    await dialog.screenshot({ path: path.join(root, 'images', `production-${locale}-${theme}-${width}-booking.png`) });
    await dialog.getByRole('radio').first().check();
    await dialog.getByLabel(catalogs.booking[locale].name, { exact: true }).fill(copy.syntheticName);
    await dialog.getByLabel(catalogs.booking[locale].number, { exact: true }).fill('01000000000');
    await dialog.getByLabel(catalogs.booking[locale].consent, { exact: true }).check();
    await dialog.getByText(catalogs.booking[locale].review, { exact: true }).scrollIntoViewIfNeeded();
    await dialog.screenshot({ path: path.join(root, 'images', `production-${locale}-${theme}-${width}-review.png`) });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Document overflow');
    if (errors.length) throw new Error(errors.join(' | '));
    results.push({ locale, theme, width, status: 'PASS', ratios, reducedMotion, providerCalls: 0, bookingWrites: 0 });
    console.log('CAPTURED AND CHECKED', locale, theme, width); await context.close();
  }
} finally {
  await browser.close();
  await writeFile(path.join(root, 'qa/production-results.json'), JSON.stringify({ scope: 'Current production React components on local server; intercepted same synthetic fixture', results, complete: results.length === 8 }, null, 2));
}
