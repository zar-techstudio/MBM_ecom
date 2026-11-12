/** Read-only star rating (0–5, halves shown in a lighter gold). */
export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} out of 5`} style={{ ["--star" as string]: `${size}px` }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" aria-hidden="true" className={value >= n - 0.25 ? "on" : value >= n - 0.75 ? "half" : undefined}>
          <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" />
        </svg>
      ))}
    </span>
  );
}
