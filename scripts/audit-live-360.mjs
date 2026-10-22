#!/usr/bin/env node
/**
 * Read-only production audit for Lopez Marquez Abogados.
 * - Does NOT submit contact forms or change website files.
 * - Checks live HTTP responses, SEO metadata, legacy redirects, analytics hints,
 *   cookies/security headers, and scans local source for trackers/storage APIs.
 * - No third-party dependencies; run with Node 22+ from repository root.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = new URL(process.env.AUDIT_BASE_URL || 'https://lopezmarquezabogados.com/');
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs');
const MAX_ROUTES = Number.parseInt(process.env.AUDIT_MAX_ROUTES || '120', 10);
const CONCURRENCY = Math.max(1, Math.min(6, Number.parseInt(process.env.AUDIT_CONCURRENCY || '4', 10)));
const TIMEOUT_MS = 15000;
const isoDate = new Date().toISOString().slice(0, 10);

const ANALYTICS = [
  ['Cloudflare Web Analytics', /static\.cloudflareinsights\.com|cloudflareinsights\.com|\/cdn-cgi\/rum/i],
  ['Google Tag Manager', /googletagmanager\.com|GTM-[A-Z0-9]+/i],
  ['Google Analytics / gtag', /google-analytics\.com|gtag\s*\(|\bG-[A-Z0-9]{5,}\b/],
  ['Meta Pixel', /connect\.facebook\.net|fbq\s*\(/i],
  ['Microsoft Clarity', /clarity\.ms|clarity\s*\(/i],
  ['Hotjar', /static\.hotjar\.com|hj\s*\(/i],
  ['Plausible', /plausible\.io/i],
  ['Umami', /umami/i],
  ['Matomo', /matomo|_paq\s*\./i],
];
const STORAGE = [
  ['document.cookie', /document\s*\.\s*cookie/i],
  ['localStorage', /\blocalStorage\b/i],
  ['sessionStorage', /\bsessionStorage\b/i],
  ['IndexedDB', /\bindexedDB\b/i],
  ['Cache Storage API', /\bcaches\s*\./i],
];
const DRAFT_PHRASES = [
  /must be confirmed before (publishing|launch)/i,
  /this page remains? a draft/i,
  /must not be published/i,
  /launch gate/i,
  /bloqueo de lanzamiento/i,
  /debe[n]? confirmarse antes de publicar/i,
  /permanece como borrador/i,
  /no debe publicarse/i,
  /pendiente de completar/i,
  /antes del lanzamiento/i,
];
const RESPONSE_PROMISES = [
  /plazo orientativo de respuesta/i,
  /response time\s*:?/i,
  /\b48\s*[–-]\s*72\s*(?:horas\s+laborables|business\s+hours)\b/i,
];
const LEGACY_PATHS = [
  '/es/about.html', '/es/servicios', '/es/faqs.html', '/en/index_en',
  '/es/about', '/es/contact.html', '/en/about_en.html', '/en/faqs_en.html',

  '/en/',
  '/en/index.html',
  '/index_en',
  '/index_en.html',
  '/en/laboral.html',
  '/en/civil.html',
  '/en/about.html',
];
const EXPECTED_LEGACY_DESTINATIONS = new Map([
  ['/en/', '/en'],
  ['/en/index.html', '/en'],
  ['/index_en', '/en'],
  ['/index_en.html', '/en'],
  ['/en/laboral.html', '/en/employment'],
  ['/en/civil.html', '/en'],
  ['/en/about.html', '/en/about'],
]);


function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return m ? m[2].replaceAll('&amp;', '&') : '';
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => m[0]);
}
function textContent(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ').trim();
}
function absolute(href, base) {
  try { return new URL(href, base); } catch { return null; }
}
function formatFetchError(error) {
  const cause = error?.cause;
  const parts = [
    `${error?.name || 'Error'}: ${error?.message || String(error)}`,
    cause?.code ? `code=${cause.code}` : '',
    cause?.message && cause.message !== error?.message ? `cause=${cause.message}` : '',
    cause?.hostname ? `host=${cause.hostname}` : '',
    cause?.address ? `address=${cause.address}` : '',
    cause?.port ? `port=${cause.port}` : '',
  ].filter(Boolean);
  return [...new Set(parts)].join(' | ');
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const NETWORK_ERROR_RE = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|socket hang up|network error|certificate/i;

async function fetchChain(url) {
  const chain = [];
  let current = new URL(url);
  for (let i = 0; i < 6; i++) {
    let res;
    let lastError;
    const attempts = Math.max(1, Math.min(3, Number.parseInt(process.env.AUDIT_FETCH_ATTEMPTS || '2', 10)));
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        res = await fetch(current, {
          redirect: 'manual',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: { 'user-agent': 'LMAbogados-ReadOnly-Audit/1.1' },
        });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        const detail = formatFetchError(error);
        const retryableTransport = /ECONNRESET|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|socket hang up/i.test(detail)
          && !/ENOTFOUND|EAI_AGAIN|ECONNREFUSED/i.test(detail);
        if (attempt < attempts && retryableTransport) await delay(350 * attempt);
        else break;
      }
    }
    if (!res) return { error: formatFetchError(lastError), chain, url: current.href, networkError: NETWORK_ERROR_RE.test(formatFetchError(lastError)) };
    const location = res.headers.get('location');
    chain.push({ url: current.href, status: res.status, location: location ? new URL(location, current).href : '',
      headers: {
        contentType: res.headers.get('content-type') || '',
        cacheControl: res.headers.get('cache-control') || '',
        xRobotsTag: res.headers.get('x-robots-tag') || '',
        csp: res.headers.get('content-security-policy') || '',
        server: res.headers.get('server') || '',
        cfRay: res.headers.get('cf-ray') || '',
        setCookie: typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []),
      },
    });
    if ([301, 302, 303, 307, 308].includes(res.status) && location) {
      current = new URL(location, current);
      continue;
    }
    let body = '';
    try { body = await res.text(); } catch {}
    return { chain, final: chain[chain.length - 1], body, url: current.href };
  }
  return { chain, error: 'Redirect chain exceeded 6 hops', url: current.href };
}
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = index++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}
async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name.startsWith('.audit360-backup')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (/\.(astro|ts|tsx|js|mjs|json|jsonc|html|css|txt|md)$/i.test(e.name)) out.push(p);
  }
  return out;
}
function parsePage(url, result) {
  if (!result?.body) return { requested: url, status: result?.final?.status ?? 'ERR', error: result?.error || 'No HTML body' };
  const html = result.body;
  const final = result.final || {};
  const title = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  const descriptions = tags(html, 'meta').filter(t => /^description$/i.test(attr(t, 'name')));
  const robots = tags(html, 'meta').filter(t => /^robots$/i.test(attr(t, 'name'))).map(t => attr(t, 'content')).join('; ');
  const canonTag = tags(html, 'link').find(t => /\brel\s*=\s*["']canonical["']/i.test(t));
  const canonical = canonTag ? attr(canonTag, 'href') : '';
  const hreflangs = tags(html, 'link').filter(t => /\brel\s*=\s*["']alternate["']/i.test(t) && attr(t, 'hreflang'))
    .map(t => ({ lang: attr(t, 'hreflang').toLowerCase(), href: attr(t, 'href') }));
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => textContent(m[1]));
  const scriptTags = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => ({ tag: m[0].match(/^<script\b[^>]*>/i)?.[0] || '', body: m[1] || '' }));
  const scripts = scriptTags.map(x => attr(x.tag, 'src')).filter(Boolean);
  const executableMarkup = scriptTags.map(x => `${x.tag}\n${x.body}`).join('\n');
  const trackers = ANALYTICS.filter(([, re]) => re.test(executableMarkup)).map(([name]) => name);
  const sourceUrl = new URL(result.url || url);
  const canonUrl = absolute(canonical, sourceUrl);
  const requestUrl = new URL(url);
  const externalScripts = scripts.filter(s => {
    const u = absolute(s, sourceUrl);
    return u && u.origin !== BASE.origin;
  });
  const cookieHeaders = (result.chain || []).flatMap(c => c.headers?.setCookie || []);
  return {
    requested: url,
    status: final.status,
    finalUrl: result.url,
    redirectChain: (result.chain || []).slice(0, -1).map(c => `${c.status} ${c.url} → ${c.location}`),
    title,
    description: descriptions.length ? attr(descriptions[0], 'content') : '',
    robots,
    canonical,
    canonicalMismatch: Boolean(canonUrl && canonUrl.href.replace(/\/$/, '') !== requestUrl.href.replace(/\/$/, '')),
    h1Count: h1s.length,
    h1: h1s[0] || '',
    language: html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)/i)?.[1] || '',
    hreflangs,
    scripts,
    externalScripts,
    trackers,
    dataLayerFound: /\bdataLayer\b/.test(executableMarkup),
    customEventsFound: /lm:track|lm:analytics/.test(executableMarkup),
    setCookieHeaders: cookieHeaders,
    csp: final.headers?.csp || '',
    contentType: final.headers?.contentType || '',
    error: result.error || '',
  };
}

const report = {
  date: isoDate,
  baseUrl: BASE.href,
  generatedAt: new Date().toISOString(),
  localScans: [],
  endpoints: [],
  pages: [],
  redirects: [],
  findings: [],
  limitations: [
    'La auditoría no envía consultas ni ejecuta JavaScript en un navegador real; no toca el backend de correo ni la base de datos.',
    'El HTML recibido sí permite detectar scripts inyectados en la respuesta, pero no sustituye una revisión del panel de Cloudflare ni una prueba de cookies tras interacciones reales.',
    'No se miden Lighthouse/Core Web Vitals de laboratorio en esta auditoría; esos datos requieren navegador/PSI o analítica real.',
  ],
};

console.log(`Auditoría pública de solo lectura: ${BASE.origin}`);
console.log('1/4 Analizando código local…');
const files = [...await walk(path.join(ROOT, 'src')), ...await walk(path.join(ROOT, 'public'))];
for (const extra of ['worker.ts', 'wrangler.jsonc', 'package.json', 'astro.config.mjs']) {
  const p = path.join(ROOT, extra);
  try { await fs.access(p); files.push(p); } catch {}
}
const uniqueFiles = [...new Set(files)];
const srcByFile = new Map();
for (const p of uniqueFiles) {
  try { srcByFile.set(p, await fs.readFile(p, 'utf8')); } catch {}
}
for (const [name, re] of ANALYTICS) {
  const found = [...srcByFile.entries()].filter(([, text]) => re.test(text)).map(([p]) => path.relative(ROOT, p));
  report.localScans.push({ kind: 'analytics', name, found });
}
for (const [name, re] of STORAGE) {
  const found = [...srcByFile.entries()].filter(([, text]) => re.test(text)).map(([p]) => path.relative(ROOT, p));
  report.localScans.push({ kind: 'storage-api', name, found });
}
const customTracking = [...srcByFile.entries()].filter(([p, t]) => /\.(?:js|mjs|ts|astro)$/i.test(p) && /\bdataLayer\b|lm:track|lm:analytics/.test(t)).map(([p]) => path.relative(ROOT, p));
report.localScans.push({ kind: 'custom-tracking-events', found: customTracking });
const policyFiles = uniqueFiles.filter(p => /(?:privacy|privacidad|cookies|legal-notice|aviso-legal)\.(?:astro|html|md)$/i.test(p));
for (const p of policyFiles) {
  const txt = srcByFile.get(p) || '';
  const found = DRAFT_PHRASES.filter(re => re.test(txt)).map(re => re.source);
  if (found.length) report.findings.push({ severity: 'ALTO', area: 'Legal pages', file: path.relative(ROOT, p), detail: `Contiene lenguaje interno de borrador/lanzamiento: ${found.join(', ')}` });
}
const headersFile = path.join(ROOT, 'public/_headers');
let headersTxt = '';
try { headersTxt = await fs.readFile(headersFile, 'utf8'); } catch {}
const cspLine = headersTxt.split(/\r?\n/).find(l => /content-security-policy:/i.test(l)) || '';
const localCFBeacon = [...srcByFile.values()].some(t => /static\.cloudflareinsights\.com/i.test(t));
if (cspLine && /script-src[^\n]*'self'/.test(cspLine) && localCFBeacon && !/static\.cloudflareinsights\.com/i.test(cspLine)) {
  report.findings.push({ severity: 'MEDIO', area: 'CSP / Analytics', file: 'public/_headers', detail: 'La CSP restringe script-src a self; si Cloudflare inserta el beacon externo de Web Analytics en el edge, debe comprobarse que el navegador no lo bloquea. Los eventos dataLayer locales no prueban transmisión de datos.' });
}

console.log('2/4 Consultando robots, sitemap y políticas públicas…');
const endpointPaths = ['/robots.txt', '/sitemap.xml', '/cookies', '/privacidad', '/aviso-legal', '/en/cookies', '/en/privacy', '/en/legal-notice', '/contacto', '/en/contact'];
const endpointResults = await mapLimit(endpointPaths, CONCURRENCY, async p => {
  const requested = new URL(p, BASE).href;
  const r = await fetchChain(requested);
  return { path: p, requested, ...parsePage(requested, r), body: r.body || '', chain: r.chain || [] };
});
for (const item of endpointResults) {
  if (item.path === '/robots.txt' || item.path === '/sitemap.xml') {
    report.endpoints.push({ path: item.path, status: item.status, finalUrl: item.finalUrl, contentType: item.contentType, error: item.error, redirectChain: item.redirectChain, body: (item.body || '').slice(0, 18000) });
  } else {
    report.pages.push({ ...item, body: undefined, chain: undefined });
  }
}
for (const item of endpointResults) {
  if (!/^\/(?:privacidad|aviso-legal|en\/privacy|en\/legal-notice|cookies|en\/cookies)$/.test(item.path) || !item.body) continue;
  const visibleText = textContent(item.body);
  const draftMatches = DRAFT_PHRASES.filter(re => re.test(visibleText)).map(re => re.source);
  if (draftMatches.length) report.findings.push({
    severity: 'ALTO', area: 'Información legal publicada', url: item.requested,
    detail: `La página pública contiene lenguaje provisional o datos sin confirmar: ${draftMatches.join(', ')}`,
  });
}
const liveContact = endpointResults.find(x => x.path === '/contacto');
if (liveContact?.body) {
  const formPosition = liveContact.body.indexOf('<form id="consulta-form"');
  const precedingContactCards = formPosition >= 0
    ? [...liveContact.body.slice(0, formPosition).matchAll(/class="[^"]*\bcontact-card\b/g)].length
    : Number.POSITIVE_INFINITY;
  if (formPosition < 0 || precedingContactCards > 2) report.findings.push({
    severity: 'MEDIO', area: 'Conversión / Contacto', url: liveContact.requested,
    detail: formPosition < 0
      ? 'No se encontró el formulario en la página pública de contacto.'
      : `El formulario aparece después de ${precedingContactCards} tarjetas de contacto; revisar si puede acercarse al encabezado.`,
  });
  const promiseMatches = RESPONSE_PROMISES.filter(re => re.test(textContent(liveContact.body))).map(re => re.source);
  if (promiseMatches.length) report.findings.push({
    severity: 'MEDIO', area: 'Promesa operativa en contacto', url: liveContact.requested,
    detail: `Se encontró un plazo de respuesta publicado que debe validarse con la capacidad real del despacho: ${promiseMatches.join(', ')}`,
  });
}
const sitemap = endpointResults.find(x => x.path === '/sitemap.xml');
let routeUrls = [];
let sitemapFetchedSuccessfully = false;
if (sitemap?.body && typeof sitemap.status === 'number' && sitemap.status >= 200 && sitemap.status < 300) {
  routeUrls = [...sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1].trim());
  routeUrls = [...new Set(routeUrls)].slice(0, MAX_ROUTES);
  sitemapFetchedSuccessfully = routeUrls.length > 0;
} else {
  routeUrls = [BASE.href, ...['/laboral','/extranjeria','/empresas','/recursos','/actualidad-juridica','/contacto','/en','/en/employment','/en/immigration','/en/business','/en/contact'].map(p => new URL(p, BASE).href)];
  console.log(`Sitemap público no verificable (${sitemap?.error || `HTTP ${sitemap?.status ?? 'sin respuesta'}`}); se usa una lista provisional de ${routeUrls.length} rutas. Esto no confirma que el sitemap esté roto.`);
}
console.log(`3/4 Revisando ${routeUrls.length} URLs indexables y redirecciones antiguas…`);
const routesResults = await mapLimit(routeUrls, CONCURRENCY, async url => {
  const r = await fetchChain(url);
  return parsePage(url, r);
});
report.pages.push(...routesResults);
const redirectResults = await mapLimit(LEGACY_PATHS, CONCURRENCY, async p => {
  const requested = new URL(p, BASE).href;
  const r = await fetchChain(requested);
  return { path: p, requested, status: r.final?.status ?? 'ERR', finalUrl: r.url, redirects: (r.chain || []).slice(0,-1).map(c => ({status:c.status,from:c.url,to:c.location})), error: r.error || '' };
});
report.redirects = redirectResults;

console.log('4/4 Calculando hallazgos…');
const allPages = report.pages.filter(p => p && p.requested?.startsWith(BASE.origin));
const remoteResults = [...report.endpoints, ...report.pages, ...report.redirects];
const networkFailures = remoteResults.filter(item => {
  const detail = item.error || '';
  return Boolean(detail && NETWORK_ERROR_RE.test(detail));
});
const attemptedRemoteRequests = remoteResults.length;
const connectivityInconclusive = networkFailures.length >= 8 &&
  networkFailures.length / Math.max(1, attemptedRemoteRequests) >= 0.60;
report.connectivity = {
  attemptedRequests: attemptedRemoteRequests,
  networkFailures: networkFailures.length,
  failureRate: Number((networkFailures.length / Math.max(1, attemptedRemoteRequests)).toFixed(3)),
  inconclusive: connectivityInconclusive,
  sampleError: networkFailures.find(x => x.error)?.error || '',
  note: connectivityInconclusive
    ? 'La mayoría de solicitudes fallaron a nivel de conexión desde el entorno que ejecuta Node. No se debe interpretar como caída de todas las páginas; comparar con curl y navegador.'
    : 'No se ha detectado un fallo global de conectividad según el umbral de esta auditoría.',
};
if (connectivityInconclusive) {
  console.log(`AVISO: ${networkFailures.length}/${attemptedRemoteRequests} solicitudes fallaron al conectar desde Node. Los errores de transporte se agruparán; el resultado será INCONCLUSO, no una declaración de caída del sitio.`);
  report.findings.push({ severity: 'MEDIO', area: 'Conectividad de auditoría', detail: `${networkFailures.length} de ${attemptedRemoteRequests} solicitudes fallaron antes de obtener una respuesta HTTP. Ejemplo: ${report.connectivity.sampleError}. Comprueba conectividad con curl y repite la auditoría.` });
}
for (const page of allPages) {
  if (page.error && !(connectivityInconclusive && NETWORK_ERROR_RE.test(page.error))) report.findings.push({ severity: 'ALTO', area: 'Disponibilidad', url: page.requested, detail: page.error });
  else if (typeof page.status === 'number' && (page.status >= 400 || page.status < 200)) report.findings.push({ severity: 'ALTO', area: 'HTTP', url: page.requested, detail: `Respuesta ${page.status}` });
  if (page.status >= 200 && page.status < 300 && page.contentType && !/text\/html/i.test(page.contentType) && !/\.xml|\.txt/.test(new URL(page.requested).pathname)) {
    report.findings.push({ severity: 'MEDIO', area: 'Content-Type', url: page.requested, detail: `Página esperando HTML pero recibió ${page.contentType}` });
  }
  if (page.status >= 200 && page.status < 300 && !page.title) report.findings.push({ severity: 'MEDIO', area: 'SEO', url: page.requested, detail: 'Falta <title>.' });
  if (page.status >= 200 && page.status < 300 && !page.description) report.findings.push({ severity: 'MEDIO', area: 'SEO', url: page.requested, detail: 'Falta meta description.' });
  if (page.status >= 200 && page.status < 300 && page.h1Count !== 1) report.findings.push({ severity: 'BAJO', area: 'Accesibilidad/SEO', url: page.requested, detail: `Tiene ${page.h1Count} H1; objetivo de QA: un H1 descriptivo.` });
  if (page.status >= 200 && page.status < 300 && page.canonicalMismatch && !/robots\.txt|sitemap\.xml/.test(page.requested)) report.findings.push({ severity: 'MEDIO', area: 'Canonical', url: page.requested, detail: `Canonical apunta a ${page.canonical || '(vacío)'}` });
  if (page.trackers?.includes('Cloudflare Web Analytics') && page.csp && /script-src[^;]*'self'/.test(page.csp) && !/static\.cloudflareinsights\.com/.test(page.csp)) {
    report.findings.push({ severity: 'MEDIO', area: 'CSP / Analytics', url: page.requested, detail: 'Se detecta Cloudflare Web Analytics en el HTML pero la CSP reportada no autoriza static.cloudflareinsights.com. Confirmar el modo de inyección y consola del navegador.' });
  }
}
const sitemapSet = new Set(routeUrls.map(u => new URL(u).href.replace(/\/$/, '')));
const seenTitles = new Map();
for (const p of allPages) {
  if (!p.title) continue;
  const key = p.title.toLowerCase().trim();
  if (seenTitles.has(key) && seenTitles.get(key) !== p.requested) report.findings.push({ severity: 'BAJO', area: 'SEO', url: p.requested, detail: `Título duplicado con ${seenTitles.get(key)}: ${p.title}` });
  else seenTitles.set(key,p.requested);
  if (sitemapFetchedSuccessfully && p.robots && /noindex/i.test(p.robots) && sitemapSet.has(new URL(p.requested).href.replace(/\/$/, ''))) {
    report.findings.push({ severity: 'ALTO', area: 'Sitemap/Indexación', url: p.requested, detail: 'La URL aparece en sitemap pero la etiqueta robots indica noindex.' });
  }
  const es = p.hreflangs?.find(x => x.lang === 'es');
  const en = p.hreflangs?.find(x => x.lang === 'en');
  if ((es || en) && (!es || !en)) report.findings.push({ severity: 'MEDIO', area: 'Hreflang', url: p.requested, detail: 'Tiene hreflang incompleto: falta variante es o en.' });
}
for (const r of report.redirects) {
  if (connectivityInconclusive && r.error && NETWORK_ERROR_RE.test(r.error)) continue;
  if (r.status === 404 || (typeof r.status === 'number' && r.status >= 500)) report.findings.push({ severity: 'ALTO', area: 'Redirecciones antiguas', url: r.requested, detail: `URL heredada responde ${r.status} y no redirige a destino actual.` });
  else if (!r.redirects?.length && !r.error && r.status >= 200 && r.status < 300) report.findings.push({ severity: 'MEDIO', area: 'Redirecciones antiguas', url: r.requested, detail: 'La URL heredada entrega contenido sin redirección; confirmar si aún debe estar activa.' });
  else if (r.redirects?.length && r.redirects.length > 1) report.findings.push({ severity: 'BAJO', area: 'Redirecciones antiguas', url: r.requested, detail: `Cadena con ${r.redirects.length} saltos; simplificar si procede.` });
}
for (const [legacyPath, expectedPath] of EXPECTED_LEGACY_DESTINATIONS) {
  const result = report.redirects.find(item => item.path === legacyPath);
  if (!result || result.error) continue; // transport errors remain inconclusive and are reported separately.
  const finalUrl = absolute(result.finalUrl || '', BASE);
  const finalPath = finalUrl ? (finalUrl.pathname.replace(/\/$/, '') || '/') : '';
  if (!result.redirects?.length) {
    report.findings.push({ severity: 'ALTO', area: 'Redirecciones heredadas de Search Console', url: result.requested, detail: `No ha redirigido a ${expectedPath}; devuelve HTTP ${result.status}.` });
  } else if (!finalUrl || finalUrl.origin !== BASE.origin || finalPath !== expectedPath) {
    report.findings.push({ severity: 'ALTO', area: 'Destino de redirección de Search Console', url: result.requested, detail: `Destino final incorrecto: ${result.finalUrl}; se esperaba ${expectedPath}.` });
  }
}

const sourceTrackers = report.localScans.filter(x => x.kind === 'analytics' && x.found.length > 0);
const liveTrackers = [...new Set(allPages.flatMap(p => p.trackers || []))];
report.analyticsSummary = {
  sourceTrackers,
  liveTrackers,
  customTrackingSourceFiles: customTracking,
  note: liveTrackers.includes('Cloudflare Web Analytics')
    ? 'Cloudflare Web Analytics aparece en el HTML entregado al navegador; revisar en dashboard si incluye tráfico UE y validar CSP.'
    : 'No se detectó el beacon de Cloudflare ni una etiqueta de analítica conocida en el HTML consultado. Eso no demuestra por sí solo que la analítica esté desactivada en el dashboard: comprobar la inyección edge y la consola de un navegador real.',
};
report.cookieSummary = {
  observedSetCookieHeaders: [...new Set(report.pages.flatMap(p => p.setCookieHeaders || []))],
  sourceStorageApis: report.localScans.filter(x => x.kind === 'storage-api' && x.found.length > 0),
  note: 'Set-Cookie solo refleja la respuesta HTTP inspeccionada; los scripts podrían añadir cookies después de ejecutar en navegador, por lo que debe hacerse una prueba limpia en Chrome/Firefox con DevTools.',
};
report.summary = {
  pagesChecked: allPages.length,
  routesFromSitemap: sitemapFetchedSuccessfully ? routeUrls.length : 0,
  provisionalRoutesUsed: sitemapFetchedSuccessfully ? 0 : routeUrls.length,
  sitemapVerified: sitemapFetchedSuccessfully,
  high: report.findings.filter(x => x.severity === 'ALTO').length,
  medium: report.findings.filter(x => x.severity === 'MEDIO').length,
  low: report.findings.filter(x => x.severity === 'BAJO').length,
  status: connectivityInconclusive ? 'AUDITORIA INCONCLUSA: CONECTIVIDAD' : report.findings.some(x => x.severity === 'ALTO') ? 'HAY BLOQUEOS' : report.findings.some(x => x.severity === 'MEDIO') ? 'REQUIERE REVISION' : 'SIN ERRORES DETECTADOS EN ESTA AUDITORIA',
};

const md = [];
md.push(`# Auditoría live 360° — López Márquez Abogados`, '');
md.push(`- Fecha: ${report.date}`, `- Dominio revisado: ${BASE.origin}`, `- URLs comprobadas: ${report.summary.pagesChecked}`, `- URLs detectadas en sitemap: ${report.summary.routesFromSitemap}`, `- Resultado automático: **${report.summary.status}**`, `- Hallazgos: ${report.summary.high} alto(s), ${report.summary.medium} medio(s), ${report.summary.low} bajo(s)`, '');
md.push('## Resumen de analítica', '');
md.push(`- Scripts conocidos detectados en HTML: ${report.analyticsSummary.liveTrackers.length ? report.analyticsSummary.liveTrackers.join(', ') : 'ninguno detectado'}.`);
md.push(`- Código fuente con librerías conocidas: ${sourceTrackers.length ? sourceTrackers.map(x => `${x.name} (${x.found.join(', ')})`).join('; ') : 'ninguna librería conocida encontrada'}.`);
md.push(`- Eventos propios identificados en código: ${customTracking.length ? customTracking.join(', ') : 'no detectados'}.`);
md.push(`- Interpretación: ${report.analyticsSummary.note}`, '');
md.push('## Resumen de cookies y almacenamiento', '');
md.push(`- APIs de almacenamiento encontradas en código: ${report.cookieSummary.sourceStorageApis.length ? report.cookieSummary.sourceStorageApis.map(x => `${x.name} (${x.found.join(', ')})`).join('; ') : 'ninguna de las APIs buscadas en el código local'}.`);
md.push(`- Cabeceras Set-Cookie observadas: ${report.cookieSummary.observedSetCookieHeaders.length ? report.cookieSummary.observedSetCookieHeaders.map(x => `\`${x}\``).join(', ') : 'ninguna en las respuestas HTML examinadas'}.`);
md.push(`- Limitación: ${report.cookieSummary.note}`, '');
md.push('## Páginas legales y contacto', '');
for (const p of report.pages.filter(p => ['/cookies','/privacidad','/aviso-legal','/en/cookies','/en/privacy','/en/legal-notice','/contacto','/en/contact'].includes(new URL(p.requested).pathname))) {
  md.push(`- **${new URL(p.requested).pathname}** — HTTP ${p.status}; robots: ${p.robots || '(sin meta robots)'}; título: ${p.title || '(sin título)'}; error: ${p.error || 'ninguno'}.`);
}
md.push('', '## Redirecciones heredadas', '');
for (const r of report.redirects) md.push(`- \`${r.path}\`: ${r.redirects?.length ? r.redirects.map(x => `${x.status} → ${new URL(x.to).pathname}`).join(' → ') : `HTTP ${r.status}${r.error ? `; ${r.error}` : ''}`}.`);
md.push('', '## Hallazgos automáticos', '');
if (!report.findings.length) md.push('No se detectaron errores en las comprobaciones automáticas realizadas. Esto no equivale a una certificación legal, de seguridad o de accesibilidad.');
else for (const f of report.findings) md.push(`- **${f.severity} · ${f.area}**${f.url ? ` · ${f.url}` : ''}${f.file ? ` · \`${f.file}\`` : ''}: ${f.detail}`);
md.push('', '## Comprobaciones que requieren el panel o un navegador real', '');
md.push('0. Si el resultado es AUDITORIA INCONCLUSA: CONECTIVIDAD, compara `curl -I --max-time 15 https://lopezmarquezabogados.com/sitemap.xml` con `node -e "fetch(\'https://lopezmarquezabogados.com/sitemap.xml\').then(r=>console.log(r.status,r.url)).catch(e=>console.error(e,e.cause))"`. Si curl funciona y Node no, el problema está en la ruta TLS/DNS/proxy que usa Node; no clasifiques todas las páginas como caídas.');
md.push('1. En Cloudflare → Web Analytics → Manage site: confirmar si el beacon está Enabled, si excluye visitantes de la UE y si el hostname configurado es el canónico. En el plan Free el ajuste por defecto puede excluir tráfico de la UE.');
md.push('2. Abrir una ventana privada con DevTools → Network y Application/Storage; cargar la home, navegar, abrir el formulario y usar herramientas. Registrar cookies antes y después, solicitudes a terceros y errores CSP. No enviar una consulta de prueba en producción sin acordarlo.');
md.push('3. Verificar en Search Console la cobertura/indexación real y enviar el sitemap. La auditoría por HTTP no puede ver rendimiento de búsqueda, clics, posición media ni conversiones reales de Search Console.');
md.push('4. Ejecutar Lighthouse/PageSpeed en móvil y escritorio; registrar LCP, INP, CLS, accesibilidad y oportunidades. Este script no simula navegador y no calcula esas métricas.');
md.push('5. La auditoría técnica no sustituye la validación por un profesional de los textos legales ni hace que un aviso de privacidad sea conforme si no identifica verazmente al responsable del tratamiento.', '');
md.push('## Fuentes', '');
md.push('- AEPD, Guía sobre el uso de las cookies (mayo 2024): https://www.aepd.es/es/documento/guia-cookies.pdf');
md.push('- RGPD, artículo 13: https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807');
md.push('- LSSI, artículo 10: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758');
md.push('- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/about/');
md.push('- Cloudflare automatic setup and EU exclusion: https://developers.cloudflare.com/web-analytics/get-started/', '');
md.push('---', 'Generado automáticamente por `scripts/audit-live-360.mjs`. Solo lectura: no modificó el sitio ni envió formularios.');

await fs.mkdir(OUT_DIR, { recursive: true });
const mdPath = path.join(OUT_DIR, `auditoria-live-360-${isoDate}.md`);
const jsonPath = path.join(OUT_DIR, `auditoria-live-360-${isoDate}.json`);
await fs.writeFile(mdPath, md.join('\n') + '\n', 'utf8');
await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
console.log('');
console.log(`Estado: ${report.summary.status}`);
console.log(`Solicitudes con fallos de conectividad: ${report.connectivity.networkFailures}/${report.connectivity.attemptedRequests}`);
console.log(`URLs verificadas desde sitemap: ${report.summary.routesFromSitemap}; rutas provisionales: ${report.summary.provisionalRoutesUsed}`);
console.log(`Hallazgos: ${report.summary.high} alto(s), ${report.summary.medium} medio(s), ${report.summary.low} bajo(s)`);
console.log(`Informe: ${path.relative(ROOT, mdPath)}`);
console.log(`Datos JSON: ${path.relative(ROOT, jsonPath)}`);
console.log('No se han enviado formularios ni modificado producción.');
