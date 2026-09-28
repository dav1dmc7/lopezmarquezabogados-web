# Despliegue de producción

## 1. GitHub

Crear un repositorio nuevo y vacío llamado `lopezmarquezabogados-web`. No reutilizar `LMpruebas`: ese repositorio queda como histórico/backup del sitio Netlify.

```bash
unzip LopezMarquezAbogados-Astro-2026.zip
cd lopezmarquezabogados-web
git init
git add .
git commit -m "feat: launch Astro 2026 website"
git branch -M main
git remote add origin git@github.com:dav1dmc7/lopezmarquezabogados-web.git
git push -u origin main
```

## 2. Cloudflare Workers Builds

En Cloudflare: Workers & Pages → Create application → Import a repository. Conectar el repositorio de GitHub.

Build command:

```text
npm run check && npm run audit && npm run build
```

Deploy command:

```text
npx wrangler deploy
```

La rama de producción debe ser `main`.

## 3. Primera publicación

La primera publicación debe ir únicamente a `workers.dev` para realizar QA. El proyecto marca las URLs `workers.dev` como `noindex` mediante `_headers`.

## 4. Cutover de dominio

Cuando QA esté verde, en el Worker: Settings → Domains & Routes → Add → Custom Domain. Añadir el dominio raíz y el hostname `www` según la configuración definitiva. Cloudflare crea los registros DNS y certificados necesarios para los Custom Domains.

Antes de añadir un Custom Domain a `www`, eliminar el CNAME antiguo de Netlify porque Cloudflare no permite crear un Custom Domain en un hostname que ya tiene un CNAME.

En el cutover, no modificar los MX de correo.

## 5. Legacy / Netlify

No borrar `LMpruebas`. Una vez que la nueva web esté en producción y las comprobaciones de DNS/HTTP/HTTPS/formularios hayan pasado, desconectar el deploy automático de Netlify y mantener el repositorio como backup histórico.

## 6. QA de producción

Comprobar: home, todas las rutas indexables, 301 legacy, `www`, HTTPS, sitemap, robots, schema, WhatsApp, teléfono, email, formulario, responsive, accesibilidad básica y ausencia de URLs de staging indexables.
