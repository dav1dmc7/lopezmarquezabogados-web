# Observabilidad gratuita — estado 2026-10-03

## Lo que ya está en el proyecto

- `public/analytics.js` existe y queda bajo una compuerta explícita de consentimiento.
- La integración se audita automáticamente.
- Los eventos de comportamiento se mantienen separados de los datos de las consultas jurídicas.
- El Worker y D1 siguen cubriendo el registro de leads/contactos.

## Lo que NO puede activarse desde el repositorio

La activación de los paneles externos requiere acceso al dashboard correspondiente:

1. **Cloudflare Web Analytics**: activar/conectar el hostname y su beacon desde Cloudflare.
2. **Cloudflare Zaraz**: configurar las herramientas/destinos que recibirán los eventos personalizados.
3. **Google Search Console**: verificar la propiedad del dominio.

## Qué se obtiene

- Cloudflare/Workers: volumen de solicitudes y estado del Worker.
- Cloudflare Web Analytics: métricas de visitantes/páginas y rendimiento web.
- Zaraz: eventos de comportamiento, por ejemplo clics en llamadas a la acción, siempre respetando el consentimiento configurado.
- Search Console: clics, impresiones, CTR, posición media, consultas, páginas, países y dispositivos en Google Search.
- D1: contactos/leads enviados al backend, separados de la analítica de comportamiento.

## Regla de privacidad

La analítica del sitio no debe enviar el contenido de una consulta, nombre, email, teléfono, DNI/NIE/pasaporte, expediente ni otros datos aportados al formulario.
