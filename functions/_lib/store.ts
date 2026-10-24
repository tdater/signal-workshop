import type { D1Database } from '@cloudflare/workers-types';
import { LIMITS, RATE, RETENTION_DAYS } from './rules';
import type { FeedbackInput } from './validate';
import { nowIso } from './http';
import { randomToken, sha256Hex } from './crypto';

// All SQL is parameterised. Public reads only ever select approved, public rows and never the
// email, details or moderation columns.

export async function hit(
  db: D1Database,
  kind: string,
  key: string,
  windowMs: number,
  max: number,
) {
  const now = Date.now();
  await db
    .prepare('DELETE FROM rate_events WHERE at < ?')
    .bind(now - 86_400_000)
    .run();
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM rate_events WHERE kind = ? AND key = ? AND at > ?')
    .bind(kind, key, now - windowMs)
    .first<{ n: number }>();
  if ((row?.n ?? 0) >= max) return false;
  await db
    .prepare('INSERT INTO rate_events (key, kind, at) VALUES (?, ?, ?)')
    .bind(key, kind, now)
    .run();
  return true;
}

export async function submitAllowed(db: D1Database, key: string) {
  const now = Date.now();
  const day = await db
    .prepare("SELECT COUNT(*) AS n FROM rate_events WHERE kind = 'submit' AND key = ? AND at > ?")
    .bind(key, now - 86_400_000)
    .first<{ n: number }>();
  if ((day?.n ?? 0) >= RATE.submitPerDay) return false;
  return hit(db, 'submit', key, 600_000, RATE.submitPer10Min);
}

export function messageHash(input: FeedbackInput) {
  return sha256Hex(`${input.project}\n${input.message.toLowerCase().replace(/\s+/g, ' ')}`);
}

export async function isDuplicate(db: D1Database, hash: string) {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const row = await db
    .prepare('SELECT id FROM feedback WHERE message_hash = ? AND created_at > ? LIMIT 1')
    .bind(hash, since)
    .first();
  return Boolean(row);
}

export async function insertFeedback(db: D1Database, input: FeedbackInput, hash: string) {
  const id = `fb_${randomToken(12)}`;
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO feedback (id, created_at, updated_at, type, project, visibility, status, title, message,
        display_name, email, details, message_hash)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      now,
      now,
      input.type,
      input.project,
      input.visibility,
      input.title,
      input.message,
      input.displayName,
      input.email,
      input.details ? JSON.stringify(input.details) : null,
      hash,
    )
    .run();
  return id;
}

