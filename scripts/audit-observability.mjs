import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const analyticsPath = join(root, 'public/analytics.js');
const layoutPath = join(root, 'src/layouts/Layout.astro');
const docsPath = join(root, 'docs/ANALYTICS-GRATIS-SETUP.md');

const errors = [];
const notes = [];

function read(path) {
  if (!existsSync(path)) {
    errors.push(`missing: ${relative(root, path)}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

const analytics = read(analyticsPath);
const layout = read(layoutPath);
const docs = read(docsPath);

const hasConsentGate = /__LM_ANALYTICS_CONSENT__/.test(analytics);
const hasTrack = /zaraz\.track\s*\(/.test(analytics);
const trackCalls = [...analytics.matchAll(/zaraz\.track\s*\(\s*(["'`])([^"'`]+)\1([\s\S]{0,1800}?)\)/g)];
const eventNames = [...new Set(trackCalls.map((m) => m[2]))];

if (analytics && !hasConsentGate) {
  errors.push('analytics.js is missing the explicit __LM_ANALYTICS_CONSENT__ gate.');
}
if (analytics && !hasTrack) {
  errors.push('analytics.js does not contain zaraz.track(); custom behavioral events are not wired.');
}
if (layout && !/analytics\.js/.test(layout)) {
  errors.push('Layout.astro does not reference public/analytics.js.');
}
if (!docs) {
  notes.push('ANALYTICS-GRATIS-SETUP.md is missing; external activation steps should remain documented locally.');
}

// Privacy guard: analytics.js must never harvest form contents or input values.
const dangerousPatterns = [
  { re: /new\s+FormData\s*\(/i, label: 'new FormData(...)' },
  { re: /(?:querySelector|querySelectorAll)\s*\([^)]*\b(?:input|textarea|select)\b/i, label: 'form control selection' },
  { re: /(?:getElementById|getElementsByName)\s*\([^)]*\b(?:email|correo|telefono|teléfono|phone|dni|nie|passport|pasaporte|mensaje|message|consulta|expediente)\b/i, label: 'sensitive form field lookup' },
  { re: /\b(?:localStorage|sessionStorage)\.(?:setItem|set)\s*\(/i, label: 'browser storage write' },
  { re: /\b(?:fetch|XMLHttpRequest)\s*\(/i, label: 'custom outbound network call' },
  { re: /\bnavigator\.sendBeacon\s*\(/i, label: 'custom beacon call' },
];

for (const call of trackCalls) {
  const snippet = call[0];
  for (const item of dangerousPatterns) {
    if (item.re.test(snippet)) {
      errors.push(`Sensitive/outbound pattern inside zaraz.track(${call[2]}): ${item.label}.`);
    }
  }
  if (/\b(?:email|correo|telefono|teléfono|phone|dni|nie|passport|pasaporte|mensaje|message|consulta|expediente)\s*[:=]/i.test(snippet)) {
    errors.push(`Sensitive property name detected in zaraz.track(${call[2]}).`);
  }
  if (/\.value\b/i.test(snippet)) {
    errors.push(`DOM .value access detected inside zaraz.track(${call[2]}).`);
  }
}

const externalHosts = [...analytics.matchAll(/https?:\/\/[^\s'"`<>]+/g)].map((m) => m[0]);
if (externalHosts.length) {
  notes.push(`analytics.js contains ${externalHosts.length} literal external URL(s); inspect before allowing new destinations.`);
}

console.log('=== OBSERVABILITY / ANALYTICS READINESS ===');
console.log(`client analytics module: ${analytics ? 'present' : 'missing'}`);
console.log(`Layout integration: ${layout && /analytics\.js/.test(layout) ? 'present' : 'missing'}`);
console.log(`consent gate: ${hasConsentGate ? 'present' : 'missing'}`);
console.log(`custom event API: ${hasTrack ? 'present' : 'missing'}`);
console.log(`event names detected: ${eventNames.length ? eventNames.join(', ') : 'none'}`);
console.log(`privacy flow: ${errors.some((e) => /Sensitive|DOM \.value|outbound|Network|beacon|storage|FormData|form control/i.test(e)) ? 'FAILED' : 'PASS'}`);
console.log('external dashboard activation: MANUAL');
console.log('  - Cloudflare Web Analytics: enable the hostname in Web Analytics; proxied hostnames support automatic beacon injection.');
console.log('  - Cloudflare Zaraz: configure the required destinations/tools and consent purposes before publishing event actions.');
console.log('  - Google Search Console: verify the domain property and submit https://lopezmarquezabogados.com/sitemap.xml.');

for (const n of notes) console.log(`INFO: ${n}`);
for (const e of errors) console.log(`ERROR: ${e}`);

if (errors.length) process.exitCode = 1;
else console.log('Observability code QA: OK');
