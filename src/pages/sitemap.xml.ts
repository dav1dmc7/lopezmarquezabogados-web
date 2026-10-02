import { indexableRoutes } from '../lib/site';

export const GET = () => {
  const urls = indexableRoutes.map((path) => {
    const loc = `https://lopezmarquezabogados.com${path === '/' ? '' : path}`;
    return `  <url><loc>${loc}</loc></url>`;
  }).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
