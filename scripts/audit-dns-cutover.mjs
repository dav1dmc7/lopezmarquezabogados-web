#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const domain = 'lopezmarquezabogados.com';
const hosts = [domain, `www.${domain}`];
const netlifyIp = '75.2.60.5';
const errors = [];
const warnings = [];
const inconclusive = [];

function cmd(command, args) {
  try { return execFileSync(command, args, { encoding: 'utf8', timeout: 15000, stdio: ['ignore','pipe','pipe'] }); }
  catch { return ''; }
}

function nslookup(host, type='') {
  const args = type ? ['-type=' + type, host] : [host];
  return cmd('nslookup', args);
}

function fetchText(url) {
  try {
    return cmd('curl', ['-L', '--max-time', '15', '-sS', url]);
  } catch { return ''; }
}

function fetchFinal(url) {
  const output = cmd('curl', ['-4', '-L', '--max-time', '15', '-sS', '-o', '/dev/null', '-w', '%{http_code}\n%{url_effective}', url]);
  const [status, effective] = output.trim().split(/\r?\n/);
  return { status: Number(status) || 0, effective: effective || '' };
}

console.log('=== CLOUDFLARE DOMAIN CUTOVER PREFLIGHT ===');
console.log('Domain:', domain);
console.log('')

for (const host of hosts) {
  const a = nslookup(host, 'A');
  const cname = nslookup(host, 'CNAME');
  console.log(`--- ${host} ---`);
  console.log(a.trim() || 'A: sin respuesta');
  console.log(cname.trim() || 'CNAME: sin respuesta');
  if (!a.trim() && !cname.trim()) inconclusive.push(`${host}: DNS no respondió desde este entorno.`);
  const combined = `${a}\n${cname}`;
  if (combined.includes(netlifyIp) || /netlify\.app/i.test(combined)) {
    warnings.push(`${host}: sigue apuntando a Netlify (${netlifyIp} o *.netlify.app)`);
  }
}

const wwwRoute = fetchFinal(`https://www.${domain}/`);
console.log(`www canonical routing             -> ${wwwRoute.status || '000'} final=${wwwRoute.effective || '-'}`);
if (!wwwRoute.status) inconclusive.push('www host routing: no HTTP response from this environment.');
else if (wwwRoute.status >= 400 || wwwRoute.effective !== `https://${domain}/`) {
  errors.push(`www must resolve to the apex homepage; received HTTP ${wwwRoute.status} at ${wwwRoute.effective || 'unknown URL'}.`);
}

for (const path of ['/', '/contacto/', '/laboral/despidos/', '/extranjeria/arraigo/', '/empresas/', '/en/', '/en/contact/']) {
  const url = `https://${domain}${path}`;
  const route = fetchFinal(url);
  const page = fetchText(url);
  const status = String(route.status || '000');
  const oldMarker = /Bienvenido a López Márquez Abogados|Servicios en Derecho Laboral|695 802 513/i.test(page);
  console.log(`${path.padEnd(34)} -> ${status}${oldMarker ? '  [OLD-NETLIFY-CONTENT]' : ''}`);
  if (status === '000') inconclusive.push(`${path}: HTTP no respondió desde este entorno.`);
  if (path === '/' && oldMarker) errors.push('La home pública sigue sirviendo contenido legacy de Netlify.');
  if (path !== '/' && status === '404') errors.push(`${path}: 404 en producción.`);
}

if (warnings.length) {
  console.log('\nWARNINGS');
  for (const w of warnings) console.warn('WARN', w);
}

if (errors.length) {
  console.log('\nERRORS');
  for (const e of errors) console.error('ERROR', e);
  console.log('\nACCIÓN');
  console.log('1. Cloudflare → Workers & Pages → lopezmarquezabogados → Custom Domains.');
  console.log('2. Configura ambos hosts en Pages/Workers o redirige www al apex con una regla de Cloudflare.');
  console.log('3. No borres el hosting antiguo: cambia solo el enrutamiento cuando el destino nuevo esté verificado y sea reversible.');
  console.log('4. Espera a que DNS/certificados se activen y vuelve a ejecutar este comando.');
  process.exit(1);
}

if (inconclusive.length) {
  console.log(`\nCutover preflight: INCONCLUSO (${inconclusive.length} consultas sin respuesta)`);
  for (const item of [...new Set(inconclusive)]) console.warn('INCONCLUSO', item);
  process.exit(2);
}

console.log('\nCutover preflight: OK');
