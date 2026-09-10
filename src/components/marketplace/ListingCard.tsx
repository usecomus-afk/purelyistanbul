"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ImageOff, Star } from "lucide-react";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface ListingCardProps {
  listing: MarketplaceListing;
  isFavorite?: boolean;
  onToggleFavorite?: (listing: MarketplaceListing) => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: ListingCardProps) {
  const priceUnit = listing.type === "stay" ? "gece" : "kişi";
  const rating = listing.rating?.score ?? 4.9;
  const reviewCount = listing.rating?.reviewCount ?? 0;

  return (
    <div className="group">
      <Link href={`/marketplace/listing/${listing.id}`} className="block">
        {/* Dikey dikdörtgen (3:4) görsel — Airbnb Deneyimler stili */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-sand-card ring-1 ring-inset ring-black/[0.04]">
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 22vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted/50">
              <ImageOff className="w-5 h-5" strokeWidth={1.5} />
            </div>
          )}

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(listing);
              }}
              aria-label="Favorilere ekle"
              className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 transition"
            >
              <Heart
                className={`w-[22px] h-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${isFavorite ? "fill-terracotta text-terracotta" : "fill-white/30 text-white"}`}
                strokeWidth={2}
              />
            </button>
          )}
        </div>

        {/* Bilgi alanı */}
        <div className="mt-2.5">
          {/* Başlık + puan yan yana */}
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-[13.5px] font-semibold text-ink leading-snug line-clamp-2 flex-1">
              {listing.title || "İsimsiz ilan"}
            </p>
            {reviewCount > 0 && (
              <div className="flex items-center gap-0.5 shrink-0 pt-px">
                <Star className="w-3 h-3 fill-ink text-ink" />
                <span className="text-[12.5px] font-medium text-ink">{rating.toFixed(2)}</span>
              </div>
            )}
          </div>
          {/* Bölge */}
          <p className="text-[12.5px] text-ink-muted mt-0.5 truncate">{listing.district}</p>
          {/* Fiyat */}
          <p className="text-[13.5px] text-ink mt-1">
            <span className="font-semibold">{listing.pricing.basePrice.toLocaleString("tr-TR")} {listing.pricing.currency}</span>
            <span className="text-ink-muted font-normal"> / {priceUnit}</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
