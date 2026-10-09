import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const files = ['src/content/public-content.ar.ts', 'src/content/public-content.en.ts', 'src/features/public-site/public-pages.tsx', 'src/features/public-site/public-components.tsx', 'src/features/public-site/firm-industries-pages.tsx'];
const documents = await Promise.all(files.map(async file => ({ file, source: await readFile(file, 'utf8') })));
const originals = [...new Set(documents.flatMap(({ source }) => [...source.matchAll(/\/stitch-assets\/[a-f0-9]+\.png/g)].map(match => match[0])))];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const records = [];
await mkdir('public/site-assets', { recursive: true });
for (const source of originals) {
  const input = await readFile(`public${source}`);
  const meta = await sharp(input).metadata();
  const output = await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer();
  const destination = `/site-assets/${source.split('/').pop().replace('.png', '')}-${hash(output).slice(0, 10)}.webp`;
  await writeFile(`public${destination}`, output);
  records.push({ source, destination, sourceHash: hash(input), outputHash: hash(output), beforeBytes: input.length, afterBytes: output.length, width: meta.width, height: meta.height, mode: 'aspect-preserving resize and WebP compression; no enlargement', verifiedOfficeOrTeamPhoto: false });
  for (const doc of documents) doc.source = doc.source.replaceAll(source, destination);
}
if (!records.length) throw new Error('No original references found; do not overwrite the existing manifest.');
for (const { file, source } of documents) await writeFile(file, source);
await mkdir('docs/reviews/2026-10-09/phase-two', { recursive: true });
await writeFile('docs/reviews/2026-10-09/phase-two/asset-optimization.json', JSON.stringify({ originalsPreserved: true, note: 'Inherited design imagery, not verified office/team photography. Original metadata/provenance remains in original files.', records }, null, 2));
console.log(JSON.stringify({ images: records.length, beforeBytes: records.reduce((n,r)=>n+r.beforeBytes,0), afterBytes: records.reduce((n,r)=>n+r.afterBytes,0) }));
