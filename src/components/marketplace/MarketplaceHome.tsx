"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CategoryFilterBar } from "@/components/marketplace/CategoryFilterBar";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { getCategoryByKey } from "@/lib/marketplace/categories";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

/**
 * Purely Istanbul Marketplace vitrini — onaylı ilanların Airbnb tarzı grid'i.
 * Herkese açıktır: giriş yapılmadan görüntülenebilir, rezervasyon adımına
 * (mock ödeme öncesi) kadar da giriş gerekmez — sadece favori eklemek için
 * hesap istenir. Bu bileşen bir AuthProvider ağacı içinde render edilmelidir
 * (bkz. (marketplace)/layout.tsx veya (guest)/page.tsx'teki gömme kullanımı).
 */
export function MarketplaceHome() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = watchApprovedListings((data) => {
      setListings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesCategory = category === "all" ? true : l.category === category;
      const matchesSearch = !q || l.title.toLowerCase().includes(q) || l.district.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [listings, category, search]);

  const activeCategoryLabel = category === "all" ? null : getCategoryByKey(category)?.label;

  async function handleToggleFavorite(listing: MarketplaceListing) {
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }
    const nowFavorite = await toggleFavorite(user.uid, listing.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavorite) next.add(listing.id);
      else next.delete(listing.id);
      return next;
    });
  }

  return (
    <>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-terracotta mb-5">
          Bir host topluluğu, bir şehir
        </p>
        <h1 className="text-[2.6rem] leading-[1.05] md:text-6xl font-light tracking-tight text-ink">
          <span className="font-light text-ink-muted">Nothing but</span>
          <br />
          <span className="font-semibold text-ink">İstanbul.</span>
        </h1>
        <p className="mt-6 text-[15px] text-ink-muted max-w-md mx-auto leading-relaxed">
          Konaklama ve şehir deneyimlerini, doğrudan yerel host'lardan keşfedin.
        </p>

        <div className="mt-9 flex items-center gap-2 max-w-lg mx-auto rounded-full border border-sand-border bg-white shadow-[0_2px_16px_rgba(30,33,41,0.06)] p-1.5 pl-5">
          <Search className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bölge veya ilan adı ara — örn. Sultanahmet"
            className="flex-1 bg-transparent text-[13.5px] py-2 outline-none placeholder:text-ink-muted/60"
          />
          <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-ink text-white text-[12.5px] font-medium px-5 py-2.5 shrink-0">
            Keşfet
          </span>
        </div>
      </section>

      <CategoryFilterBar value={category} onChange={setCategory} />

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="mb-7">
          <h2 className="text-[22px] font-medium tracking-tight text-ink">
            {activeCategoryLabel ?? "Öne çıkan ilanlar"}
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Yükleniyor...</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-sand-border rounded-2xl">
            <p className="text-sm text-ink-muted">Bu aramayla eşleşen ilan yok. Yakında burada olacak.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {visible.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favoriteIds.has(listing.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </>
  );
}
