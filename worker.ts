/// <reference path="./worker-configuration.d.ts" />

import { buildCustomerContactEmail, buildInternalContactEmail, type ContactEmailData, type ContactEmailMessage } from './src/lib/email';
import { site } from './src/lib/site';
import { verifyTurnstileToken } from './src/lib/turnstile';

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



const RESEND_TIMEOUT_MS = 8000;
async function sendViaResend(apiKey: string, message: ContactEmailMessage, recipient: string, replyTo?: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const payload: Record<string, unknown> = { from: site.emailFrom, to: [recipient], subject: message.subject, html: message.html, text: message.text };
    if (replyTo) payload.reply_to = replyTo;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    const result = await response.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!response.ok || typeof result.id !== 'string' || !result.id) {
      const code = typeof result.name === 'string' ? result.name : `http_${response.status}`;
      throw new Error(`resend_${code}`);
    }
  } finally { clearTimeout(timeout); }
}
async function sendViaCloudflare(env: Env, message: ContactEmailMessage, recipient: string, replyTo: string): Promise<void> {
  const result = await env.EMAIL.send({ from: 'web@lopezmarquezabogados.com', to: recipient, replyTo, subject: message.subject, text: message.text, html: message.html });
  if (!result?.messageId) throw new Error('cloudflare_email_missing_id');
}
type DeliveryStatus = 'sent' | 'pending' | 'failed';
type ProviderStatus = 'resend' | 'cloudflare_fallback' | 'mixed' | 'none';
async function sendContactMessages(env: Env, internalMessage: ContactEmailMessage, customerMessage: ContactEmailMessage, customerEmail: string): Promise<{ internal: DeliveryStatus; customer: DeliveryStatus; provider: ProviderStatus }> {
  const apiKey = String((env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY ?? '').trim();
  if (apiKey) {
    const [internalResult, customerResult] = await Promise.allSettled([
      sendViaResend(apiKey, internalMessage, site.email, customerEmail),
      sendViaResend(apiKey, customerMessage, customerEmail, site.email),
    ]);
    let internal: DeliveryStatus = internalResult.status === 'fulfilled' ? 'sent' : 'failed';
    const customer: DeliveryStatus = customerResult.status === 'fulfilled' ? 'sent' : 'failed';
    let provider: ProviderStatus = 'resend';
    if (internalResult.status === 'rejected') {
      console.warn('Resend internal notification failed; attempting Cloudflare fallback.');
      provider = 'mixed';
      try { await sendViaCloudflare(env, internalMessage, site.email, customerEmail); internal = 'sent'; }
      catch (_) { internal = 'failed'; }
    }
    if (customerResult.status === 'rejected') console.warn('Resend customer confirmation failed; remains pending.');
    return { internal, customer, provider };
  }
  console.warn('RESEND_API_KEY missing; only attempting internal Cloudflare fallback.');
  try { await sendViaCloudflare(env, internalMessage, site.email, customerEmail); return { internal: 'sent', customer: 'pending', provider: 'cloudflare_fallback' }; }
  catch (_) { return { internal: 'failed', customer: 'pending', provider: 'cloudflare_fallback' }; }
}

const AREAS_ES = new Set(['Laboral', 'Extranjería', 'Empresas', 'Otras áreas']);
const AREAS_EN = new Set(['Employment', 'Immigration', 'Business', 'Other legal matters']);

const LEGACY_REDIRECTS = new Map<string, string>([
  ['/index.html', '/'],
  ['/es', '/'], ['/es/index', '/'], ['/es/index.html', '/'],
  ['/es/about', '/sobre-nosotros'], ['/es/about.html', '/sobre-nosotros'],
  ['/es/servicios', '/otras-areas'], ['/es/servicios.html', '/otras-areas'],
  ['/es/laboral', '/laboral'], ['/es/laboral.html', '/laboral'],
  ['/es/extranjeria', '/extranjeria'], ['/es/extranjeria.html', '/extranjeria'],
  ['/es/civil', '/civil'], ['/es/civil.html', '/civil'],
  ['/es/penal', '/penal'], ['/es/penal.html', '/penal'],
  ['/es/administrativo', '/administrativo'], ['/es/administrativo.html', '/administrativo'],
  ['/es/contact', '/contacto'], ['/es/contact.html', '/contacto'],
  ['/es/faqs', '/preguntas-frecuentes'], ['/es/faqs.html', '/preguntas-frecuentes'],
  ['/en/index_en', '/en'], ['/en/index_en.html', '/en'],
  ['/en/index.html', '/en'], ['/en/about.html', '/en/about'],
  ['/en/laboral.html', '/en/employment'], ['/en/civil.html', '/en'],
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

// Search Console legacy URLs verified on 2026-10-10.
const SEARCH_CONSOLE_LEGACY_REDIRECTS: Array<[string, string]> = [
  ['/en/', '/en'],
  ['/en/index.html', '/en'],
  ['/index_en', '/en'],
  ['/index_en.html', '/en'],
  ['/en/laboral.html', '/en/employment'],
  ['/en/civil.html', '/en'],
  ['/en/about.html', '/en/about'],
];
for (const [legacyPath, destination] of SEARCH_CONSOLE_LEGACY_REDIRECTS) {
  LEGACY_REDIRECTS.set(legacyPath, destination);
}


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
      const nativeFailure = (status: number, error = 'request_failed') => {
        const messages: Record<string, { es: string; en: string }> = {
          turnstile_missing: { es: 'Completa la comprobación de seguridad y vuelve a enviar el formulario.', en: 'Complete the security check and submit the form again.' },
          turnstile_invalid: { es: 'No se ha podido validar la comprobación de seguridad. Complétala de nuevo e inténtalo otra vez.', en: 'The security check could not be verified. Complete it again and retry.' },
          turnstile_expired: { es: 'La comprobación de seguridad ha caducado o ya se utilizó. Complétala de nuevo.', en: 'The security check expired or was already used. Complete it again.' },
          turnstile_unavailable: { es: 'La comprobación de seguridad no está disponible ahora. Escríbenos por email o WhatsApp; el formulario no se ha enviado.', en: 'The security check is unavailable right now. Contact us by email or WhatsApp; the form has not been sent.' }
        };
        const message = messages[error]?.[requestedLocale] ?? (requestedLocale === 'en'
          ? 'The message could not be processed. Return to the form and try again.'
          : 'No se ha podido procesar el mensaje. Vuelve al formulario e inténtalo de nuevo.');
        return new Response(
        `<!doctype html><html lang="${requestedLocale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${requestedLocale === 'en' ? 'Enquiry not sent' : 'Consulta no enviada'}</title><main><h1>${requestedLocale === 'en' ? 'We could not send your enquiry' : 'No hemos podido enviar tu consulta'}</h1><p>${message}</p><p><a href="${requestedLocale === 'en' ? '/en/contact' : '/contacto'}#consulta-form">${requestedLocale === 'en' ? 'Return to contact form' : 'Volver al formulario de contacto'}</a></p></main></html>`,
        { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' } }
      );
      };
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
          sourcePath: fields.get('sourcePath'), turnstileToken: fields.get('cf-turnstile-response')
        };
      } else {
        return json({ ok: false, error: 'invalid_content_type' }, 415);
      }

      const locale = clean(input.locale, 2) === 'en' ? 'en' : 'es';
      const formError = (error: string, status: number) => nativeForm
        ? nativeFailure(status, error)
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

      const turnstileEnv = env as Env & { TURNSTILE_SECRET_KEY?: string; TURNSTILE_REQUIRED?: string; TURNSTILE_TEST_MODE?: string };
      const turnstileSecret = String(turnstileEnv.TURNSTILE_SECRET_KEY ?? '').trim();
      const turnstileRequired = String(turnstileEnv.TURNSTILE_REQUIRED ?? '').toLowerCase() === 'true';
      const turnstileTestMode = String(turnstileEnv.TURNSTILE_TEST_MODE ?? '').toLowerCase() === 'true'
        && ['localhost', '127.0.0.1'].includes(url.hostname.toLowerCase());
      const turnstileToken = clean(input.turnstileToken, 2049);
      if (turnstileRequired || turnstileSecret || turnstileToken) {
        if (!turnstileSecret) return formError('turnstile_unavailable', 503);
        const validation = await verifyTurnstileToken({
          token: turnstileToken,
          secret: turnstileSecret,
          hostname: canonicalHost,
          remoteIp: request.headers.get('CF-Connecting-IP') ?? undefined,
          testMode: turnstileTestMode,
        });
        if (!validation.ok) return formError(validation.error, validation.error === 'turnstile_unavailable' ? 503 : 422);
      }

      const recent = await env.lopezmarquez_consultas
        .prepare("SELECT COUNT(*) AS count FROM consultations WHERE email = ? AND datetime(created_at) >= datetime('now', '-15 minutes')")
        .bind(email)
        .first<{ count: number }>();
      if (Number(recent?.count ?? 0) >= 3) return formError('rate_limited', 429);

      const id = crypto.randomUUID();
      const reference = `LM-${id.slice(0, 8).toUpperCase()}`;
      const now = new Date().toISOString();
      await env.lopezmarquez_consultas
        .prepare(`INSERT INTO consultations
          (id, created_at, locale, area, name, email, phone, relevant_date, message, consent_at, status, source, source_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'website', ?)`)
        .bind(id, now, locale, area, name, email, phone, relevantDate, message, now, sourcePath)
        .run();

      const emailData: ContactEmailData = { id, reference, locale, name, email, phone, area, relevantDate, message, sourcePath };
      const internalMessage = buildInternalContactEmail(emailData);
      const customerMessage = buildCustomerContactEmail(emailData);
      const delivery = await sendContactMessages(env, internalMessage, customerMessage, email);
      const aggregateStatus =
        delivery.internal === 'sent' && delivery.customer === 'sent' ? 'notified' :
        delivery.internal === 'sent' ? 'notified_customer_pending' :
        delivery.customer === 'sent' ? 'customer_notified_internal_pending' :
        'stored_pending_notification';

      try {
        await env.lopezmarquez_consultas
          .prepare(`UPDATE consultations
            SET status = ?, internal_notification_status = ?, customer_confirmation_status = ?, notification_provider = ?
            WHERE id = ?`)
          .bind(aggregateStatus, delivery.internal, delivery.customer, delivery.provider, id)
          .run();
      } catch (_) {
        console.error('Could not persist contact email delivery status.');
      }

      const destination = new URL(locale === 'en' ? '/en/contact/sent' : '/consulta-enviada', url);
      destination.searchParams.set('confirmation', delivery.customer === 'sent' ? 'sent' : 'pending');
      destination.searchParams.set('reference', reference);
      if (nativeForm) return Response.redirect(destination, 303);
      return json({ ok: true, reference, notification: delivery.internal, confirmation: delivery.customer });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
