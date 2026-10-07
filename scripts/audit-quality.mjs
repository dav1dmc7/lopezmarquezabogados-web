import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const sourceRoot = join(root, 'src');
const errors = [];
const pages = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.astro')) pages.push(full);
  }
}
walk(sourceRoot);

const read = (p) => readFileSync(join(root, p), 'utf8');
const site = read('src/lib/site.ts');
const layout = read('src/layouts/Layout.astro');
const hero = read('src/components/PageHero.astro');
const cta = read('src/components/CTA.astro');
const contact = read('src/pages/contacto.astro');
const faq = read('src/pages/preguntas-frecuentes.astro');

if (!site.includes("emailHref: 'mailto:lopezmarquezabogados@gmail.com'")) errors.push('site.ts: emailHref canonical missing');
if (!site.includes("'/actualidad-juridica'")) errors.push('site.ts: actualidad route missing from indexableRoutes');
if (!site.includes("'/recursos/primeras-horas-despido'")) errors.push('site.ts: primeras-horas-despido route missing from indexableRoutes');
const layoutWithoutMobileBar = layout.replace(/<div class="mobile-conversion-bar"[\s\S]*?<\/div>/, '');
if (layout.includes('floating-wa') || layoutWithoutMobileBar.includes('WhatsApp</a>')) errors.push('Layout.astro: duplicate WhatsApp floating/primary CTA remains');
if (!layout.includes('href={site.whatsapp}') || !layout.includes('href={site.phoneHref}') || !layout.includes('mobile_primary_cta')) errors.push('Layout.astro: mobile conversion bar must expose WhatsApp, calling and contact actions');
if (!layout.includes('twitter:title') || !layout.includes('twitter:description') || !layout.includes('twitter:image')) errors.push('Layout.astro: Twitter card metadata incomplete');
if (!hero.includes("const isWorkersDev = Astro.url.hostname.endsWith('.workers.dev');")) errors.push('PageHero.astro: workers.dev guard missing');
if (!hero.includes('{!isWorkersDev && <script type="application/ld+json"')) errors.push('PageHero.astro: breadcrumb JSON-LD still emitted on workers.dev');
if (cta.includes('site.whatsapp')) errors.push('CTA.astro: global CTA still routes directly to WhatsApp');
if (!contact.includes('data-endpoint="/api/contact"')) errors.push('contacto.astro: direct form endpoint missing');
if (!/name="email"/.test(contact)) errors.push('contacto.astro: email field missing');
if (!contact.includes('site.emailHref') && !contact.includes('site.email')) errors.push('contacto.astro: direct email fallback missing');
if (contact.includes('Continuar por WhatsApp')) errors.push('contacto.astro: old WhatsApp submit label remains');
if (faq.includes('Continuar por WhatsApp')) errors.push('preguntas-frecuentes.astro: old WhatsApp submit label remains');
if (!faq.includes('site.emailHref')) errors.push('preguntas-frecuentes.astro: email CTA missing');
if (!read('public/site.js').includes("form.dataset.endpoint || '/api/contact'")) errors.push('public/site.js: direct form flow missing');
if (read('public/site.js').includes('form.dataset.whatsapp')) errors.push('public/site.js: old WhatsApp form flow remains');

for (const path of pages) {
  const source = readFileSync(path, 'utf8');
  if (source.includes('695 802 513') || source.includes('34695802513')) errors.push(`${path.replace(root, '')}: old phone remains`);
  if (source.includes('example.com') || source.includes('[Insertar]') || source.includes('TODO')) errors.push(`${path.replace(root, '')}: placeholder content detected`);
  if (/target="_blank"(?![^>]*rel=)/.test(source)) errors.push(`${path.replace(root, '')}: target=_blank without rel`);
}

for (const required of ['public/_headers', 'public/robots.txt', 'src/pages/sitemap.xml.ts', 'scripts/audit.mjs', 'scripts/audit-production.mjs']) {
  if (!existsSync(join(root, required))) errors.push(`${required}: missing`);
}

const output = readFileSync(join(root, 'package.json'), 'utf8');
if (!output.includes('audit-quality.mjs')) errors.push('package.json: audit-quality not integrated');

console.log(`Quality pages inspected: ${pages.length}`);
console.log(`Quality errors: ${errors.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
