"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ImageOff } from "lucide-react";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface ListingCardProps {
  listing: MarketplaceListing;
  isFavorite?: boolean;
  onToggleFavorite?: (listing: MarketplaceListing) => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: ListingCardProps) {
  const priceUnit = listing.type === "stay" ? "gece" : "kişi";

  return (
    <div className="group">
      <Link href={`/marketplace/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-sand-card">
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              <ImageOff className="w-6 h-6" />
            </div>
          )}

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(listing);
              }}
              aria-label="Favorilere ekle"
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/85 backdrop-blur-sm hover:bg-white transition"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-terracotta text-terracotta" : "text-ink/70"}`} />
            </button>
          )}
        </div>

        <div className="mt-2.5 space-y-0.5">
          <p className="text-[13px] text-ink-muted">{listing.district}</p>
          <p className="text-sm font-medium text-ink truncate">{listing.title || "İsimsiz ilan"}</p>
          <p className="text-sm text-ink">
            <span className="font-semibold">
              {listing.pricing.basePrice.toLocaleString("tr-TR")} {listing.pricing.currency}
            </span>{" "}
            <span className="text-ink-muted">/ {priceUnit}</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
