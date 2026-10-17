"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ImageOff, MapPin, Users, ShieldCheck } from "lucide-react";
import { watchListing, bumpListingStat } from "@/lib/marketplace/listings";
import { useCategoryConfigs } from "@/lib/marketplace/use-category-configs";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import type { MarketplaceListing } from "@/lib/marketplace/types";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const categoryConfigs = useCategoryConfigs();

  useEffect(() => {
    const unsub = watchListing(
      id,
      (data) => setListing(data),
      () => setListing(null)
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (listing) bumpListingStat(listing.id, "viewCount");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (listing === undefined) {
    return <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-sm text-ink-muted">Loading experience...</div>;
  }

  if (listing === null) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-center">
          <p className="text-sm text-ink-muted">This experience could not be found or is no longer active.</p>
        </div>
        <MarketplaceFooter />
      </>
    );
  }

  const gallery = listing.images.length > 0 ? listing.images : [];
  const priceUnit = listing.type === "stay" ? "night" : "guest";
  const nights =
    listing.type === "stay" && checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 1;
  const total =
    listing.type === "stay"
      ? listing.pricing.basePrice * nights + (listing.pricing.cleaningFee ?? 0)
      : listing.pricing.basePrice * guests;

  function handleReserve() {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/marketplace/listing/${listing!.id}/book?${params.toString()}`);
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <h1 className="font-luxury-serif text-[26px] md:text-3xl font-semibold tracking-tight text-ink mb-1.5">
          {listing.title}
        </h1>
        <p className="text-[13.5px] text-ink-muted flex items-center gap-1.5 mb-7">
          <MapPin className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.75} /> {listing.district}
        </p>

        {/* Photo Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-3xl overflow-hidden mb-12 h-[340px] md:h-[440px] ring-1 ring-inset ring-black/[0.04]">
          <div
            className={`relative col-span-4 row-span-2 ${
              gallery.length > 1 ? "md:col-span-2 md:row-span-2" : "md:col-span-4 md:row-span-2"
            } bg-sand-card`}
          >
            {gallery[0] ? (
              <Image
                src={gallery[0].url}
                alt={listing.title}
                fill
                className="object-cover"
                sizes={gallery.length > 1 ? "50vw" : "100vw"}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-muted/50">
                <ImageOff className="w-7 h-7" strokeWidth={1.5} />
              </div>
            )}
          </div>
          {gallery.length > 1 &&
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="relative hidden md:block bg-sand-card">
                {gallery[i] ? (
                  <Image src={gallery[i].url} alt={`${listing.title} ${i}`} fill className="object-cover" sizes="25vw" />
                ) : null}
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-9">
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-muted border-b border-sand-border/70 pb-7">
              <Users className="w-4 h-4 text-terracotta" strokeWidth={1.75} />
              <span>
                Up to {listing.capacity} guests ·{" "}
                {listing.type === "stay" ? "Boutique Stay" : "Verified Local Experience"}
                {listing.category
                  ? ` · ${categoryConfigs.find((c) => c.key === listing.category)?.label ?? listing.category}`
                  : ""}
              </span>
            </div>

            <div>
              <h2 className="font-luxury-serif text-[19px] font-semibold text-ink mb-3">About This Experience</h2>
              <p className="text-[14.5px] text-ink-muted leading-relaxed whitespace-pre-line">
                {listing.description || "Verified local experience curated by Purely Istanbul."}
              </p>
            </div>

            {listing.amenities.length > 0 && (
              <div>
                <h2 className="font-luxury-serif text-[19px] font-semibold text-ink mb-4">Included Highlights</h2>
                <div className="grid grid-cols-2 gap-y-3 text-[14px] text-ink-muted">
                  {listing.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-terracotta" strokeWidth={1.75} /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-sand-border bg-white p-5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-terracotta shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="text-xs text-ink-muted leading-relaxed">
                <p className="font-semibold text-ink mb-0.5">Tanrı Misafiri Ethical Guarantee</p>
                <p>
                  Real local rates, zero tourist markups, and pre-vetted licensed fulfillment under our Ethical Charter &amp; Guest Commitment.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:self-start lg:sticky lg:top-28">
            <div className="rounded-3xl border border-sand-border bg-white shadow-[0_4px_24px_rgba(11,25,44,0.07)] p-6 space-y-5">
              <p className="text-[19px]">
                <span className="font-semibold text-ink">
                  {listing.pricing.basePrice.toLocaleString("en-GB")} {listing.pricing.currency}
                </span>{" "}
                <span className="text-[13.5px] text-ink-muted">/ {priceUnit}</span>
              </p>

              {listing.type === "stay" ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="border border-sand-border rounded-xl px-3.5 py-2.5">
                    <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Check-in</span>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-[12.5px] outline-none mt-0.5"
                    />
                  </label>
                  <label className="border border-sand-border rounded-xl px-3.5 py-2.5">
                    <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Check-out</span>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-[12.5px] outline-none mt-0.5"
                    />
                  </label>
                </div>
              ) : (
                <label className="block border border-sand-border rounded-xl px-3.5 py-2.5">
                  <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Preferred Date</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-[12.5px] outline-none mt-0.5"
                  />
                </label>
              )}

              <label className="block border border-sand-border rounded-xl px-3.5 py-2.5">
                <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Guests</span>
                <input
                  type="number"
                  min={1}
                  max={listing.capacity}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full text-[12.5px] outline-none mt-0.5"
                />
              </label>

              <button
                onClick={handleReserve}
                disabled={!checkIn || (listing.type === "stay" && !checkOut)}
                className="w-full rounded-full bg-ink text-white font-semibold py-3 text-[14px] hover:bg-terracotta transition disabled:opacity-40"
              >
                Request Reservation
              </button>

              <div className="text-[13px] text-ink-muted flex justify-between pt-1 border-t border-sand-border/70">
                <span>Estimated Total</span>
                <span className="font-semibold text-ink">
                  {total.toLocaleString("en-GB")} {listing.pricing.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MarketplaceFooter />
    </>
  );
}
