"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { watchListing } from "@/lib/marketplace/listings";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import type { MarketplaceListing } from "@/lib/marketplace/types";

export default function BookingSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);

  useEffect(() => {
    const unsub = watchListing(id, setListing, () => setListing(null));
    return () => unsub();
  }, [id]);

  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const guests = params.get("guests") || "1";

  if (listing === undefined) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Loading...</div>;
  }
  if (listing === null) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Experience not found.</div>;
  }

  return (
    <>
      <div className="max-w-md mx-auto px-5 py-12">
        <h1 className="font-luxury-serif text-2xl font-semibold tracking-tight text-ink mb-1">
          Reservation Summary
        </h1>
        <p className="text-sm text-ink-muted mb-6">{listing.title}</p>

        <div className="rounded-2xl border border-sand-border bg-white p-5 space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-ink-muted">{listing.type === "stay" ? "Check-in" : "Date"}</span>
            <span>{checkIn || "—"}</span>
          </div>
          {listing.type === "stay" && (
            <div className="flex justify-between">
              <span className="text-ink-muted">Check-out</span>
              <span>{checkOut || "—"}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-muted">Guests</span>
            <span>{guests}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-xs text-ink-muted leading-relaxed">
          Your reservation request is coordinated directly with our pre-vetted licensed operator with transparent local rates and secure Stripe checkout.
        </div>

        <Link
          href={`/marketplace/listing/${listing.id}`}
          className="inline-block mt-6 text-xs font-semibold text-ink-muted underline"
        >
          ← Back to Experience Details
        </Link>
      </div>
      <MarketplaceFooter />
    </>
  );
}
