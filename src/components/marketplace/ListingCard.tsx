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
        <div className="relative aspect-[6/5] rounded-2xl overflow-hidden bg-sand-card ring-1 ring-inset ring-black/[0.04]">
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
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
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-110 transition"
            >
              <Heart
                className={`w-[17px] h-[17px] ${isFavorite ? "fill-terracotta text-terracotta" : "text-ink/60"}`}
                strokeWidth={1.75}
              />
            </button>
          )}
        </div>

        <div className="mt-3 space-y-0.5">
          <p className="text-[12px] text-ink-muted tracking-wide uppercase">{listing.district}</p>
          <p className="text-[14.5px] font-medium text-ink truncate leading-snug">{listing.title || "İsimsiz ilan"}</p>
          <p className="text-[13.5px] text-ink pt-0.5">
            <span className="font-semibold">
              {listing.pricing.basePrice.toLocaleString("tr-TR")} {listing.pricing.currency}
            </span>{" "}
            <span className="text-ink-muted font-normal">/ {priceUnit}</span>
          </p>
        </div>
      </Link>
    </div>
  );
}
