(() => {
  document.documentElement.classList.add('js-enabled');
  const track = (name, details = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: name,
        ...details,
        page_path: window.location.pathname
      });
      window.dispatchEvent(new CustomEvent('lm:track', {
        detail: { name, ...details }
      }));
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
    const setMenu = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
    };

    setMenu(false);

    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
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
      if (name) track(name);
    });
  });

  const form = document.querySelector('#consulta-form');
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        track('form_error');
        return;
      }

      const destination = form.dataset.email;
      if (!destination) return;

      const data = new FormData(form);
      const area = String(data.get('area') || 'Consulta');

      const body = [
        `Hola, soy ${data.get('nombre') || ''}.`,
        `Área: ${area}.`,
        `Fecha relevante: ${data.get('fecha') || 'No indicada'}.`,
        `Email: ${data.get('email') || 'No indicado'}.`,
        `Teléfono: ${data.get('telefono') || 'No indicado'}.`,
        '',
        'Situación:',
        String(data.get('mensaje') || '')
      ].join('\n');

      track('contact_submit', { contact_area: area });

      window.location.href =
        `mailto:${destination}` +
        `?subject=${encodeURIComponent(`Consulta web · ${area}`)}` +
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
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    document.querySelectorAll('[data-reveal]').forEach((element) => {
      observer.observe(element);
    });
  }
})();