export async function listPublic(db: D1Database, project: string | null, page: number) {
  const where = project
    ? "status = 'approved' AND visibility = 'public' AND project = ?"
    : "status = 'approved' AND visibility = 'public'";
  const args = project ? [project] : [];
  const total =
    (
      await db
        .prepare(`SELECT COUNT(*) AS n FROM feedback WHERE ${where}`)
        .bind(...args)
        .first<{ n: number }>()
    )?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMITS.pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const { results } = await db
    .prepare(
      `SELECT id, type, project, title, message, display_name AS displayName, created_at AS createdAt, reply
       FROM feedback WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .bind(...args, LIMITS.pageSize, (p - 1) * LIMITS.pageSize)
    .all();
  return { items: results, page: p, pages, total };
}

export const ADMIN_STATUSES = [
  'pending',
  'approved',
  'hidden',
  'rejected',
  'spam',
  'removed',
] as const;

export async function listAdmin(
  db: D1Database,
  status: string,
  visibility: string | null,
  page: number,
) {
  const conds = ['status = ?'];
  const args: unknown[] = [status];
  if (visibility) {
    conds.push('visibility = ?');
    args.push(visibility);
  }
  const where = conds.join(' AND ');
  const total =
    (
      await db
        .prepare(`SELECT COUNT(*) AS n FROM feedback WHERE ${where}`)
        .bind(...args)
        .first<{ n: number }>()
    )?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  const p = Math.min(Math.max(1, page), pages);
  const { results } = await db
    .prepare(
      `SELECT id, created_at AS createdAt, updated_at AS updatedAt, type, project, visibility, status, title, message,
        display_name AS displayName, email, details, reply, reply_at AS replyAt, purged_at AS purgedAt
       FROM feedback WHERE ${where} ORDER BY created_at DESC LIMIT 20 OFFSET ?`,
    )
    .bind(...args, (p - 1) * 20)
    .all();
  const counts = await db
    .prepare('SELECT status, visibility, COUNT(*) AS n FROM feedback GROUP BY status, visibility')
    .all<{ status: string; visibility: string; n: number }>();
  return { items: results, page: p, pages, total, counts: counts.results };
}

type Row = { id: string; status: string; visibility: string };

const PURGE_SET = `title = NULL, message = NULL, display_name = NULL, email = NULL, details = NULL,
  reply = NULL, message_hash = NULL, purged_at = ?`;

export const ACTIONS = ['approve', 'reject', 'hide', 'spam', 'remove', 'restore', 'reply'] as const;
export type Action = (typeof ACTIONS)[number];

export async function moderate(db: D1Database, id: string, action: Action, reply?: string) {
  const row = await db
    .prepare('SELECT id, status, visibility FROM feedback WHERE id = ?')
    .bind(id)
    .first<Row>();
  if (!row) return { ok: false as const, status: 404, error: 'No such feedback item.' };
  if (row.status === 'removed')
    return {
      ok: false as const,
      status: 409,
      error: 'This item was removed and its content erased.',
    };
  const now = nowIso();
  let stmt;
  switch (action) {
    case 'approve':
      if (row.visibility !== 'public')
        return {
          ok: false as const,
          status: 409,
          error: 'Private reports can never be published.',
        };
      stmt = db
        .prepare("UPDATE feedback SET status = 'approved', updated_at = ? WHERE id = ?")
        .bind(now, id);
      break;
    case 'reject':
    case 'spam':
      stmt = db
        .prepare(`UPDATE feedback SET status = ?, updated_at = ? WHERE id = ?`)
        .bind(action === 'reject' ? 'rejected' : 'spam', now, id);
      break;
    case 'hide':
      stmt = db
        .prepare("UPDATE feedback SET status = 'hidden', updated_at = ? WHERE id = ?")
        .bind(now, id);
      break;
    case 'restore':
      stmt = db
        .prepare("UPDATE feedback SET status = 'pending', updated_at = ? WHERE id = ?")
        .bind(now, id);
      break;
    case 'remove':
      stmt = db
        .prepare(
          `UPDATE feedback SET status = 'removed', ${PURGE_SET}, updated_at = ? WHERE id = ?`,
        )
        .bind(now, now, id);
      break;
    case 'reply': {
      const text = (reply ?? '').trim();
      if (text.length > LIMITS.reply)
        return {
          ok: false as const,
          status: 400,
          error: `Keep replies under ${LIMITS.reply} characters.`,
        };
      stmt = db
        .prepare('UPDATE feedback SET reply = ?, reply_at = ?, updated_at = ? WHERE id = ?')
        .bind(text || null, text ? now : null, now, id);
      break;
    }
  }
  await db.batch([
    stmt,
    db
      .prepare('INSERT INTO moderation_log (feedback_id, action, at) VALUES (?, ?, ?)')
      .bind(id, action, now),
  ]);
  return { ok: true as const };
}

// Retention runs opportunistically on submissions and moderation requests, so it needs no
// scheduler. It erases visitor content; the tombstone row and the audit trail remain.
export async function purgeExpired(db: D1Database) {
  const now = nowIso();
  const rejectedCutoff = new Date(Date.now() - RETENTION_DAYS.rejected * 86_400_000).toISOString();
  const emailCutoff = new Date(Date.now() - RETENTION_DAYS.email * 86_400_000).toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE feedback SET ${PURGE_SET} WHERE status IN ('rejected', 'spam') AND purged_at IS NULL AND updated_at < ?`,
      )
      .bind(now, rejectedCutoff),
    db
      .prepare('UPDATE feedback SET email = NULL WHERE email IS NOT NULL AND created_at < ?')
      .bind(emailCutoff),
  ]);
}

export async function auditFor(db: D1Database, id: string) {
  const { results } = await db
    .prepare('SELECT action, at FROM moderation_log WHERE feedback_id = ? ORDER BY id')
    .bind(id)
    .all();
  return results;
}
