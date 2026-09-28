import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const pagesRoot = join(root, 'src', 'pages');
const routeFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.astro') && !name.startsWith('404')) routeFiles.push(full);
  }
}
walk(pagesRoot);

const routeFromFile = (file) => {
  const rel = file.replace(join(root, 'src', 'pages') + '/', '');
  if (rel === 'index.astro') return '/';
  if (rel === 'sitemap.xml.ts') return '/sitemap.xml';
  return '/' + rel.replace(/\.astro$/, '').replace(/\/index$/, '');
};
const knownRoutes = new Set(routeFiles.map(routeFromFile));
const errors=[]; const warnings=[];
for (const file of routeFiles) {
  const text = readFileSync(file, 'utf8');
  const rel = file.replace(root, '');
  if (!text.includes('<Layout')) errors.push(`${rel}: no Layout component`);
  if (!/title="[^"]{20,}"/.test(text) && !/title=\{/.test(text)) warnings.push(`${rel}: check page title length`);
  if (!/description="[^"]{50,}"/.test(text) && !/description=\{/.test(text)) warnings.push(`${rel}: check meta description length`);
  if (text.includes('example.com') || text.includes('[Insertar]') || text.includes('TODO')) errors.push(`${rel}: placeholder content detected`);
  if (text.includes('cite')) errors.push(`${rel}: web citation token leaked into source`);
  for (const m of text.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (href === '/sitemap.xml' || href.startsWith('/assets')) continue;
    if (!knownRoutes.has(href)) errors.push(`${rel}: broken internal href ${href}`);
  }
}
for (const file of ['public/_redirects','public/_headers','public/robots.txt','src/pages/sitemap.xml.ts']) if (!existsSync(join(root,file))) errors.push(`${file}: missing`);

console.log(`Pages scanned: ${routeFiles.length}`);
console.log(`Routes registered: ${knownRoutes.size}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
for (const e of errors) console.error(`ERROR ${e}`);
for (const w of warnings) console.warn(`WARN ${w}`);
if (errors.length) process.exit(1);
