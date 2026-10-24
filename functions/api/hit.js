/**
 * POST /api/hit — record one page view for a browser that carries a zt489_vid cookie.
 *
 * The identifier is a random UUID the page stores in a `domain=.zt489.com` cookie, so the same
 * browser reports the same id on clock / spelling / maths / games. Nothing here derives identity
 * from IP, User-Agent or anything else: the id is supplied by the client and is only as sticky as
 * that browser's cookie jar.
 *
 * One Analytics Engine data point per accepted hit:
 *   index1  = client id      (group by this to count returns)
 *   blob1   = site hostname  (which of the four sites)
 *   blob2   = path
 *   blob3   = country (from request.cf, not from the payload)
 *   double1 = 1              (sum for a total hit count)
 *
 * A missing HITS binding is not an error: the endpoint still answers 204 so a half-configured
 * deploy never shows a console error on a child's page.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('expected JSON body', { status: 400, headers: CORS });
  }

  const id = String((body && body.v) || '');
  if (!UUID.test(id)) {
    return new Response('expected a UUID in "v"', { status: 400, headers: CORS });
  }

  const host = String((body && body.h) || '').slice(0, 60) || new URL(request.url).hostname;
  const path = String((body && body.p) || '/').slice(0, 120);
  const country = (request.cf && request.cf.country) || '';

  const bound = env.HITS ? 'yes' : 'no';
  if (env.HITS) {
    env.HITS.writeDataPoint({ indexes: [id], blobs: [host, path, country], doubles: [1] });
  }

  // x-zt489-bound is a diagnostic: a 204 alone cannot tell a writer apart from a no-op when the
  // binding is absent, and that distinction is exactly what is worth knowing on a fresh deploy.
  return new Response(null, { status: 204, headers: { ...CORS, 'x-zt489-bound': bound } });
}
