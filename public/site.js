(() => {
  document.documentElement.classList.add('js-enabled');
  const isEnglish = document.documentElement.lang === 'en';
  const track = (name, details = {}) => {
    try {
      if (window.__LM_ANALYTICS_CONSENT__ === true) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: name, ...details, page_path: window.location.pathname });
      }
      window.dispatchEvent(new CustomEvent('lm:track', { detail: { name, ...details } }));
    } catch (_) {
      // Measurement must never block navigation or contact.
    }
  };

  const header = document.querySelector('.site-header');
  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');

  if (toggle && nav) {
    const setMenu = (open, restoreFocus = false) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? (isEnglish ? 'Close menu' : 'Cerrar menú') : (isEnglish ? 'Open menu' : 'Abrir menú'));
      toggle.textContent = open ? '×' : (isEnglish ? 'Menu' : 'Menú');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) nav.querySelector('a')?.focus();
      else if (restoreFocus) toggle.focus();
    };

    setMenu(false);
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Node)) return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const destination = new URL(link.href, window.location.href);
    const contactPaths = ['/contacto', '/en/contact'];
    if (contactPaths.includes(destination.pathname) && !contactPaths.includes(window.location.pathname)) {
      destination.searchParams.set('origen', window.location.pathname);
      link.href = destination.toString();
    }
  }, true);

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      const name = element.getAttribute('data-track');
      if (!name) return;
      const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') || '' : '';
      track(name, { link_href: href });
    });
  });

  const scrollMarks = new Set();
  const measureScrollDepth = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const depth = Math.round((window.scrollY / scrollable) * 100);
    [25, 50, 75, 90].forEach((mark) => {
      if (depth >= mark && !scrollMarks.has(mark)) {
        scrollMarks.add(mark);
        track('scroll_depth', { depth_percent: mark });
      }
    });
  };
  window.addEventListener('scroll', measureScrollDepth, { passive: true });
  window.addEventListener('load', measureScrollDepth);

  const scenarioLinks = document.querySelectorAll('[data-area]');
  const areaSelect = document.querySelector('#area');
  const contactParams = new URLSearchParams(window.location.search);
  if (areaSelect instanceof HTMLSelectElement) {
    const requestedArea = contactParams.get('area');
    if (requestedArea && Array.from(areaSelect.options).some((option) => option.value === requestedArea)) {
      areaSelect.value = requestedArea;
    }
  }
  const sourcePathField = document.querySelector('#consulta-form input[name="sourcePath"]');
  const sourcePath = contactParams.get('origen') || '';
  if (sourcePathField instanceof HTMLInputElement && /^\/(?!\/)[A-Za-z0-9/_-]{0,199}$/.test(sourcePath)) {
    sourcePathField.value = sourcePath;
  }
  scenarioLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const area = link.getAttribute('data-area');
      const select = document.querySelector('#area');
      if (select instanceof HTMLSelectElement && area) {
        select.value = area;
        window.setTimeout(() => select.focus({ preventScroll: true }), 40);
      }
    });
  });

  const confirmationState = contactParams.get('confirmation');
  const confirmationStatus = document.querySelector('#confirmation-email-status');
  const confirmationHeading = document.querySelector('.page-hero h1');
  const confirmationEyebrow = document.querySelector('.page-hero .eyebrow');
  const confirmationDescription = document.querySelector('.page-hero .container > p');
  if (confirmationStatus instanceof HTMLElement) {
    const validConfirmation = confirmationState === 'sent' || confirmationState === 'pending';
    if (confirmationHeading instanceof HTMLElement) confirmationHeading.textContent = validConfirmation
      ? (isEnglish ? 'Your enquiry has been received.' : 'Hemos recibido tu consulta.')
      : (isEnglish ? 'No confirmed enquiry was found.' : 'No encontramos una consulta confirmada.');
    if (confirmationEyebrow instanceof HTMLElement) confirmationEyebrow.textContent = validConfirmation
      ? (isEnglish ? 'Enquiry received' : 'Consulta recibida')
      : (isEnglish ? 'Enquiry status' : 'Estado de consulta');
    if (confirmationDescription instanceof HTMLElement) confirmationDescription.textContent = validConfirmation
      ? (isEnglish ? 'The server has confirmed that your enquiry was registered. Email confirmation may still be pending.' : 'El servidor ha confirmado el registro de la consulta. El email de confirmación puede quedar pendiente.')
      : (isEnglish ? 'If you just submitted the form, return to the contact page and check whether the submission completed.' : 'Si acabas de enviar el formulario, vuelve a contacto y comprueba si el envío llegó a completarse.');
    confirmationStatus.textContent = validConfirmation
      ? confirmationState === 'sent'
        ? (isEnglish ? 'A confirmation email was sent to the address you provided. Check your spam folder if it is not in your inbox.' : 'Hemos enviado una confirmación al email que indicaste. Revisa también la carpeta de spam si no aparece en la bandeja de entrada.')
        : (isEnglish ? 'Your enquiry is registered, but the confirmation email is still pending. The registration remains on record.' : 'La consulta está registrada, pero el email de confirmación sigue pendiente. El registro de la consulta se mantiene.')
      : (isEnglish ? 'No registration has been confirmed on this page.' : 'Esta página no contiene una confirmación de registro.');
  }
  const reference = contactParams.get('reference') || '';
  const referenceCard = document.querySelector('#confirmation-reference');
  if (referenceCard instanceof HTMLElement && /^LM-[0-9A-F]{8}$/i.test(reference)) {
    const value = referenceCard.querySelector('span');
    if (value) value.textContent = reference.toUpperCase();
    referenceCard.hidden = false;
  }

  const form = document.querySelector('#consulta-form');
  if (form instanceof HTMLFormElement) {
    let started = false;
    let submitting = false;
    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = submitButton instanceof HTMLButtonElement ? submitButton.textContent : '';
    const sendingLabel = isEnglish ? 'Sending enquiry…' : 'Enviando consulta…';
    form.addEventListener('focusin', () => {
      if (!started) { started = true; track('form_start'); }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        track('form_error', { reason: 'validation' });
        return;
      }
      submitting = true;
      const status = document.querySelector('#consulta-status');
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = sendingLabel;
      }
      if (status instanceof HTMLElement) { status.hidden = true; status.classList.remove('is-error'); }

      const data = new FormData(form);
      const payload = {
        locale: String(form.dataset.locale || (isEnglish ? 'en' : 'es')),
        name: String(data.get('nombre') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('telefono') || ''),
        area: String(data.get('area') || ''),
        relevantDate: String(data.get('fecha') || ''),
        message: String(data.get('mensaje') || ''),
        consent: data.get('privacy') === 'on',
        turnstileToken: String(data.get('cf-turnstile-response') || ''),
        website: String(data.get('website') || ''),
        sourcePath: String(data.get('sourcePath') || window.location.pathname)
      };

      if (form.querySelector('#contact-turnstile') && !payload.turnstileToken) {
        submitting = false;
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
        track('form_error', { reason: 'turnstile_missing' });
        if (status instanceof HTMLElement) {
          status.textContent = isEnglish
            ? 'Complete the security check before sending. If it does not load, retry it or contact us by email or WhatsApp.'
            : 'Completa la comprobación de seguridad antes de enviar. Si no se carga, reinténtala o escríbenos por email o WhatsApp.';
          status.classList.add('is-error');
          status.hidden = false;
        }
        return;
      }

      try {
        const response = await fetch(form.dataset.endpoint || '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(String(result.error || `http_${response.status}`));
        if (result.accepted === true && !result.reference) {
          window.location.href = isEnglish ? '/en/contact/sent' : '/consulta-enviada';
          return;
        }
        track('contact_success', { contact_area: payload.area });
        const destination = new URL(isEnglish ? '/en/contact/sent' : '/consulta-enviada', window.location.origin);
        destination.searchParams.set('confirmation', result.confirmation === 'sent' ? 'sent' : 'pending');
        if (typeof result.reference === 'string' && /^LM-[0-9A-F]{8}$/.test(result.reference)) destination.searchParams.set('reference', result.reference);
        window.location.href = destination.toString();
      } catch (error) {
        submitting = false;
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
        track('contact_error', { reason: error instanceof Error ? error.message : 'network' });
        if (status instanceof HTMLElement) {
          const code = error instanceof Error ? error.message : 'network';
          const messages = isEnglish
            ? {
                invalid_name: 'Enter your name so we can address your enquiry.',
                invalid_email: 'Check the email address and try again.',
                invalid_area: 'Select the area closest to your enquiry.',
                invalid_message: 'Add a little more detail about what happened.',
                consent_required: 'Please read and accept the privacy information before sending.',
                origin_not_allowed: 'The form could not be verified. Reload the page and try again.',
                invalid_body: 'The form data could not be read. Reload the page and try again.',
                invalid_content_type: 'The form could not be processed. Reload the page and try again.',
                payload_too_large: 'Your message is too long. Shorten it and try again.',
                rate_limited: 'We have recently received several enquiries from this email address. If you need to continue, contact us by email or WhatsApp.',
                turnstile_missing: 'Complete the security check before sending.',
                turnstile_invalid: 'The security check could not be verified. Please complete it again and retry.',
                turnstile_expired: 'The security check expired or was already used. Please complete it again and retry.',
                turnstile_unavailable: 'The security check is unavailable right now. Your enquiry was not sent. Please contact us by email or WhatsApp.'
              }
            : {
                invalid_name: 'Escribe tu nombre para que podamos dirigirnos a ti.',
                invalid_email: 'Revisa la dirección de email e inténtalo de nuevo.',
                invalid_area: 'Selecciona el área que mejor se ajuste a tu consulta.',
                invalid_message: 'Añade algo más de información sobre lo ocurrido.',
                consent_required: 'Lee y acepta la información de privacidad antes de enviar.',
                origin_not_allowed: 'No hemos podido verificar el formulario. Recarga la página e inténtalo de nuevo.',
                invalid_body: 'No se han podido leer los datos del formulario. Recarga la página e inténtalo de nuevo.',
                invalid_content_type: 'No se ha podido procesar el formulario. Recarga la página e inténtalo de nuevo.',
                payload_too_large: 'El mensaje es demasiado largo. Acórtalo e inténtalo de nuevo.',
                rate_limited: 'Ya hemos recibido varias consultas recientes con esta dirección de email. Si necesitas continuar, escríbenos por email o WhatsApp.',
                turnstile_missing: 'Completa la comprobación de seguridad antes de enviar.',
                turnstile_invalid: 'No se ha podido validar la comprobación de seguridad. Complétala de nuevo e inténtalo otra vez.',
                turnstile_expired: 'La comprobación de seguridad ha caducado o ya se utilizó. Complétala de nuevo e inténtalo otra vez.',
                turnstile_unavailable: 'La comprobación de seguridad no está disponible ahora. No se ha enviado tu consulta. Escríbenos por email o WhatsApp.'
              };
          if (['turnstile_invalid', 'turnstile_expired'].includes(code) && typeof window.resetContactTurnstile === 'function') {
            window.resetContactTurnstile();
          }
          status.textContent = messages[code] || (isEnglish
            ? 'We could not send the enquiry right now. Please try again or contact us by email or WhatsApp.'
            : 'No hemos podido enviar la consulta ahora mismo. Inténtalo de nuevo o escríbenos por email o WhatsApp.');
          status.classList.add('is-error');
          status.hidden = false;
        }
      }
    });
  }

  const progress = document.querySelector('.lm-progress');
  const updateProgress = () => {
    if (!(progress instanceof HTMLElement)) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, current) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        current.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }
})();


