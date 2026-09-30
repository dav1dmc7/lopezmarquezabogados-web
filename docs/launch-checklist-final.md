# Checklist de lanzamiento

## Código
- `npm run check`
- `npm run audit`
- `npm run build`
- `git diff --check`

## Antes de publicar
- Completar los datos identificativos y colegiales del aviso legal.
- Completar y validar la política de privacidad según los tratamientos reales.
- Validar la política de cookies con la configuración final de medición y Cloudflare.
- Probar email, teléfono, WhatsApp, Google Maps y formulario en escritorio y móvil.
- Revisar `workers.dev`: debe aparecer `noindex` antes del dominio definitivo.
- Tras la transferencia del dominio: comprobar HTTPS, canonical, robots, sitemap y enlaces.

## No hacer todavía
- No publicar el dominio definitivo mientras las páginas legales sigan siendo borradores.
- No añadir analítica de terceros sin actualizar privacidad/cookies.
