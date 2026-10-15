import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('design-preview/consultation');
const requested = process.argv.find(arg => arg.startsWith('--direction='))?.split('=')[1];
const directions = requested ? [requested] : ['01', '02', '03', '04', '05'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [], issues = [], external = [];
await mkdir(path.join(output, 'images'), { recursive: true });
const assert = (test, reason) => { if (!test) throw new Error(reason); };
async function geometry(page) {
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => {}))));
  const value = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    const scroll = dialog?.querySelector('.dialog-scroll');
    const rect = dialog?.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
      dialog: !rect || (rect.x >= 0 && rect.right <= innerWidth + 1 && rect.y >= 0 && rect.bottom <= innerHeight + 1),
      body: !scroll || scroll.scrollWidth <= scroll.clientWidth + 1,
      assets: [...document.images].every(image => image.complete && image.naturalWidth > 0) };
  });
  assert(!value.overflow && value.dialog && value.body && value.assets, 'Geometry or asset failure: ' + JSON.stringify(value));
}
async function contrast(page) {
  return page.evaluate(() => {
    const probe = document.createElement('span'); document.body.append(probe);
    const rgb = token => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number); };
    const lum = color => color.map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const pairs = [['--text', '--surface'], ['--muted', '--surface'], ['--gold', '--tint'], ['--on-gold', '--gold-fill'], ['--success', '--success-bg'], ['--error', '--error-bg']];
    const ratios = pairs.map(([a, b]) => { const x = lum(rgb(a)), y = lum(rgb(b)); return { pair: `${a}/${b}`, ratio: Number(((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2)) }; });
    probe.remove(); return ratios;
  });
}
try {
  for (const direction of directions) for (const locale of ['ar', 'en']) for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
    const label = `${direction}-${locale}-${theme}-${width}`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', route => {
      if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    try {
      await page.goto(`http://127.0.0.1:3417/direction-${direction}/?lang=${locale}&theme=${theme}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const texts = await page.evaluate(() => ({ copy: KMT_PREVIEW[document.documentElement.lang], booking: KMT_CATALOGS.booking[document.documentElement.lang], chat: KMT_CATALOGS.chat[document.documentElement.lang] }));
      await expect(page.locator('.message')).toHaveCount(4);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await geometry(page);
      const primary = await page.locator('#open-booking').boundingBox();
      assert(primary && primary.y + primary.height <= 900, 'Primary booking action is below the initial viewport');
      const ratios = await contrast(page); assert(ratios.every(pair => pair.ratio >= 4.5), 'Contrast: ' + JSON.stringify(ratios));
      await page.screenshot({ path: path.join(output, 'images', `direction-${label}-chat.png`) });
      await page.locator('.chat-card').screenshot({ path: path.join(output, 'images', `direction-${label}-conversation.png`) });
      await page.locator('#open-booking').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible(); await geometry(page);
      await page.screenshot({ path: path.join(output, 'images', `direction-${label}-booking.png`) });
      await dialog.screenshot({ path: path.join(output, 'images', `direction-${label}-dialog.png`) });
      await page.locator('#full-name').fill(texts.copy.syntheticName); await page.locator('#phone').fill('01000000000');
      await page.locator('[name="appointment-time"]').first().check();
      await page.locator('#phone').fill('invalid'); await expect(page.locator('#phone-error')).toBeVisible();
      await expect(page.locator('#confirm-booking')).toBeDisabled(); await page.locator('#phone').fill('01000000000');
      await page.locator('#booking-consent').check();
      await expect(page.locator('#confirm-booking')).toBeEnabled();
      await page.screenshot({ path: path.join(output, 'images', `direction-${label}-review.png`) });
      await page.locator('[data-date="2026-10-19"]').click();
      await expect(page.locator('#full-name')).toHaveValue(texts.copy.syntheticName);
      await expect(page.locator('#phone')).toHaveValue('01000000000');
      await expect(page.locator('[name="appointment-time"]:checked')).toHaveCount(0);
      await expect(page.locator('#booking-consent')).toHaveCount(0);
      await page.locator('[data-date="2026-10-23"]').click();
      await expect(dialog.getByRole('status')).toContainText(texts.booking.availabilityReasons.CLOSED_WEEKLY);
      await expect(page.locator('[name="appointment-time"]')).toHaveCount(0);
      await expect(dialog.getByRole('button', { name: texts.booking.callback, exact: true })).toHaveCount(0);
      await page.locator('[data-action="nearest"]').click();
      await expect(page.locator('#direct-date')).toHaveValue('2026-10-24');
      await expect(page.locator('[name="appointment-time"]').first()).toBeChecked();
      await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
      await expect(page.locator('#open-booking')).toBeFocused();
      await page.locator('#open-booking').click(); await expect(page.locator('#full-name')).toHaveValue(texts.copy.syntheticName);
      await page.locator('#booking-consent').check(); await page.locator('#confirm-booking').click();
      await expect(dialog.getByRole('heading', { name: texts.copy.successTitle })).toBeVisible();
      await page.locator('[data-action="edit"]').click();
      await page.locator('[name="appointment-time"]').nth(1).check();
      await page.locator('#booking-consent').check(); await page.locator('#confirm-booking').click();
      await page.locator('[data-action="cancel"]').click(); await page.locator('[data-action="confirm-cancel"]').click();
      await expect(dialog.getByRole('heading', { name: texts.copy.cancelledTitle })).toBeVisible();
      await page.keyboard.press('Escape');
      for (const scenario of ['error', 'empty', 'review']) {
        await page.locator('#preview-state').selectOption(scenario);
        await expect(dialog).toBeVisible(); await geometry(page);
        if (scenario === 'error') { await expect(dialog.getByRole('alert')).toContainText(texts.copy.errorTitle); await page.locator('[data-action="retry-booking"]').click(); await expect(page.locator('[name="appointment-time"]')).toHaveCount(5); }
        if (scenario === 'empty') { await expect(dialog.getByRole('button', { name: texts.booking.callback, exact: true })).toBeVisible(); await expect(page.locator('[name="appointment-time"]')).toHaveCount(0); }
        await page.keyboard.press('Escape');
      }
      await page.locator('#preview-state').selectOption('normal');
      await page.locator('#message').fill(texts.copy.suggestion); await page.locator('#send-button').click();
      await expect(page.locator('#chat-feedback [role="status"]')).toContainText(texts.chat.waiting);
      await expect(page.locator('.message')).toHaveCount(6);
      await page.locator('#preview-state').selectOption('staff');
      const assistants = await page.locator('.message.assistant').count();
      await page.locator('#message').fill(texts.copy.suggestion); await page.locator('#send-button').click();
      await expect(page.locator('.message.assistant')).toHaveCount(assistants);
      await expect(page.locator('.message.staff')).toHaveCount(1);
      await page.locator('#preview-state').selectOption('waiting'); await expect(page.locator('#send-button')).toBeDisabled();
      await page.locator('#preview-state').selectOption('normal');
      await page.locator('#open-booking').click();
      for (let i = 0; i < 28; i++) { await page.keyboard.press('Tab'); assert(await dialog.evaluate(d => d.contains(document.activeElement)), 'Focus escaped modal'); }
      await geometry(page); await page.keyboard.press('Escape');
      await page.setViewportSize({ width: 360, height: 780 }); await geometry(page); await page.locator('#open-booking').click(); await geometry(page);
      assert(errors.length === 0, 'Console/page errors: ' + errors.join(' | '));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      assert(await page.locator('.btn').first().evaluate(button => getComputedStyle(button).transitionDuration.includes('0.16s')), 'Normal motion token missing');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert(await page.locator('.btn').first().evaluate(button => getComputedStyle(button).transitionDuration === '0s'), 'Reduced motion not honored');
      results.push({ label, status: 'PASS', ratios, checks: ['chat', 'booking', 'retained-contact', 'reset-selection-consent', 'closed-day-next', 'confirm-edit-cancel', 'error-empty-review', 'local-send-staff-waiting', 'focus-Escape', 'geometry-360', 'assets', 'reduced-motion'] });
      console.log('PASS', label);
    } catch (error) { issues.push({ label, message: error.message }); console.log('FAIL', label, error.message.slice(0, 260)); await page.screenshot({ path: path.join(output, 'images', `failure-${label}.png`) }).catch(() => {}); }
    finally { await context.close(); }
  }
} finally {
  await browser.close();
  await mkdir(path.join(output, 'qa'), { recursive: true });
  const report = { date: '2026-10-15', environment: 'Local standalone HTML / synthetic data / Chrome', directions, results, issues, externalRequests: external, summary: { passed: results.length, failed: issues.length } };
  await writeFile(path.join(output, 'qa', requested ? `direction-${requested}-results.json` : 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  if (issues.length || external.length) process.exitCode = 1;
}
