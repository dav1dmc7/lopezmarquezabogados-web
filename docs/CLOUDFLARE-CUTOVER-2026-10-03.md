# Cutover a Cloudflare Worker — López Márquez Abogados

## Estado detectado
La nueva aplicación se construye como Cloudflare Worker + Static Assets (`worker.ts` + `ASSETS`). El dominio público todavía puede estar apuntando al alojamiento anterior de Netlify. No cambiar DNS hasta asociar primero el dominio al Worker.

## Procedimiento seguro

1. Cloudflare → **Workers & Pages** → abrir el proyecto `lopezmarquezabogados`.
2. Entrar en **Custom Domains**.
3. Seleccionar **Set up a custom domain** y añadir `lopezmarquezabogados.com`.
4. Repetir con `www.lopezmarquezabogados.com` si Cloudflare no lo incorpora automáticamente.
5. Esperar a que cada dominio aparezca como activo y que el certificado HTTPS esté operativo.
6. En **DNS**, comprobar que ya no existe el `A @ → 75.2.60.5` de Netlify ni el `CNAME www → *.netlify.app` antiguo. Con Custom Domains, Cloudflare crea/gestiona el enlace al Worker.
7. No tocar los registros MX/TXT de correo salvo que exista un motivo independiente. El correo debe seguir funcionando aunque cambie el alojamiento web.
8. Comprobar manualmente en navegador:
   - `https://lopezmarquezabogados.com/`
   - `https://www.lopezmarquezabogados.com/`
   - `/contacto/`
   - `/laboral/despidos/`
   - `/extranjeria/arraigo/`
   - `/empresas/`
   - `/en/`
9. Ejecutar `npm run audit:production-live` y `npm run audit:dns-cutover`.

## No usar Routes como sustituto
Si el Worker es el origen de la aplicación, Cloudflare recomienda Custom Domains. Las Routes son para otros escenarios y requieren un DNS proxied compatible.

## Protección de SEO durante el corte
Después de comprobar el nuevo sitio:

- mantener la misma URL canónica principal;
- devolver 301 desde URLs legacy con equivalente;
- no crear 301 de todas las URLs antiguas hacia `/`;
- comprobar sitemap y robots;
- comprobar que no hay contenido antiguo accesible por las rutas `.html`.

## Correo
No eliminar MX/TXT de Namecheap/Google por el mero hecho de cambiar el hosting web. El website y el correo son servicios distintos.
