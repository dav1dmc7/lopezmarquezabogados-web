# Publicación y retirada del sitio antiguo

## Objetivo

- `https://lopezmarquezabogados.com` es la única web pública e indexable.
- `https://www.lopezmarquezabogados.com` redirige permanentemente al dominio raíz.
- La web antigua y cualquier preview de despliegue no deben servir contenido público ni aparecer en buscadores.
- El código antiguo se conserva como copia privada/local en el Mac y en el GitHub personal; no se borra.
- No se cambian registros MX ni se eliminan bases de datos o repositorios.

## Publicar esta versión

1. Ejecutar `npm run verify` y revisar `git diff --check`.
2. Confirmar que la rama `main` del repositorio personal contiene los cambios validados.
3. En Cloudflare, comprobar que el Worker `lopezmarquezabogados` tiene asociados los Custom Domains `lopezmarquezabogados.com` y `www.lopezmarquezabogados.com`.
4. Aplicar primero la migración D1 pendiente con `npx wrangler d1 migrations apply lopezmarquez-consultas --remote` y revisar que aparece como aplicada.
5. Comprobar que D1 y Email Sending están enlazados al Worker y que el dominio remitente está autenticado.
6. Desplegar con `npx wrangler deploy` desde este repositorio. No publicar previews como sitios indexables.
7. Verificar la home, rutas principales, formulario, correo, redirección de `www`, rutas legacy, `robots.txt`, sitemap y cabeceras.

## Retirar el sitio anterior

1. En el proveedor de hosting antiguo, desactivar el sitio público y los deploys automáticos. Mantener el repositorio/copia de código en el Mac y el GitHub personal.
2. No borrar el dominio, el repositorio histórico ni la base de datos.
3. En Cloudflare DNS, confirmar que raíz y `www` llegan al Worker nuevo; retirar solo los registros web antiguos que impidan asociar esos hostnames. No tocar MX, SPF, DKIM ni DMARC.
4. Probar la URL pública antigua del proveedor: debe dejar de servir el contenido antiguo. Si el proveedor permite mantenerla activa, configurar una respuesta de retirada/noindex y una redirección al dominio canónico antes de despublicarla.
5. En Google Search Console, usar la propiedad de dominio: enviar el sitemap actual, inspeccionar la home y las rutas actualizadas, y solicitar retirada temporal de URLs antiguas/staging que sigan apareciendo. Revisar cobertura hasta que el índice refleje el sitio nuevo.

## Datos que siguen pendientes

No publicar las páginas legales ni retirar su `noindex` hasta que el usuario confirme los datos del responsable, datos colegiales, proveedor real y conservación aplicable. No inventar esos datos.
