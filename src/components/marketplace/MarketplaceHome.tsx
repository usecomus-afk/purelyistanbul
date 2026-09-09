"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CategoryFilterBar } from "@/components/marketplace/CategoryFilterBar";
import { getCategoryByKey } from "@/lib/marketplace/categories";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

/**
 * Purely Istanbul Marketplace vitrini — onaylı ilanların Airbnb tarzı grid'i.
 * Herkese açıktır: giriş yapılmadan görüntülenebilir, rezervasyon adımına
 * (mock ödeme öncesi) kadar da giriş gerekmez — sadece favori eklemek için
 * hesap istenir. Bu bileşen bir AuthProvider ağacı içinde render edilmelidir
 * (bkz. (marketplace)/layout.tsx veya (guest)/page.tsx'teki gömme kullanımı).
 */
export function MarketplaceHome() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = watchApprovedListings((data) => {
      setListings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const visible = listings.filter((l) => (category === "all" ? true : l.category === category));
  const activeCategoryLabel = category === "all" ? null : getCategoryByKey(category)?.label;

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
    <>
      <CategoryFilterBar value={category} onChange={setCategory} />

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-ink">
            {activeCategoryLabel ?? "İstanbul'da kalacak yer ve deneyimler"}
          </h1>
          <p className="text-sm text-ink-muted mt-1">Purely Istanbul host topluluğu tarafından sunulur.</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Yükleniyor...</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm text-ink-muted">Bu kategoride henüz onaylanmış ilan yok. Yakında burada olacak.</p>
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
    </>
  );
}
