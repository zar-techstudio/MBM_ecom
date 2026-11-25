import Link from "next/link";
import type { PointsRules } from "@/lib/catalogue";

/** Points earned on an amount: 1 point per earn_per_paise (the ERP's rule), whole points only. */
export function pointsFor(amountPaise: number | null | undefined, rules: PointsRules | null | undefined) {
  if (!rules?.enabled || !amountPaise || !rules.earn_per_paise) return 0;
  return Math.floor(amountPaise / rules.earn_per_paise);
}

/** "Earn 32 points on this" under a price (product page, bag). Nothing until the ERP sends the
 * rules, or when the amount earns no points. */
export function EarnPoints({ amountPaise, rules, what = "on this" }: { amountPaise: number | null | undefined; rules: PointsRules | null | undefined; what?: string }) {
  const pts = pointsFor(amountPaise, rules);
  if (!pts || !rules) return null;
  return (
    <p className="earn-pts">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 14.4 9l5.6.5-4.3 3.7 1.3 5.6L12 15.9l-5 2.9 1.3-5.6L4 9.5 9.6 9z" />
      </svg>
      <span>
        Earn <strong>{pts} points</strong> {what} (worth &#8377;{Math.round((pts * rules.point_value_paise) / 100)} on your next purchase).{" "}
        <Link href="/policies/points">How points work</Link>
      </span>
    </p>
  );
}
