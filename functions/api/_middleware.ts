import type { Env } from '../_lib/http';

// Scoped to /api/* on purpose: a root middleware also wraps static pages, which would mark the
// whole site noindex and no-store. Static pages get their headers from _headers.
export const onRequest: PagesFunction<Env> = async ({ next, request }) => {
  let res: Response;
  try {
    res = await next();
  } catch {
    // Never echo internals or request bodies back to the client, and don't log visitor content.
    console.error(`Unhandled error on ${new URL(request.url).pathname}`);
    res = new Response(
      JSON.stringify({ error: 'Something went wrong on the server. Nothing was changed.' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }
  const out = new Response(res.body, res);
  out.headers.set('x-content-type-options', 'nosniff');
  out.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  out.headers.set('x-robots-tag', 'noindex');
  out.headers.set('cross-origin-resource-policy', 'same-origin');
  if (!out.headers.has('cache-control')) out.headers.set('cache-control', 'no-store');
  return out;
};
