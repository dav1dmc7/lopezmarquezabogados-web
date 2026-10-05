import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url).pathname;
const MAX_SVG = 750_000;
const MAX_RASTER = 1_500_000;
const MAX_ANY = 2_000_000;
const findings = [];
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}

if (!existsSync(ROOT)) {
  console.error(`Missing build directory: ${ROOT}`);
  process.exit(1);
}

walk(ROOT);
const textFiles = files.filter((f) => /\.(html|css|svg)$/i.test(f));
const textSources = new Map(textFiles.map((f) => [f, readFileSync(f, 'utf8')]));

const assets = [];
for (const file of files) {
  const bytes = statSync(file).size;
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  const lower = rel.toLowerCase();
  const isAsset = /\.(svg|png|jpe?g|webp|avif|gif|ico)$/i.test(lower);
  if (bytes > MAX_ANY) findings.push(`${rel}: ${bytes} bytes > ${MAX_ANY} (general asset budget)`);
  if (/\.svg$/i.test(file) && bytes > MAX_SVG) findings.push(`${rel}: SVG ${bytes} bytes > ${MAX_SVG}`);
  if (/\.(png|jpe?g|webp|avif)$/i.test(file) && bytes > MAX_RASTER) findings.push(`${rel}: raster image ${bytes} bytes > ${MAX_RASTER}`);
  if (isAsset) assets.push({ rel, bytes });
}

function refVariants(rel) {
  const fileName = rel.split('/').pop();
  return [
    `/${rel}`,
    rel,
    `./${fileName}`,
    `./${rel}`,
    fileName,
  ];
}

function isReferenced(rel) {
  const needles = refVariants(rel);
  for (const [file, source] of textSources.entries()) {
    if (file === join(ROOT, rel)) continue;
    if (needles.some((n) => source.includes(n))) return true;
  }
  return false;
}

assets.forEach((a) => { a.referenced = isReferenced(a.rel); });
assets.sort((a, b) => b.bytes - a.bytes);

console.log('=== LOCAL ASSET QUALITY ===');
console.log(`dist files: ${files.length}`);
console.log('largest assets:');
for (const row of assets.slice(0, 15)) {
  console.log(`  ${String(row.bytes).padStart(9)} ${row.referenced ? '[USED] ' : '[UNUSED?]'}${row.rel}`);
}
if (findings.length) {
  for (const f of findings) console.log(`WARNING: ${f}`);
} else {
  console.log('Asset warnings: 0');
}

const oversizedUnreferenced = assets.filter((a) => a.bytes > MAX_RASTER && !a.referenced);
if (oversizedUnreferenced.length) {
  console.log('INFO: oversized assets not referenced anywhere in HTML/CSS/SVG should be reviewed before deployment.');
}
