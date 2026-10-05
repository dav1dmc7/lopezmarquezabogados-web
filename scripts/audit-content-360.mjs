import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const pagesRoot = join(root, 'src/pages');
const pageHeroPath = join(root, 'src/components/PageHero.astro');
const errors = [];
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
const placeholderRe = /(?:lorem ipsum|texto provisional|contenido provisional|contenido pendiente|por definir|pendiente de completar|\bTODO\b|\bTBD\b|xxxxx+)/i;

function renderedMarkup(source) {
  let value = source;
  value = value.replace(/\A---[\s\S]*?---/m, ' ');
  value = value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  value = value.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  value = value.replace(/<!--[\s\S]*?-->/g, ' ');
  return value;
}

function editorialText(source) {
  return renderedMarkup(source).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

for (const file of files) {
  const source = read(file);
  const rel = relative(root, file).replaceAll('\\', '/');
  const visibleSource = renderedMarkup(source);
  const rawH1Count = (visibleSource.match(/<h1\b/gi) || []).length;
  const usesPageHero = /import\s+PageHero\s+from\s+['"][^'"]*\/PageHero\.astro['"]/.test(source) && /<PageHero\b/.test(source);
  const renderedH1Count = rawH1Count + (usesPageHero && pageHeroHasH1 && rawH1Count === 0 ? 1 : 0);
  const text = editorialText(source);

  if (placeholderRe.test(text)) errors.push(`${rel}: placeholder editorial text detected`);
  if (renderedH1Count !== 1) warnings.push(`${rel}: expected exactly one rendered H1, found ${renderedH1Count}`);

  const isLegal = /(?:privacy|privacidad|cookies|aviso-legal|legal-notice)/i.test(rel);
  const hasContextualContact = /data-track=|mailto:|tel:|whatsapp|\/contacto|\/en\/contact/i.test(visibleSource) || /import\s+CTA\s+from\s+['"][^'"]*\/CTA\.astro['"]/.test(source);
  if (!hasContextualContact && !isLegal) warnings.push(`${rel}: no obvious contextual contact path`);
}

console.log(`Content/360 QA pages: ${files.length}`);
console.log(`Content/360 QA errors: ${errors.length}`);
console.log(`Content/360 QA warnings: ${warnings.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) process.exit(1);
