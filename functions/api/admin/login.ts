import { json, originOk, readBody, clientIp, type Env } from '../../_lib/http';
import { adminConfigured, createSessionCookie } from '../../_lib/auth';
import { verifyPassword, sha256Hex } from '../../_lib/crypto';
import { hit } from '../../_lib/store';
import { RATE } from '../../_lib/rules';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!adminConfigured(env))
    return json({ error: 'Moderation is not configured on this deployment.' }, 503);
  if (!originOk(request, env, true)) return json({ error: 'Cross-origin request refused.' }, 403);
  const key = await sha256Hex(`${env.IP_HASH_SALT ?? 'dev-salt'}:login:${clientIp(request)}`);
  if (!(await hit(env.DB, 'login', key, 900_000, RATE.loginPer15Min)))
    return json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }, 429);
  const body = await readBody(request);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (
    !password ||
    password.length > 512 ||
    !(await verifyPassword(password, env.ADMIN_PASSWORD_HASH!))
  )
    return json({ error: 'That password is not correct.' }, 401);
  const { cookie, csrf } = await createSessionCookie(env);
  return json({ authenticated: true, csrf }, 200, { 'set-cookie': cookie });
};
