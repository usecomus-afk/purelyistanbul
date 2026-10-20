"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { watchListing } from "@/lib/marketplace/listings";
import { isRestaurantListing } from "@/lib/marketplace/seed-listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";

export default function BookingSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = watchListing(id, setListing, () => setListing(null));
    return () => unsub();
  }, [id]);

  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const time = params.get("time") || "";
  const guests = params.get("guests") || "2";

  if (listing === undefined) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Loading...</div>;
  }
  if (listing === null) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Experience not found.</div>;
  }

  const isRestaurant = isRestaurantListing(listing);

  if (isRestaurant) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 space-y-4">
        <h1 className="font-luxury-serif text-2xl font-semibold tracking-tight text-ink">
          Comus Curated Dining Guide
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          <span className="font-semibold text-ink">{listing.title}</span> is featured in our independent dining guide
          for guest information only. Please contact the venue directly using the details on its guide page.
        </p>
        <Link
          href={`/marketplace/listing/${listing.id}`}
          className="inline-block text-xs font-semibold text-terracotta underline"
        >
          ← Back to Venue Guide
        </Link>
      </div>
    );
  }

  function handleConfirmReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !guestContact.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="font-luxury-serif text-2xl font-semibold tracking-tight text-ink mb-1">
        Reservation Summary
      </h1>
      <p className="text-sm text-ink-muted mb-6">{listing.title}</p>

      <div className="rounded-2xl border border-sand-border bg-white p-5 space-y-2.5 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-ink-muted">{listing.type === "stay" ? "Check-in" : "Date"}</span>
          <span className="font-medium text-ink">{checkIn || "—"}</span>
        </div>
        {time && (
          <div className="flex justify-between">
            <span className="text-ink-muted">Preferred Time</span>
            <span className="font-medium text-ink">{time}</span>
          </div>
        )}
        {listing.type === "stay" && (
          <div className="flex justify-between">
            <span className="text-ink-muted">Check-out</span>
            <span className="font-medium text-ink">{checkOut || "—"}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-muted">Guests</span>
          <span className="font-medium text-ink">{guests}</span>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center space-y-2 mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" strokeWidth={2} />
          <h2 className="font-luxury-serif text-lg font-semibold text-emerald-950">
            Reservation Request Received
          </h2>
          <p className="text-xs text-emerald-900/80 leading-relaxed">
            Thank you, <span className="font-semibold">{guestName}</span>. Our concierge team is confirming your booking
            at <span className="font-semibold">{listing.title}</span> and will send your confirmation shortly to{" "}
            <span className="font-semibold">{guestContact}</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirmReservation} className="rounded-2xl border border-sand-border bg-white p-5 space-y-4 mb-6">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full rounded-xl border border-sand-border bg-sand-bg/50 px-3.5 py-2.5 text-[13px] outline-none focus:border-terracotta"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
              WhatsApp Phone or Email *
            </label>
            <input
              type="text"
              required
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              placeholder="+44 7700 900000 or name@example.com"
              className="w-full rounded-xl border border-sand-border bg-sand-bg/50 px-3.5 py-2.5 text-[13px] outline-none focus:border-terracotta"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Special Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests for your experience"
              className="w-full rounded-xl border border-sand-border bg-sand-bg/50 px-3.5 py-2 text-[13px] outline-none focus:border-terracotta resize-none"
            />
          </div>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full rounded-full bg-sand-border/80 text-ink-muted/80 font-semibold py-3 text-[13.5px] cursor-not-allowed flex items-center justify-center gap-2 border border-sand-border"
            title="Direct online booking is currently disabled while the platform is in pre-launch preview mode."
          >
            <CalendarCheck className="w-4 h-4" strokeWidth={2} />
            Reservation Disabled (Preview Mode)
          </button>
          <p className="text-center text-[11.5px] text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 leading-relaxed">
            ⚠️ Direct online booking is currently disabled while the platform is in pre-launch preview mode.
          </p>
        </form>
      )}

      <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-xs text-ink-muted leading-relaxed">
        Your reservation request is coordinated directly with our pre-vetted licensed operator with transparent local
        rates and secure Stripe checkout.
      </div>

      <Link
        href={`/marketplace/listing/${listing.id}`}
        className="inline-block mt-6 text-xs font-semibold text-ink-muted underline"
      >
        ← Back to Experience Details
      </Link>
    </div>
  );
}
