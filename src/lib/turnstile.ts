export type TurnstileValidation =
  | { ok: true }
  | { ok: false; error: 'turnstile_missing' | 'turnstile_invalid' | 'turnstile_expired' | 'turnstile_unavailable' };

type SiteverifyResponse = {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
  'error-codes'?: unknown;
};

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SITEVERIFY_TIMEOUT_MS = 8000;

export async function verifyTurnstileToken({
  token,
  secret,
  hostname,
  remoteIp,
  testMode = false,
}: {
  token: string;
  secret: string;
  hostname: string;
  remoteIp?: string;
  testMode?: boolean;
}): Promise<TurnstileValidation> {
  if (!token) return { ok: false, error: 'turnstile_missing' };
  if (token.length > 2048) return { ok: false, error: 'turnstile_invalid' };
  if (!secret) return { ok: false, error: 'turnstile_unavailable' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEVERIFY_TIMEOUT_MS);
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      idempotency_key: crypto.randomUUID(),
    });
    if (remoteIp) body.set('remoteip', remoteIp);

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, error: 'turnstile_unavailable' };

    const result = await response.json().catch(() => null) as SiteverifyResponse | null;
    if (!result || typeof result !== 'object') return { ok: false, error: 'turnstile_unavailable' };
    if (result.success !== true) {
      const codes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
      if (codes.includes('timeout-or-duplicate')) return { ok: false, error: 'turnstile_expired' };
      if (codes.includes('invalid-input-response') || codes.includes('missing-input-response')) {
        return { ok: false, error: 'turnstile_invalid' };
      }
      return { ok: false, error: 'turnstile_unavailable' };
    }

    if (testMode) {
      if (result.hostname !== 'example.com' || (result.action !== undefined && result.action !== 'test')) {
        return { ok: false, error: 'turnstile_invalid' };
      }
    } else {
      const expectedHostnames = new Set([hostname.toLowerCase(), `www.${hostname}`.toLowerCase()]);
      if (typeof result.hostname !== 'string' || !expectedHostnames.has(result.hostname.toLowerCase())) {
        return { ok: false, error: 'turnstile_invalid' };
      }
      if (result.action !== 'contact') return { ok: false, error: 'turnstile_invalid' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'turnstile_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}
