import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lopezmarquezabogados.com',
  trailingSlash: 'never',
  output: 'static',
  compressHTML: true,
  build: { format: 'directory' }
});
