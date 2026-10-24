import { json, readBody, type Env } from '../../../_lib/http';
import { requireAdmin } from '../../../_lib/auth';
import { moderate, auditFor, ACTIONS, type Action } from '../../../_lib/store';

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const id = String(params.id);
  if (!/^fb_[A-Za-z0-9_-]{8,40}$/.test(id)) return json({ error: 'Invalid id.' }, 400);
  const body = await readBody(request);
  const action = body?.action;
  if (typeof action !== 'string' || !(ACTIONS as readonly string[]).includes(action))
    return json({ error: 'Unknown action.' }, 400);
  const result = await moderate(
    env.DB,
    id,
    action as Action,
    typeof body?.reply === 'string' ? body.reply : undefined,
  );
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, audit: await auditFor(env.DB, id) });
};

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  return json({ audit: await auditFor(env.DB, String(params.id)) });
};
