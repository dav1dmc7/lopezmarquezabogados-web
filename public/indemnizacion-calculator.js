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

  const en = form.closest('.calculator-shell')?.dataset.locale === 'en';
  const cutoff = new Date(Date.UTC(2012, 1, 12));
  const euro = new Intl.NumberFormat(en ? 'en-GB' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  const t = {
    missingDates: en ? 'Enter both dates to calculate the estimate.' : 'Introduce las dos fechas para realizar la estimación.',
    invalidDates: en ? 'The dismissal date cannot be earlier than the employment start date.' : 'La fecha de despido no puede ser anterior a la fecha de inicio.',
    invalidSalary: en ? 'Enter a valid annual gross salary.' : 'Introduce un salario bruto anual válido.',
    months: (n) => en ? `${n} ${n === 1 ? 'month' : 'months'}` : `${n} ${n === 1 ? 'mes' : 'meses'}`,
    days: (n) => en ? `${n.toFixed(2)} days` : `${n.toFixed(2).replace('.', ',')} días`,
    cap: (n) => en ? `Cap: ${money(n)}` : money(n),
    legacy: en ? ' The historical tranche is calculated under the transitional unfair-dismissal rule; the file still requires professional review.' : ' El tramo histórico se calcula con la regla transitoria prevista para improcedencia; la revisión del expediente sigue siendo necesaria.'
  };

  const parseDate = (value) => {
    if (typeof value !== 'string') return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date;
  };
  const serviceMonths = (start, end) => {
    if (end < start) return 0;
    // Match the CGPJ's calendar-month rounding. A 365-day average miscounts
    // short months and periods that cross the February 2012 transitional cut-off.
    const wholeMonthDifference = (end.getUTCFullYear() - start.getUTCFullYear()) * 12
      + end.getUTCMonth() - start.getUTCMonth();
    const includesPartialMonth = end.getUTCDate() >= start.getUTCDate() ? 1 : 0;
    return Math.max(1, wholeMonthDifference + includesPartialMonth);
  };
  const dailySalary = (annualSalary) => annualSalary / 365;
  const money = (value) => euro.format(Math.max(0, value));
  const dispatch = (name, details = {}) => { window.dispatchEvent(new CustomEvent('lm:track', { detail: { name, ...details } })); };

  const calculateObjective = (start, end, annualSalary) => {
    const months = serviceMonths(start, end);
    const daily = dailySalary(annualSalary);
    const rawDays = months * (20 / 12);
    const capAmount = daily * 360;
    const amount = Math.min(rawDays * daily, capAmount);
    return { amount, days: amount / daily, months, cap: capAmount, summary: en ? `${t.months(months)} of service · 20 days of salary per year, capped at 12 monthly payments.` : `${t.months(months)} de servicio · 20 días de salario por año, con un máximo de 12 mensualidades.`, legacy: false };
  };

  const calculateUnfair = (start, end, annualSalary) => {
    const daily = dailySalary(annualSalary);
    if (start >= cutoff) {
      const months = serviceMonths(start, end);
      const rawDays = months * (33 / 12);
      const capAmount = daily * 720;
      const amount = Math.min(rawDays * daily, capAmount);
      return { amount, days: amount / daily, months, cap: capAmount, summary: en ? `${t.months(months)} of service · 33 days of salary per year, capped at 24 monthly payments.` : `${t.months(months)} de servicio · 33 días de salario por año, con un máximo de 24 mensualidades.`, legacy: false };
    }

    const preEnd = end < cutoff ? end : new Date(cutoff.getTime() - 86400000);
    const preMonths = serviceMonths(start, preEnd);
    const postMonths = end >= cutoff ? serviceMonths(cutoff, end) : 0;
    const preDays = preMonths * (45 / 12);
    const postDays = postMonths * (33 / 12);
    const rawDays = preDays + postDays;
    const rawAmount = rawDays * daily;
    const standardCap = daily * 720;
    const legacyCap = Math.min(preDays * daily, daily * 1260);
    const capAmount = preDays > 720 ? legacyCap : standardCap;
    const amount = Math.min(rawAmount, capAmount);
    return { amount, days: amount / daily, months: serviceMonths(start, end), cap: capAmount, summary: en ? `Contract signed before 12 February 2012 · ${t.months(preMonths)} at 45 days/year before the cutoff and ${t.months(postMonths)} at 33 days/year after it.` : `Contrato anterior al 12/02/2012 · ${t.months(preMonths)} a 45 días/año antes del corte y ${t.months(postMonths)} a 33 días/año después.`, legacy: true };
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault(); error.hidden = true; result.hidden = true;
    const data = new FormData(form);
    const start = parseDate(data.get('inicio')); const end = parseDate(data.get('fin'));
    const annualSalary = Number(String(data.get('salario') || '').replace(',', '.'));
    const scenario = data.get('escenario') === 'unfair' ? 'unfair' : 'objective';
    if (!start || !end) { error.textContent = t.missingDates; error.hidden = false; dispatch('calculator_error', { reason: 'missing_dates' }); return; }
    if (end < start) { error.textContent = t.invalidDates; error.hidden = false; dispatch('calculator_error', { reason: 'invalid_dates' }); return; }
    if (!Number.isFinite(annualSalary) || annualSalary <= 0) { error.textContent = t.invalidSalary; error.hidden = false; dispatch('calculator_error', { reason: 'invalid_salary' }); return; }

    const calculation = scenario === 'unfair' ? calculateUnfair(start, end, annualSalary) : calculateObjective(start, end, annualSalary);
    amount.textContent = money(calculation.amount);
    daysOutput.textContent = t.days(calculation.days);
    monthsOutput.textContent = t.months(calculation.months);
    capOutput.textContent = t.cap(calculation.cap);
    summary.textContent = calculation.summary + (calculation.legacy ? t.legacy : '');
    result.hidden = false;

    if (emailButton instanceof HTMLAnchorElement) {
      const email = form.dataset.email;
      const message = en ? 'Hello, I used the López Márquez Abogados severance calculator and would like to review my case.' : 'Hola, he usado la calculadora de indemnización de López Márquez Abogados y quisiera revisar mi caso.';
      if (email) {
        emailButton.href = `mailto:${email}?subject=${encodeURIComponent(en ? 'Dismissal severance review' : 'Revisión de estimación de indemnización por despido')}&body=${encodeURIComponent(message)}`;
        emailButton.hidden = false;
      }
    }
    dispatch('calculator_complete', { scenario, service_months: calculation.months, indemnity_days: Number(calculation.days.toFixed(2)) });
  });
})();
