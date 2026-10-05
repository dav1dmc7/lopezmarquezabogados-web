# Formulario de contacto — Cloudflare Worker + D1

El formulario usa `/api/contact` en el mismo dominio. El Worker valida el contenido, guarda la consulta mínima en D1 y puede enviar un aviso al despacho mediante Resend.

## Configuración única

1. Crear la base de datos de producción:

```bash
npx wrangler d1 create lopezmarquez-consultas --location weur
```

2. Añadir en `wrangler.jsonc` el bloque `d1_databases` usando el `database_id` que devuelve Cloudflare:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "lopezmarquez-consultas",
    "database_id": "PEGAR_ID_DEVUELTO_POR_CLOUDFLARE"
  }
]
```

3. Aplicar la migración local:

```bash
npx wrangler d1 migrations apply lopezmarquez-consultas --local
```

4. Aplicar la migración remota:

```bash
npx wrangler d1 migrations apply lopezmarquez-consultas --remote
```

5. Para notificaciones, configurar un remitente verificado y las variables/secrets `RESEND_API_KEY` y `CONTACT_FROM_EMAIL`. El destinatario se toma de `src/lib/site.ts`, para evitar duplicar el email oficial.

6. Desplegar:

```bash
npm run verify
npx wrangler deploy
```

El formulario no solicita DNI/NIE, pasaporte, datos bancarios ni informes médicos en el primer contacto.
