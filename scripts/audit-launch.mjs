import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const pages = [];
const errors = [];
const warnings = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.astro')) pages.push(full);
  }
}
walk(join(root, 'src/pages'));

const read = (file) => readFileSync(join(root, file), 'utf8');
const layout = read('src/layouts/Layout.astro');
const site = read('src/lib/site.ts');
const siteJs = read('public/site.js');
const packageSource = read('package.json');

const internalTone = [
  /informaci[oó]n jur[ií]dica [uú]til, sin convertirla en asesoramiento autom[aá]tico/i,
  /publicamos gu[ií]as para entender conceptos/i,
  /el objetivo no es vender consultas/i,
  /una firma peque[nñ]a/i,
  /la nueva web est[aá] construida/i,
  /no es un bolet[ií]n autom[aá]tico/i
];

if (!site.includes("emailHref: 'mailto:lopezmarquezabogados@gmail.com'")) errors.push('site.ts: emailHref canonical missing');
if (!site.includes("phone: '+34 695 385 198'")) errors.push('site.ts: production phone mismatch');
if (site.includes('695 802 513') || site.includes('34695802513')) errors.push('site.ts: old phone remains');
if (!site.includes("'/actualidad-juridica'") || !site.includes("'/recursos/primeras-horas-despido'")) errors.push('site.ts: strategic routes missing');
if (!site.includes('localizedPathMap')) errors.push('site.ts: localizedPathMap missing');

if (layout.includes('floating-wa')) errors.push('Layout: obsolete floating WhatsApp');
if (/data-track="email_click"[^>]*data-track="email_click"/.test(layout)) errors.push('Layout: duplicate email tracking attribute');
if (!layout.includes("aria-current={isNavActive('/actualidad-juridica') ? 'page' : undefined}")) errors.push('Layout: Actualidad active state missing');
if (!layout.includes('og:image:width') || !layout.includes('twitter:image')) errors.push('Layout: social metadata incomplete');
if (!layout.includes('hreflang')) errors.push('Layout: hreflang missing');
if (!layout.includes('language-switch')) errors.push('Layout: language switch missing');

if (siteJs.includes('form.dataset.whatsapp')) errors.push('site.js: legacy WhatsApp form');
if (!siteJs.includes('mailto:${destination}')) errors.push('site.js: email mailto flow missing');
if (!siteJs.includes('prefers-reduced-motion')) errors.push('site.js: reduced-motion check missing');
if (!siteJs.includes('is-scrolled')) errors.push('site.js: header scroll state missing');

if (!packageSource.includes('audit-launch.mjs')) errors.push('package.json: final audit not integrated');


const redirects = read('public/_redirects');

const legacyRedirects = [
  ['/es/index.html', '/'],
  ['/es/about.html', '/sobre-nosotros'],
  ['/es/servicios.html', '/otras-areas'],
  ['/es/laboral.html', '/laboral'],
  ['/es/extranjeria.html', '/extranjeria'],
  ['/es/civil.html', '/civil'],
  ['/es/penal.html', '/penal'],
  ['/es/administrativo.html', '/administrativo'],
  ['/es/contact.html', '/contacto'],
  ['/es/faqs.html', '/preguntas-frecuentes'],
  ['/en/index_en.html', '/en'],
  ['/en/about_en.html', '/en/about'],
  ['/en/servicios_en.html', '/en'],
  ['/en/laboral_en.html', '/en/employment'],
  ['/en/extranjeria_en.html', '/en/immigration'],
  ['/en/civil_en.html', '/en'],
  ['/en/penal_en.html', '/en'],
  ['/en/administrativo_en.html', '/en'],
  ['/en/contact_en.html', '/en/contact'],
  ['/en/faqs_en.html', '/en/faqs']
];

for (const [legacy, destination] of legacyRedirects) {
  if (!redirects.includes(`${legacy} ${destination} 301`)) {
    errors.push(`_redirects: missing ${legacy} -> ${destination}`);
  }
}

const updates = read('src/data/legalUpdates.ts');
const requiredOfficialUpdates = [
  'BOE-A-2026-19200',
  'BOE-A-2026-8284',
  'BOE-A-2026-18504',
  'BOE-A-2026-20265'
];

for (const reference of requiredOfficialUpdates) {
  if (!updates.includes(reference)) {
    errors.push(`legalUpdates: missing ${reference}`);
  }
}

const actualidad = read('src/pages/actualidad-juridica.astro');
if (!actualidad.includes('Revisión actual: 1 de octubre de 2026')) {
  errors.push('actualidad: stale review date');
}
if (!actualidad.includes('La publicación oficial prevalece sobre este resumen.')) {
  errors.push('actualidad: official source notice missing');
}

const calculator = read('src/components/IndemnizacionCalculator.astro');
if (!calculator.includes('poderjudicial.es/cgpj/es/Servicios/Utilidades/Calculo-de-indemnizaciones')) {
  errors.push('calculator: CGPJ reference missing');
}
if (!calculator.includes('boe.es/eli/es/rdlg/2015/10/23/2/con')) {
  errors.push('calculator: Estatuto BOE reference missing');
}

for (const file of pages) {
  const source = readFileSync(file, 'utf8');
  const rel = file.replace(root, '');
  if (/\bTODO\b|\[Insertar\]|example\.com/.test(source)) errors.push(`${rel}: placeholder/TODO`);
  if (/target="_blank"(?![^>]*rel=)/.test(source)) errors.push(`${rel}: target blank without rel`);
  if (source.includes('695 802 513') || source.includes('34695802513')) errors.push(`${rel}: old phone`);
  for (const pattern of internalTone) {
    if (pattern.test(source)) errors.push(`${rel}: internal copy pattern`);
  }
}

for (const file of ['src/pages/aviso-legal.astro', 'src/pages/privacidad.astro', 'src/pages/cookies.astro']) {
  if (!read(file).includes('noindex={true}')) errors.push(`${file}: expected noindex until legal data is final`);
}

for (const file of ['public/_headers', 'public/_redirects', 'public/robots.txt', 'src/pages/sitemap.xml.ts']) {
  if (!existsSync(join(root, file))) errors.push(`${file}: missing`);
}

console.log(`Launch QA pages: ${pages.length}`);
console.log(`Launch QA errors: ${errors.length}`);
console.log(`Launch QA warnings: ${warnings.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) process.exit(1);
