#!/usr/bin/env node
/** Build a sitemap from the actual Astro page tree, excluding noindex/utility pages. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'src', 'pages');
const PUBLIC = path.join(ROOT, 'public');

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.astro')) out.push(absolute);
  }
  return out;
}
function xmlEscape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
function pagePath(file) {
  let rel = path.relative(PAGES, file).split(path.sep).join('/').replace(/\.astro$/, '');
  if (rel === 'index') rel = '';
  else if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
  if (rel.split('/').some(segment => segment.startsWith('[') && segment.endsWith(']'))) return null;
  return `/${rel}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}
async function main() {
  let config = '';
  try { config = await fs.readFile(path.join(ROOT, 'astro.config.mjs'), 'utf8'); } catch {}
  const match = config.match(/site\s*:\s*['"](https?:\/\/[^'"]+)['"]/);
  const siteUrl = (process.env.PUBLIC_SITE_URL || match?.[1] || '').replace(/\/$/, '');
  if (!siteUrl) throw new Error('No se pudo determinar la URL canónica desde astro.config.mjs o PUBLIC_SITE_URL.');

  const files = await walk(PAGES);
  const urls = [];
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const route = pagePath(file);
    if (!route || route === '/404' || route === '/500' || route === '/api' || route.startsWith('/api/')) continue;
    if (/\bnoindex\s*=\s*\{\s*true\s*\}/i.test(source)) continue;
    if (['/consulta-enviada', '/en/contact/sent'].includes(route)) continue;
    urls.push(`${siteUrl}${route === '/' ? '/' : route}`);
  }
  const unique = [...new Set(urls)].sort((a, b) => a === `${siteUrl}/` ? -1 : b === `${siteUrl}/` ? 1 : a.localeCompare(b));
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  await fs.mkdir(PUBLIC, { recursive: true });
  await fs.writeFile(path.join(PUBLIC, 'sitemap.xml'), body, 'utf8');
  console.log(`Sitemap generado: public/sitemap.xml (${unique.length} URLs, dominio ${siteUrl}).`);
}
main().catch(error => { console.error(`ERROR sitemap: ${error.message}`); process.exitCode = 1; });
