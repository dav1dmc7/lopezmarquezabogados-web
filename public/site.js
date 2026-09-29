(() => {
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
      // Analytics is optional; navigation must never depend on it.
    }
  };

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');

  if (toggle && nav) {
    const closeNav = () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    };

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
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

      const whatsapp = form.dataset.whatsapp;
      if (!whatsapp) return;

      const data = new FormData(form);
      const text = [
        `Hola, soy ${data.get('nombre') || ''}.`,
        `Área: ${data.get('area') || ''}.`,
        `Fecha relevante: ${data.get('fecha') || 'No indicada'}.`,
        `Teléfono: ${data.get('telefono') || 'No indicado'}.`,
        `Situación: ${data.get('mensaje') || ''}`
      ].join('\n');

      track('contact_submit', {
        contact_area: String(data.get('area') || '')
      });

      window.open(
        `${whatsapp}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    });
  }
})();
