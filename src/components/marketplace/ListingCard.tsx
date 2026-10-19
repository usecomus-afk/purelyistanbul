"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Heart, ImageOff, Star } from "lucide-react";
import { isRestaurantListing } from "@/lib/marketplace/seed-listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface ListingCardProps {
  listing: MarketplaceListing;
  isFavorite?: boolean;
  onToggleFavorite?: (listing: MarketplaceListing) => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: ListingCardProps) {
  const isRestaurant = isRestaurantListing(listing);
  const priceUnit = listing.type === "stay" ? "night" : "guest";
  const rating = listing.rating?.score ?? 4.9;
  const reviewCount = listing.rating?.reviewCount ?? 0;
  const currencySymbol =
    listing.pricing.currency === "EUR" ? "€" : listing.pricing.currency === "USD" ? "$" : "₺";

  return (
    <div className="group">
      <Link href={`/marketplace/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-sand-card ring-1 ring-inset ring-black/[0.05] shadow-[0_1px_2px_rgba(11,25,44,0.04)] transition-shadow duration-300 group-hover:shadow-[0_10px_28px_-10px_rgba(11,25,44,0.28)]">
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
              aria-label="Save experience"
              className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-105 transition shadow-sm"
            >
              <Heart
                className={`w-[17px] h-[17px] ${isFavorite ? "fill-terracotta text-terracotta" : "text-ink"}`}
                strokeWidth={1.75}
              />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <p className="text-[14.5px] font-semibold text-ink leading-[1.3] line-clamp-2">
            {listing.title || "Curated Istanbul Experience"}
          </p>

          <div className="flex items-center justify-between gap-2">
            {isRestaurant ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-terracotta group-hover:underline">
                <CalendarCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                Reserve a Table
              </span>
            ) : (
              <p className="text-[13.5px] text-ink-muted">
                <span className="font-semibold text-ink">
                  {currencySymbol}
                  {listing.pricing.basePrice.toLocaleString("en-GB")}
                </span>{" "}
                / {priceUnit}
              </p>
            )}

            {reviewCount > 0 && (
              <div className="flex items-center gap-1 text-ink">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-[13px] font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
