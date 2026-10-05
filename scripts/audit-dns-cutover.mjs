#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const domain = 'lopezmarquezabogados.com';
const hosts = [domain, `www.${domain}`];
const netlifyIp = '75.2.60.5';
const errors = [];
const warnings = [];

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

function fetchHeaders(url) {
  return cmd('curl', ['-L', '--max-time', '15', '-sS', '-I', url]);
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
  const combined = `${a}\n${cname}`;
  if (combined.includes(netlifyIp) || /netlify\.app/i.test(combined)) {
    warnings.push(`${host}: sigue apuntando a Netlify (${netlifyIp} o *.netlify.app)`);
  }
}

for (const path of ['/', '/contacto/', '/laboral/despidos/', '/extranjeria/arraigo/', '/empresas/', '/en/', '/en/contact/']) {
  const url = `https://${domain}${path}`;
  const headers = fetchHeaders(url);
  const page = fetchText(url);
  const status = (headers.match(/HTTP\/[^ ]+\s+(\d{3})/) || [])[1] || '000';
  const oldMarker = /Bienvenido a López Márquez Abogados|Servicios en Derecho Laboral|695 802 513/i.test(page);
  console.log(`${path.padEnd(34)} -> ${status}${oldMarker ? '  [OLD-NETLIFY-CONTENT]' : ''}`);
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
  console.log('2. Configura el apex lopezmarquezabogados.com y www.lopezmarquezabogados.com en el Worker.');
  console.log('3. Solo después de activar los Custom Domains, elimina los destinos Netlify del DNS de esa zona.');
  console.log('4. Espera a que el certificado/DNS se active y vuelve a ejecutar este comando.');
  process.exit(1);
}

console.log('\nCutover preflight: OK');
