# Medición gratuita de tráfico — activación final

## Objetivo

Tener visibilidad de:

- visitas y páginas vistas;
- páginas de entrada y navegación;
- rendimiento real (Core Web Vitals / tiempos de carga);
- clics en CTAs (teléfono, email, WhatsApp y otros enlaces de contacto, cuando estén instrumentados);
- rendimiento orgánico en Google (consultas, clics, impresiones, CTR y posición);
- formularios/leads recibidos por el backend D1.

## Paso 1 — Cloudflare Web Analytics

La documentación vigente de Cloudflare indica que para un hostname proxied basta con entrar en Web Analytics, elegir Add a site y seleccionar el hostname. La configuración automática puede inyectar el beacon; alternativamente existe instalación manual.

Ruta: Cloudflare Dashboard → Web Analytics → Add a site → `lopezmarquezabogados.com`.

Después de activarlo, comprobar que aparecen datos tras visitar la web y esperar unos minutos. Revisar también el panel Web Analytics.

## Paso 2 — Zaraz

Ruta: Cloudflare Dashboard → Zaraz / Tag Setup.

Configurar únicamente los destinos que realmente vayamos a utilizar. Para eventos personalizados, Zaraz utiliza eventos enviados mediante `zaraz.track()` y triggers que comparan el Event Name.

Crear un propósito de consentimiento para las herramientas no estrictamente necesarias y asignar cada herramienta a su propósito correspondiente. No deben enviarse datos de la consulta jurídica ni PII del formulario a los eventos de comportamiento.

## Paso 3 — Google Search Console

Crear una propiedad de dominio para `lopezmarquezabogados.com`.

Google proporciona un registro TXT/CNAME único para verificar la propiedad. Añadir exactamente ese registro en DNS sin eliminar los registros actuales de correo.

Una vez verificada la propiedad, enviar:

`https://lopezmarquezabogados.com/sitemap.xml`

## Paso 4 — Comprobación final

Comprobar durante una navegación privada:

1. página de inicio abierta;
2. navegación a una página de servicio;
3. clic en un CTA de contacto;
4. envío de un formulario de prueba sin datos reales;
5. comprobar que el evento aparece en Zaraz cuando corresponde y con consentimiento;
6. comprobar que Search Console acepta el sitemap;
7. comprobar que Web Analytics recibe actividad.

## Privacidad

La capa de analítica del proyecto no debe transmitir nombre, email, teléfono, DNI/NIE/pasaporte, mensaje, expediente, contenido jurídico ni cualquier otro dato introducido por una persona en el formulario.
