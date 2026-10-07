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
- Aplicar las migraciones pendientes de D1 antes de desplegar una versión del Worker que las utilice.
- Probar email, teléfono, WhatsApp, Google Maps y formulario en escritorio y móvil, tanto con JavaScript activo como desactivado.
- Confirmar entrega, rebotes y SPF/DKIM/DMARC del remitente técnico en el proveedor y DNS.
- Definir y ejecutar plazos de conservación/borrado de consultas en D1 y del buzón.
- Aplicar comprobación de conflictos de intereses antes de aceptar cada asunto.
- Indicar un canal adecuado antes de solicitar documentación sensible.
- Revisar `workers.dev`: debe aparecer `noindex` antes del dominio definitivo.
- Comprobar que `www` redirige al dominio canónico y que apex/`www` responden bien antes de publicar.
- Comprobar las URLs legacy con y sin `.html`; no basta con que las rutas nuevas respondan.
- Tras cualquier cambio de dominio: comprobar HTTPS, canonical, robots, sitemap y enlaces.

## No hacer todavía
- No publicar el dominio definitivo mientras las páginas legales sigan siendo borradores.
- No añadir analítica de terceros sin actualizar privacidad/cookies.
