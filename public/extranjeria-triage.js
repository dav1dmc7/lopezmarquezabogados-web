(() => {
  const form = document.querySelector('#extranjeria-triage-form');
  const result = document.querySelector('#extranjeria-triage-result');
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) return;
  const en = form.dataset.locale === 'en';
  const get = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const option = (title, text, href) => ({ title, text, href });
  const t = {
    route: en ? 'Suggested route' : 'Ruta orientativa',
    view: en ? 'View related information' : 'Ver información relacionada',
    email: en ? 'Send this direction by email' : 'Enviar esta orientación por email',
    disclaimer: en ? 'This direction does not replace a review of your file. The email opens a draft; nothing is sent automatically.' : 'La orientación no sustituye el estudio del expediente. El email abre un borrador; no se envía nada automáticamente.',
    hello: en ? 'Hello,' : 'Hola,',
    intro: en ? 'I used the López Márquez Abogados immigration route finder.' : 'He utilizado el orientador de Extranjería de López Márquez Abogados.',
    routeLabel: en ? 'Suggested route shown' : 'Ruta orientativa mostrada',
    where: en ? 'Where I am' : 'Dónde estoy',
    goal: en ? 'Goal' : 'Objetivo',
    permit: en ? 'Permit or application' : 'Autorización o solicitud',
    stay: en ? 'Time in Spain' : 'Tiempo aproximado en España',
    deadline: en ? 'Notification or deadline' : 'Notificación o fecha límite',
    euFamily: en ? 'Spanish/EU/EEA/Swiss family connection' : 'Vínculo familiar español/UE/EEE/Suiza',
    otherFamily: en ? 'Other relevant family connection' : 'Otro vínculo familiar relevante',
    close: en ? 'I would like to review my specific situation and know which documents I should prepare.' : 'Quisiera revisar mi situación concreta y saber qué documentación conviene preparar.'
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = {
      ubicacion: get('ubicacion'), objetivo: get('objetivo'), autorizacion: get('autorizacion'),
      estancia: get('estancia'), urgencia: get('urgencia'), familia: get('familia'), familiar_eu: get('familiar_eu')
    };

    let route = option(
      en ? 'Initial case review' : 'Revisión inicial del caso',
      en ? 'Order the facts, documents and objective before choosing a procedure.' : 'Ordenar hechos, documentación y objetivo antes de elegir procedimiento.',
      en ? '/en/contact' : '/contacto'
    );
    if (data.urgencia === 'si' || data.autorizacion === 'caducada') {
      route = option(en ? 'Priority review' : 'Revisión prioritaria', en ? 'A notification, date or administrative issue needs to be checked before you act.' : 'Hay una notificación, fecha o situación administrativa que merece comprobarse antes de actuar.', en ? '/en/contact' : '/contacto');
    } else if (data.objetivo === 'nacionalidad') {
      route = option(en ? 'Spanish nationality' : 'Nacionalidad española', en ? 'Review the applicable residence period, documents and your current situation.' : 'Revisar plazo aplicable, documentación y situación de residencia.', en ? '/en/immigration/spanish-nationality' : '/extranjeria/nacionalidad-espanola');
    } else if (data.familiar_eu === 'si') {
      route = option(en ? 'Family member of a Spanish or EU citizen' : 'Familiar de persona española o de la UE', en ? 'Check the relationship, the reference person\'s status and the immigration route that may apply.' : 'Conviene comprobar el vínculo, la situación de la persona de referencia y la vía de autorización que corresponda.', en ? '/en/immigration/residency' : '/extranjeria/residencia');
    } else if (data.objetivo === 'familia' || data.familia === 'si') {
      route = option(en ? 'Family-related immigration' : 'Situación familiar', en ? 'Review the family relationship, the reference person\'s status and the relevant route.' : 'Revisar el vínculo, la situación de la persona de referencia y la vía que corresponda.', en ? '/en/immigration/family-reunification' : '/extranjeria/reagrupacion-familiar');
    } else if (data.ubicacion === 'fuera' && data.objetivo !== 'regularizar') {
      route = option(en ? 'Residence from outside Spain' : 'Residencia desde fuera de España', en ? 'Review the specific authorisation and documents before starting the file.' : 'Revisar la autorización concreta y la documentación necesaria antes de iniciar el expediente.', en ? '/en/immigration/residency' : '/extranjeria/residencia');
    } else if (data.ubicacion === 'espana' && (data.objetivo === 'regularizar' || data.autorizacion === 'no')) {
      route = option(en ? 'Regularisation and arraigo' : 'Arraigo y otras vías de regularización', en ? 'Review your situation, time in Spain and the requirements of the route that may fit.' : 'Revisar la situación personal, el tiempo de permanencia y los requisitos de la vía que pueda encajar.', en ? '/en/immigration/regularisation' : '/extranjeria/arraigo');
    } else if (data.objetivo === 'residencia') {
      route = option(en ? 'Residence: renewal, modification or new permit' : 'Residencia: renovación, modificación o nueva autorización', en ? 'First identify which permit exists or which route you want to apply for.' : 'Primero hay que identificar qué autorización existe o se pretende solicitar.', en ? '/en/immigration/residency' : '/extranjeria/residencia');
    }

    const note = data.estancia === '2omas'
      ? (en ? 'Time spent in Spain may be relevant for some routes, but it must be checked together with the other requirements and current rules.' : 'La antigüedad de permanencia puede ser relevante en algunas vías, pero debe comprobarse junto con el resto de requisitos y la normativa vigente.')
      : (en ? 'Time spent in Spain is only one of the facts to check alongside the rest of the file.' : 'La antigüedad de permanencia es solo uno de los datos que conviene comprobar junto con el resto del expediente.');

    result.hidden = false;
    result.innerHTML = `
      <span class="eyebrow">${t.route}</span>
      <h3>${route.title}</h3>
      <p>${route.text}</p>
      <p class="small">${note}</p>
      <div class="hero-actions compact">
        <a class="btn btn-dark" href="${route.href}">${t.view}</a>
        <button type="button" class="btn btn-outline" id="extranjeria-triage-email">${t.email}</button>
      </div>
      <p class="small">${t.disclaimer}</p>
    `;

    result.querySelector('#extranjeria-triage-email')?.addEventListener('click', () => {
      const email = form.dataset.email;
      if (!email) return;
      const body = [
        t.hello, '', t.intro,
        `${t.routeLabel}: ${route.title}`, '',
        `${t.where}: ${data.ubicacion}`,
        `${t.goal}: ${data.objetivo}`,
        `${t.permit}: ${data.autorizacion}`,
        `${t.stay}: ${data.estancia}`,
        `${t.deadline}: ${data.urgencia}`,
        `${t.euFamily}: ${data.familiar_eu}`,
        `${t.otherFamily}: ${data.familia}`,
        '', t.close
      ].join('\n');
      try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'immigration_triage_email_click', page_path: window.location.pathname }); } catch (_) {}
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(en ? 'Immigration enquiry' : 'Consulta de Extranjería')}&body=${encodeURIComponent(body)}`;
    });
  });
})();
