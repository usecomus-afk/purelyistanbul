"use client";

import { useRef, useCallback, useEffect } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface CategoryShelfProps {
  id: string;
  title: string;
  icon?: string;
  listings: MarketplaceListing[];
  favoriteIds: Set<string>;
  onToggleFavorite: (listing: MarketplaceListing) => void;
  /** Kategori başlığına tıklandığında çağrılır (tüm ilanları göster) */
  onTitleClick?: () => void;
}

/** Bir kategorinin ilanlarını yatay eksende kayan bir raf olarak gösterir.
 *  Ekrana sığmayan ilanlar varsa fare üzerine gelince otomatik kayar. */
export function CategoryShelf({ id, title, listings, favoriteIds, onToggleFavorite, onTitleClick }: CategoryShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      if (pauseRef.current !== null) clearTimeout(pauseRef.current);
    };
  }, []);

  const startAutoScroll = useCallback(() => {
    pauseRef.current = setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;
      // Tüm ilanlar ekrana sığıyorsa kaydırma yapma
      if (container.scrollWidth <= container.clientWidth + 4) return;

      const step = () => {
        const c = scrollRef.current;
        if (!c) return;
        if (c.scrollLeft >= c.scrollWidth - c.clientWidth - 2) {
          c.scrollLeft = 0;
        } else {
          c.scrollLeft += 0.8;
        }
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    }, 300);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (pauseRef.current !== null) {
      clearTimeout(pauseRef.current);
      pauseRef.current = null;
    }
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  if (listings.length === 0) return null;

  return (
    <section id={id} style={{ scrollMarginTop: 180 }} className="py-7 border-b border-sand-border/40 last:border-b-0 overflow-hidden">
      <div className="flex items-center justify-between mb-5 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div>
            <div className="flex items-center gap-2.5">
              {onTitleClick ? (
                <button
                  onClick={onTitleClick}
                  className="text-lg sm:text-2xl font-semibold tracking-tight text-ink hover:text-terracotta transition-colors text-left group"
                >
                  {title}
                  <span className="ml-2 text-sm font-normal text-ink-muted group-hover:text-terracotta">→</span>
                </button>
              ) : (
                <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-ink">{title}</h2>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                {listings.length} İlan
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              İstanbul'un en seçkin {title.toLowerCase()} seçenekleri
              {onTitleClick && (
                <button onClick={onTitleClick} className="ml-2 font-semibold text-terracotta hover:underline">
                  Tümünü gör
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div
          ref={scrollRef}
          onMouseEnter={startAutoScroll}
          onMouseLeave={stopAutoScroll}
          className="flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: 'auto' }}
        >
          {/* Sol padding spacer */}
          <div className="shrink-0 w-5 md:w-8 xl:w-[calc((100vw-1152px)/2+2rem)]" />

          {listings.map((listing) => (
            <div key={listing.id} className="w-[220px] sm:w-[260px] shrink-0">
              <ListingCard
                listing={listing}
                isFavorite={favoriteIds.has(listing.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}

          {/* Sağ padding spacer */}
          <div className="shrink-0 w-5 md:w-8 xl:w-[calc((100vw-1152px)/2+2rem)]" />
        </div>
      </div>
    </section>
  );
}
