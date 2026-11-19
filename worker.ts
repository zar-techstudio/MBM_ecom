// Cloudflare Worker entry (wrangler.jsonc "main"): sends plain-http visits to https, serves pages
// from Cloudflare's edge copy when it has one, then hands every other request to the website built
// by OpenNext (`.open-next/worker.js`).
// Not part of the app's type check (tsconfig "exclude"): wrangler bundles it, and
// `.open-next/worker.js` only exists after a build.
import { default as site } from "./.open-next/worker.js";

/** Plain http on the live site: 301 for GET and HEAD, 308 for anything else (keeps a POST a POST).
 * Local addresses (wrangler dev, preview) are left alone. */
function toHttps(request: Request): Response | null {
  const url = new URL(request.url);
  const visitor = request.headers.get("cf-visitor"); // {"scheme":"http"} from Cloudflare
  const plain = url.protocol === "http:" || (visitor !== null && visitor.includes('"http"'));
  if (!plain || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) return null;
  url.protocol = "https:";
  const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
  return new Response(null, { status, headers: { Location: url.toString() } });
}

/* ---------- Edge copy of pages ----------
 * Pages are the same for every visitor (sign-in, bag and wishlist live in the browser), so a copy
 * is kept in Cloudflare's cache of each city. A copy younger than FRESH_S is served as is; an older
 * one (up to STALE_S) is served at once while a new one is built in the background, so visitors
 * never wait for the page to be built. Same one-minute freshness as the catalogue's memory cache.
 * The key includes the deployed version, so a deploy never serves pages that point to old files. */
const FRESH_S = 60;
const STALE_S = 24 * 3600;
const SKIP = /^\/(api|_next|account|bag|checkout|orders|order|invoice|review|wishlist)(\/|$)/;

type Ctx = { waitUntil(p: Promise<unknown>): void };
type Env = { CF_VERSION_METADATA?: { id?: string } };

function cacheable(request: Request, url: URL) {
  return (
    request.method === "GET" &&
    !url.search && // searches and links with options are built each time
    !SKIP.test(url.pathname) &&
    !request.headers.has("rsc") && // in-app navigation data, not a page
    // signed-in shoppers ("mbs" cookie) always get a freshly built page, to be safe
    !/(^|;\s*)mbs=/.test(request.headers.get("cookie") ?? "") &&
    (request.headers.get("accept") ?? "").includes("text/html")
  );
}

/** Builds the page and stores a copy (only plain 200 pages without cookies). */
async function buildAndStore(request: Request, env: Env, ctx: Ctx, key: Request): Promise<Response> {
  const res: Response = await site.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie") || !(res.headers.get("content-type") ?? "").includes("text/html")) return res;
  const copy = new Response(res.clone().body, res);
  copy.headers.set("cache-control", `public, max-age=${STALE_S}`);
  // Next lists its in-app navigation headers in Vary; Cloudflare's cache then often skips or misses
  // the copy. Those requests never use the copy (see cacheable), so the stored copy drops it.
  copy.headers.delete("vary");
  copy.headers.set("x-mbm-built", String(Date.now()));
  ctx.waitUntil(caches.default.put(key, copy));
  return res;
}

async function page(request: Request, env: Env, ctx: Ctx): Promise<Response> {
  const url = new URL(request.url);
  if (!cacheable(request, url)) return site.fetch(request, env, ctx);
  const version = env.CF_VERSION_METADATA?.id ?? "dev";
  const key = new Request(`${url.origin}${url.pathname}?__v=${version}`, { method: "GET" });
  const hit = await caches.default.match(key);
  if (!hit) {
    const res = await buildAndStore(request, env, ctx, key);
    return withState(res, "MISS");
  }
  const age = (Date.now() - Number(hit.headers.get("x-mbm-built") ?? 0)) / 1000;
  if (age > FRESH_S) ctx.waitUntil(buildAndStore(new Request(request), env, ctx, key).then(() => undefined, () => undefined));
  return withState(hit, age > FRESH_S ? "STALE" : "HIT");
}

/** The visitor's browser never keeps the page itself; only Cloudflare's copy is reused. */
function withState(res: Response, state: string): Response {
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "private, no-cache, no-store, max-age=0, must-revalidate");
  out.headers.delete("x-mbm-built");
  out.headers.set("x-mbm-edge", state);
  return out;
}

/** www.maqdoomsbigmall.com goes to maqdoomsbigmall.com (one address for shoppers and search
 * engines; the canonical links already name it). 301 for GET and HEAD, 308 for anything else. */
function toApex(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== "www.maqdoomsbigmall.com") return null;
  url.hostname = "maqdoomsbigmall.com";
  url.protocol = "https:";
  const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
  return new Response(null, { status, headers: { Location: url.toString() } });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: Ctx) {
    return toApex(request) ?? toHttps(request) ?? page(request, env, ctx);
  },
};
export default worker;

// The website's Durable Objects (OpenNext caching) must be exported from the entry too.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
