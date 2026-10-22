(() => {
  const form = document.querySelector('#empresa-autodiagnostico');
  const result = document.querySelector('#empresa-autodiagnostico-resultado');
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) return;
  const en = form.dataset.locale === 'en';
  const get = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const mailto = (email, subject, body) => { window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = { plantilla: get('plantilla'), frecuencia: get('frecuencia'), revision: get('revision'), necesidad: get('necesidad'), documentacion: get('documentacion'), modelo: get('modelo') };
    const priorities = [];
    if (data.revision !== 'si') priorities.push(en ? 'preventive review of sensitive employment decisions' : 'revisión preventiva de decisiones laborales sensibles');
    if (data.documentacion !== 'si') priorities.push(en ? 'organisation and availability of employment documentation' : 'orden y disponibilidad de documentación laboral');
    if (data.necesidad === 'extinciones') priorities.push(en ? 'dismissals, departures and decision documentation' : 'despidos, salidas y documentación de la decisión');
    if (data.necesidad === 'disciplina') priorities.push(en ? 'conflicts and disciplinary measures' : 'conflictos y medidas disciplinarias');
    if (data.necesidad === 'contratacion') priorities.push(en ? 'hiring, changes and contract documentation' : 'contratación, cambios y documentación contractual');
    if (data.necesidad === 'prevencion' || data.modelo !== 'puntual' || data.frecuencia !== 'ocasional') priorities.push(en ? 'a recurring legal channel and prevention' : 'canal jurídico recurrente y prevención');
    if (!priorities.length) priorities.push(en ? 'review of the employment processes that recur most often' : 'revisión de los procesos laborales que más se repiten');
    const workforcePriority = {
      '1-5': en ? 'clear ownership for employment decisions and records in a small team' : 'definir quién gestiona las decisiones y la documentación laboral en un equipo pequeño',
      '6-15': en ? 'consistent handling of employment changes and records as the team grows' : 'mantener un criterio común para cambios y documentos laborales a medida que crece el equipo',
      '16-49': en ? 'consistent employment processes across the company’s teams' : 'aplicar criterios laborales coherentes entre los distintos equipos',
      '50+': en ? 'coordination of employment decisions and records across teams and managers' : 'coordinar decisiones y documentación laboral entre equipos y responsables'
    }[data.plantilla];
    if (workforcePriority) priorities.unshift(workforcePriority);

    const title = en ? 'These are the priorities suggested by your answers' : 'Estas son las prioridades que aparecen en tus respuestas';
    const next = en ? 'The workforce size is context, not a legal threshold. The next step is to look at the company activity, documents and the decision on the table.' : 'El tamaño de la plantilla aporta contexto, pero no determina por sí solo las obligaciones legales. El siguiente paso es revisar la actividad, los documentos y la decisión concreta.';
    const emailLabel = en ? 'Email the summary to the firm' : 'Enviar resumen al despacho';
    const note = en ? 'The button opens a draft in your email app. Nothing is sent automatically.' : 'El botón abre tu aplicación de correo con un borrador. No se envía nada automáticamente.';

    result.hidden = false;
    result.innerHTML = `<span class="eyebrow">${en ? 'Suggested result' : 'Resultado orientativo'}</span><h3>${title}</h3><ul>${priorities.map((item) => `<li>${item}</li>`).join('')}</ul><p>${next}</p><button type="button" class="btn btn-dark" id="empresa-autodiagnostico-email">${emailLabel}</button><p class="small">${note}</p>`;

    result.querySelector('#empresa-autodiagnostico-email')?.addEventListener('click', () => {
      const email = form.dataset.email;
      if (!email) return;
      const body = [
        en ? 'Hello,' : 'Hola,', '',
        en ? 'I completed the preventive employment review for companies on the López Márquez Abogados website and would like to discuss these points:' : 'He completado la revisión preventiva para empresas de López Márquez Abogados y me gustaría revisar estos puntos:',
        ...priorities.map((item) => `- ${item}`), '',
        `${en ? 'Workforce' : 'Plantilla'}: ${data.plantilla}`,
        `${en ? 'Frequency of sensitive decisions' : 'Frecuencia de decisiones sensibles'}: ${data.frecuencia}`,
        `${en ? 'Prior review' : 'Revisión previa'}: ${data.revision}`,
        `${en ? 'Main need' : 'Necesidad principal'}: ${data.necesidad}`,
        `${en ? 'Documentation' : 'Documentación'}: ${data.documentacion}`,
        `${en ? 'Preferred model' : 'Modelo buscado'}: ${data.modelo}`,
        '', en ? 'I would like to know the appropriate next step.' : 'Quedo pendiente de indicaciones sobre el siguiente paso.'
      ].join('\n');
      window.dispatchEvent(new CustomEvent('lm:track', { detail: { name: 'company_assessment_email_click' } }));
      mailto(email, en ? 'Employment legal enquiry for a company' : 'Consulta jurídica laboral para empresa', body);
    });
  });
})();
