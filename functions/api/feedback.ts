import { json, wantsJson, originOk, readBody, clientIp, type Env } from '../_lib/http';
import { validateFeedback } from '../_lib/validate';
import { sha256Hex } from '../_lib/crypto';
import {
  submitAllowed,
  isDuplicate,
  insertFeedback,
  listPublic,
  messageHash,
  purgeExpired,
} from '../_lib/store';
import { PROJECT_IDS } from '../_lib/project-ids';

// Visitors without JavaScript post the form directly and get redirected to a receipt page.
function respond(request: Request, status: number, data: Record<string, unknown>) {
  if (wantsJson(request)) return json(data, status);
  const url = new URL('/feedback/received', request.url);
  if (status < 300) {
    url.searchParams.set('s', String(data.visibility));
    url.searchParams.set('id', String(data.id));
  } else {
    url.searchParams.set('s', 'error');
    url.searchParams.set('code', String(status));
  }
  return Response.redirect(url.toString(), 303);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!originOk(request, env, false))
    return respond(request, 403, { error: 'Submissions are only accepted from this site.' });
  const body = await readBody(request);
  if (!body)
    return respond(request, 400, { error: "The submission couldn't be read. Nothing was stored." });

  // Honeypot: a field people can't see. Anything in it means an automated submission.
  if (typeof body.website === 'string' && body.website.trim() !== '')
    return respond(request, 400, {
      error: 'This submission looks automated, so it was not stored.',
    });

  const result = validateFeedback(body, PROJECT_IDS);
  if (!result.ok)
    return respond(request, 400, {
      error: 'Some fields need attention. Nothing was stored.',
      errors: result.errors,
    });

  const key = await sha256Hex(`${env.IP_HASH_SALT ?? 'dev-salt'}:${clientIp(request)}`);
  if (!(await submitAllowed(env.DB, key)))
    return respond(request, 429, {
      error:
        "You've sent a lot of feedback in a short time. Please wait a while and try again. Nothing was stored.",
    });

  const hash = await messageHash(result.value);
  if (await isDuplicate(env.DB, hash))
    return respond(request, 409, {
      error:
        'This looks like a duplicate of something sent in the last day, so it was not stored again.',
    });

  const id = await insertFeedback(env.DB, result.value, hash);
  await purgeExpired(env.DB);
  return respond(request, 201, {
    id,
    status: 'pending',
    visibility: result.value.visibility,
    message:
      result.value.visibility === 'private'
        ? 'Stored as a private report. It will never be published.'
        : 'Stored and pending review. It is not public yet.',
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const project = url.searchParams.get('project');
  if (project && project !== 'site' && !PROJECT_IDS.includes(project))
    return json({ error: 'Unknown project.' }, 404);
  const page = Math.max(
    1,
    Math.min(1000, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1),
  );
  const data = await listPublic(env.DB, project, page);
  // no-cache: an approval or removal must show up on the next load, not a minute later.
  return json(data, 200, { 'cache-control': 'no-cache' });
};
