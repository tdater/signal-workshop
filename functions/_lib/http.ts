import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
  IP_HASH_SALT?: string;
  ALLOWED_ORIGINS?: string;
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export function wantsJson(request: Request) {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

export function allowedOrigins(request: Request, env: Env) {
  const own = new URL(request.url).origin;
  const extra = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([own, ...extra]);
}

// Browsers send Origin on cross-site and same-site POSTs. `required` is used for owner endpoints,
// where a missing Origin is treated as hostile.
export function originOk(request: Request, env: Env, required: boolean) {
  const origin = request.headers.get('origin');
  if (!origin) return !required;
  return allowedOrigins(request, env).has(origin);
}

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('content-type') ?? '';
  const len = Number(request.headers.get('content-length') ?? '0');
  if (len > 64_000) return null;
  try {
    if (type.includes('application/json')) {
      const data = await request.json();
      return data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    }
    if (
      type.includes('application/x-www-form-urlencoded') ||
      type.includes('multipart/form-data')
    ) {
      const fd = await request.formData();
      const out: Record<string, unknown> = {};
      fd.forEach((v, k) => {
        if (typeof v === 'string') out[k] = v;
      });
      return out;
    }
  } catch {
    return null;
  }
  return null;
}

export function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

export const nowIso = () => new Date().toISOString();
