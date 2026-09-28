# López Márquez Abogados — Web 2026

Sitio corporativo de López Márquez Abogados construido con Astro y preparado para Cloudflare Workers.

## Objetivos

- Arquitectura orientada a intención de búsqueda.
- SEO técnico y datos estructurados.
- Accesibilidad y rendimiento.
- Conversión directa a WhatsApp, teléfono y formulario.
- Contenido jurídico revisable con fuentes oficiales.
- Redirecciones de URLs legacy.
- Despliegue reproducible en Cloudflare Workers.

## Desarrollo y verificación

```bash
npm install
npm run verify
npm run dev
```

`npm run verify` ejecuta `astro check`, la auditoría estructural y el build de producción en ese orden.

Node: ver `.nvmrc`.

## Producción

La web antigua de `LMpruebas` se mantiene como respaldo. Este repositorio es la nueva línea de producción.

Flujo objetivo:

`GitHub → Cloudflare Workers Builds → verify → deploy`

## Estrategia de negocio

El mapa interno de prácticas rentables está en `docs/strategy/revenue-areas-2026.md`. No debe publicarse como contenido comercial sin validación profesional.
