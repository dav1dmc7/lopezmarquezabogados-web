(() => {
  const form = document.querySelector('#extranjeria-triage-form');
  const result = document.querySelector('#extranjeria-triage-result');
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) return;

  const get = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const option = (title, text, href) => ({ title, text, href });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      ubicacion: get('ubicacion'),
      objetivo: get('objetivo'),
      autorizacion: get('autorizacion'),
      estancia: get('estancia'),
      urgencia: get('urgencia'),
      familia: get('familia'),
      familiar_eu: get('familiar_eu')
    };

    let route = option('Revisión inicial del caso', 'Ordenar hechos, documentación y objetivo antes de elegir procedimiento.', '/contacto');
    if (data.urgencia === 'si' || data.autorizacion === 'caducada') {
      route = option('Revisión prioritaria', 'Hay una notificación, fecha o situación administrativa que merece comprobarse antes de actuar.', '/contacto');
    } else if (data.objetivo === 'nacionalidad') {
      route = option('Nacionalidad española', 'Revisar plazo aplicable, documentación y situación de residencia.', '/extranjeria/nacionalidad-espanola');
    } else if (data.familiar_eu === 'si') {
      route = option('Familiar de persona española o de la UE', 'Conviene comprobar el vínculo, la situación de la persona de referencia y la vía de autorización que corresponda.', '/extranjeria/residencia');
    } else if (data.objetivo === 'familia' || data.familia === 'si') {
      route = option('Situación familiar', 'Revisar el vínculo, la situación de la persona de referencia y la vía que corresponda.', '/extranjeria/reagrupacion-familiar');
    } else if (data.ubicacion === 'fuera' && data.objetivo !== 'regularizar') {
      route = option('Residencia desde fuera de España', 'Revisar la autorización concreta y la documentación necesaria antes de iniciar el expediente.', '/extranjeria/residencia');
    } else if (data.ubicacion === 'espana' && (data.objetivo === 'regularizar' || data.autorizacion === 'no')) {
      route = option('Arraigo y otras vías de regularización', 'Revisar la situación personal, el tiempo de permanencia y los requisitos de la vía que pueda encajar.', '/extranjeria/arraigo');
    } else if (data.objetivo === 'residencia') {
      route = option('Residencia: renovación, modificación o nueva autorización', 'Primero hay que identificar qué autorización existe o se pretende solicitar.', '/extranjeria/residencia');
    }

    const note = data.estancia === '2omas'
      ? 'La antigüedad de permanencia puede ser relevante en algunas vías, pero debe comprobarse junto con el resto de requisitos y la normativa vigente.'
      : 'La antigüedad de permanencia es solo uno de los datos que conviene comprobar junto con el resto del expediente.';

    result.hidden = false;
    result.innerHTML = `
      <span class="eyebrow">Ruta orientativa</span>
      <h3>${route.title}</h3>
      <p>${route.text}</p>
      <p class="small">${note}</p>
      <div class="hero-actions compact">
        <a class="btn btn-dark" href="${route.href}">Ver información relacionada</a>
        <button type="button" class="btn btn-outline" id="extranjeria-triage-email">Enviar esta orientación por email</button>
      </div>
      <p class="small">La orientación no sustituye el estudio del expediente. El email abre un borrador; no se envía nada automáticamente.</p>
    `;

    result.querySelector('#extranjeria-triage-email')?.addEventListener('click', () => {
      const email = form.dataset.email;
      if (!email) return;
      const body = [
        'Hola,',
        '',
        'He utilizado el orientador de Extranjería de López Márquez Abogados.',
        `Ruta orientativa mostrada: ${route.title}`,
        '',
        `Dónde estoy: ${data.ubicacion}`,
        `Objetivo: ${data.objetivo}`,
        `Autorización o solicitud: ${data.autorizacion}`,
        `Tiempo aproximado en España: ${data.estancia}`,
        `Notificación o fecha límite: ${data.urgencia}`,
        `Vínculo familiar español/UE/EEE/Suiza: ${data.familiar_eu}`,
        `Otro vínculo familiar relevante: ${data.familia}`,
        '',
        'Quisiera revisar mi situación concreta y saber qué documentación conviene preparar.'
      ].join('\n');
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'immigration_triage_email_click', page_path: window.location.pathname });
      } catch (_) {}
      window.location.href = `mailto:${email}?subject=${encodeURIComponent('Consulta de Extranjería')}&body=${encodeURIComponent(body)}`;
    });
  });
})();
