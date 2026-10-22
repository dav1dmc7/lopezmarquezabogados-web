# Auditoría live 360° — López Márquez Abogados

- Fecha: 2026-10-09
- Dominio revisado: https://lopezmarquezabogados.com
- URLs comprobadas: 64
- URLs detectadas en sitemap: 56
- Resultado automático: **REQUIERE REVISION**
- Hallazgos: 0 alto(s), 1 medio(s), 0 bajo(s)

## Resumen de analítica

- Scripts conocidos detectados en HTML: Cloudflare Web Analytics, Google Analytics / gtag.
- Código fuente con librerías conocidas: Cloudflare Web Analytics (src/layouts/Layout.astro); Google Analytics / gtag (src/layouts/Layout.astro, src/pages/en/employment/permanent-disability.astro, src/pages/laboral/incapacidad-permanente.astro, src/pages/laboral/incapacidad-temporal.astro, src/styles/global.css, wrangler.jsonc).
- Eventos propios identificados en código: public/company-self-assessment.js, public/extranjeria-triage.js, public/indemnizacion-calculator.js, public/site.js.
- Interpretación: Cloudflare Web Analytics aparece en el HTML entregado al navegador; revisar en dashboard si incluye tráfico UE y validar CSP.

## Resumen de cookies y almacenamiento

- APIs de almacenamiento encontradas en código: ninguna de las APIs buscadas en el código local.
- Cabeceras Set-Cookie observadas: ninguna en las respuestas HTML examinadas.
- Limitación: Set-Cookie solo refleja la respuesta HTTP inspeccionada; los scripts podrían añadir cookies después de ejecutar en navegador, por lo que debe hacerse una prueba limpia en Chrome/Firefox con DevTools.

## Páginas legales y contacto

- **/cookies** — HTTP 200; robots: noindex,follow; título: Política de cookies | López Márquez Abogados; error: ninguno.
- **/privacidad** — HTTP 200; robots: noindex,follow; título: Política de privacidad | López Márquez Abogados; error: ninguno.
- **/aviso-legal** — HTTP 200; robots: noindex,follow; título: Aviso legal | López Márquez Abogados; error: ninguno.
- **/en/cookies** — HTTP 200; robots: noindex,follow; título: Cookie Policy | López Márquez Abogados; error: ninguno.
- **/en/privacy** — HTTP 200; robots: noindex,follow; título: Privacy Policy | López Márquez Abogados; error: ninguno.
- **/en/legal-notice** — HTTP 200; robots: noindex,follow; título: Legal Notice | López Márquez Abogados; error: ninguno.
- **/contacto** — HTTP 200; robots: index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1; título: Contacto | López Márquez Abogados; error: ninguno.
- **/en/contact** — HTTP 200; robots: index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1; título: Contact an Employment or Immigration Lawyer | Barcelona | López Márquez Abogados; error: ninguno.
- **/contacto** — HTTP 200; robots: index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1; título: Contacto | López Márquez Abogados; error: ninguno.
- **/en/contact** — HTTP 200; robots: index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1; título: Contact an Employment or Immigration Lawyer | Barcelona | López Márquez Abogados; error: ninguno.

## Redirecciones heredadas

- `/es/about.html`: 301 → /sobre-nosotros.
- `/es/servicios`: 301 → /otras-areas.
- `/es/faqs.html`: 301 → /preguntas-frecuentes.
- `/en/index_en`: 301 → /en.
- `/es/about`: 301 → /sobre-nosotros.
- `/es/contact.html`: 301 → /contacto.
- `/en/about_en.html`: 301 → /en/about.
- `/en/faqs_en.html`: 301 → /en/faqs.

## Hallazgos automáticos

- **MEDIO · CSP / Analytics** · `public/_headers`: La CSP restringe script-src a self; si Cloudflare inserta el beacon externo de Web Analytics en el edge, debe comprobarse que el navegador no lo bloquea. Los eventos dataLayer locales no prueban transmisión de datos.

## Comprobaciones que requieren el panel o un navegador real

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
