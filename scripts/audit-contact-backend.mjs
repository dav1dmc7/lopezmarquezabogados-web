import { existsSync, readFileSync } from 'node:fs';
const errors=[];
const read=(p)=>readFileSync(p,'utf8');
for(const f of ['worker.ts','worker-configuration.d.ts','wrangler.jsonc','src/pages/contacto.astro','src/pages/en/contact.astro','public/site.js','migrations/0001_create_consultations.sql','migrations/0002_add_source_path.sql']) if(!existsSync(f)) errors.push(`missing ${f}`);
if(!errors.length){
  const w=read('worker.ts'), wr=JSON.parse(read('wrangler.jsonc')), es=read('src/pages/contacto.astro'), en=read('src/pages/en/contact.astro'), js=read('public/site.js'), mig=read('migrations/0001_create_consultations.sql'), sourceMig=read('migrations/0002_add_source_path.sql');
  for(const n of ["'/api/contact'",'env.lopezmarquez_consultas','INSERT INTO consultations','env.EMAIL.send']) if(!w.includes(n)) errors.push(`worker missing ${n}`);
  for(const n of ['MAX_REQUEST_BYTES = 32 * 1024','readBoundedBody(request)','sameOrigin','payload_too_large']) if(!w.includes(n)) errors.push(`worker request protection missing ${n}`);
  if(!w.includes('url.hostname === `www.${canonicalHost}`') || !w.includes('new URL(`${url.pathname}${url.search}`, site.url)')) errors.push('www must permanently redirect to the canonical site URL');
  if(!w.includes('const permanentRedirect =') || !w.includes('headers: { Location: url.toString()')) errors.push('redirect responses must use mutable explicit headers');
  if(!w.includes("mediaType === 'application/x-www-form-urlencoded'") || !w.includes("mediaType === 'application/json'")) errors.push('worker must accept only the expected contact form media types');
  for(const [lang, form] of [['ES', es], ['EN', en]]) if(!form.includes('method="post" action="/api/contact"')) errors.push(`${lang} form lacks native POST fallback`);
  if(!w.includes('application/x-www-form-urlencoded') || !w.includes('Response.redirect(new URL(locale ===')) errors.push('worker native form fallback missing');
  for(const n of ['data-endpoint="/api/contact"','name="nombre"','name="email"','name="area"','name="mensaje"','name="privacy"','name="website"']) { if(!es.includes(n)) errors.push(`ES form missing ${n}`); if(!en.includes(n)) errors.push(`EN form missing ${n}`); }
  if(es.includes('Se abrirá tu aplicación de correo')||en.includes('Your email application will open')) errors.push('contact form still mentions mailto');
  if(js.includes('mailto:${destination}')||js.includes('window.location.href = `mailto')) errors.push('legacy mailto submit logic remains');
  if(wr.main!=='./worker.ts') errors.push('wrangler main mismatch');
  if(wr.assets?.binding!=='ASSETS') errors.push('ASSETS binding missing');
  if(!wr.assets?.run_worker_first?.includes('/*')) errors.push('all public requests must pass through the Worker for host canonicalization');
  if(!wr.routes?.some(x=>x.pattern==='lopezmarquezabogados.com'&&x.custom_domain) || !wr.routes?.some(x=>x.pattern==='www.lopezmarquezabogados.com'&&x.custom_domain)) errors.push('canonical apex and www custom domains must be attached to the Worker');
  if(!Array.isArray(wr.d1_databases)||!wr.d1_databases.some(x=>x.binding==='lopezmarquez_consultas')) errors.push('D1 binding missing');
  if(!Array.isArray(wr.send_email)||!wr.send_email.some(x=>x.name==='EMAIL')) errors.push('EMAIL binding missing');
  if(!mig.includes('CREATE TABLE IF NOT EXISTS consultations')) errors.push('consultations migration missing');
  if(!sourceMig.includes('ADD COLUMN source_path') || !w.includes('source_path)')) errors.push('consultation source-path migration/insert missing');
}
console.log(`Contact backend audit: ${errors.length?'FAILED': 'OK'}`); errors.forEach(e=>console.error(`ERROR ${e}`));
if(errors.length) process.exit(1);
