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
        {/* Yatay dikdörtgen (4:3) görsel — Airbnb Deneyimler stili */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-sand-card ring-1 ring-inset ring-black/[0.04]">
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

          {/* Popüler Badge (Airbnb tarzı) */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[13px] font-semibold text-ink shadow-[0_2px_4px_rgba(0,0,0,0.18)]">
            Popüler
          </div>

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
                className={`w-[24px] h-[24px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${isFavorite ? "fill-terracotta text-terracotta" : "fill-black/30 text-white"}`}
                strokeWidth={1.5}
              />
            </button>
          )}
        </div>

        {/* Bilgi alanı (Airbnb Birebir Tasarım) */}
        <div className="mt-3.5 flex flex-col gap-0.5">
          {/* Başlık */}
          <p className="text-[15px] font-semibold text-[#222222] leading-[1.3] line-clamp-2">
            {listing.title || "İsimsiz ilan"}
          </p>
          
          {/* Fiyat */}
          <p className="text-[15px] text-[#717171] mt-0.5">
            Başlangıç fiyatı ₺{listing.pricing.basePrice.toLocaleString("tr-TR")} <span className="font-normal">/{priceUnit}</span>
          </p>
          
          {/* Puan ve Değerlendirme (Airbnb stilinde hemen altta) */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-0.5 text-[#222222]">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[14px] font-medium">{rating.toFixed(2)}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
