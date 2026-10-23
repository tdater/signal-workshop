import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  sign,
  verifySignature,
  timingSafeEqual,
} from '../../functions/_lib/crypto';
import {
  requireAdmin,
  createSessionCookie,
  adminConfigured,
  COOKIE,
} from '../../functions/_lib/auth';
import type { Env } from '../../functions/_lib/http';

const env = { ADMIN_PASSWORD_HASH: 'x', SESSION_SECRET: 's'.repeat(40) } as Env;
const req = (init: RequestInit & { cookie?: string } = {}) =>
  new Request('https://site.test/api/admin/feedback', {
    ...init,
    headers: {
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...(init.headers as Record<string, string>),
    },
  });

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const h = await hashPassword('correct horse battery');
    expect(h).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(await verifyPassword('correct horse battery', h)).toBe(true);
    expect(await verifyPassword('correct horse batterz', h)).toBe(false);
  });
  it('rejects malformed hashes', async () => {
    expect(await verifyPassword('x', 'plaintext')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2-sha256$5$aa$bb')).toBe(false);
  });
});

describe('signatures', () => {
  it('detects tampering', async () => {
    const sig = await sign('payload', 'secret');
    expect(await verifySignature('payload', sig, 'secret')).toBe(true);
    expect(await verifySignature('payloaD', sig, 'secret')).toBe(false);
    expect(await verifySignature('payload', sig, 'other')).toBe(false);
  });
  it('timingSafeEqual compares lengths and bytes', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
  });
});

describe('requireAdmin', () => {
  it('fails closed when secrets are missing', async () => {
    expect(adminConfigured({} as Env)).toBe(false);
    expect(adminConfigured({ ADMIN_PASSWORD_HASH: 'x', SESSION_SECRET: 'short' } as Env)).toBe(
      false,
    );
    const r = await requireAdmin(req(), {} as Env);
    expect(r).toMatchObject({ ok: false, status: 503 });
  });

  it('rejects requests without a session', async () => {
    expect(await requireAdmin(req(), env)).toMatchObject({ ok: false, status: 401 });
  });

  it('rejects forged and expired cookies', async () => {
    expect(await requireAdmin(req({ cookie: `${COOKIE}=eyJ2IjoxfQ.forged` }), env)).toMatchObject({
      status: 401,
    });
    const other = await createSessionCookie({ ...env, SESSION_SECRET: 'o'.repeat(40) });
    const value = other.cookie.split(';')[0];
    expect(await requireAdmin(req({ cookie: value }), env)).toMatchObject({ status: 401 });
  });

  it('allows reads with a valid session', async () => {
    const { cookie } = await createSessionCookie(env);
    expect(await requireAdmin(req({ cookie: cookie.split(';')[0] }), env)).toMatchObject({
      ok: true,
    });
  });

  it('requires same origin and the CSRF token for writes', async () => {
    const { cookie, csrf } = await createSessionCookie(env);
    const c = cookie.split(';')[0];
    const post = (headers: Record<string, string>) => req({ method: 'POST', cookie: c, headers });
    expect(await requireAdmin(post({ origin: 'https://site.test' }), env)).toMatchObject({
      status: 403,
    });
    expect(
      await requireAdmin(post({ origin: 'https://evil.test', 'x-csrf-token': csrf }), env),
    ).toMatchObject({ status: 403 });
    expect(await requireAdmin(post({ 'x-csrf-token': csrf }), env)).toMatchObject({ status: 403 });
    expect(
      await requireAdmin(post({ origin: 'https://site.test', 'x-csrf-token': csrf }), env),
    ).toMatchObject({ ok: true });
  });

  it('sets a hardened cookie', async () => {
    const { cookie } = await createSessionCookie(env);
    expect(cookie).toMatch(/^__Host-sw_admin=/);
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/'])
      expect(cookie).toContain(flag);
  });
});
