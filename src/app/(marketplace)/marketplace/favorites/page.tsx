"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchUserFavoriteListings, toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

/** Airbnb'deki "Wishlists" karşılığı: kullanıcının kalp ile işaretlediği ilanlar. */
export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = watchUserFavoriteListings(user.uid, (data) => {
      setListings(data);
      setReady(true);
    });
    return () => unsub();
  }, [user]);

  async function handleToggleFavorite(listing: MarketplaceListing) {
    if (!user) return;
    await toggleFavorite(user.uid, listing.id);
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-sm text-ink-muted">Yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 text-center">
        <Heart className="w-8 h-8 text-ink-muted/40 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-ink-muted">
          Favorilerinizi görmek için{" "}
          <Link href="/marketplace/account" className="text-terracotta underline">
            giriş yapın
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
      <h1 className="text-[26px] font-light tracking-tight text-ink mb-1">Favorilerim</h1>
      <p className="text-[13.5px] text-ink-muted mb-8">Kalp ile işaretlediğiniz ilanlar burada listelenir.</p>

      {!ready ? (
        <p className="text-sm text-ink-muted">Yükleniyor...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-sand-border rounded-2xl">
          <Heart className="w-7 h-7 text-ink-muted/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-muted">Henüz favori ilanınız yok.</p>
          <Link href="/" className="inline-block mt-3 text-[13px] font-semibold text-terracotta underline">
            İlanlara göz atın →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} isFavorite onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
