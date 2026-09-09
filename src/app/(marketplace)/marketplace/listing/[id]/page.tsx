"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ImageOff, MapPin, Users } from "lucide-react";
import { watchListing, bumpListingStat } from "@/lib/marketplace/listings";
import { getCategoryByKey } from "@/lib/marketplace/categories";
import type { MarketplaceListing } from "@/lib/marketplace/types";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

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
    // Sadece ilk yükte bir kez sayaç artırılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (listing === undefined) {
    return <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-sm text-ink-muted">Yükleniyor...</div>;
  }

  if (listing === null) {
    return (
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-center">
        <p className="text-sm text-ink-muted">Bu ilan bulunamadı veya artık yayında değil.</p>
      </div>
    );
  }

  const gallery = listing.images.length > 0 ? listing.images : [];
  const priceUnit = listing.type === "stay" ? "gece" : "kişi";
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
      guests: String(guests)
    });
    router.push(`/marketplace/listing/${listing!.id}/book?${params.toString()}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
      <h1 className="text-2xl md:text-[26px] font-light tracking-tight text-ink mb-1">{listing.title}</h1>
      <p className="text-sm text-ink-muted flex items-center gap-1 mb-6">
        <MapPin className="w-3.5 h-3.5" /> {listing.district}
      </p>

      {/* Fotoğraf galerisi */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden mb-10 h-[340px] md:h-[420px]">
        <div className="relative col-span-4 row-span-2 md:col-span-2 md:row-span-2 bg-sand-card">
          {gallery[0] ? (
            <Image src={gallery[0].url} alt={listing.title} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              <ImageOff className="w-8 h-8" />
            </div>
          )}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative hidden md:block bg-sand-card">
            {gallery[i] ? (
              <Image src={gallery[i].url} alt={`${listing.title} ${i}`} fill className="object-cover" sizes="25vw" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Sol: detaylar */}
        <div className="space-y-8">
          <div className="flex items-center gap-2 text-sm text-ink-muted border-b border-sand-border pb-6">
            <Users className="w-4 h-4" />
            {listing.capacity} misafire kadar · {listing.type === "stay" ? "Konaklama" : "Deneyim"}
            {listing.category ? ` · ${getCategoryByKey(listing.category)?.label ?? listing.category}` : ""}
          </div>

          <div>
            <h2 className="text-lg font-medium text-ink mb-2">Bu ilan hakkında</h2>
            <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">
              {listing.description || "Açıklama henüz eklenmedi."}
            </p>
          </div>

          {listing.amenities.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-ink mb-3">Sunulan olanaklar</h2>
              <div className="grid grid-cols-2 gap-y-2.5 text-sm text-ink-muted">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-terracotta" /> {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: sticky rezervasyon kutusu */}
        <div className="lg:self-start lg:sticky lg:top-24">
          <div className="rounded-2xl border border-sand-border bg-white shadow-md p-5 space-y-4">
            <p className="text-lg">
              <span className="font-semibold">
                {listing.pricing.basePrice.toLocaleString("tr-TR")} {listing.pricing.currency}
              </span>{" "}
              <span className="text-sm text-ink-muted">/ {priceUnit}</span>
            </p>

            {listing.type === "stay" ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="border border-sand-border rounded-xl px-3 py-2">
                  <span className="block text-[10px] uppercase text-ink-muted">Giriş</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs outline-none"
                  />
                </label>
                <label className="border border-sand-border rounded-xl px-3 py-2">
                  <span className="block text-[10px] uppercase text-ink-muted">Çıkış</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs outline-none"
                  />
                </label>
              </div>
            ) : (
              <label className="block border border-sand-border rounded-xl px-3 py-2">
                <span className="block text-[10px] uppercase text-ink-muted">Tarih</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-xs outline-none"
                />
              </label>
            )}

            <label className="block border border-sand-border rounded-xl px-3 py-2">
              <span className="block text-[10px] uppercase text-ink-muted">Misafir Sayısı</span>
              <input
                type="number"
                min={1}
                max={listing.capacity}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full text-xs outline-none"
              />
            </label>

            <button
              onClick={handleReserve}
              disabled={!checkIn || (listing.type === "stay" && !checkOut)}
              className="w-full rounded-full bg-terracotta text-white font-semibold py-3 text-sm hover:bg-terracotta/90 transition disabled:opacity-50"
            >
              Rezervasyon Yap
            </button>

            <div className="text-xs text-ink-muted flex justify-between pt-1 border-t border-sand-border">
              <span>Toplam (tahmini)</span>
              <span className="font-semibold text-ink">
                {total.toLocaleString("tr-TR")} {listing.pricing.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
