import { execFileSync } from 'node:child_process';

const id = process.argv[2] || '';
const force = process.argv.includes('--force');
if (!/^[0-9a-f-]{36}$/i.test(id)) {
  console.error('Uso: RESEND_API_KEY=... node scripts/resend-pending-notification.mjs <UUID> [--force]');
  process.exit(2);
}
const apiKey = String(process.env.RESEND_API_KEY || '').trim();
if (!apiKey) {
  console.error('Falta RESEND_API_KEY en el entorno. No la guardes en Git.');
  process.exit(2);
}

function query(sql) {
  const output = execFileSync('npx', ['wrangler', 'd1', 'execute', 'lopezmarquez-consultas', '--remote', '--json', '--command', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const data = JSON.parse(output);
  const groups = Array.isArray(data) ? data : [data];
  return groups.flatMap((g) => Array.isArray(g?.results) ? g.results : Array.isArray(g?.result?.results) ? g.result.results : []);
}
const row = query(`SELECT id, created_at, locale, area, name, email, phone, relevant_date, message, source_path, status FROM consultations WHERE id = '${id}' LIMIT 1`)[0];
if (!row) { console.error('No se encontró esa consulta en D1.'); process.exit(1); }
if (!force && row.status !== 'stored_pending_notification') {
  console.error(`La consulta tiene estado ${row.status}. Para reenviar expresamente un aviso marcado como enviado, añade --force después de revisar el riesgo de duplicado.`);
  process.exit(1);
}
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[c] ?? c);
const es = row.locale !== 'en';
const reference = `LM-${String(row.id).slice(0, 8).toUpperCase()}`;
const subject = es ? `Recuperación de consulta web · ${row.area} · ${row.name}` : `Recovered website enquiry · ${row.area} · ${row.name}`;
const message = esc(row.message).replace(/\n/g, '<br>');
const html = `<!doctype html><html lang="${es ? 'es' : 'en'}"><body style="margin:0;background:#f7f3eb;font:15px/1.65 Arial,sans-serif;color:#15261f"><main style="max-width:650px;margin:24px auto;background:#fffdf8"><header style="padding:24px;text-align:center;background:#15261f"><img src="https://lopezmarquezabogados.com/brand/email-logo.png" alt="López Márquez Abogados" width="260" style="max-width:100%;height:auto"></header><section style="padding:28px"><h1>${es ? 'Aviso de consulta recuperado' : 'Recovered enquiry notification'}</h1><p>${es ? 'Este email recupera una notificación que no se pudo entregar en el envío original.' : 'This email recovers a notification that could not be delivered originally.'}</p><p><strong>Referencia:</strong> ${esc(reference)}<br><strong>${es ? 'Área' : 'Area'}:</strong> ${esc(row.area)}<br><strong>${es ? 'Nombre' : 'Name'}:</strong> ${esc(row.name)}<br><strong>Email:</strong> ${esc(row.email)}<br><strong>${es ? 'Teléfono' : 'Phone'}:</strong> ${esc(row.phone || (es ? 'No indicado' : 'Not provided'))}<br><strong>${es ? 'Fecha relevante' : 'Relevant date'}:</strong> ${esc(row.relevant_date || (es ? 'No indicada' : 'Not specified'))}<br><strong>${es ? 'Origen' : 'Source'}:</strong> ${esc(row.source_path || '')}</p><hr><h2>${es ? 'Mensaje' : 'Message'}</h2><p>${message}</p><p><a href="mailto:${esc(row.email)}?subject=${encodeURIComponent(subject)}">${es ? 'Responder al cliente' : 'Reply to client'}</a></p></section><footer style="padding:20px;text-align:center;background:#f7f3eb">López Márquez Abogados · Barcelona</footer></main></body></html>`;
const text = `${subject}\nReferencia: ${reference}\n${es ? 'Área' : 'Area'}: ${row.area}\n${es ? 'Nombre' : 'Name'}: ${row.name}\nEmail: ${row.email}\n${es ? 'Teléfono' : 'Phone'}: ${row.phone || ''}\n${es ? 'Fecha relevante' : 'Relevant date'}: ${row.relevant_date || ''}\n\n${row.message}`;
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: 'López Márquez Abogados <web@lopezmarquezabogados.com>', to: ['lopezmarquezabogados@gmail.com'], reply_to: row.email, subject, html, text }),
});
const result = await response.json().catch(() => ({}));
if (!response.ok || typeof result.id !== 'string') {
  console.error(`Resend no aceptó el envío (HTTP ${response.status}). Revisa el panel de Resend; no se ha cambiado D1.`);
  process.exit(1);
}
const sqlId = id.replace(/'/g, "''");
query(`UPDATE consultations SET status = 'notified_customer_pending', internal_notification_status = 'sent', customer_confirmation_status = 'not_sent_before_migration', notification_provider = 'resend' WHERE id = '${sqlId}'`);
console.log(`Aviso interno enviado a Resend. ID Resend: ${result.id}. Referencia: ${reference}.`);
console.log('Se ha actualizado D1. El cliente antiguo no recibe una confirmación retroactiva con este comando.');
