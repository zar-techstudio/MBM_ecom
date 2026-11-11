import { getProducts } from "@/lib/catalogue";
import { searchProducts } from "@/lib/search";

/** Search suggestions: GET /api/search?q=sherwani → up to 8 product cards from both stores. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const all = await getProducts(); // both stores, kept in memory for a minute
  return Response.json(searchProducts(all, q).slice(0, 8));
}
