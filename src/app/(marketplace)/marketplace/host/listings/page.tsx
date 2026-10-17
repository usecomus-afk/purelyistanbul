"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageOff, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HostGuard } from "@/components/marketplace/HostGuard";
import { watchHostListings } from "@/lib/marketplace/listings";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import type { ListingStatus, MarketplaceListing } from "@/lib/marketplace/types";

const STATUS_LABEL: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-100 text-zinc-700" },
  pending_review: { label: "Pending Verification", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Declined", className: "bg-red-100 text-red-700" },
  suspended: { label: "Paused", className: "bg-zinc-200 text-zinc-700" },
};

function HostListingsInner() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchHostListings(user.uid, setListings);
    return () => unsub();
  }, [user]);

  return (
    <>
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-luxury-serif text-2xl font-semibold tracking-tight text-ink">
            Partner Listings
          </h1>
          <Link
            href="/marketplace/host/listings/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-terracotta text-white text-xs font-semibold px-4 py-2.5 hover:bg-terracotta/90 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Certified Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="text-sm text-ink-muted">You do not have any published partner listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => {
              const status = STATUS_LABEL[l.status];
              return (
                <Link
                  key={l.id}
                  href={`/marketplace/host/listings/${l.id}/edit`}
                  className="flex items-center gap-4 rounded-2xl border border-sand-border bg-white p-3 hover:shadow-sm transition"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-sand-card shrink-0">
                    {l.coverImageUrl ? (
                      <Image src={l.coverImageUrl} alt={l.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <ImageOff className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{l.title || "Untitled Experience"}</p>
                    <p className="text-xs text-ink-muted">{l.district || "Istanbul"}</p>
                    <p className="text-xs text-ink-muted">
                      {l.pricing.basePrice.toLocaleString("en-GB")} {l.pricing.currency} /{" "}
                      {l.type === "stay" ? "night" : "guest"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <MarketplaceFooter />
    </>
  );
}

export default function HostListingsPage() {
  return (
    <HostGuard>
      <HostListingsInner />
    </HostGuard>
  );
}
