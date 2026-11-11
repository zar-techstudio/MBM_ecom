import { getProductLive } from "@/lib/catalogue";

/** Live sizes, prices and stock for the bag: GET /api/products?slugs=a,b (at most 30). */
export async function GET(request: Request) {
  const slugs = [...new Set((new URL(request.url).searchParams.get("slugs") ?? "").split(",").filter(Boolean))].slice(0, 30);
  const found = await Promise.all(slugs.map((s) => getProductLive(s).catch(() => null)));
  return Response.json(
    found.map((p, i) =>
      p
        ? { slug: p.slug, found: true, kind: p.kind, sold_out: p.sold_out, sizes: p.sizes }
        : { slug: slugs[i], found: false, kind: "empty", sold_out: true, sizes: [] },
    ),
    { headers: { "Cache-Control": "no-store" } },
  );
}
