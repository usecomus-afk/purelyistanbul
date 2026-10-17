"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { watchListing } from "@/lib/marketplace/listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";

/**
 * Rezervasyon akışının ilk adımı. Gerçek Mock Ödeme (Sanal POS'a hazır
 * `orders` koleksiyonu) ve sözleşme onayları bir sonraki geliştirme adımında
 * burada devreye girecek — şimdilik seçilen tarih/misafir özetini gösterir.
 */
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
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Yükleniyor...</div>;
  }
  if (listing === null) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">İlan bulunamadı.</div>;
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="text-xl font-light tracking-tight text-ink mb-1">Rezervasyon Özeti</h1>
      <p className="text-sm text-ink-muted mb-6">{listing.title}</p>

      <div className="rounded-2xl border border-sand-border bg-white p-5 space-y-2 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-ink-muted">{listing.type === "stay" ? "Giriş" : "Tarih"}</span>
          <span>{checkIn || "—"}</span>
        </div>
        {listing.type === "stay" && (
          <div className="flex justify-between">
            <span className="text-ink-muted">Çıkış</span>
            <span>{checkOut || "—"}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-muted">Misafir</span>
          <span>{guests}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-xs text-ink-muted">
        Ödeme adımı (Mock/Test Ödeme ve Sanal POS entegrasyonu) bir sonraki geliştirme adımında
        buraya eklenecek. Şimdilik bu ekran, rezervasyon akışının ilk adımını temsil eder.
      </div>

      <Link
        href={`/marketplace/listing/${listing.id}`}
        className="inline-block mt-6 text-xs font-semibold text-ink-muted underline"
      >
        ← İlana geri dön
      </Link>
    </div>
  );
}
