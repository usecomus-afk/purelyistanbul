"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface CategoryShelfProps {
  id: string;
  title: string;
  icon?: string;
  listings: MarketplaceListing[];
  favoriteIds: Set<string>;
  onToggleFavorite: (listing: MarketplaceListing) => void;
  onTitleClick?: () => void;
}

export function CategoryShelf({ id, title, listings, favoriteIds, onToggleFavorite, onTitleClick }: CategoryShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // İlk render'da kontrol et
    updateArrows();
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateArrows);
    };
  }, [updateArrows, listings]);

  const scrollBy = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div > div")?.clientWidth ?? 260;
    const visibleCards = Math.floor(el.clientWidth / cardWidth);
    el.scrollBy({ left: dir === "right" ? cardWidth * visibleCards : -(cardWidth * visibleCards), behavior: "smooth" });
  }, []);

  if (listings.length === 0) return null;

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <section id={id} style={{ scrollMarginTop: 180 }} className="py-7 border-b border-sand-border/40 last:border-b-0">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4 px-5 md:px-8 max-w-6xl mx-auto">
        <div>
          <div className="flex items-center gap-2.5">
            {onTitleClick ? (
              <button
                onClick={onTitleClick}
                className="text-lg sm:text-xl font-semibold tracking-tight text-ink hover:underline text-left"
              >
                {title} →
              </button>
            ) : (
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">{title}</h2>
            )}
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
              {listings.length} İlan
            </span>
          </div>
          {onTitleClick && (
            <button onClick={onTitleClick} className="text-xs text-terracotta font-semibold hover:underline mt-0.5">
              Tümünü gör
            </button>
          )}
        </div>

        {/* Ok butonları — sadece overflow varsa göster */}
        {hasOverflow && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-ink/20 bg-white flex items-center justify-center shadow-sm hover:shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Önceki"
            >
              <ChevronLeft className="w-4 h-4 text-ink" />
            </button>
            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-ink/20 bg-white flex items-center justify-center shadow-sm hover:shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Sonraki"
            >
              <ChevronRight className="w-4 h-4 text-ink" />
            </button>
          </div>
        )}
      </div>

      {/* Kayan raf */}
      <div className="w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="shrink-0 w-5 md:w-8 xl:w-[calc((100vw-1152px)/2+2rem)]" />
          {listings.map((listing) => (
            <div key={listing.id} className="w-[160px] sm:w-[192px] shrink-0">
              <ListingCard
                listing={listing}
                isFavorite={favoriteIds.has(listing.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
          <div className="shrink-0 w-5 md:w-8 xl:w-[calc((100vw-1152px)/2+2rem)]" />
        </div>
      </div>
    </section>
  );
}
