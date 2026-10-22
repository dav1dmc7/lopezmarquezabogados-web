# Formulario de contacto — Worker, D1 y Resend

El formulario publica en `/api/contact`. El Worker valida la consulta y la guarda en D1 antes de intentar enviar emails.

## Flujo

1. Guarda la consulta en D1 aunque falle el proveedor de correo.
2. Envía un aviso interno a `lopezmarquezabogados@gmail.com`, con referencia y enlace para responder al cliente.
3. Envía una confirmación al cliente, en español o inglés según el formulario, con logo, resumen de su consulta, referencia y advertencia de no enviar documentación sensible por email.
4. Registra por separado el estado del aviso interno, el estado de la confirmación al cliente y el proveedor utilizado.
5. Si Resend no puede enviar el aviso interno, el Worker intenta el binding de Cloudflare como respaldo. La confirmación al cliente requiere Resend porque la persona puede usar cualquier correo.

## Resend Free

El plan Free publicado actualmente indica 3.000 emails al mes, 100 al día y 3 dominios verificados. Vigila el consumo en el panel de Resend; no actives funciones de pago.

1. Crea una cuenta gratuita.
2. En **Domains**, añade `lopezmarquezabogados.com`.
3. Copia a Cloudflare los registros DNS exactos que te muestre Resend.
4. Vuelve a Resend y confirma que el dominio está verificado.
5. En la terminal, ejecuta `npx wrangler secret put RESEND_API_KEY` y pega la API key.
6. No guardes la clave real en Git, `.env`, `wrangler.jsonc` ni el navegador.

## Cloudflare Turnstile

El formulario incluye integración opcional con Turnstile Managed. Mientras no haya una clave pública en el entorno de compilación, el widget no se muestra. Si se configura el secreto o se activa la variable `TURNSTILE_REQUIRED=true` en el Worker, el servidor exige una validación correcta antes de insertar la consulta en D1.

1. En Cloudflare Turnstile, crea un widget gratuito en modo **Managed** para `lopezmarquezabogados.com` y `www.lopezmarquezabogados.com`.
2. Configura la clave pública como `PUBLIC_TURNSTILE_SITE_KEY` en el entorno que compila Astro.
3. Guarda la clave secreta solo como secreto del Worker con `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. Configura `TURNSTILE_REQUIRED=true` como variable no secreta del Worker. Publica el nuevo HTML con la clave pública y el Worker con el secreto y la variable en el mismo despliegue, para no dejar un formulario protegido solo en el navegador.
5. Antes de activarlo, confirma que el aviso de privacidad identifica correctamente a Cloudflare como proveedor de seguridad y describe los tratamientos y transferencias reales. No inventes ni completes esos datos sin validación.
6. Prueba localmente con las claves de prueba oficiales de Cloudflare. Usa `TURNSTILE_REQUIRED=true`, `TURNSTILE_TEST_MODE=true` y la clave secreta de prueba en `.dev.vars` (archivo ignorado por Git); `TURNSTILE_TEST_MODE` solo se acepta cuando la solicitud llega a `localhost` o `127.0.0.1`. Comprueba token válido, ausente, inválido, caducado y reutilizado; valida que una respuesta incorrecta de Siteverify nunca se guarda en D1 ni genera email.

El Worker envía el token a Siteverify, incluye la IP que aporta Cloudflare cuando está disponible y comprueba éxito, host y acción `contact`. Los errores de red/configuración se muestran al usuario en español e inglés, permiten volver a intentar y no crean una consulta. El secreto nunca se incluye en HTML ni en JavaScript.

La integración local está preparada, pero sigue desactivada hasta crear el widget, disponer de las dos claves y validar la información de privacidad. La disponibilidad de Turnstile puede requerir recursos de `challenges.cloudflare.com`, permitidos de forma acotada en la CSP del proyecto.

## DNS: no cambiar los MX raíz

Este flujo usa la API HTTPS de Resend y no requiere Cloudflare Email Routing. No sustituyas los MX `eforward*.registrar-servers.com` por `route*.mx.cloudflare.net` solo para activar el formulario. Añade únicamente los registros exactos del panel de Resend.

El dominio ya tiene un SPF de Namecheap en la raíz. Si Resend ofrece otro SPF para el mismo host `@`, no publiques dos TXT SPF: detente y combina/ajusta el valor tras confirmar el host. Si Resend ofrece SPF en un subdominio (por ejemplo, `send`), es un host distinto. No borres los TXT de Google ni los MX actuales sin una razón independiente.

## Migración D1

`migrations/0003_add_email_delivery_status.sql` añade `internal_notification_status`, `customer_confirmation_status` y `notification_provider`, y clasifica las notificaciones antiguas según el estado previo. Antes de aplicar cambios remotos, confirma el nombre de la base y el esquema actual. Wrangler crea una copia de seguridad cuando aplica una migración D1.

## Recuperar un aviso antiguo pendiente

Tras verificar el dominio en Resend y disponer de la API key, el script `scripts/resend-pending-notification.mjs` puede reenviar un aviso interno por ID. Solo permite por defecto registros que sigan en `stored_pending_notification`; para forzar uno que figure como enviado, usa `--force` únicamente después de revisar el riesgo de duplicado.

```bash
read -s "RESEND_API_KEY?Pega la API key de Resend: "; export RESEND_API_KEY; echo
node scripts/resend-pending-notification.mjs <UUID-DE-LA-CONSULTA>
unset RESEND_API_KEY
```

Este script no envía confirmaciones retroactivas al cliente. Antes de reenviar, confirma que la fila corresponde a una consulta real y que no es solo una prueba.

## Verificación

```bash
npm run verify
git diff --check
```

Prueba de producción: enviar una consulta de prueba en español e inglés, comprobar ambos correos, comprobar ambos `Reply-To` y verificar los estados de D1.
