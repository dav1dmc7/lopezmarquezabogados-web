#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const domain='lopezmarquezabogados.com';
const paths=['/','/laboral/despidos/','/extranjeria/arraigo/','/empresas/','/en/','/en/contact/'];
const errors=[];
const warnings=[];

function curl(url){
  const r=spawnSync('curl',['-4','-L','--max-time','20','--retry','1','--retry-all-errors','-sS',url],{encoding:'utf8',timeout:30000});
  return {exit:r.status??-1,body:r.stdout??'',stderr:(r.stderr??'').trim()};
}
function final(url){
  const r=spawnSync('curl',['-4','-L','--max-time','20','--retry','1','--retry-all-errors','-sS','-o','/dev/null','-w','%{http_code}\n%{url_effective}\n%{num_redirects}\n',url],{encoding:'utf8',timeout:30000});
  const lines=(r.stdout??'').trim().split(/\n/);
  return {exit:r.status??-1,status:Number(lines[0])||0,effective:lines[1]||'',redirects:Number(lines[2])||0,stderr:(r.stderr??'').trim()};
}
function meta(body, pattern){ return body.match(pattern)?.[1]?.trim() || ''; }

console.log('=== LIVE SEO / RENDER QA ===');
for(const path of paths){
  const url=`https://${domain}${path}`;
  const r=final(url);
  const page=curl(url);
  console.log(`${path.padEnd(28)} ${r.status} final=${r.effective} redirects=${r.redirects}`);
  if(r.status===0) errors.push(`${path}: curl failed (exit ${r.exit}) ${r.stderr}`);
  else if(r.status>=400) errors.push(`${path}: final HTTP ${r.status}`);
  if(!/<!doctype html/i.test(page.body)) warnings.push(`${path}: doctype not detected`);
  if((page.body.match(/<title\b/gi)||[]).length!==1) errors.push(`${path}: expected exactly one <title>`);
  if((page.body.match(/<h1\b/gi)||[]).length!==1) errors.push(`${path}: expected exactly one rendered H1`);
  if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(page.body)) errors.push(`${path}: noindex detected`);
  const canonical=meta(page.body, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
  if(canonical && !/^https:\/\/lopezmarquezabogados\.com(?:\/|$)/i.test(canonical)) errors.push(`${path}: canonical outside canonical host: ${canonical}`);
  const ogTitle=(page.body.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)||[])[1]||'';
  const ogDesc=(page.body.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)||[])[1]||'';
  if(!ogTitle) warnings.push(`${path}: og:title not detected`);
  if(!ogDesc) warnings.push(`${path}: og:description not detected`);
}

const www=final(`https://www.${domain}/`);
console.log(`${'www canonical host'.padEnd(28)} ${www.status} final=${www.effective} redirects=${www.redirects}`);
if(www.status===0) errors.push(`www: curl failed (exit ${www.exit}) ${www.stderr}`);
else if(www.status!==200||www.effective!==`https://${domain}/`) errors.push(`www must redirect to the canonical apex homepage; received ${www.status} at ${www.effective}`);

const sitemap=curl(`https://${domain}/sitemap.xml`);
if(sitemap.exit!==0) errors.push(`sitemap.xml: curl failed (exit ${sitemap.exit})`);
else if(!/<(?:urlset|sitemapindex)\b/i.test(sitemap.body)) errors.push('sitemap.xml: XML sitemap root not detected');

const robots=curl(`https://${domain}/robots.txt`);
if(robots.exit!==0) errors.push(`robots.txt: curl failed (exit ${robots.exit})`);
else if(!/sitemap:\s*https:\/\/lopezmarquezabogados\.com\/sitemap\.xml/i.test(robots.body)) warnings.push('robots.txt: canonical Sitemap line not detected');

console.log(`\nLive SEO errors: ${errors.length}`);
console.log(`Live SEO warnings: ${warnings.length}`);
for(const e of errors) console.error('ERROR',e);
for(const w of warnings) console.warn('WARN',w);
if(errors.length) process.exit(1);
console.log('\nLive SEO / Render QA: OK');
