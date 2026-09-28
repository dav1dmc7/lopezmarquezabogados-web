import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const sourceRoot = join(root, 'src');
const pagesRoot = join(sourceRoot, 'pages');
const sourceFiles = [];
const pageFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.astro')) {
      sourceFiles.push(full);
      if (full.startsWith(pagesRoot) && !name.startsWith('404')) pageFiles.push(full);
    }
  }
}
walk(sourceRoot);

const routeFromFile = (file) => {
  const rel = file.replace(pagesRoot + '/', '');
  if (rel === 'index.astro') return '/';
  if (rel === 'sitemap.xml.ts') return '/sitemap.xml';
  return '/' + rel.replace(/\.astro$/, '').replace(/\/index$/, '');
};
const knownRoutes = new Set(pageFiles.map(routeFromFile));
const errors = [];
const warnings = [];

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  const rel = file.replace(root, '');
  const isPage = file.startsWith(pagesRoot) && file.endsWith('.astro') && !file.endsWith('/404.astro');

  if (isPage && !source.includes('<Layout')) errors.push(`${rel}: no Layout component`);
  if (isPage) {
    const rawH1 = (source.match(/<h1\b/g) || []).length;
    const generatedH1 = (source.match(/<PageHero\b/g) || []).length;
    if (rawH1 + generatedH1 !== 1) errors.push(`${rel}: expected exactly one H1 (raw=${rawH1}, PageHero=${generatedH1})`);
    if (!/title="[^"]{20,}"/.test(source) && !/title=\{/.test(source)) warnings.push(`${rel}: check page title length`);
    if (!/description="[^"]{50,}"/.test(source) && !/description=\{/.test(source)) warnings.push(`${rel}: check meta description length`);
  }
  if (source.includes('apiKey') || source.includes('AIzaSy')) errors.push(`${rel}: possible client-side API key detected`);
  if (/target="_blank"(?![^>]*rel=)/.test(source)) errors.push(`${rel}: target=_blank missing rel=noopener`);
  if (source.includes('example.com') || source.includes('[Insertar]') || source.includes('TODO')) errors.push(`${rel}: placeholder content detected`);
  if (source.includes('cite')) errors.push(`${rel}: web citation token leaked into source`);

  for (const match of source.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = match[1].replace(/\/$/, '') || '/';
    if (href === '/sitemap.xml' || href.startsWith('/assets') || ['/favicon.svg','/og-image.svg','/og-image.png','/robots.txt'].includes(href)) continue;
    if (!knownRoutes.has(href)) errors.push(`${rel}: broken internal href ${href}`);
  }
}

for (const file of ['public/_redirects', 'public/_headers', 'public/robots.txt', 'src/pages/sitemap.xml.ts']) {
  if (!existsSync(join(root, file))) errors.push(`${file}: missing`);
}

console.log(`Pages scanned: ${pageFiles.length}`);
console.log(`Source files scanned: ${sourceFiles.length}`);
console.log(`Routes registered: ${knownRoutes.size}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
for (const e of errors) console.error(`ERROR ${e}`);
for (const w of warnings) console.warn(`WARN ${w}`);
if (errors.length) process.exit(1);
