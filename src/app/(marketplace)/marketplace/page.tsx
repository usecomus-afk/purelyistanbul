"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

const CATEGORY_FILTERS = ["Tümü", "Konaklama", "Deneyim"] as const;

/**
 * Purely Istanbul Marketplace vitrini — onaylı ilanların Airbnb tarzı grid'i.
 */
export default function MarketplaceGridPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("Tümü");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = watchApprovedListings((data) => {
      setListings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const visible = listings.filter((l) => {
    if (filter === "Tümü") return true;
    if (filter === "Konaklama") return l.type === "stay";
    return l.type === "experience";
  });

  async function handleToggleFavorite(listing: MarketplaceListing) {
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }
    const nowFavorite = await toggleFavorite(user.uid, listing.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavorite) next.add(listing.id);
      else next.delete(listing.id);
      return next;
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-light tracking-tight text-ink">
          İstanbul'da kalacak yer ve deneyimler
        </h1>
        <p className="text-sm text-ink-muted mt-1">Purely Istanbul host topluluğu tarafından sunulur.</p>
      </div>

      <div className="flex gap-2 mb-8">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition ${
              filter === f
                ? "bg-terracotta text-white border-terracotta"
                : "bg-white text-ink-muted border-sand-border hover:border-terracotta/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Yükleniyor...</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm text-ink-muted">Henüz onaylanmış ilan yok. Yakında burada olacak.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {visible.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={favoriteIds.has(listing.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
