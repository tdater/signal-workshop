import { json, type Env } from '../../../_lib/http';
import { requireAdmin } from '../../../_lib/auth';
import { listAdmin, purgeExpired, ADMIN_STATUSES } from '../../../_lib/store';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'pending';
  const visibility = url.searchParams.get('visibility');
  if (!(ADMIN_STATUSES as readonly string[]).includes(status))
    return json({ error: 'Unknown status.' }, 400);
  if (visibility && visibility !== 'public' && visibility !== 'private')
    return json({ error: 'Unknown visibility.' }, 400);
  await purgeExpired(env.DB);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  return json(await listAdmin(env.DB, status, visibility, page));
};
