import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagesRoot = path.join(root, 'src', 'pages');
const siteFile = path.join(root, 'src', 'lib', 'site.ts');
const errors = [];
const warnings = [];

const read = (file) => {
  const absolute = path.isAbsolute(file) ? file : path.join(root, file);
  return fs.readFileSync(absolute, 'utf8');
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
};

const astroFiles = walk(pagesRoot).filter((file) => file.endsWith('.astro'));
const routeForFile = (file) => {
  const rel = path.relative(pagesRoot, file).replaceAll(path.sep, '/');
  if (rel === 'index.astro') return '/';
  return `/${rel.replace(/\/index\.astro$/, '').replace(/\.astro$/, '')}`;
};
const routeExists = (route) => {
  if (route === '/') return fs.existsSync(path.join(pagesRoot, 'index.astro'));
  const direct = path.join(pagesRoot, route.slice(1) + '.astro');
  const index = path.join(pagesRoot, route.slice(1), 'index.astro');
  return fs.existsSync(direct) || fs.existsSync(index);
};

for (const file of astroFiles) {
  const source = read(file);
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const route = routeForFile(file);
  if (!source.includes('<Layout')) warnings.push(`${rel}: no <Layout> usage detected`);
  if (route.startsWith('/en/') && /href=["']\/(laboral|extranjeria|empresas|recursos|contacto|sobre-nosotros)(?:["'])/.test(source)) {
    warnings.push(`${route}: hard-coded Spanish internal link detected; check locale parity`);
  }
}

const site = read(siteFile);
const mapMatch = site.match(/export const localizedPathMap: Record<string, string> = \{([\s\S]*?)\n\};/);
if (!mapMatch) errors.push('localizedPathMap could not be parsed');
else {
  const entries = [...mapMatch[1].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)].map((m) => [m[1], m[2]]);
  const map = new Map(entries);
  for (const [from, to] of entries) {
    if (map.get(to) !== from) errors.push(`localizedPathMap is not reciprocal: ${from} -> ${to}`);
    if (!routeExists(from)) errors.push(`localizedPathMap source route missing: ${from}`);
    if (!routeExists(to)) errors.push(`localizedPathMap target route missing: ${to}`);
  }
}

const indexMatch = site.match(/export const indexableRoutes = \[([\s\S]*?)\] as const;/);
if (indexMatch) {
  const routes = [...indexMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const route of routes) if (!routeExists(route)) errors.push(`indexableRoutes route missing: ${route}`);
}

const commercialChecks = [
  ['/laboral', ['Abogado laboralista en Barcelona', '/contacto']],
  ['/extranjeria', ['Abogado de Extranjería en Barcelona', '/contacto']],
  ['/en/employment', ['Employment Lawyer in Barcelona', '/en/contact']],
  ['/en/immigration', ['Immigration lawyer in Barcelona', '/en/contact']],
  ['/laboral/incapacidad-permanente', ['incapacidad permanente']],
  ['/en/employment/permanent-disability', ['Permanent Disability Lawyer']],
  ['/laboral/incapacidad-temporal', ['incapacidad temporal']],
  ['/en/employment/temporary-sickness-leave', ['temporary sickness leave']],
  ['/recursos/incapacidad-permanente-ley-2025', ['incapacidad permanente']],
  ['/en/resources/permanent-disability-employment-2025', ['permanent disability']],
];

for (const [route, needles] of commercialChecks) {
  const file = astroFiles.find((candidate) => routeForFile(candidate) === route);
  if (!file) { errors.push(`Intent route missing from source tree: ${route}`); continue; }
  const body = read(file).toLowerCase();
  for (const needle of needles) {
    if (!body.includes(String(needle).toLowerCase())) warnings.push(`${route}: expected intent/CTA phrase not found: ${needle}`);
  }
  const hasContact = body.includes('/contacto') || body.includes('/en/contact') || body.includes('site.emailHref') || body.includes('site.whatsapp');
  if (!hasContact) warnings.push(`${route}: no obvious contact path detected`);
}

const layoutFile = path.join(root, 'src', 'layouts', 'Layout.astro');
const layoutSource = read(layoutFile);
if (layoutSource.includes('hreflang=\"x-default\" href={site.url}')) errors.push('x-default still points every localized page to the Spanish home page');
if (layoutSource.includes('href=\"/brand/logo.svg\"')) warnings.push('structured/header logo path still references the SVG in a selector check; visual logo is expected to use the official black-background lockup');

const labourHub = path.join(pagesRoot, 'laboral', 'index.astro');
if (fs.existsSync(labourHub) && read(labourHub).includes('href=\"/laboral/asesoramiento-empresas\"')) warnings.push('/laboral still links to duplicate business-employment advice route');

const requiredFiles = [
  'src/pages/laboral/incapacidad-temporal.astro',
  'src/pages/laboral/incapacidad-permanente.astro',
  'src/pages/recursos/incapacidad-permanente-ley-2025.astro',
  'src/pages/en/employment/temporary-sickness-leave.astro',
  'src/pages/en/employment/permanent-disability.astro',
  'src/pages/en/resources/permanent-disability-employment-2025.astro',
  'public/brand/logo.svg',
];
for (const rel of requiredFiles) if (!fs.existsSync(path.join(root, rel))) errors.push(`Required asset/page missing: ${rel}`);

if (errors.length) {
  console.error(`Intent audit FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  errors.forEach((item) => console.error(`ERROR: ${item}`));
  warnings.forEach((item) => console.warn(`WARN: ${item}`));
  process.exit(1);
}
console.log(`Intent audit OK: ${astroFiles.length} Astro pages, localized routes reciprocal, indexable routes resolvable, commercial intent checks present.`);
if (warnings.length) warnings.forEach((item) => console.warn(`WARN: ${item}`));
