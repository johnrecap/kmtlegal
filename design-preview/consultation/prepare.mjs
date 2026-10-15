import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const root = process.cwd();
const output = path.join(root, 'design-preview/consultation');
await mkdir(path.join(output, 'shared/assets'), { recursive: true });
const catalogs = {};
for (const [key, file, exported] of [
  ['chat', 'conversation-copy', 'conversationCopy'],
  ['policy', 'assistant-policy-copy', 'assistantPolicyCopy'],
  ['booking', 'direct-booking-copy', 'directBookingCopy']
]) {
  const source = await readFile(path.join(root, 'src/content', file + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {} }; vm.runInNewContext(compiled, context);
  catalogs[key] = context.exports[exported];
}
await writeFile(path.join(output, 'shared/catalogs.js'), '/* Read-only snapshot of current application catalogs; regenerate with node design-preview/consultation/prepare.mjs. */\nwindow.KMT_CATALOGS = ' + JSON.stringify(catalogs, null, 2) + ';\n');
await copyFile(path.join(root, 'public/brand/kmt-official-logo-280d06c72f-256.webp'), path.join(output, 'shared/assets/kmt-logo.webp'));
for (const [family, subset, prefix, weights] of [
  ['ibm-plex-sans-arabic', 'arabic', 'arabic', [400, 500, 600, 700]],
  ['inter', 'latin', 'inter', [400, 500, 600]]
]) {
  for (const weight of weights) await copyFile(path.join(root, 'node_modules/@fontsource', family, 'files', `${family}-${subset}-${weight}-normal.woff2`), path.join(output, 'shared/assets', `${prefix}-${weight}.woff2`));
  await copyFile(path.join(root, 'node_modules/@fontsource', family, 'LICENSE'), path.join(output, 'shared/assets', `${prefix}-LICENSE.txt`));
}
console.log('Prepared local logo, licensed existing fonts and catalog snapshots. No application files changed.');
