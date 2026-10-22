import { existsSync, readFileSync } from 'node:fs';
const errors=[];
const read=(p)=>readFileSync(p,'utf8');
for(const f of ['worker.ts','worker-configuration.d.ts','wrangler.jsonc','src/lib/site.ts','src/lib/email.ts','src/lib/turnstile.ts','src/components/ContactTurnstile.astro','public/contact-turnstile.js','public/_headers','src/pages/contacto.astro','src/pages/en/contact.astro','public/site.js','migrations/0001_create_consultations.sql','migrations/0002_add_source_path.sql','migrations/0003_add_email_delivery_status.sql','scripts/resend-pending-notification.mjs']) if(!existsSync(f)) errors.push(`missing ${f}`);
if(!errors.length){
  const w=read('worker.ts'), wr=JSON.parse(read('wrangler.jsonc')), site=read('src/lib/site.ts'), email=read('src/lib/email.ts'), turnstile=read('src/lib/turnstile.ts'), turnstileUi=read('src/components/ContactTurnstile.astro'), turnstileJs=read('public/contact-turnstile.js'), headers=read('public/_headers'), es=read('src/pages/contacto.astro'), en=read('src/pages/en/contact.astro'), js=read('public/site.js'), mig=read('migrations/0001_create_consultations.sql'), sourceMig=read('migrations/0002_add_source_path.sql'), deliveryMig=read('migrations/0003_add_email_delivery_status.sql');
  for(const n of ["'/api/contact'",'env.lopezmarquez_consultas','INSERT INTO consultations','env.EMAIL.send','RESEND_API_KEY','sendViaResend','buildCustomerContactEmail','buildInternalContactEmail']) if(!w.includes(n)) errors.push(`worker missing ${n}`);
  for(const n of ['MAX_REQUEST_BYTES = 32 * 1024','readBoundedBody(request)','sameOrigin','payload_too_large']) if(!w.includes(n)) errors.push(`worker request protection missing ${n}`);
  if(!w.includes('url.hostname === `www.${canonicalHost}`') || !w.includes('new URL(`${url.pathname}${url.search}`, site.url)')) errors.push('www must permanently redirect to canonical site URL');
  if(!w.includes('const permanentRedirect =') || !w.includes('headers: { Location: url.toString()')) errors.push('redirect responses must use explicit mutable headers');
  if(!w.includes("mediaType === 'application/x-www-form-urlencoded'") || !w.includes("mediaType === 'application/json'")) errors.push('worker must accept only expected contact form media types');
  if(!w.includes('verifyTurnstileToken') || !w.includes("'CF-Connecting-IP'") || !w.includes("turnstileRequired || turnstileSecret || turnstileToken")) errors.push('Worker must enforce configured Turnstile validation before accepting a consultation');
  if(!w.includes("['localhost', '127.0.0.1'].includes(url.hostname.toLowerCase())")) errors.push('Turnstile test mode must be restricted to local loopback hosts');
  for(const n of ['https://challenges.cloudflare.com/turnstile/v0/siteverify','idempotency_key','timeout-or-duplicate','result.action !== \'contact\'','result.hostname','testMode']) if(!turnstile.includes(n)) errors.push(`Turnstile server validation missing ${n}`);
  const turnstileSource = `${turnstileUi}\n${turnstileJs}`;
  for(const n of ['PUBLIC_TURNSTILE_SITE_KEY','data-sitekey','action: \'contact\'','size: \'compact\'']) if(!turnstileSource.includes(n)) errors.push(`Turnstile UI missing ${n}`);
  if(!turnstileJs.includes('turnstile.render') || !turnstileJs.includes('expired-callback') || !turnstileJs.includes('error-callback')) errors.push('Turnstile UI must render a Managed widget and handle error/expiry callbacks');
  if(!headers.includes('script-src') || !headers.includes('https://challenges.cloudflare.com') || !headers.includes('frame-src https://challenges.cloudflare.com')) errors.push('CSP must allow Turnstile script and frame origins');
  for(const n of ['turnstileToken: String(data.get(\'cf-turnstile-response\')','turnstile_expired','turnstile_unavailable']) if(!js.includes(n)) errors.push(`Contact client missing ${n}`);
  for(const [lang,form] of [['ES',es],['EN',en]]) if(!form.includes('method="post" action="/api/contact"')) errors.push(`${lang} form lacks native POST fallback`);
  if(!w.includes('application/x-www-form-urlencoded') || !w.includes('Response.redirect(new URL(locale ===')) errors.push('worker native form fallback missing');
  for(const n of ['data-endpoint="/api/contact"','name="nombre"','name="email"','name="area"','name="mensaje"','name="privacy"','name="website"']) { if(!es.includes(n)) errors.push(`ES form missing ${n}`); if(!en.includes(n)) errors.push(`EN form missing ${n}`); }
  if(es.includes('Se abrirá tu aplicación de correo')||en.includes('Your email application will open')) errors.push('contact form still mentions mailto');
  if(js.includes('mailto:${destination}')||js.includes('window.location.href = `mailto')) errors.push('legacy mailto submit logic remains');
  if(!w.includes('Promise.allSettled')) errors.push('internal and customer notifications must be attempted independently');
  for(const col of ['internal_notification_status','customer_confirmation_status','notification_provider']) { if(!w.includes(col)) errors.push(`worker missing delivery state ${col}`); if(!deliveryMig.includes(`ADD COLUMN ${col}`)) errors.push(`migration missing ${col}`); }
  if(!w.includes("destination.searchParams.set('confirmation'")) errors.push('success route must expose customer confirmation status');
  if(!site.includes("emailFrom: 'López Márquez Abogados <web@lopezmarquezabogados.com>'")) errors.push('site.ts transactional sender missing');
  if(!email.includes('/brand/email-logo.png')) errors.push('email template logo missing');
  for(const t of ['Copia de tu consulta','Copy of your enquiry','Puedes responder directamente a este correo','You can reply directly to this email']) if(!email.includes(t)) errors.push(`email template missing ${t}`);
  if(!js.includes("result.confirmation === 'sent'")) errors.push('frontend must honour actual confirmation state');
  if(wr.main!=='./worker.ts') errors.push('wrangler main mismatch');
  if(wr.assets?.binding!=='ASSETS') errors.push('ASSETS binding missing');
  if(!wr.assets?.run_worker_first?.includes('/*')) errors.push('all public requests must pass through Worker for host canonicalization');
  if(!wr.routes?.some(x=>x.pattern==='lopezmarquezabogados.com'&&x.custom_domain) || !wr.routes?.some(x=>x.pattern==='www.lopezmarquezabogados.com'&&x.custom_domain)) errors.push('canonical apex and www custom domains must be attached to Worker');
  if(!Array.isArray(wr.d1_databases)||!wr.d1_databases.some(x=>x.binding==='lopezmarquez_consultas')) errors.push('D1 binding missing');
  if(!Array.isArray(wr.send_email)||!wr.send_email.some(x=>x.name==='EMAIL')) errors.push('Cloudflare internal fallback EMAIL binding missing');
  if(!mig.includes('CREATE TABLE IF NOT EXISTS consultations')) errors.push('consultations migration missing');
  if(!sourceMig.includes('ADD COLUMN source_path') || !w.includes('source_path)')) errors.push('consultation source-path migration/insert missing');
}
console.log(`Contact backend audit: ${errors.length?'FAILED':'OK'}`); errors.forEach(e=>console.error(`ERROR ${e}`)); if(errors.length) process.exit(1);
