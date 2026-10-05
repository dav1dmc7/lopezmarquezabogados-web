import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];

const site = read('src/lib/site.ts');
const layout = read('src/layouts/Layout.astro');
const cta = read('src/components/CTA.astro');
const home = read('src/pages/index.astro');
const contact = read('src/pages/contacto.astro');
const empresas = read('src/pages/empresas/index.astro');
const extranjeria = read('src/pages/extranjeria/index.astro');
const about = read('src/pages/sobre-nosotros.astro');

if (!site.includes("emailHref:")) errors.push('site.ts: emailHref missing');
if (!cta.includes('emailHref') || cta.includes('site.whatsapp')) errors.push('CTA.astro: must be email-first and must not embed WhatsApp');
if (!empresas.includes('CompanySelfAssessment')) errors.push('empresas/index.astro: CompanySelfAssessment missing');
if (!extranjeria.includes('ExtranjeriaTriage')) errors.push('extranjeria/index.astro: ExtranjeriaTriage missing');
if (!layout.includes('floating-contact')) errors.push('Layout.astro: floating contact missing');
if (!layout.includes('href={site.whatsapp}')) errors.push('Layout.astro: floating WhatsApp contact missing');
if (!layout.includes('data-track="whatsapp_click"')) errors.push('Layout.astro: floating WhatsApp tracking missing');
if (layout.includes('class="floating-wa"')) errors.push('Layout.astro: obsolete floating-wa class remains');
if (home.includes('Escribir por WhatsApp')) errors.push('index.astro: WhatsApp still used as primary home CTA');
if (contact.includes('Continuar por WhatsApp')) errors.push('contacto.astro: WhatsApp still used as primary form action');
if (/firma pequeñ?a|nueva web/i.test(home + '\n' + about)) errors.push('positioning: unwanted small-firm/new-website language remains');
if (!read('public/company-self-assessment.js').includes('company_assessment_email_click')) errors.push('company-self-assessment.js: analytics hook missing');
if (!read('public/extranjeria-triage.js').includes('immigration_triage_email_click')) errors.push('extranjeria-triage.js: analytics hook missing');

console.log(`Lead tools/contact checks: ${errors.length ? 'ERROR' : 'OK'}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length) process.exit(1);

const enHome = read('src/pages/en/index.astro');
const enImmigration = read('src/pages/en/immigration/index.astro');
const enBusiness = read('src/pages/en/business/index.astro');
if (!enHome.includes('/en/contact')) errors.push('English home: contact route missing');
if (!enImmigration.includes('ExtranjeriaTriage')) errors.push('English immigration: route finder missing');
if (!enBusiness.includes('CompanySelfAssessment')) errors.push('English business: self-assessment missing');
if (layout.includes("{isEnglish ? 'Email us' : 'Email'}")) errors.push('Layout: WhatsApp floating label mismatch');

console.log(`English lead checks: ${errors.length ? 'ERROR' : 'OK'}`);
