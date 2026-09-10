"use client";

import Image from "next/image";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface CategoryShelfProps {
  id: string;
  title: string;
  icon?: string;
  listings: MarketplaceListing[];
  favoriteIds: Set<string>;
  onToggleFavorite: (listing: MarketplaceListing) => void;
}

/** Bir kategorinin ilanlarını yatay eksende kayan bir raf olarak gösterir. */
export function CategoryShelf({ id, title, icon, listings, favoriteIds, onToggleFavorite }: CategoryShelfProps) {
  if (listings.length === 0) return null;

  return (
    <section id={id} style={{ scrollMarginTop: 180 }} className="py-7 border-b border-sand-border/40 last:border-b-0 overflow-hidden">
      <div className="flex items-center justify-between mb-5 px-5 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                {listings.length} İlan
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              İstanbul'un en seçkin {title.toLowerCase()} seçenekleri
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div 
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-px-5 md:scroll-px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Sol padding spacer (Header ile aynı hizada başlaması için) */}
          <div className="shrink-0 w-5 md:w-8 xl:w-[calc((100vw-1152px)/2+2rem)]" />
          
          {listings.map((listing) => (
            <div key={listing.id} className="w-[220px] sm:w-[260px] shrink-0 snap-start">
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

