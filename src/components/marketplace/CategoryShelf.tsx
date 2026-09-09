"use client";

import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface CategoryShelfProps {
  id: string;
  title: string;
  listings: MarketplaceListing[];
  favoriteIds: Set<string>;
  onToggleFavorite: (listing: MarketplaceListing) => void;
}

/** Bir kategorinin ilanlarını yatay eksende kayan bir raf olarak gösterir. */
export function CategoryShelf({ id, title, listings, favoriteIds, onToggleFavorite }: CategoryShelfProps) {
  if (listings.length === 0) return null;

  return (
    <section id={id} style={{ scrollMarginTop: 172 }} className="py-6">
      <h2 className="text-[19px] font-medium tracking-tight text-ink mb-4 px-5 md:px-8 max-w-6xl mx-auto">
        {title}
      </h2>
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-5">
          {listings.map((listing) => (
            <div key={listing.id} className="w-[220px] sm:w-[250px] shrink-0 snap-start">
              <ListingCard
                listing={listing}
                isFavorite={favoriteIds.has(listing.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
