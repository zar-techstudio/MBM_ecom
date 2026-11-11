import type { ProductCard } from "./catalogue";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ");

/** Simple product search over title, category and store name: every word must match somewhere.
 * Title matches rank first. */
export function searchProducts(all: ProductCard[], q: string) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return all
    .map((p) => {
      const title = norm(p.title);
      const hay = `${title} ${norm(p.category.name)} ${p.category.section === "mahib" ? "mahib" : "maqdooms"}`;
      if (!words.every((w) => hay.includes(w))) return null;
      const score = words.reduce((n, w) => n + (title.includes(w) ? 2 : 1), 0) + (title.startsWith(words[0]!) ? 2 : 0);
      return { p, score };
    })
    .filter((x): x is { p: ProductCard; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
