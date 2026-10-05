import { existsSync, readFileSync } from 'node:fs';

const errors = [];
const warnings = [];
const layoutPath = 'src/layouts/Layout.astro';
const cssPath = 'src/styles/global.css';

if (!existsSync(layoutPath)) errors.push('Layout.astro missing');
if (!existsSync(cssPath)) errors.push('global.css missing');

const layout = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf8') : '';
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';

const hasFocusRule = /:focus-visible\s*\{[\s\S]*?outline\s*:/i.test(css) || /:focus\s*\{[\s\S]*?outline\s*:/i.test(css);
const hasReducedMotion = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(css);
const hasMain = /<main\b/i.test(layout);
const hasSkip = /skip-link|skip link/i.test(layout);
const hasNavToggle = /aria-expanded|menu-toggle|nav-toggle/i.test(layout);

if (!hasFocusRule) warnings.push('Layout/CSS: no explicit visible keyboard focus rule found in global CSS');
if (!hasReducedMotion) warnings.push('Layout/CSS: no prefers-reduced-motion rule found in global CSS');
if (!hasMain) warnings.push('Layout: shared main landmark not found; review page landmark structure');
if (!hasSkip) warnings.push('Layout: skip-link not found; review keyboard navigation');
if (!hasNavToggle) warnings.push('Layout: shared mobile navigation control is not obvious; review keyboard/menu semantics');

console.log(`Source accessibility QA errors: ${errors.length}`);
console.log(`Source accessibility QA warnings: ${warnings.length}`);
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) process.exit(1);
