import { ShopError, erpReviewPhoto } from "@/lib/shop-api";

const MAX = 2 * 1024 * 1024;

/** POST /api/review-photo?token=<review code>, body = the image (WebP or JPEG, under 2 MB, already
 * resized in the browser). Passed on to the ERP with the shared secret; answers { photo }. */
export async function POST(request: Request) {
  const token = (new URL(request.url).searchParams.get("token") ?? "").slice(0, 80);
  const type = request.headers.get("content-type") ?? "";
  if (!token || !/^image\/(webp|jpeg)$/.test(type)) return Response.json({ error: "Send a WebP or JPEG photo" }, { status: 415 });
  try {
    const body = await request.arrayBuffer();
    if (!body.byteLength || body.byteLength > MAX) throw new ShopError("The photo is too large. Try another one.");
    return Response.json(await erpReviewPhoto(token, type, body));
  } catch (e) {
    const err = e instanceof ShopError ? e : new ShopError("The photo couldn't be added. Try another one.", 500);
    return Response.json({ error: err.message }, { status: err.status });
  }
}