// Premium interaction layer v4
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const value = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    document.documentElement.style.setProperty('--lm-scroll-progress', `${value}%`);
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });

  if (reduceMotion) return;

  const staggerTargets = [...document.querySelectorAll('.section > .container > :where(.cards,.business-grid,.resource-preview,.editorial-grid,.trust-grid,.metric-strip,.contact-grid,.faq)')];
  staggerTargets.forEach((element) => {
    if (!element.hasAttribute('data-reveal')) element.setAttribute('data-reveal', 'stagger');
  });
  if ('IntersectionObserver' in window) {
    const staggerObserver = new IntersectionObserver((entries, current) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        current.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    staggerTargets.filter((element) => !element.classList.contains('is-visible')).forEach((element) => staggerObserver.observe(element));
  }

})();


// Premium authority layer v5
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Keep the pointer glow inside the hero and throttle writes to one frame.
  const hero = document.querySelector('.hero-home');
  if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    let pending = null;
    hero.addEventListener('pointermove', (event) => {
      pending = event;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const e = pending;
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--lm-pointer-x', `${x.toFixed(1)}%`);
        hero.style.setProperty('--lm-pointer-y', `${y.toFixed(1)}%`);
        raf = 0;
      });
    }, { passive: true });
  }
})();
/* v30: query-driven area preselection and accessible invalid-field feedback. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      const invalid = form.querySelector(':invalid');
      if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement || invalid instanceof HTMLTextAreaElement) {
        invalid.setAttribute('aria-invalid', 'true');
        invalid.focus({ preventScroll: true });
        invalid.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }, true);
    form.addEventListener('input', (event) => {
      const field = event.target;
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.removeAttribute('aria-invalid');
    });
  });
});
