import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const site = read('src/lib/site.ts');
const layout = read('src/layouts/Layout.astro');
const calc = read('src/components/IndemnizacionCalculator.astro');
const calcJs = read('public/indemnizacion-calculator.js');
const triage = read('src/components/ExtranjeriaTriage.astro');
const triageJs = read('public/extranjeria-triage.js');
const company = read('src/components/CompanySelfAssessment.astro');
const redirects = read('public/_redirects');

for (const required of [
  'src/pages/en/index.astro', 'src/pages/en/employment/index.astro', 'src/pages/en/immigration/index.astro',
  'src/pages/en/employment/temporary-sickness-leave.astro', 'src/pages/en/employment/permanent-disability.astro',
  'src/pages/en/business/index.astro', 'src/pages/en/about.astro', 'src/pages/en/faqs.astro', 'src/pages/en/contact.astro',
  'src/pages/en/resources/index.astro', 'src/pages/en/resources/first-hours-after-dismissal.astro', 'src/pages/en/resources/dismissal-deadline-spain.astro', 'src/pages/en/resources/arraigo-two-years-spain.astro', 'src/pages/en/resources/spanish-nationality-residence-period.astro', 'src/pages/en/legal-updates.astro'
]) if (!existsSync(join(root, required))) errors.push(`missing English route: ${required}`);

for (const needle of ["'/laboral': '/en/employment'", "'/extranjeria': '/en/immigration'", "'/sobre-nosotros': '/en/about'", "'/preguntas-frecuentes': '/en/faqs'", "'/contacto': '/en/contact'"]) {
  if (!site.includes(needle)) errors.push(`localizedPathMap missing: ${needle}`);
}

if (!layout.includes('href={isEnglish ? \'/en\' : \'/\'}')) errors.push('Layout: brand does not return to current language home');
if (!layout.includes("{isEnglish ? 'WhatsApp us' : 'WhatsApp'}")) errors.push('Layout: floating WhatsApp labels are not localized');
if (layout.includes('class="floating-contact"') && layout.includes('{isEnglish ? \'Email us\' : \'Email\'}')) errors.push('Layout: floating contact still says Email while opening WhatsApp');
if (!layout.includes("isEnglish ? 'Primary navigation' : 'Navegación principal'")) errors.push('Layout: navigation language labels missing');
if (!layout.includes("isEnglish ? 'Office' : 'Despacho'")) errors.push('Layout: footer office heading not localized');

if (!calc.includes('lang="en"') && !calc.includes("lang?: 'es' | 'en'")) errors.push('calculator: English mode unavailable');
if (!calcJs.includes('monthlySalary(annualSalary) * 12')) errors.push('calculator: objective cap not based on 12 monthly payments');
if (!calcJs.includes('monthly * 24')) errors.push('calculator: unfair cap not based on 24 monthly payments');
if (!triage.includes('data-locale')) errors.push('triage: locale missing');
if (!triageJs.includes("form.dataset.locale") || !triageJs.includes("const en =")) errors.push('triage JS: locale-aware route selection missing');
if (!company.includes('data-locale')) errors.push('company assessment: locale missing');

for (const legacy of ['/es/index.html / 301', '/en/index_en.html /en 301', '/laboral/asesoramiento-empresas /empresas/asesoramiento-laboral 301']) {
  if (!redirects.includes(legacy)) errors.push(`_redirects missing 301: ${legacy}`);
}
if (redirects.includes('/en/index_en.html /\n')) errors.push('legacy English index still redirects to Spanish home');

console.log(`International QA errors: ${errors.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);

const enFiles = [];
for (const f of ['src/pages/en/index.astro','src/pages/en/business/index.astro','src/pages/en/resources/index.astro']) { enFiles.push(read(f)); }
if (enFiles.join('\n').includes('href="/empresas/')) errors.push('English commercial navigation contains an unintended Spanish business link');
