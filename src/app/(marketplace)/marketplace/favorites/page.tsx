"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchUserFavoriteListings, toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace/types";

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
    return <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-sm text-ink-muted">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 text-center">
        <Heart className="w-8 h-8 text-ink-muted/40 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-ink-muted">
          Please{" "}
          <Link href="/marketplace/account" className="text-terracotta underline">
            sign in
          </Link>{" "}
          to view your saved experiences.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
      <h1 className="font-luxury-serif text-[28px] font-semibold tracking-tight text-ink mb-1">
        Saved Experiences
      </h1>
      <p className="text-[13.5px] text-ink-muted mb-8">
        Your curated wishlist of verified Istanbul experiences and services.
      </p>

      {!ready ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-sand-border rounded-2xl">
          <Heart className="w-7 h-7 text-ink-muted/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-muted">You haven&apos;t saved any experiences yet.</p>
          <Link href="/" className="inline-block mt-3 text-[13px] font-semibold text-terracotta underline">
            Explore Curated Experiences →
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
