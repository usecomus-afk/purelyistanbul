"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";
import { watchPendingListings, approveListing, rejectListing } from "@/lib/marketplace/listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";

/**
 * Süperadmin: marketplace_listings için moderasyon kuyruğu (sadece pending_review).
 * NOT: firestore.rules'daki isAdmin(), Firebase Auth custom claim / özel e-posta
 * gerektirir. Cockpit girişi hâlâ eski env-var tabanlı (bkz. AdminAuthGuard) —
 * bu ekranın onay/red işlemleri için cockpit admin'inin AYRICA Firebase ile
 * giriş yapmış olması gerekiyor (host-applications ekranıyla aynı bilinen açık).
 */
export default function ListingApprovalsPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchPendingListings(setListings);
    return () => unsub();
  }, []);

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await approveListing(id);
      toast.success("İlan onaylandı ve vitrine eklendi.");
    } catch (err: any) {
      toast.error(err?.message || "Onay başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Reddetme nedeni (host'a gösterilecek):") || "";
    if (!reason) return;
    setBusyId(id);
    try {
      await rejectListing(id, reason);
      toast.success("İlan reddedildi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">İlan Onayları</h1>
      <p className="text-xs text-ink-muted">Sadece admin onayı vitrine (/marketplace) çıkışa izin verir.</p>

      <div className="space-y-3">
        {listings.length === 0 && <p className="text-xs text-ink-muted">Onay bekleyen ilan yok.</p>}
        {listings.map((l) => (
          <div key={l.id} className="flex gap-4 rounded-2xl border border-amber-200/80 bg-white p-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-sand-card shrink-0">
              {l.coverImageUrl ? (
                <Image src={l.coverImageUrl} alt={l.title} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-muted">
                  <ImageOff className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{l.title}</p>
              <p className="text-xs text-ink-muted">
                {l.district} · {l.type === "stay" ? "Konaklama" : "Deneyim"} · {l.pricing.basePrice}{" "}
                {l.pricing.currency}
              </p>
              <p className="text-xs text-zinc-700 mt-1 line-clamp-2">{l.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  disabled={busyId === l.id}
                  onClick={() => handleApprove(l.id)}
                  className="rounded-lg bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 disabled:opacity-60"
                >
                  Onayla
                </button>
                <button
                  disabled={busyId === l.id}
                  onClick={() => handleReject(l.id)}
                  className="rounded-lg bg-red-600 text-white text-xs font-bold px-3 py-1.5 disabled:opacity-60"
                >
                  Reddet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
