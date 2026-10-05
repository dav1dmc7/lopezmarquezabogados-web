import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const pagesRoot = join(root, 'src/pages');
const pageHeroPath = join(root, 'src/components/PageHero.astro');
const errors = [];
const isInformationalLegal = (rel) => /(?:aviso-legal|privacidad|privacy|cookies|legal-notice)/i.test(rel);
const warnings = [];
const files = [];

const read = (file) => readFileSync(file, 'utf8');

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (entry.isFile() && entry.name.endsWith('.astro')) files.push(abs);
  }
}

walk(pagesRoot);

const pageHeroHasH1 = existsSync(pageHeroPath) && /<h1\b/i.test(read(pageHeroPath));

for (const file of files) {
  const source = read(file);
  const rel = relative(root, file).replaceAll('\\\\', '/');
  const rawH1Count = (source.match(/<h1\b/gi) || []).length;
  const usesPageHero = /import\s+PageHero\s+from\s+['"][^'"]*\/PageHero\.astro['"]/.test(source) && /<PageHero\b/.test(source);
  const renderedH1Count = rawH1Count + (usesPageHero && pageHeroHasH1 && rawH1Count === 0 ? 1 : 0);

  if (renderedH1Count !== 1) {
    warnings.push(`${rel}: expected exactly one rendered H1, found ${renderedH1Count}`);
  }

  if (!/data-track=|mailto:|tel:|whatsapp|\/contacto|\/en\/contact/i.test(source) && !/privacy|privacidad|cookies|aviso-legal/i.test(rel)) {
    if (!isInformationalLegal(rel)) warnings.push(`${rel}: no obvious contact/lead path detected`);
  }
}

console.log(`360 current QA pages: ${files.length}`);
console.log(`360 current QA errors: ${errors.length}`);
console.log(`360 current QA warnings: ${warnings.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) process.exit(1);
