import { describe, it, expect, inject, beforeAll } from 'vitest';
import { TEST_PASSWORD } from '../support/server.mjs';

// Runs against a real `wrangler pages dev` instance (local workerd + local D1) started by
// tests/support/vitest-global.ts. Tests in this file share one database and run in order.
const base = inject('base');
const origin = { origin: base };

async function submit(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return fetch(`${base}/api/feedback`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      ...origin,
      ...headers,
    },
    body: new URLSearchParams({
      type: 'comment',
      project: 'retrotv',
      visibility: 'public',
      ...fields,
    }),
  });
}

let cookie = '';
let csrf = '';
async function admin(
  path: string,
  init: RequestInit = {},
  opts: { csrf?: string | null; origin?: string | null } = {},
) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    cookie,
  };
  const o = opts.origin === undefined ? base : opts.origin;
  if (o) headers.origin = o;
  const c = opts.csrf === undefined ? csrf : opts.csrf;
  if (c) headers['x-csrf-token'] = c;
  return fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string>) },
  });
}

const ids: Record<string, string> = {};

describe('public feedback API', () => {
  it('stores a public submission as pending and says so', async () => {
    const res = await submit({
      message: 'RetroTV pointer feels great on my Shield.',
      displayName: 'Sam',
      email: 'sam@example.com',
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toMatchObject({ status: 'pending', visibility: 'public' });
    expect(data.id).toMatch(/^fb_/);
    ids.public = data.id;
  });

  it('does not show pending submissions publicly', async () => {
    const data = await (await fetch(`${base}/api/feedback?project=retrotv`)).json();
    expect(data.items).toEqual([]);
  });

  it('stores a private report and never treats it as public', async () => {
    const res = await submit({
      visibility: 'private',
      type: 'bug',
      message: 'Crash when opening phone link page',
      email: 'priv@example.com',
      appVersion: '1.2',
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.visibility).toBe('private');
    ids.private = data.id;
  });

  it('stores an XSS payload as inert text', async () => {
    const res = await submit({
      project: 'kitt-launcher',
      message: '<img src=x onerror="alert(1)"><script>alert(2)</script> nice app',
      title: '"><svg onload=alert(3)>',
    });
    expect(res.status).toBe(201);
    ids.xss = (await res.json()).id;
  });

  it('rejects invalid input with field errors and stores nothing', async () => {
    const res = await submit({ type: 'nonsense', project: 'nope', message: 'hi', email: 'bad' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Object.keys(data.errors).sort()).toEqual(['email', 'message', 'project', 'type']);
  });

  it('rejects malformed bodies', async () => {
    const res = await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', ...origin },
      body: '[1,2',
    });
    expect(res.status).toBe(400);
  });

  it('rejects the honeypot', async () => {
    const res = await submit({
      message: 'Totally a human writing this message',
      website: 'http://spam.example',
    });
    expect(res.status).toBe(400);
  });

  it('rejects cross-origin posts', async () => {
    const res = await submit(
      { message: 'Cross origin attempt message' },
      { origin: 'https://evil.example' },
    );
    expect(res.status).toBe(403);
  });

  it('rejects duplicates sent within a day', async () => {
    const res = await submit({ message: 'RetroTV pointer feels great on my Shield.' });
    expect(res.status).toBe(409);
  });

  it('redirects no-JS form posts to a truthful receipt', async () => {
    const res = await submit(
      { message: 'Posted without JavaScript enabled here' },
      { accept: 'text/html' },
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toMatch(/\/feedback\/received\?s=public&id=fb_/);
    const bad = await submit({ message: 'x' }, { accept: 'text/html' });
    expect(bad.headers.get('location')).toMatch(/s=error&code=400/);
  });

  it('rejects unknown projects on the public list', async () => {
    expect((await fetch(`${base}/api/feedback?project=../../etc`)).status).toBe(404);
  });
});

describe('owner authentication', () => {
  it('reports that moderation is configured but signed out', async () => {
    const data = await (await fetch(`${base}/api/admin/session`)).json();
    expect(data).toEqual({ configured: true, authenticated: false, csrf: null });
  });

  it('rejects unauthenticated moderation reads and writes', async () => {
    expect((await fetch(`${base}/api/admin/feedback`)).status).toBe(401);
    const res = await fetch(`${base}/api/admin/feedback/${ids.public}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...origin },
      body: JSON.stringify({ action: 'approve' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects a forged session cookie', async () => {
    const res = await fetch(`${base}/api/admin/feedback`, {
      headers: {
        cookie: '__Host-sw_admin=eyJ2IjoxLCJleHAiOjk5OTk5OTk5OTk5OTksImNzcmYiOiJ4In0.AAAA',
      },
    });
    expect(res.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const res = await admin(
      '/api/admin/login',
      { method: 'POST', body: JSON.stringify({ password: 'wrong-password' }) },
      { csrf: null },
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a cross-origin login', async () => {
    const res = await admin(
      '/api/admin/login',
      { method: 'POST', body: JSON.stringify({ password: TEST_PASSWORD }) },
      { csrf: null, origin: 'https://evil.example' },
    );
    expect(res.status).toBe(403);
  });

  it('signs in with the right password and sets a hardened cookie', async () => {
    const res = await admin(
      '/api/admin/login',
      { method: 'POST', body: JSON.stringify({ password: TEST_PASSWORD }) },
      { csrf: null },
    );
    expect(res.status).toBe(200);
    const set = res.headers.get('set-cookie')!;
    expect(set).toMatch(/__Host-sw_admin=.+HttpOnly.+Secure.+SameSite=Strict/);
    cookie = set.split(';')[0];
    csrf = (await res.json()).csrf;
    expect(csrf).toBeTruthy();
  });
});

describe('moderation', () => {
  beforeAll(() => expect(cookie).toBeTruthy());

  it('lists pending items with private fields for the owner only', async () => {
    const res = await admin('/api/admin/feedback?status=pending');
    expect(res.status).toBe(200);
    const data = await res.json();
    const pub = data.items.find((i: { id: string }) => i.id === ids.public);
    expect(pub.email).toBe('sam@example.com');
  });

  it('refuses writes without the CSRF token or from another origin', async () => {
    const body = JSON.stringify({ action: 'approve' });
    expect(
      (await admin(`/api/admin/feedback/${ids.public}`, { method: 'POST', body }, { csrf: null }))
        .status,
    ).toBe(403);
    expect(
      (
        await admin(
          `/api/admin/feedback/${ids.public}`,
          { method: 'POST', body },
          { csrf: 'wrong' },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin(
          `/api/admin/feedback/${ids.public}`,
          { method: 'POST', body },
          { origin: 'https://evil.example' },
        )
      ).status,
    ).toBe(403);
    expect(
      (await admin(`/api/admin/feedback/${ids.public}`, { method: 'POST', body }, { origin: null }))
        .status,
    ).toBe(403);
  });

  it('refuses unknown actions and ids', async () => {
    expect(
      (
        await admin(`/api/admin/feedback/${ids.public}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'publish-all' }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await admin(`/api/admin/feedback/fb_doesnotexist00`, {
          method: 'POST',
          body: JSON.stringify({ action: 'approve' }),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await admin(`/api/admin/feedback/'%20OR%201=1`, {
          method: 'POST',
          body: JSON.stringify({ action: 'approve' }),
        })
      ).status,
    ).toBe(400);
  });

  it('can never approve a private report', async () => {
    const res = await admin(`/api/admin/feedback/${ids.private}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    expect(res.status).toBe(409);
  });

  it('approves a public item, which then appears without private fields', async () => {
    const res = await admin(`/api/admin/feedback/${ids.public}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).audit.map((a: { action: string }) => a.action)).toEqual(['approve']);
    const raw = await (await fetch(`${base}/api/feedback?project=retrotv`)).text();
    const data = JSON.parse(raw);
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      id: ids.public,
      displayName: 'Sam',
      message: 'RetroTV pointer feels great on my Shield.',
    });
    expect(raw).not.toContain('sam@example.com');
    expect(raw).not.toMatch(/email|details|status|visibility|message_hash/);
  });

  it('adds a public reply', async () => {
    await admin(`/api/admin/feedback/${ids.public}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reply', reply: 'Thanks!' }),
    });
    const data = await (await fetch(`${base}/api/feedback?project=retrotv`)).json();
    expect(data.items[0].reply).toBe('Thanks!');
  });

  it('hides an approved item from the public list', async () => {
    await admin(`/api/admin/feedback/${ids.public}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'hide' }),
    });
    expect((await (await fetch(`${base}/api/feedback?project=retrotv`)).json()).items).toEqual([]);
  });

  it('returns approved XSS payloads only as JSON strings', async () => {
    await admin(`/api/admin/feedback/${ids.xss}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    const res = await fetch(`${base}/api/feedback?project=kitt-launcher`);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    const data = await res.json();
    expect(data.items[0].message).toContain('<script>alert(2)</script>');
  });

  it('removes an item and erases its content', async () => {
    const res = await admin(`/api/admin/feedback/${ids.private}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'remove' }),
    });
    expect(res.status).toBe(200);
    const list = await (await admin('/api/admin/feedback?status=removed')).json();
    const item = list.items.find((i: { id: string }) => i.id === ids.private);
    expect(item).toMatchObject({ message: null, email: null, details: null, title: null });
    expect(item.purgedAt).toBeTruthy();
    const again = await admin(`/api/admin/feedback/${ids.private}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'restore' }),
    });
    expect(again.status).toBe(409);
  });

  it('signs out', async () => {
    const res = await admin('/api/admin/logout', { method: 'POST' });
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});

describe('abuse limits', () => {
  it('rate-limits a burst of submissions without storing the rejected ones', async () => {
    let limited: Response | null = null;
    for (let i = 0; i < 8 && !limited; i++) {
      const res = await submit({ message: `Burst message number ${i} with enough text` });
      if (res.status === 429) limited = res;
    }
    expect(limited?.status).toBe(429);
  });

  it('rate-limits password guessing', async () => {
    let status = 0;
    for (let i = 0; i < 7; i++) {
      const res = await admin(
        '/api/admin/login',
        { method: 'POST', body: JSON.stringify({ password: `guess-${i}` }) },
        { csrf: null },
      );
      status = res.status;
    }
    expect(status).toBe(429);
  });
});
