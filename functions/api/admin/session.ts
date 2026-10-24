import { json, type Env } from '../../_lib/http';
import { adminConfigured, getSession } from '../../_lib/auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env);
  return json({
    configured: adminConfigured(env),
    authenticated: Boolean(session),
    csrf: session?.csrf ?? null,
  });
};
