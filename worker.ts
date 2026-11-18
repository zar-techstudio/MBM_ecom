// Cloudflare Worker entry (wrangler.jsonc "main"): sends plain-http visits to https, then hands
// every other request to the website built by OpenNext (`.open-next/worker.js`).
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

const worker = {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return toHttps(request) ?? site.fetch(request, env, ctx);
  },
};
export default worker;

// The website's Durable Objects (OpenNext caching) must be exported from the entry too.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
