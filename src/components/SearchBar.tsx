"use client";

import { openSearch } from "@/lib/lens-client";

/** A search bar shown at the top of listing pages (phones especially). Tapping it opens the
 * header's search; the camera searches by photo. */
export function SearchBar({ placeholder = "Search sherwanis, safas, mojris…" }: { placeholder?: string }) {
  return (
    <div className="sbar">
      <button type="button" className="sbar-field" onClick={() => openSearch()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <span>{placeholder}</span>
      </button>
      <label className="sbar-cam" aria-label="Search with a photo" title="Search with a photo">
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && openSearch(e.target.files[0])} />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </label>
    </div>
  );
}
