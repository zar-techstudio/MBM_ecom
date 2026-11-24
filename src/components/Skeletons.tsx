/* Grey outlines of a page, shown while it is being built (loading.tsx), so the wait feels shorter
 * and the page doesn't jump when it arrives. */

export function ProductSkeleton() {
  return (
    <main className="sf-product" aria-busy="true" aria-label="Loading">
      <div className="container sk-product">
        <div className="sk sk-photo" />
        <div className="sk-info">
          <div className="sk sk-line w40" />
          <div className="sk sk-line sk-title w80" />
          <div className="sk sk-line w30" />
          <div className="sk-sizes">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="sk sk-chip" />
            ))}
          </div>
          <div className="sk sk-btn" />
          <div className="sk sk-line w90" />
          <div className="sk sk-line w70" />
        </div>
      </div>
    </main>
  );
}

export function ListingSkeleton() {
  return (
    <main className="sf-listing" aria-busy="true" aria-label="Loading">
      <div className="container sk-listing">
        <div className="sk sk-line w30 sk-center" />
        <div className="sk sk-line sk-title w50 sk-center" />
        <div className="sk-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="sk-card">
              <div className="sk sk-card-photo" />
              <div className="sk sk-line w80" />
              <div className="sk sk-line w40" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
