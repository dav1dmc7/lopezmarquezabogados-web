# Formulario de contacto — Worker y D1

El formulario publica en `/api/contact` del mismo dominio. JavaScript mejora la experiencia con validación y mensajes dentro de la página; el formulario HTML también puede enviarse directamente al Worker cuando JavaScript está desactivado.

## Flujo actual

1. El Worker valida el origen, formato, campos, área permitida y consentimiento.
2. El campo honeypot rellenado se descarta silenciosamente: no crea una fila ni dispara un email.
3. Las consultas válidas se guardan en D1 mediante el binding `lopezmarquez_consultas`.
4. El Worker intenta notificar a `site.email` mediante el binding `EMAIL`, con `web@lopezmarquezabogados.com` como remitente y el email de la persona como `Reply-To`.
5. Si la notificación falla, la consulta queda guardada con estado `stored_pending_notification`; el envío del email no es la única copia.

El control actual limita cada dirección a tres consultas en quince minutos. La ruta de origen, sin query string, se guarda en D1 y se incluye en el aviso interno; no se transmite a los eventos de analítica.

## Configuración que utiliza el proyecto

Los bindings de producción están declarados en `wrangler.jsonc`; el esquema de D1 está en `migrations/0001_create_consultations.sql`. Para aplicar cambios de esquema hay que crear una migración nueva y coordinar su aplicación remota. No se deben recrear la base, sustituir su identificador ni desplegar desde esta nota.

El `send_email` binding permite el remitente y destinatario definidos en la configuración. Verifica el estado de entrega, rebotes y autenticación de dominio (SPF, DKIM y DMARC) en Cloudflare y DNS antes de depender del correo como alerta operativa.

## Límites y pendientes operativos

- La aplicación conserva los datos de consultas en D1 y el aviso enviado queda además en el buzón. El código no configura un plazo automático de borrado; el responsable debe definir y aplicar la política de conservación.
- No se debe pedir ni enviar documentación sensible en la consulta inicial. El despacho debe indicar el canal apropiado después de revisar la consulta y los posibles conflictos de intereses.
- La web no acepta por sí misma un encargo profesional: el alcance, los honorarios y las comprobaciones necesarias se explican antes de empezar.
- La disponibilidad del endpoint depende del Worker, D1 y el servicio de correo enlazado.

## Verificación antes de publicar cambios

```bash
npm run verify
git diff --check
```

El despliegue sigue el procedimiento autorizado del repositorio; esta documentación no autoriza por sí sola una publicación.
