// Starts a throwaway `wrangler pages dev` against dist/ with its own local D1 state and test-only
// secrets passed as bindings. Nothing here touches .dev.vars or any real database.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPassword } from '../../functions/_lib/crypto.ts';

export const TEST_PASSWORD = 'test-only-password-not-real';

export async function startServer(port) {
  const persist = mkdtempSync(join(tmpdir(), 'sw-d1-'));
  const root = new URL('../../', import.meta.url).pathname;
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'migrations',
      'apply',
      'signal-workshop',
      '--local',
      '--persist-to',
      persist,
    ],
    {
      cwd: root,
      stdio: 'ignore',
      env: { ...process.env, CI: '1' },
    },
  );
  const hash = await hashPassword(TEST_PASSWORD);
  const args = [
    'wrangler',
    'pages',
    'dev',
    'dist',
    '--port',
    String(port),
    '--persist-to',
    persist,
    '--binding',
    `ADMIN_PASSWORD_HASH=${hash}`,
    '--binding',
    'SESSION_SECRET=test-session-secret-0123456789abcdefghijklmnop',
    '--binding',
    'IP_HASH_SALT=test-salt',
    '--show-interactive-dev-session=false',
  ];
  const child = spawn('npx', args, {
    cwd: root,
    detached: true,
    env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const killAll = () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  };
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  const base = `http://localhost:${port}`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${base}/api/admin/session`);
      if (r.ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (Date.now() >= deadline) {
    killAll();
    throw new Error(`wrangler did not start:\n${log}`);
  }
  return {
    base,
    stop: () => {
      killAll();
      rmSync(persist, { recursive: true, force: true });
    },
  };
}
