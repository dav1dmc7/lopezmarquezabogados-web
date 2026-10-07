/// <reference path="./worker-configuration.d.ts" />

import { site } from './src/lib/site';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});
const permanentRedirect = (url: URL, cacheControl: string) => new Response(null, {
  status: 301,
  headers: { Location: url.toString(), 'Cache-Control': cacheControl },
});

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const MAX_REQUEST_BYTES = 32 * 1024;

class RequestBodyTooLarge extends Error {}

async function readBoundedBody(request: Request): Promise<string> {
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) throw new RequestBodyTooLarge();
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      try { await reader.cancel(); } catch {}
      throw new RequestBodyTooLarge();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(body);
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char] ?? char);

const AREAS_ES = new Set(['Laboral', 'Extranjería', 'Empresas', 'Otras áreas']);
const AREAS_EN = new Set(['Employment', 'Immigration', 'Business', 'Other legal matters']);

const LEGACY_REDIRECTS = new Map<string, string>([
  ['/es', '/'], ['/es/index', '/'], ['/es/index.html', '/'],
  ['/es/about', '/sobre-nosotros'], ['/es/about.html', '/sobre-nosotros'],
  ['/es/servicios', '/otras-areas'], ['/es/servicios.html', '/otras-areas'],
  ['/es/laboral', '/laboral'], ['/es/laboral.html', '/laboral'],
  ['/es/extranjeria', '/extranjeria'], ['/es/extranjeria.html', '/extranjeria'],
  ['/es/civil', '/otras-areas'], ['/es/civil.html', '/otras-areas'],
  ['/es/penal', '/otras-areas'], ['/es/penal.html', '/otras-areas'],
  ['/es/administrativo', '/otras-areas'], ['/es/administrativo.html', '/otras-areas'],
  ['/es/contact', '/contacto'], ['/es/contact.html', '/contacto'],
  ['/es/faqs', '/preguntas-frecuentes'], ['/es/faqs.html', '/preguntas-frecuentes'],
  ['/en/index_en', '/en'], ['/en/index_en.html', '/en'],
  ['/en/about_en', '/en/about'], ['/en/about_en.html', '/en/about'],
  ['/en/servicios_en', '/en'], ['/en/servicios_en.html', '/en'],
  ['/en/laboral_en', '/en/employment'], ['/en/laboral_en.html', '/en/employment'],
  ['/en/extranjeria_en', '/en/immigration'], ['/en/extranjeria_en.html', '/en/immigration'],
  ['/en/civil_en', '/en'], ['/en/civil_en.html', '/en'],
  ['/en/penal_en', '/en'], ['/en/penal_en.html', '/en'],
  ['/en/administrativo_en', '/en'], ['/en/administrativo_en.html', '/en'],
  ['/en/contact_en', '/en/contact'], ['/en/contact_en.html', '/en/contact'],
  ['/en/faqs_en', '/en/faqs'], ['/en/faqs_en.html', '/en/faqs']
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const canonicalHost = new URL(site.url).hostname;
    if (url.hostname === `www.${canonicalHost}` && (request.method === 'GET' || request.method === 'HEAD')) {
      const canonicalUrl = new URL(`${url.pathname}${url.search}`, site.url);
      return permanentRedirect(canonicalUrl, 'public, max-age=86400');
    }

    const legacyTarget = LEGACY_REDIRECTS.get(url.pathname);
    if (legacyTarget && (request.method === 'GET' || request.method === 'HEAD')) {
      const redirectUrl = new URL(legacyTarget, url);
      return permanentRedirect(redirectUrl, 'public, max-age=604800, immutable');
    }

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      const origin = request.headers.get('Origin');
      const referer = request.headers.get('Referer');
      let sameOrigin = origin === url.origin;
      if (!origin && referer) {
        try { sameOrigin = new URL(referer).origin === url.origin; }
        catch { sameOrigin = false; }
      }
      if (!sameOrigin) return json({ ok: false, error: 'origin_not_allowed' }, 403);
      const contentType = request.headers.get('Content-Type') ?? '';
      const mediaType = contentType.split(';', 1)[0].trim().toLowerCase();
      const nativeForm = mediaType === 'application/x-www-form-urlencoded';
      const jsonRequest = mediaType === 'application/json';
      const requestedLocale = referer?.includes('/en/') ? 'en' : 'es';
      const nativeFailure = (status: number) => new Response(
        `<!doctype html><html lang="${requestedLocale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${requestedLocale === 'en' ? 'Enquiry not sent' : 'Consulta no enviada'}</title><main><h1>${requestedLocale === 'en' ? 'We could not send your enquiry' : 'No hemos podido enviar tu consulta'}</h1><p>${requestedLocale === 'en' ? 'The message could not be processed. Shorten it or return to the form and try again.' : 'No se ha podido procesar el mensaje. Acórtalo o vuelve al formulario e inténtalo de nuevo.'}</p><p><a href="${requestedLocale === 'en' ? '/en/contact' : '/contacto'}#consulta-form">${requestedLocale === 'en' ? 'Return to contact form' : 'Volver al formulario de contacto'}</a></p></main></html>`,
        { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' } }
      );
      if (!nativeForm && !jsonRequest) return json({ ok: false, error: 'invalid_content_type' }, 415);

      let bodyText: string;
      try { bodyText = await readBoundedBody(request); }
      catch (error) {
        const status = error instanceof RequestBodyTooLarge ? 413 : 400;
        return nativeForm ? nativeFailure(status) : json({ ok: false, error: status === 413 ? 'payload_too_large' : 'invalid_body' }, status);
      }

      let input: Record<string, unknown>;
      if (jsonRequest) {
        try {
          const parsed: unknown = JSON.parse(bodyText);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ ok: false, error: 'invalid_json' }, 400);
          input = parsed as Record<string, unknown>;
        }
        catch { return json({ ok: false, error: 'invalid_json' }, 400); }
      } else if (nativeForm) {
        const fields = new URLSearchParams(bodyText);
        input = {
          locale: fields.get('locale'), name: fields.get('nombre'), email: fields.get('email'),
          phone: fields.get('telefono'), area: fields.get('area'), relevantDate: fields.get('fecha'),
          message: fields.get('mensaje'), privacy: fields.get('privacy'), website: fields.get('website'),
          sourcePath: fields.get('sourcePath')
        };
      } else {
        return json({ ok: false, error: 'invalid_content_type' }, 415);
      }

      const locale = clean(input.locale, 2) === 'en' ? 'en' : 'es';
      const formError = (error: string, status: number) => nativeForm
        ? nativeFailure(status)
        : json({ ok: false, error }, status);

      // Honeypot: acknowledge bots without storing or notifying.
      if (clean(input.website, 120)) return nativeForm
        ? Response.redirect(new URL(locale === 'en' ? '/en/contact/sent' : '/consulta-enviada', url), 303)
        : json({ ok: true, accepted: true });

      const name = clean(input.name, 120);
      const email = clean(input.email, 254).toLowerCase();
      const phone = clean(input.phone, 25);
      const area = clean(input.area, 60);
      const relevantDate = clean(input.relevantDate, 40);
      const message = clean(input.message, 4000);
      const sourceCandidate = clean(input.sourcePath, 200);
      const sourcePath = /^\/(?!\/)[A-Za-z0-9/_-]{0,199}$/.test(sourceCandidate)
        ? sourceCandidate
        : (locale === 'en' ? '/en/contact' : '/contacto');
      const consent = input.consent === true || input.privacy === 'on';
      const allowed = locale === 'en' ? AREAS_EN : AREAS_ES;

      if (name.length < 2) return formError('invalid_name', 422);
      if (!validEmail(email)) return formError('invalid_email', 422);
      if (!allowed.has(area)) return formError('invalid_area', 422);
      if (message.length < 20) return formError('invalid_message', 422);
      if (!consent) return formError('consent_required', 422);

      const recent = await env.lopezmarquez_consultas
        .prepare("SELECT COUNT(*) AS count FROM consultations WHERE email = ? AND datetime(created_at) >= datetime('now', '-15 minutes')")
        .bind(email)
        .first<{ count: number }>();
      if (Number(recent?.count ?? 0) >= 3) return formError('rate_limited', 429);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.lopezmarquez_consultas
        .prepare(`INSERT INTO consultations
          (id, created_at, locale, area, name, email, phone, relevant_date, message, consent_at, status, source, source_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'website', ?)`)
        .bind(id, now, locale, area, name, email, phone, relevantDate, message, now, sourcePath)
        .run();

      let notification = 'stored';
      try {
        const heading = locale === 'en' ? 'New website enquiry' : 'Nueva consulta desde la web';
        const situation = locale === 'en' ? 'Situation' : 'Situación';
        const result = await env.EMAIL.send({
          from: 'web@lopezmarquezabogados.com',
          to: site.email,
          replyTo: email,
          subject: `${heading} · ${area}`,
          text: `${heading}\nReference: ${id}\nArea: ${area}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nRelevant date: ${relevantDate || 'Not specified'}\nSource: ${sourcePath}\n\n${situation}:\n${message}`,
          html: `<h2>${heading}</h2><p><strong>Reference:</strong> ${escapeHtml(id)}</p><p><strong>Area:</strong> ${escapeHtml(area)}</p><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p><p><strong>Relevant date:</strong> ${escapeHtml(relevantDate || 'Not specified')}</p><p><strong>Source:</strong> ${escapeHtml(sourcePath)}</p><hr><p><strong>${situation}:</strong></p><p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>`,
        });
        if (!result?.messageId) throw new Error('notification_failed');
        notification = 'sent';
      } catch (_) {
        notification = 'stored_pending_notification';
      }

      await env.lopezmarquez_consultas
        .prepare('UPDATE consultations SET status = ? WHERE id = ?')
        .bind(notification === 'sent' ? 'notified' : 'stored_pending_notification', id)
        .run();

      // The enquiry remains stored even if email delivery has a transient failure.
      if (nativeForm) return Response.redirect(new URL(locale === 'en' ? '/en/contact/sent' : '/consulta-enviada', url), 303);
      return json({ ok: true, reference: id, notification });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
