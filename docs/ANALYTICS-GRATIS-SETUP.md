# Analítica gratuita — López Márquez Abogados

## Qué medimos

- visitas y páginas vistas;
- entradas y referencias;
- dispositivo y rendimiento;
- clics en WhatsApp, email y teléfono;
- clics en CTAs;
- uso de calculadora/orientadores;
- inicio/envío de formularios;
- profundidad de scroll;
- UTM de campañas;
- idioma y ruta.

## Qué NO medimos

No se envían a la capa de analítica nombres, emails, teléfonos, mensajes, DNI/NIE/pasaporte ni contenido jurídico escrito en formularios.

## Servicios gratuitos recomendados

### 1. Cloudflare Web Analytics
Disponible en todos los planes de Cloudflare. Sirve para tráfico, páginas y rendimiento real. Activarlo en el dashboard de Cloudflare para `lopezmarquezabogados.com`.

### 2. Cloudflare Zaraz
Disponible en todos los planes de Cloudflare. La web ya tiene una capa `window.zaraz.track()` preparada para eventos personalizados cuando exista consentimiento.

Eventos relevantes: `lm_page_view`, `lm_click`, `lm_scroll_depth`, `lm_form_start`, `lm_form_submit_intent`.

### 3. Google Search Console
Usarlo para impresiones, clics, consultas de búsqueda, CTR y cobertura de indexación. No sustituye la analítica de comportamiento, pero es la fuente principal gratuita para comprobar si Google está generando tráfico.

### 4. Semrush
No es necesario para este proyecto. El plan gratuito es limitado; no asumimos ningún coste.

## Consentimiento

Antes de activar proveedores externos que requieran consentimiento, el mecanismo de cookies/privacidad debe establecer `window.__LM_ANALYTICS_CONSENT__ = true`.

## Primer cuadro de mando

Cada semana revisar:

1. visitantes;
2. sesiones/visitas;
3. top landing pages;
4. consultas orgánicas;
5. WhatsApp clicks;
6. email clicks;
7. phone clicks;
8. CTA clicks;
9. calculator/triage completions;
10. contactos reales recibidos.

La métrica final no será `visitas`, sino `contactos cualificados / visitas`.
