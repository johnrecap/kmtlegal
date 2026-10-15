import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = process.cwd(), folder = path.join(root, 'design-preview/consultation');
const sha = data => createHash('sha256').update(data).digest('hex');
async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(file)); else found.push(file);
  }
  return found;
}
const issues = [], files = await walk(folder), checks = [];
await writeFile(path.join(folder, 'qa/manifest.json'), JSON.stringify({ status: 'NOT_VERIFIED', reason: 'Awaiting evidence finalization' }), { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
for (const file of files.filter(file => /\.(js|mjs)$/.test(file))) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); checks.push(path.relative(root, file)); }
  catch { issues.push({ file: path.relative(root, file), error: 'JS syntax failed' }); }
}
const docs = files.filter(file => file.endsWith('.md')).concat([
  path.join(root, 'docs/ui-redesign/CONSULTATION_DESIGN.md'),
  path.join(root, 'docs/ui-redesign/CONSULTATION_INTEGRATION_PLAN.md')
]);
let links = 0;
for (const file of docs) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split(/[?#]/)[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    try { await stat(path.resolve(path.dirname(file), decodeURIComponent(target))); links++; }
    catch { issues.push({ file: path.relative(root, file), error: 'Broken local doc link', target }); }
  }
}
const matrix = JSON.parse(await readFile(path.join(folder, 'qa/results.json'), 'utf8'));
const gallery = JSON.parse(await readFile(path.join(folder, 'qa/gallery-results.json'), 'utf8'));
const production = JSON.parse(await readFile(path.join(folder, 'qa/production-results.json'), 'utf8'));
const finalBrowser = JSON.parse(await readFile(path.join(folder, 'qa/production-final-browser.json'), 'utf8'));
if (!production.complete || production.results.length !== 8 || finalBrowser.stats.expected !== 8 || finalBrowser.stats.unexpected || finalBrowser.stats.skipped) issues.push({ error: 'Production source verification incomplete' });
if (matrix.summary.passed !== 40 || matrix.summary.failed || matrix.externalRequests.length) issues.push({ error: 'Prototype matrix incomplete' });
if (gallery.summary.passed !== 13 || gallery.summary.failed) issues.push({ error: 'Gallery matrix incomplete' });
execFileSync('git', ['diff', '--check'], { stdio: 'pipe' });
execFileSync('git', ['diff', '--cached', '--check'], { stdio: 'pipe' });
await writeFile(path.join(folder, 'qa/static-results.json'), JSON.stringify({ date: '2026-10-15', syntaxFiles: checks, localDocLinks: links, diffCheck: 'PASS', issues }, null, 2));
if (issues.length) { console.log(JSON.stringify({ issues })); process.exitCode = 1; }
else {
  const trackedDocs = ['PROJECT_GUIDE.md', 'docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md', 'docs/SERVER_COMMANDS.md', 'docs/ui-redesign/DECISIONS.md', 'docs/ui-redesign/CONSULTATION_DESIGN.md', 'docs/ui-redesign/CONSULTATION_INTEGRATION_PLAN.md'];
  const sources = ['src/app/globals.css', 'src/content/conversation-copy.ts', 'src/content/assistant-policy-copy.ts', 'src/content/direct-booking-copy.ts', 'src/features/public-site/conversational-booking-chat.tsx', 'src/features/public-site/direct-booking-panel.tsx', 'src/features/public-site/booking-availability-picker.tsx', 'src/features/public-site/consultation-experience.css', 'src/features/public-site/public-pages.tsx', 'src/components/ui/dialog.tsx', 'tests/e2e/consultation-direction-two.spec.ts', 'tests/e2e/conversational-intake.spec.ts'];
  const evidence = (await walk(folder)).filter(file => !file.endsWith(path.join('qa', 'manifest.json'))).concat([...trackedDocs, ...sources].map(file => path.join(root, file)));
  const entries = [];
  for (const file of evidence) { const bytes = await readFile(file); entries.push({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: sha(bytes), bytes: bytes.length }); }
  await writeFile(path.join(folder, 'qa/manifest.json'), JSON.stringify({ date: '2026-10-15', applicationBaseline: 'dbdc9268b4286fe10c3893f7eab1fb1c09d9b533', headAtEvidenceTime: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), selectedDirection: '02', selectionAuthority: 'Owner message: التصميمين دول كويسين اعتمدهم; two supplied screenshots retained; later explicit implementation/commit/push request and spacious bounded reading requirement', appearanceApproved: true, productionImplementation: true, serverDeployment: 'NOT_VERIFIED', templateBatchChecker: 'NOT_APPLICABLE: no prescribed Markdown template batch', verification: { prototype: matrix.summary, gallery: gallery.summary, productionCaptures: production.results.length, finalBuildBrowser: finalBrowser.stats, syntax: checks.length, localDocLinks: links }, limits: ['Root self-review only', 'Local Chrome and synthetic fixtures', 'No physical-device keyboard or non-Chromium browser acceptance', 'No actual model or production-server booking verification'], entries }, null, 2));
  console.log(JSON.stringify({ syntaxFiles: checks.length, docLinks: links, artifacts: entries.length, prototype: matrix.summary, gallery: gallery.summary, status: 'PASS' }));
}
