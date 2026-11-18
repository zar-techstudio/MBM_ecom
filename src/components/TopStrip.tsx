import Link from "next/link";

/* What the strip says, in order; the line repeats so it scrolls without a gap. Only true statements. */
const ITEMS: { text: string; href?: string; strong?: string }[] = [
  { text: "Premium Ethnic Wear" },
  { text: "Since 1895 · Hyderabad" },
  { strong: "MAHIB", text: "The Exclusive Edit", href: "/mahib" },
  { text: "Delivered across India & abroad" },
  { text: "Style. Tradition. You." },
];

function Line({ hidden }: { hidden?: boolean }) {
  return (
    <span className="topstrip-line" aria-hidden={hidden || undefined}>
      {ITEMS.map((it, i) => (
        <span key={i} className="topstrip-item">
          {it.href ? (
            <Link href={it.href} tabIndex={hidden ? -1 : undefined}>
              <b>{it.strong}</b> — {it.text}
            </Link>
          ) : (
            it.text
          )}
          <span className="topstrip-gem" aria-hidden="true">
            ◆
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * The thin dark strip above the header on every page, always shown and pinned with the header.
 * Its line of text scrolls slowly from right to left (pauses on hover; still for shoppers who
 * prefer less motion). The line is printed twice so the loop never shows a gap.
 */
export function TopStrip() {
  return (
    <div className="topstrip" role="region" aria-label="Announcement">
      <div className="topstrip-track">
        <Line />
        <Line hidden />
      </div>
    </div>
  );
}
