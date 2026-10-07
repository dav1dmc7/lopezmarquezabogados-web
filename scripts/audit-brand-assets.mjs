import { existsSync, statSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const candidates = [
  'public/brand/logo.svg',
];
const referenceCandidates = [
  'docs/brand-reference/lopez_marquez_abogados_logo_premium.png',
  'docs/brand-reference/Logo_LM.png',
];

function size(rel) {
  const p = join(root, rel);
  return existsSync(p) ? statSync(p).size : null;
}

function dimensions(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  try {
    if (process.platform === 'darwin') {
      const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', p], { encoding: 'utf8' });
      const w = out.match(/pixelWidth:\s*(\d+)/)?.[1];
      const h = out.match(/pixelHeight:\s*(\d+)/)?.[1];
      if (w && h) return `${w}x${h}`;
    }
  } catch {}
  return null;
}

console.log('=== BRAND ASSET DIAGNOSTICS ===');
console.log('Shipped brand assets:');
for (const rel of candidates) {
  const bytes = size(rel);
  if (bytes == null) continue;
  const dims = dimensions(rel) ?? 'dimensions unavailable';
  console.log(`${rel}: ${bytes} bytes; ${dims}`);
}
console.log('Preserved source references (not shipped):');
for (const rel of referenceCandidates) {
  const bytes = size(rel);
  if (bytes == null) continue;
  const dims = dimensions(rel) ?? 'dimensions unavailable';
  console.log(`${rel}: ${bytes} bytes; ${dims}`);
}

const layoutFiles = [];
for (const rel of ['src/layouts/Layout.astro', 'src/components/PageHero.astro', 'public/site.js']) {
  const p = join(root, rel);
  if (existsSync(p)) layoutFiles.push([rel, readFileSync(p, 'utf8')]);
}
for (const [rel, text] of layoutFiles) {
  if (/lopez_marquez_abogados_logo_premium|Logo_LM|brand\/logo\.svg/.test(text)) {
    console.log(`reference source: ${rel}`);
  }
}
console.log('No visual asset was modified by this diagnostic audit.');
