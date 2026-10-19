"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { watchListing } from "@/lib/marketplace/listings";
import { isRestaurantListing } from "@/lib/marketplace/seed-listings";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
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

  function handleConfirmReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !guestContact.trim()) return;
    setSubmitted(true);
  }

  return (
    <>
      <div className="max-w-md mx-auto px-5 py-12">
        <h1 className="font-luxury-serif text-2xl font-semibold tracking-tight text-ink mb-1">
          {isRestaurant ? "Create Table Reservation" : "Reservation Summary"}
        </h1>
        <p className="text-sm text-ink-muted mb-6">{listing.title}</p>

        <div className="rounded-2xl border border-sand-border bg-white p-5 space-y-2.5 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-ink-muted">
              {listing.type === "stay" ? "Check-in" : isRestaurant ? "Reservation Date" : "Date"}
            </span>
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
          {isRestaurant && (
            <div className="flex justify-between pt-2 border-t border-sand-border/70">
              <span className="text-ink-muted">Reservation Fee</span>
              <span className="font-semibold text-emerald-700">Complimentary</span>
            </div>
          )}
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center space-y-2 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" strokeWidth={2} />
            <h2 className="font-luxury-serif text-lg font-semibold text-emerald-950">
              Reservation Request Received
            </h2>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Thank you, <span className="font-semibold">{guestName}</span>. Our concierge team is confirming your{" "}
              {isRestaurant ? "table reservation" : "booking"} at <span className="font-semibold">{listing.title}</span>{" "}
              and will send your confirmation shortly to <span className="font-semibold">{guestContact}</span>.
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
                {isRestaurant ? "Seating or Dietary Preferences (Optional)" : "Special Notes (Optional)"}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isRestaurant
                    ? "e.g. Terrace table, window view, allergies, or celebration note"
                    : "Any special requests for your experience"
                }
                className="w-full rounded-xl border border-sand-border bg-sand-bg/50 px-3.5 py-2 text-[13px] outline-none focus:border-terracotta resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-ink text-white font-semibold py-3 text-[13.5px] hover:bg-terracotta transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" strokeWidth={2} />
              {isRestaurant ? "Confirm Table Reservation" : "Submit Reservation Request"}
            </button>
          </form>
        )}

        <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-xs text-ink-muted leading-relaxed">
          {isRestaurant
            ? "Table reservations are complimentary through Purely Istanbul Concierge. No upfront payment is required—you settle your dining bill directly at the restaurant."
            : "Your reservation request is coordinated directly with our pre-vetted licensed operator with transparent local rates and secure Stripe checkout."}
        </div>

        <Link
          href={`/marketplace/listing/${listing.id}`}
          className="inline-block mt-6 text-xs font-semibold text-ink-muted underline"
        >
          ← Back to {isRestaurant ? "Restaurant" : "Experience"} Details
        </Link>
      </div>
      <MarketplaceFooter />
    </>
  );
}
