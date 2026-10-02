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

  const form = document.querySelector('#consulta-form');
  if (form instanceof HTMLFormElement) {
    let started = false;
    form.addEventListener('focusin', () => {
      if (!started) {
        started = true;
        track('form_start');
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        track('form_error', { reason: 'validation' });
        return;
      }

      const destination = form.dataset.email;
      if (!destination) return;
      const data = new FormData(form);
      const area = String(data.get('area') || (isEnglish ? 'General enquiry' : 'Consulta'));
      const prefix = isEnglish ? 'Hello, my name is' : 'Hola, soy';
      const labelDate = isEnglish ? 'Relevant date' : 'Fecha relevante';
      const labelEmail = 'Email';
      const labelPhone = isEnglish ? 'Phone' : 'Teléfono';
      const labelSituation = isEnglish ? 'Situation' : 'Situación';
      const body = [
        `${prefix} ${data.get('nombre') || ''}.`,
        `${isEnglish ? 'Area' : 'Área'}: ${area}.`,
        `${labelDate}: ${data.get('fecha') || (isEnglish ? 'Not specified' : 'No indicada')}.`,
        `${labelEmail}: ${data.get('email') || (isEnglish ? 'Not provided' : 'No indicado')}.`,
        `${labelPhone}: ${data.get('telefono') || (isEnglish ? 'Not provided' : 'No indicado')}.`,
        '',
        `${labelSituation}:`,
        String(data.get('mensaje') || '')
      ].join('\n');

      track('contact_submit', { contact_area: area });
      window.location.href =
        `mailto:${destination}` +
        `?subject=${encodeURIComponent(`${isEnglish ? 'Web enquiry' : 'Consulta web'} · ${area}`)}` +
        `&body=${encodeURIComponent(body)}`;
    });
  }

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
