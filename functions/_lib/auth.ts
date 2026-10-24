import { randomToken, sign, verifySignature, b64url, fromB64, timingSafeEqual } from './crypto';
import { originOk, type Env } from './http';

export const COOKIE = '__Host-sw_admin';
export const SESSION_HOURS = 8;

interface Session {
  v: 1;
  exp: number;
  csrf: string;
}

export function adminConfigured(env: Env) {
  return Boolean(env.ADMIN_PASSWORD_HASH && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);
}

export async function createSessionCookie(env: Env) {
  const session: Session = {
    v: 1,
    exp: Date.now() + SESSION_HOURS * 3600_000,
    csrf: randomToken(18),
  };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(session)));
  const value = `${payload}.${await sign(payload, env.SESSION_SECRET!)}`;
  const cookie = `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
  return { cookie, csrf: session.csrf };
}

export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

function readCookie(request: Request) {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE) return rest.join('=');
  }
  return null;
}

export async function getSession(request: Request, env: Env): Promise<Session | null> {
  if (!adminConfigured(env)) return null;
  const raw = readCookie(request);
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig || !(await verifySignature(payload, sig, env.SESSION_SECRET!))) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(fromB64(payload))) as Session;
    if (s.v !== 1 || typeof s.exp !== 'number' || s.exp < Date.now() || typeof s.csrf !== 'string')
      return null;
    return s;
  } catch {
    return null;
  }
}

export type AuthResult =
  { ok: true; session: Session } | { ok: false; status: number; error: string };

// Every owner endpoint calls this. Reads need a valid session; writes also need a same-origin
// request and the CSRF token from the session echoed in a header.
export async function requireAdmin(request: Request, env: Env): Promise<AuthResult> {
  if (!adminConfigured(env))
    return { ok: false, status: 503, error: 'Moderation is not configured on this deployment.' };
  const session = await getSession(request, env);
  if (!session) return { ok: false, status: 401, error: 'Sign in required.' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (!originOk(request, env, true))
      return { ok: false, status: 403, error: 'Cross-origin request refused.' };
    const header = request.headers.get('x-csrf-token') ?? '';
    const enc = new TextEncoder();
    if (!timingSafeEqual(enc.encode(header), enc.encode(session.csrf)))
      return { ok: false, status: 403, error: 'Missing or invalid CSRF token.' };
  }
  return { ok: true, session };
}
