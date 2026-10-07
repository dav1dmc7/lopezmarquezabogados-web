(() => {
  const form = document.querySelector('#extranjeria-triage-form');
  const result = document.querySelector('#extranjeria-triage-result');
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) return;
  const en = form.dataset.locale === 'en';
  const get = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const fieldsets = Array.from(form.querySelectorAll('fieldset'));
  const controls = form.querySelector('[data-triage-controls]');
  const progress = form.querySelector('[data-triage-progress]');
  const stepError = form.querySelector('[data-triage-error]');
  const previous = form.querySelector('[data-triage-back]');
  const next = form.querySelector('[data-triage-next]');
  const submitButton = form.querySelector('[data-triage-submit]');
  let currentStep = 0;
  let started = false;
  if (fieldsets.length && controls && progress && stepError && previous && next && submitButton) {
    controls.hidden = false;
    submitButton.hidden = true;
    const updateStep = (moveFocus = false) => {
      fieldsets.forEach((fieldset, index) => { fieldset.hidden = index !== currentStep; });
      progress.textContent = en ? `Step ${currentStep + 1} of ${fieldsets.length}` : `Paso ${currentStep + 1} de ${fieldsets.length}`;
      previous.disabled = currentStep === 0;
      next.hidden = currentStep === fieldsets.length - 1;
      submitButton.hidden = currentStep !== fieldsets.length - 1;
      if (moveFocus) fieldsets[currentStep].querySelector('input')?.focus();
    };
    next.addEventListener('click', () => {
      if (!fieldsets[currentStep].querySelector('input[type="radio"]:checked')) {
        stepError.textContent = en ? 'Choose an answer or select “Not sure” to continue.' : 'Elige una respuesta o marca «No lo sé» para continuar.';
        stepError.hidden = false;
        fieldsets[currentStep].querySelector('input')?.focus();
        return;
      }
      stepError.hidden = true;
      currentStep = Math.min(currentStep + 1, fieldsets.length - 1);
      updateStep(true);
    });
    previous.addEventListener('click', () => {
      stepError.hidden = true;
      currentStep = Math.max(0, currentStep - 1);
      updateStep(true);
    });
    form.addEventListener('change', () => { stepError.hidden = true; });
    updateStep();
  }
  form.addEventListener('change', () => {
    if (started) return;
    started = true;
    window.dispatchEvent(new CustomEvent('lm:track', { detail: { name: 'immigration_triage_start' } }));
  });
  const option = (title, text, href) => ({ title, text, href });
  const t = {
    route: en ? 'Suggested route' : 'Ruta orientativa',
    view: en ? 'View related information' : 'Ver información relacionada',
    email: en ? 'Send this direction by email' : 'Enviar esta orientación por email',
    disclaimer: en ? 'This direction does not replace a review of your file. The email opens a draft; nothing is sent automatically.' : 'La orientación no sustituye el estudio del expediente. El email abre un borrador; no se envía nada automáticamente.',
    hello: en ? 'Hello,' : 'Hola,',
    intro: en ? 'I used the López Márquez Abogados immigration route finder.' : 'He utilizado el orientador de Extranjería de López Márquez Abogados.',
    routeLabel: en ? 'Suggested route shown' : 'Ruta orientativa mostrada',
    basisTitle: en ? 'What this direction considered' : 'Qué hemos tenido en cuenta',
    where: en ? 'Where I am' : 'Dónde estoy',
    goal: en ? 'Goal' : 'Objetivo',
    permit: en ? 'Permit or application' : 'Autorización o solicitud',
    stay: en ? 'Time in Spain' : 'Tiempo aproximado en España',
    deadline: en ? 'Notification or deadline' : 'Notificación o fecha límite',
    euFamily: en ? 'Spanish/EU/EEA/Swiss family connection' : 'Vínculo familiar español/UE/EEE/Suiza',
    otherFamily: en ? 'Other relevant family connection' : 'Otro vínculo familiar relevante',
    answers: {
      ubicacion: en ? { espana: 'In Spain', fuera: 'Outside Spain', 'no-se': 'Not sure' } : { espana: 'En España', fuera: 'Fuera de España', 'no-se': 'No lo tengo claro' },
      objetivo: en ? { regularizar: 'Regularise my situation', residencia: 'Obtain, renew or modify residence', nacionalidad: 'Spanish nationality', familia: 'Family-related matter', otro: 'Another matter' } : { regularizar: 'Regularizar mi situación', residencia: 'Obtener, renovar o modificar residencia', nacionalidad: 'Nacionalidad española', familia: 'Situación familiar', otro: 'Otra situación' },
      autorizacion: en ? { actual: 'Permit is valid', tramite: 'Application is pending', caducada: 'Expired or uncertain', no: 'No current permit or application', ns: 'Not sure' } : { actual: 'Autorización vigente', tramite: 'Solicitud en trámite', caducada: 'Caducada o con dudas', no: 'Sin autorización o solicitud en curso', ns: 'No lo sé' },
      estancia: en ? { menos2: 'Less than 2 years', '2omas': '2 years or more', fuera: 'Outside Spain', ns: 'Not sure' } : { menos2: 'Menos de 2 años', '2omas': '2 años o más', fuera: 'Fuera de España', ns: 'No lo sé' },
      urgencia: en ? { si: 'Yes', no: 'No', ns: 'Not sure' } : { si: 'Sí', no: 'No', ns: 'No lo sé' },
      familiar_eu: en ? { si: 'Yes', no: 'No', ns: 'Not sure' } : { si: 'Sí', no: 'No', ns: 'No lo sé' },
      familia: en ? { si: 'Yes', no: 'No', ns: 'Not sure' } : { si: 'Sí', no: 'No', ns: 'No lo sé' }
    },
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

    const basis = [
      [t.where, t.answers.ubicacion[data.ubicacion]],
      [t.goal, t.answers.objetivo[data.objetivo]],
      [t.permit, t.answers.autorizacion[data.autorizacion]],
      [t.stay, t.answers.estancia[data.estancia]],
      [t.deadline, t.answers.urgencia[data.urgencia]],
      [t.euFamily, t.answers.familiar_eu[data.familiar_eu]],
      [t.otherFamily, t.answers.familia[data.familia]]
    ].filter(([, answer]) => answer);

    const note = data.estancia === '2omas'
      ? (en ? 'Time spent in Spain may be relevant for some routes, but it must be checked together with the other requirements and current rules.' : 'La antigüedad de permanencia puede ser relevante en algunas vías, pero debe comprobarse junto con el resto de requisitos y la normativa vigente.')
      : (en ? 'Time spent in Spain is only one of the facts to check alongside the rest of the file.' : 'La antigüedad de permanencia es solo uno de los datos que conviene comprobar junto con el resto del expediente.');

    result.hidden = false;
    result.innerHTML = `
      <span class="eyebrow">${t.route}</span>
      <h3>${route.title}</h3>
      <p>${route.text}</p>
      <h4>${t.basisTitle}</h4>
      <ul>${basis.map(([label, answer]) => `<li><strong>${label}:</strong> ${answer}</li>`).join('')}</ul>
      <p class="small">${note}</p>
      <div class="hero-actions compact">
        <a class="btn btn-dark" href="${route.href}">${t.view}</a>
        <button type="button" class="btn btn-outline" id="extranjeria-triage-email">${t.email}</button>
      </div>
      <p class="small">${t.disclaimer}</p>
    `;

    result.setAttribute('tabindex', '-1');
    result.focus();
    window.dispatchEvent(new CustomEvent('lm:track', { detail: { name: 'immigration_triage_complete', route: route.href } }));
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
