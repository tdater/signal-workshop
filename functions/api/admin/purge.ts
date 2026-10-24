import { json, type Env } from '../../_lib/http';
import { requireAdmin } from '../../_lib/auth';
import { purgeExpired } from '../../_lib/store';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  await purgeExpired(env.DB);
  return json({ ok: true });
};
