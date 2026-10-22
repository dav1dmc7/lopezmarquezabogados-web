(() => {
  'use strict';
  const consentGranted = () => window.__LM_ANALYTICS_CONSENT__ === true;
  const clean = (value, max = 100) => String(value ?? '').slice(0, max).replace(/[\r\n\t]+/g, ' ');

  const context = () => {
    return {
      path: clean(location.pathname, 180),
      lang: clean(document.documentElement.lang || 'es', 10),
      referrer_origin: (() => { try { return document.referrer ? new URL(document.referrer).origin : ''; } catch (_) { return ''; } })()
    };
  };

  const track = (name, props = {}) => {
    if (!consentGranted()) return;
    const payload = { ...context(), ...props };
    if (window.zaraz && typeof window.zaraz.track === 'function') {
      try { window.zaraz.track(`lm_${name}`, payload); } catch (_) {}
    }
  };

  const init = () => {
    track('page_view', {});
    document.addEventListener('click', (event) => {
      const el = event.target instanceof Element ? event.target.closest('a,button,[data-track]') : null;
      if (!(el instanceof HTMLElement)) return;
      const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') || '' : '';
      let channel = 'ui';
      if (/wa\.me\//i.test(href) || /whatsapp/i.test(href)) channel = 'whatsapp';
      else if (/^mailto:/i.test(href)) channel = 'email';
      else if (/^tel:/i.test(href)) channel = 'phone';
      else if (/^(https?:)?\/\//i.test(href)) channel = 'external';
      else if (el.matches('button')) channel = 'button';
      else if (href) channel = 'internal';
      track('click', {
        event_label: clean(el.getAttribute('data-track') || el.getAttribute('aria-label') || '', 80),
        channel,
        target_type: el.tagName.toLowerCase()
      });
    }, { passive: true });

    const seen = new Set();
    window.addEventListener('scroll', () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = window.scrollY / max;
      for (const depth of [25, 50, 75, 90]) {
        if (ratio >= depth / 100 && !seen.has(depth)) {
          seen.add(depth);
          track('scroll_depth', { depth });
        }
      }
    }, { passive: true });

    document.querySelectorAll('form').forEach((form) => {
      let started = false;
      form.addEventListener('focusin', () => {
        if (started) return;
        started = true;
        track('form_start', { form_id: clean(form.id || '', 60) });
      }, { passive: true });
      form.addEventListener('submit', () => track('form_submit_intent', { form_id: clean(form.id || '', 60) }), { passive: true });
    });

    const safeEventFields = new Set(['contact_area', 'reason', 'scenario', 'service_months', 'indemnity_days', 'route']);
    const measurableEvents = new Set([
      'contact_success', 'contact_error', 'calculator_complete', 'calculator_error',
      'immigration_triage_start', 'immigration_triage_complete', 'immigration_triage_email_click',
      'company_assessment_email_click'
    ]);
    window.addEventListener('lm:track', (event) => {
      if (!consentGranted()) return;
      const detail = event instanceof CustomEvent && event.detail && typeof event.detail === 'object' ? event.detail : {};
      const name = clean(detail.name || '', 60);
      if (!measurableEvents.has(name)) return;
      const props = {};
      for (const field of safeEventFields) {
        const value = detail[field];
        if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) props[field] = clean(value, 80);
      }
      track(name, props);
    }, { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
