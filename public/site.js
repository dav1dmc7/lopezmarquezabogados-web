(() => {
  document.documentElement.classList.add('js-enabled');
  const isEnglish = document.documentElement.lang === 'en';
  const track = (name, details = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: name,
        ...details,
        page_path: window.location.pathname
      });
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
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) nav.querySelector('a')?.focus();
      else if (restoreFocus) toggle.focus();
    };

    setMenu(false);
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false, true);
    });
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Node)) return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

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

  const form = document.querySelector('#consulta-form');
  if (form instanceof HTMLFormElement) {
    let started = false;
    form.addEventListener('focusin', () => {
      if (!started) { started = true; track('form_start'); }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        track('form_error', { reason: 'validation' });
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      const status = document.querySelector('#consulta-status');
      if (button instanceof HTMLButtonElement) button.disabled = true;
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
        website: String(data.get('website') || ''),
        sourcePath: window.location.pathname
      };

      try {
        const response = await fetch(form.dataset.endpoint || '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(String(result.error || `http_${response.status}`));
        track('contact_submit', { contact_area: payload.area });
        track('contact_success', { contact_area: payload.area });
        window.location.href = isEnglish ? '/en/contact/sent' : '/consulta-enviada';
      } catch (error) {
        if (button instanceof HTMLButtonElement) button.disabled = false;
        track('contact_error', { reason: error instanceof Error ? error.message : 'network' });
        if (status instanceof HTMLElement) {
          status.textContent = isEnglish
            ? 'We could not send the enquiry right now. Please try again or call the firm.'
            : 'No hemos podido enviar la consulta ahora mismo. Inténtalo de nuevo o llama al despacho.';
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

  const hero = document.querySelector('.hero-home');
  if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const move = (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--lm-pointer-x', `${x.toFixed(1)}%`);
      hero.style.setProperty('--lm-pointer-y', `${y.toFixed(1)}%`);
    };
    hero.addEventListener('pointermove', move, { passive: true });
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
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  }
