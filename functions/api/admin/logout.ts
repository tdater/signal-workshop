import { json, type Env } from '../../_lib/http';
import { requireAdmin, clearCookie } from '../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status, { 'set-cookie': clearCookie });
  return json({ authenticated: false }, 200, { 'set-cookie': clearCookie });
};
