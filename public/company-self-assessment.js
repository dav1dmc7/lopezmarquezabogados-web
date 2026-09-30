(() => {
  const form = document.querySelector('#empresa-autodiagnostico');
  const result = document.querySelector('#empresa-autodiagnostico-resultado');
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) return;

  const get = (name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const mailto = (email, subject, body) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      plantilla: get('plantilla'),
      frecuencia: get('frecuencia'),
      revision: get('revision'),
      necesidad: get('necesidad'),
      documentacion: get('documentacion'),
      modelo: get('modelo')
    };

    const priorities = [];
    if (data.revision !== 'si') priorities.push('revisión preventiva de decisiones laborales sensibles');
    if (data.documentacion !== 'si') priorities.push('orden y disponibilidad de documentación laboral');
    if (data.necesidad === 'extinciones') priorities.push('despidos, salidas y documentación de la decisión');
    if (data.necesidad === 'disciplina') priorities.push('conflictos y medidas disciplinarias');
    if (data.necesidad === 'contratacion') priorities.push('contratación, cambios y documentación contractual');
    if (data.necesidad === 'prevencion' || data.modelo !== 'puntual' || data.frecuencia !== 'ocasional') priorities.push('canal jurídico recurrente y prevención');
    if (!priorities.length) priorities.push('revisión de los procesos laborales que más se repiten');

    result.hidden = false;
    result.innerHTML = `
      <span class="eyebrow">Resultado orientativo</span>
      <h3>Estas son las prioridades que aparecen en tus respuestas</h3>
      <ul>${priorities.map((item) => `<li>${item}</li>`).join('')}</ul>
      <p>El siguiente paso es llevar esta foto general a una situación concreta: actividad, plantilla, documentación y decisión que esté sobre la mesa.</p>
      <button type="button" class="btn btn-dark" id="empresa-autodiagnostico-email">Enviar resumen al despacho</button>
      <p class="small">El botón abre tu aplicación de correo con un borrador. No se envía nada automáticamente.</p>
    `;

    const emailButton = result.querySelector('#empresa-autodiagnostico-email');
    emailButton?.addEventListener('click', () => {
      const email = form.dataset.email;
      if (!email) return;
      const body = [
        'Hola,',
        '',
        'He completado la revisión preventiva para empresas de López Márquez Abogados y me gustaría revisar estos puntos:',
        ...priorities.map((item) => `- ${item}`),
        '',
        `Plantilla: ${data.plantilla}`,
        `Frecuencia de decisiones sensibles: ${data.frecuencia}`,
        `Revisión previa: ${data.revision}`,
        `Necesidad principal: ${data.necesidad}`,
        `Documentación: ${data.documentacion}`,
        `Modelo buscado: ${data.modelo}`,
        '',
        'Quedo pendiente de indicaciones sobre el siguiente paso.'
      ].join('\n');
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'company_assessment_email_click', page_path: window.location.pathname });
      } catch (_) {}
      mailto(email, 'Consulta jurídica laboral para empresa', body);
    });
  });
})();
