#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const domain='lopezmarquezabogados.com';
const modern=['/','/sitemap.xml','/robots.txt','/contacto/','/laboral/despidos/','/extranjeria/arraigo/','/empresas/','/en/','/en/contact/'];
const legacy=['/index.html','/en/index.html','/en/about.html','/en/laboral.html','/en/civil.html','/es/index.html','/es/servicios.html','/es/laboral.html','/es/contact.html','/es','/es/index','/es/about','/es/servicios','/es/laboral','/es/extranjeria','/es/civil','/es/penal','/es/administrativo','/es/contact','/es/faqs','/en/index_en','/en/about_en','/en/servicios_en','/en/laboral_en','/en/extranjeria_en','/en/civil_en','/en/penal_en','/en/administrativo_en','/en/contact_en','/en/faqs_en'];
const errors=[];

function request(url,{body=false}={}){
  const args=['-4','-L','--max-time','20','--retry','1','--retry-all-errors','-sS'];
  if(body){
    args.push(url);
    const r=spawnSync('curl',args,{encoding:'utf8',timeout:30000});
    const stdout=r.stdout??'';
    const stderr=(r.stderr??'').trim();
    return {exit:r.status??-1,stdout,stderr,status:0,effective:'',redirects:0};
  }
  args.push('-o','/dev/null','-w','%{http_code}\n%{url_effective}\n%{num_redirects}\n',url);
  const r=spawnSync('curl',args,{encoding:'utf8',timeout:30000});
  const lines=(r.stdout??'').trim().split(/\n/);
  return {
    exit:r.status??-1,
    stdout:r.stdout??'',
    stderr:(r.stderr??'').trim(),
    status:Number(lines[0])||0,
    effective:lines[1]||'',
    redirects:Number(lines[2])||0,
  };
}

function inspect(path){
  const url=`https://${domain}${path}`;
  const r=request(url);
  const b=request(url,{body:true});
  const text=b.stdout;
  const legacyMarker=/Bienvenido a López Márquez Abogados|Servicios en Derecho Laboral|695 802 513/i.test(text);
  const diagnosis=r.status===0
    ? ` CURL_ERROR exit=${r.exit}${r.stderr?` · ${r.stderr}`:''}`
    : '';
  console.log(`${path.padEnd(34)} -> ${String(r.status).padEnd(3)} final=${r.effective||'-'} redirects=${r.redirects}${legacyMarker?' [LEGACY-CONTENT]':''}${diagnosis}`);
  return {r,b,legacyMarker};
}

console.log('=== PRODUCTION LIVE SMOKE ===');
console.log(`Origin: https://${domain}`);
for(const path of modern){
  const {r,legacyMarker}=inspect(path);
  if(r.status===0) errors.push(`${path}: curl no obtuvo respuesta HTTP (exit ${r.exit}${r.stderr?`, ${r.stderr}`:''}).`);
  else if(r.status>=400) errors.push(`${path}: final HTTP ${r.status}`);
  if(path==='/' && legacyMarker) errors.push('Home: sigue sirviendo contenido legacy detectable.');
}

// Sitemap is checked separately so we can fail loudly when the URL responds but is not XML.
const sitemap=inspect('/sitemap.xml');
if(sitemap.r.status===200){
  const xml=sitemap.b.stdout;
  if(!/<(?:urlset|sitemapindex)\b/i.test(xml)) errors.push('sitemap.xml: 200 pero el contenido no parece XML de sitemap.');
}

console.log('--- LEGACY URLS ---');
for(const path of legacy){
  const {r,legacyMarker}=inspect(path);
  if(r.status===0) errors.push(`${path}: curl no obtuvo respuesta HTTP (exit ${r.exit}${r.stderr?`, ${r.stderr}`:''}).`);
  else if(r.status>=400) errors.push(`${path}: final HTTP ${r.status}; la ruta legacy necesita una redirección válida.`);
  else if(legacyMarker) errors.push(`${path}: sirve contenido legacy detectable.`);
}

const www=request(`https://www.${domain}/`);
console.log(`www canonical routing             -> ${www.status} final=${www.effective||'-'} redirects=${www.redirects}`);
if(www.status===0) errors.push(`www: curl no obtuvo respuesta HTTP (exit ${www.exit}${www.stderr?`, ${www.stderr}`:''}).`);
else if(www.status!==200||www.effective!==`https://${domain}/`) errors.push(`www: debe redirigir a https://${domain}/ y terminar en HTTP 200.`);

if(errors.length){
  console.log(`\nProduction live errors: ${errors.length}`);
  for(const e of [...new Set(errors)]) console.error('ERROR',e);
  process.exit(1);
}
console.log('\nProduction live smoke: OK');
