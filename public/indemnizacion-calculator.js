(() => {
  const form = document.querySelector('#indemnizacion-calculadora');
  const result = document.querySelector('#calculadora-resultado');
  const error = document.querySelector('#calculadora-error');
  const amount = document.querySelector('#calculadora-importe');
  const summary = document.querySelector('#calculadora-resumen');
  const daysOutput = document.querySelector('#calculadora-dias');
  const monthsOutput = document.querySelector('#calculadora-meses');
  const capOutput = document.querySelector('#calculadora-tope');
  const emailButton = document.querySelector('#calculadora-email');

  if (!(form instanceof HTMLFormElement) || !result || !error || !amount || !summary || !daysOutput || !monthsOutput || !capOutput) return;

  const cutoff = new Date(Date.UTC(2012, 1, 12));
  const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  const parseDate = (value) => {
    if (typeof value !== 'string') return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const addMonths = (date, months) => {
    const serialMonth = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
    const year = Math.floor(serialMonth / 12);
    const month = serialMonth % 12;
    const day = Math.min(date.getUTCDate(), daysInMonth(year, month));
    return new Date(Date.UTC(year, month, day));
  };

  // For the statutory proration by months, any remaining fraction of a month is counted as a month.
  const serviceMonths = (start, end) => {
    if (end < start) return 0;
    let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
    if (addMonths(start, months) < end) months += 1;
    if (months === 0) months = 1;
    return months;
  };

  const dailySalary = (annualSalary) => annualSalary / 365;
  const money = (value) => euro.format(Math.max(0, value));
  const dispatch = (name, details = {}) => {
    window.dispatchEvent(new CustomEvent('lm:analytics', { detail: { name, ...details } }));
  };

  const calculateObjective = (start, end, annualSalary) => {
    const months = serviceMonths(start, end);
    const daily = dailySalary(annualSalary);
    const rawDays = months * (20 / 12);
    const capAmount = 720 * daily;
    const amount = Math.min(rawDays * daily, capAmount);
    return {
      amount,
      days: amount / daily,
      months,
      cap: capAmount,
      summary: `${months} meses de servicio · 20 días de salario por año, con un máximo de 12 mensualidades.`,
      legacy: false
    };
  };

  const calculateUnfair = (start, end, annualSalary) => {
    const daily = dailySalary(annualSalary);

    if (start >= cutoff) {
      const months = serviceMonths(start, end);
      const rawDays = months * (33 / 12);
      const capAmount = 720 * daily;
      const amount = Math.min(rawDays * daily, capAmount);
      return {
        amount,
        days: amount / daily,
        months,
        cap: capAmount,
        summary: `${months} meses de servicio · 33 días de salario por año, con un máximo de 24 mensualidades.`,
        legacy: false
      };
    }

    const preEnd = end < cutoff ? end : new Date(cutoff.getTime() - 86400000);
    const preMonths = serviceMonths(start, preEnd);
    const postMonths = end >= cutoff ? serviceMonths(cutoff, end) : 0;
    const preDays = preMonths * (45 / 12);
    const postDays = postMonths * (33 / 12);
    const rawDays = preDays + postDays;
    const rawAmount = rawDays * daily;
    const standardCap = 720 * daily;
    const legacyCap = Math.min(preDays * daily, 1260 * daily);
    const capAmount = preDays > 720 ? legacyCap : standardCap;
    const amount = Math.min(rawAmount, capAmount);

    return {
      amount,
      days: amount / daily,
      months: preMonths + postMonths,
      cap: capAmount,
      summary: `Contrato anterior al 12/02/2012 · ${preMonths} meses anteriores a 45 días/año y ${postMonths} meses posteriores a 33 días/año.`,
      legacy: true
    };
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    result.hidden = true;

    const data = new FormData(form);
    const start = parseDate(data.get('inicio'));
    const end = parseDate(data.get('fin'));
    const annualSalary = Number(String(data.get('salario') || '').replace(',', '.'));
    const scenario = data.get('escenario') === 'unfair' ? 'unfair' : 'objective';

    if (!start || !end) {
      error.textContent = 'Introduce las dos fechas para realizar la estimación.';
      error.hidden = false;
      dispatch('calculator_error', { reason: 'missing_dates' });
      return;
    }

    if (end < start) {
      error.textContent = 'La fecha de despido no puede ser anterior a la fecha de inicio.';
      error.hidden = false;
      dispatch('calculator_error', { reason: 'invalid_dates' });
      return;
    }

    if (!Number.isFinite(annualSalary) || annualSalary <= 0) {
      error.textContent = 'Introduce un salario bruto anual válido.';
      error.hidden = false;
      dispatch('calculator_error', { reason: 'invalid_salary' });
      return;
    }

    const calculation = scenario === 'unfair'
      ? calculateUnfair(start, end, annualSalary)
      : calculateObjective(start, end, annualSalary);

    amount.textContent = money(calculation.amount);
    daysOutput.textContent = `${calculation.days.toFixed(2).replace('.', ',')} días`;
    monthsOutput.textContent = `${calculation.months} meses`;
    capOutput.textContent = money(calculation.cap);

    const historicalWarning = calculation.legacy
      ? ' El tramo histórico se calcula con la regla transitoria prevista para improcedencia; la revisión del expediente sigue siendo necesaria.'
      : '';

    summary.textContent = calculation.summary + historicalWarning;
    result.hidden = false;

    if (emailButton instanceof HTMLAnchorElement) {
      const email = form.dataset.email;
      const message = 'Hola, he usado la calculadora de indemnización de López Márquez Abogados y quisiera revisar mi caso.';
      if (email) {
        emailButton.href = `mailto:${email}?subject=${encodeURIComponent('Revisión de estimación de indemnización por despido')}&body=${encodeURIComponent(message)}`;
        emailButton.hidden = false;
      }
    }

    dispatch('calculator_complete', {
      scenario,
      service_months: calculation.months,
      indemnity_days: Number(calculation.days.toFixed(2))
    });
  });
})();
