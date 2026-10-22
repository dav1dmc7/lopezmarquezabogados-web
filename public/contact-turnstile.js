(() => {
  const container = document.querySelector('#contact-turnstile');
  const tokenField = document.querySelector('input[name="cf-turnstile-response"]');
  const status = document.querySelector('#turnstile-status');
  const retryButton = document.querySelector('.turnstile-retry');
  if (!(container instanceof HTMLElement) || !(tokenField instanceof HTMLInputElement)) return;

  const isEnglish = container.dataset.locale === 'en';
  let widgetId;
  let scriptLoading = false;

  const showStatus = (kind) => {
    if (!(status instanceof HTMLElement)) return;
    const messages = isEnglish
      ? {
          expired: 'The security check expired. Please complete it again.',
          unavailable: 'The security check could not be loaded. Retry it, or contact us by email or WhatsApp. The form has not been sent.'
        }
      : {
          expired: 'La comprobación de seguridad ha caducado. Complétala de nuevo.',
          unavailable: 'No se ha podido cargar la comprobación de seguridad. Reinténtala o escríbenos por email o WhatsApp. El formulario no se ha enviado.'
        };
    status.textContent = messages[kind] || messages.unavailable;
    status.hidden = false;
    if (retryButton instanceof HTMLButtonElement) retryButton.hidden = false;
  };

  const clearStatus = () => {
    if (status instanceof HTMLElement) {
      status.textContent = '';
      status.hidden = true;
    }
    if (retryButton instanceof HTMLButtonElement) retryButton.hidden = true;
  };

  const loadApi = () => {
    if (scriptLoading) return;
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      renderWidget();
      return;
    }
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    script.onerror = () => {
      scriptLoading = false;
      showStatus('unavailable');
    };
    document.head.append(script);
  };

  const renderWidget = () => {
    scriptLoading = false;
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      showStatus('unavailable');
      return;
    }
    try {
      widgetId = window.turnstile.render(container, {
        sitekey: container.dataset.sitekey,
        action: 'contact',
        language: isEnglish ? 'en' : 'es',
        theme: 'light',
        size: 'compact',
        responseField: false,
        callback: (token) => {
          tokenField.value = token;
          clearStatus();
          const formStatus = document.querySelector('#consulta-status');
          if (formStatus instanceof HTMLElement) {
            formStatus.textContent = '';
            formStatus.hidden = true;
            formStatus.classList.remove('is-error');
          }
        },
        'error-callback': () => {
          tokenField.value = '';
          showStatus('unavailable');
          return true;
        },
        'expired-callback': () => {
          tokenField.value = '';
          showStatus('expired');
        },
        'timeout-callback': () => {
          tokenField.value = '';
          showStatus('expired');
        }
      });
    } catch {
      showStatus('unavailable');
    }
  };

  window.resetContactTurnstile = () => {
    tokenField.value = '';
    clearStatus();
    if (window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId);
    else loadApi();
  };

  if (retryButton instanceof HTMLButtonElement) {
    retryButton.addEventListener('click', () => window.resetContactTurnstile());
  }

  loadApi();
})();
