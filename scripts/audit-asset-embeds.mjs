import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const svgPath = join(root, 'public/brand/logo.svg');
if (!existsSync(svgPath)) {
  console.error(`Missing ${svgPath}`);
  process.exit(1);
}

const svg = readFileSync(svgPath, 'utf8');
const matches = [...svg.matchAll(/data:([^,;"']+)(?:;[^,"']*)?,([^"']+)/g)];

function decodedBytes(payload, meta) {
  try {
    if (/;base64/i.test(meta)) return Buffer.from(payload, 'base64').length;
    return Buffer.byteLength(decodeURIComponent(payload));
  } catch {
    return null;
  }
}

const rows = matches.map((m, i) => {
  const meta = m[0].slice(5, m[0].indexOf(','));
  const payload = m[2];
  return {
    index: i + 1,
    mime: m[1],
    encoding: /;base64/i.test(meta) ? 'base64' : 'url-encoded',
    decodedBytes: decodedBytes(payload, meta),
    payloadChars: payload.length,
  };
});

const byPayload = new Map();
for (const m of matches) {
  const meta = m[0].slice(5, m[0].indexOf(','));
  const payload = m[2];
  let key = `${m[1]}|${meta.includes(';base64') ? 'b64' : 'uri'}|${payload}`;
  byPayload.set(key, (byPayload.get(key) || 0) + 1);
}

console.log('=== EMBEDDED ASSET AUDIT ===');
console.log(`SVG: public/brand/logo.svg (${Buffer.byteLength(svg)} bytes)`);
console.log(`data URI count: ${rows.length}`);
for (const row of rows) {
  console.log(`data URI #${row.index}: mime=${row.mime} encoding=${row.encoding} decodedBytes=${row.decodedBytes ?? 'unknown'} payloadChars=${row.payloadChars}`);
}
const duplicates = [...byPayload.values()].filter((n) => n > 1);
console.log(`duplicate data URI payload groups: ${duplicates.length}`);
if (rows.some((r) => (r.decodedBytes ?? 0) > 100_000)) {
  console.log('RECOMMENDATION: externalize large embedded image payload(s) so the SVG shell stays lightweight and the browser can cache the image separately.');
} else {
  console.log('No embedded payload exceeds 100 KB.');
}
