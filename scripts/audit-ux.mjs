import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const pagesRoot = join(root, 'src', 'pages');
const site = readFileSync(join(root, 'src', 'lib', 'site.ts'), 'utf8');
const layout = readFileSync(join(root, 'src', 'layouts', 'Layout.astro'), 'utf8');
const errors = [];
const isInformationalLegal = (rel) => /(?:aviso-legal|privacidad|privacy|cookies|legal-notice)/i.test(rel);
const warnings = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.astro') && !name.startsWith('404')) out.push(full);
  }
  return out;
}

function routeFromFile(file) {
  const rel = relative(pagesRoot, file).replaceAll('\\', '/');
  if (rel === 'index.astro') return '/';
  return '/' + rel.replace(/\.astro$/, '').replace(/\/index$/, '');
}

const pages = walk(pagesRoot);
const commercial = pages.filter((file) => {
  const p = routeFromFile(file);
  return !p.startsWith('/recursos/') && !p.startsWith('/en/resources/') &&
    !p.includes('/legal-notice') && !p.includes('/privacy') && !p.includes('/cookies') &&
    !p.endsWith('/faqs') && !p.endsWith('/preguntas-frecuentes') &&
    !p.endsWith('/legal-updates') && !p.endsWith('/actualidad-juridica') &&
    !p.endsWith('/sitemap.xml');
});

// Conversion paths available site-wide through Layout.astro.
const globalContact =
  layout.includes('class="floating-contact"') &&
  layout.includes('site.whatsapp') &&
  layout.includes('site.emailHref') &&
  layout.includes('site.phoneHref');

if (!globalContact) {
  errors.push('Layout: expected site-wide WhatsApp, email and phone conversion paths');
}

for (const file of commercial) {
  const source = readFileSync(file, 'utf8');
  const rel = relative(root, file).replaceAll('\\', '/');
  const isEnglish = rel.startsWith('src/pages/en/');

  const hasLocalContact =
    /href=["'](?:\/contacto|\/en\/contact)["']/.test(source) ||
    source.includes('site.emailHref') ||
    source.includes('site.phoneHref') ||
    source.includes('site.whatsapp');

  const hasHeroCTA =
    (source.includes('<PageHero') && source.includes('primaryLabel=')) ||
    /class=["'][^"']*hero-actions[^"']*/.test(source) ||
    source.includes('<CTA ');

  // Global contact is valid conversion coverage; local CTA is an additional quality signal.
  if (!hasLocalContact && !globalContact) {
    errors.push(`${rel}: no contact path detected locally or through Layout`);
  }

  if (!hasHeroCTA) {
    if (!isInformationalLegal(rel)) warnings.push(`${rel}: no prominent contextual CTA detected; review conversion hierarchy`);
  }

  if (isEnglish && /href=["']\/empresas\//.test(source)) {
    errors.push(`${rel}: Spanish business path found in English page`);
  }
  if (!isEnglish && /href=["']\/en\//.test(source)) {
    warnings.push(`${rel}: English internal link found; confirm deliberate language handoff`);
  }
}

if (!layout.includes('/brand/Logo_LM.png')) {
  errors.push('Layout: official black-background logo not referenced');
}
if (!existsSync(join(root, 'public', 'brand', 'Logo_LM.png'))) {
  errors.push('public/brand/Logo_LM.png missing from working tree');
}
if (!existsSync(join(root, 'public', 'brand', 'logo.svg'))) {
  errors.push('public/brand/logo.svg missing from working tree');
}
if (!site.includes("'/en/business/employment-advice': '/empresas/asesoramiento-laboral'")) {
  errors.push('site.ts: business employment route pair is not reciprocal');
}
if (!site.includes("'/empresas/asesoramiento-laboral': '/en/business/employment-advice'")) {
  errors.push('site.ts: Spanish business employment route pair is not reciprocal');
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (!packageJson.scripts?.audit?.includes('audit-ux.mjs')) {
  errors.push('package.json: audit-ux.mjs not chained into npm audit');
}

console.log(`UX / authority audit: ${pages.length} Astro pages inspected.`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
for (const e of errors) console.error(`ERROR ${e}`);
for (const w of warnings) console.warn(`WARN ${w}`);
if (errors.length) process.exit(1);
