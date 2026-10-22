# Auditoría live 360° — López Márquez Abogados

- Fecha: 2026-10-10
- Dominio revisado: https://lopezmarquezabogados.com
- URLs comprobadas: 20
- URLs detectadas en sitemap: 0
- Resultado automático: **AUDITORIA INCONCLUSA: CONECTIVIDAD**
- Hallazgos: 0 alto(s), 2 medio(s), 0 bajo(s)

## Resumen de analítica

- Scripts conocidos detectados en HTML: ninguno detectado.
- Código fuente con librerías conocidas: Cloudflare Web Analytics (src/layouts/Layout.astro); Google Analytics / gtag (src/layouts/Layout.astro, src/pages/en/employment/permanent-disability.astro, src/pages/laboral/incapacidad-permanente.astro, src/pages/laboral/incapacidad-temporal.astro, src/styles/global.css, wrangler.jsonc).
- Eventos propios identificados en código: public/company-self-assessment.js, public/extranjeria-triage.js, public/indemnizacion-calculator.js, public/site.js.
- Interpretación: No se detectó el beacon de Cloudflare ni una etiqueta de analítica conocida en el HTML consultado. Eso no demuestra por sí solo que la analítica esté desactivada en el dashboard: comprobar la inyección edge y la consola de un navegador real.

## Resumen de cookies y almacenamiento

- APIs de almacenamiento encontradas en código: ninguna de las APIs buscadas en el código local.
- Cabeceras Set-Cookie observadas: ninguna en las respuestas HTML examinadas.
- Limitación: Set-Cookie solo refleja la respuesta HTTP inspeccionada; los scripts podrían añadir cookies después de ejecutar en navegador, por lo que debe hacerse una prueba limpia en Chrome/Firefox con DevTools.

## Páginas legales y contacto

- **/cookies** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/privacidad** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/aviso-legal** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/en/cookies** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/en/privacy** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/en/legal-notice** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/contacto** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/en/contact** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/contacto** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- **/en/contact** — HTTP ERR; robots: (sin meta robots); título: (sin título); error: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).

## Redirecciones heredadas

- `/es/about.html`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/es/servicios`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/es/faqs.html`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/en/index_en`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/es/about`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/es/contact.html`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/en/about_en.html`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).
- `/en/faqs_en.html`: HTTP ERR; TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms).

## Hallazgos automáticos

- **MEDIO · CSP / Analytics** · `public/_headers`: La CSP restringe script-src a self; si Cloudflare inserta el beacon externo de Web Analytics en el edge, debe comprobarse que el navegador no lo bloquea. Los eventos dataLayer locales no prueban transmisión de datos.
- **MEDIO · Conectividad de auditoría**: 30 de 30 solicitudes fallaron antes de obtener una respuesta HTTP. Ejemplo: TypeError: fetch failed | code=UND_ERR_CONNECT_TIMEOUT | cause=Connect Timeout Error (attempted addresses: 188.114.96.5:443, 188.114.97.5:443, timeout: 10000ms). Comprueba conectividad con curl y repite la auditoría.

## Comprobaciones que requieren el panel o un navegador real

0. Si el resultado es AUDITORIA INCONCLUSA: CONECTIVIDAD, compara `curl -I --max-time 15 https://lopezmarquezabogados.com/sitemap.xml` con `node -e "fetch('https://lopezmarquezabogados.com/sitemap.xml').then(r=>console.log(r.status,r.url)).catch(e=>console.error(e,e.cause))"`. Si curl funciona y Node no, el problema está en la ruta TLS/DNS/proxy que usa Node; no clasifiques todas las páginas como caídas.
1. En Cloudflare → Web Analytics → Manage site: confirmar si el beacon está Enabled, si excluye visitantes de la UE y si el hostname configurado es el canónico. En el plan Free el ajuste por defecto puede excluir tráfico de la UE.
2. Abrir una ventana privada con DevTools → Network y Application/Storage; cargar la home, navegar, abrir el formulario y usar herramientas. Registrar cookies antes y después, solicitudes a terceros y errores CSP. No enviar una consulta de prueba en producción sin acordarlo.
3. Verificar en Search Console la cobertura/indexación real y enviar el sitemap. La auditoría por HTTP no puede ver rendimiento de búsqueda, clics, posición media ni conversiones reales de Search Console.
4. Ejecutar Lighthouse/PageSpeed en móvil y escritorio; registrar LCP, INP, CLS, accesibilidad y oportunidades. Este script no simula navegador y no calcula esas métricas.
5. La auditoría técnica no sustituye la validación por un profesional de los textos legales ni hace que un aviso de privacidad sea conforme si no identifica verazmente al responsable del tratamiento.

## Fuentes

- AEPD, Guía sobre el uso de las cookies (mayo 2024): https://www.aepd.es/es/documento/guia-cookies.pdf
- RGPD, artículo 13: https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807
- LSSI, artículo 10: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/about/
- Cloudflare automatic setup and EU exclusion: https://developers.cloudflare.com/web-analytics/get-started/

---
Generado automáticamente por `scripts/audit-live-360.mjs`. Solo lectura: no modificó el sitio ni envió formularios.
