import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'src/lib/site.ts', 'src/layouts/Layout.astro', 'src/pages/index.astro',
  'src/pages/contacto.astro', 'src/components/IndemnizacionCalculator.astro',
  'public/site.js', 'public/indemnizacion-calculator.js',
  'src/pages/actualidad-juridica.astro', 'src/pages/recursos/primeras-horas-despido.astro'
];
const errors = [];
const warnings = [];
const read = (file) => existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '';

for (const file of required) {
  if (!existsSync(join(root, file))) errors.push(`missing: ${file}`);
}

const site = read('src/lib/site.ts');
const layout = read('src/layouts/Layout.astro');
const home = read('src/pages/index.astro');
const contact = read('src/pages/contacto.astro');
const calc = read('src/components/IndemnizacionCalculator.astro');
const scripts = read('public/site.js') + '\n' + read('public/indemnizacion-calculator.js');
const combined = [site, layout, home, contact, calc, scripts].join('\n');

if (!site.includes("phone: '+34 695 385 198'")) errors.push('production phone mismatch');
if (!site.includes("email: 'lopezmarquezabogados@gmail.com'")) errors.push('production email mismatch');
if (combined.includes('695 802 513') || combined.includes('34695802513')) errors.push('old phone still present');
if (combined.includes('Una firma pequeña puede trabajar con estándares grandes.')) errors.push('obsolete small-firm copy still present');
if (combined.includes('Por eso la nueva web está construida')) errors.push('obsolete new-web copy still present');
if (!site.includes("'/actualidad-juridica'")) errors.push('actualidad route missing from indexableRoutes');
if (!site.includes("'/recursos/primeras-horas-despido'")) errors.push('first-hours route missing from indexableRoutes');
if (!contact.includes('data-endpoint="/api/contact"')) errors.push('contact form is not using the direct API');
if (!contact.includes('mailto:')) { /* form is direct-submit; footer email may still use mailto */ }
if (scripts.includes('form.dataset.whatsapp')) errors.push('contact form still depends on WhatsApp');
if (calc.includes('calculadora-whatsapp')) errors.push('stale calculator WhatsApp id');

console.log(`Production guards: ${errors.length ? 'ERROR' : 'OK'}`);
for (const e of errors) console.log(`ERROR: ${e}`);
for (const w of warnings) console.log(`WARNING: ${w}`);
process.exitCode = errors.length ? 1 : 0;
