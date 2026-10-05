/// <reference path="./worker-configuration.d.ts" />

import { site } from './src/lib/site';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char] ?? char);

const AREAS_ES = new Set(['Laboral', 'Extranjería', 'Empresas', 'Otras áreas']);
const AREAS_EN = new Set(['Employment', 'Immigration', 'Business', 'Other legal matters']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return json({ ok: false, error: 'origin_not_allowed' }, 403);
      if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
        return json({ ok: false, error: 'invalid_content_type' }, 415);
      }

      let input: Record<string, unknown>;
      try { input = await request.json() as Record<string, unknown>; }
      catch { return json({ ok: false, error: 'invalid_json' }, 400); }

      // Honeypot: acknowledge bots without storing or notifying.
      if (clean(input.website, 120)) return json({ ok: true, accepted: true });

      const locale = clean(input.locale, 2) === 'en' ? 'en' : 'es';
      const name = clean(input.name, 120);
      const email = clean(input.email, 254).toLowerCase();
      const phone = clean(input.phone, 25);
      const area = clean(input.area, 60);
      const relevantDate = clean(input.relevantDate, 40);
      const message = clean(input.message, 4000);
      const sourcePath = clean(input.sourcePath, 200) || (locale === 'en' ? '/en/contact' : '/contacto');
      const consent = input.consent === true;
      const allowed = locale === 'en' ? AREAS_EN : AREAS_ES;

      if (name.length < 2) return json({ ok: false, error: 'invalid_name' }, 422);
      if (!validEmail(email)) return json({ ok: false, error: 'invalid_email' }, 422);
      if (!allowed.has(area)) return json({ ok: false, error: 'invalid_area' }, 422);
      if (message.length < 20) return json({ ok: false, error: 'invalid_message' }, 422);
      if (!consent) return json({ ok: false, error: 'consent_required' }, 422);

      const recent = await env.lopezmarquez_consultas
        .prepare("SELECT COUNT(*) AS count FROM consultations WHERE email = ? AND datetime(created_at) >= datetime('now', '-15 minutes')")
        .bind(email)
        .first<{ count: number }>();
      if (Number(recent?.count ?? 0) >= 3) return json({ ok: false, error: 'rate_limited' }, 429);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.lopezmarquez_consultas
        .prepare(`INSERT INTO consultations
          (id, created_at, locale, area, name, email, phone, relevant_date, message, consent_at, status, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'website')`)
        .bind(id, now, locale, area, name, email, phone, relevantDate, message, now)
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
      return json({ ok: true, reference: id, notification });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
