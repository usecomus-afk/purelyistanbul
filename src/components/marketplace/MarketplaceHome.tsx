"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CategoryFilterBar } from "@/components/marketplace/CategoryFilterBar";
import { CategoryShelf } from "@/components/marketplace/CategoryShelf";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";
import { SEED_LISTINGS } from "@/lib/marketplace/seed-listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

/**
 * Purely Istanbul Marketplace vitrini. Herkese açıktır: giriş yapılmadan
 * görüntülenebilir, rezervasyon adımına (mock ödeme öncesi) kadar da giriş
 * gerekmez — sadece favori eklemek için hesap istenir. Bu bileşen bir
 * AuthProvider ağacı içinde render edilmelidir (bkz. (marketplace)/layout.tsx
 * veya (guest)/page.tsx'teki gömme kullanımı).
 */
export function MarketplaceHome() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(MARKETPLACE_CATEGORIES[0]?.key ?? "");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = watchApprovedListings((data) => {
      setListings(data);
      setLoading(false);
    });
    // Firestore hiç yanıt vermezse (ne veri ne hata) vitrin sonsuza kadar
    // "Yükleniyor..." demesin — birkaç saniye sonra örnek ilanlara düşülür.
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  // Henüz onaylı gerçek host ilanı yokken vitrin boş görünmesin diye markanın
  // kendi örnek ilanları gösterilir; gerçek bir ilan onaylandığı an bunlar
  // otomatik olarak devre dışı kalır.
  const source = !loading && listings.length === 0 ? SEED_LISTINGS : listings;
  const withCover = useMemo(() => source.filter((l) => !!l.coverImageUrl), [source]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !filterCategory) return null;
    return withCover.filter((l) => {
      const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.district.toLowerCase().includes(q);
      const matchesCategory = !filterCategory || l.category === filterCategory;
      return matchesQuery && matchesCategory;
    });
  }, [withCover, search, filterCategory]);

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
      <CategoryFilterBar value={category} onChange={setCategory} />

      {/* Hero — kategori çubuğunun altında, arama kutusu burada */}
      <section className="max-w-3xl mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-10 text-center">
        <h1 className="text-2xl md:text-4xl font-light tracking-tight text-ink">
          <span className="text-ink-muted">Nothing but</span> <span className="font-semibold text-ink">İstanbul.</span>
        </h1>

        <div className="mt-6 flex items-center gap-1 max-w-lg mx-auto rounded-full border border-sand-border bg-white shadow-[0_2px_16px_rgba(30,33,41,0.06)] p-1.5 pl-5">
          <Search className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bölge veya ilan adı ara — örn. Sultanahmet"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] py-2 outline-none placeholder:text-ink-muted/60"
          />
          <div className="relative shrink-0 border-l border-sand-border pl-2">
            <Filter className="w-3.5 h-3.5 text-ink-muted absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Kategoriye göre filtrele"
              className="appearance-none bg-transparent text-[12px] font-medium text-ink rounded-full pl-6 pr-2 py-2 outline-none cursor-pointer max-w-[110px] sm:max-w-none"
            >
              <option value="">Tüm Kategoriler</option>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-ink text-white text-[12.5px] font-medium px-5 py-2.5 shrink-0">
            Keşfet
          </span>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-ink-muted text-center py-16">Yükleniyor...</p>
      ) : searchResults ? (
        // Arama aktifken tek bir grid olarak sonuçlar gösterilir.
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6">
          {searchResults.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-sand-border rounded-2xl">
              <p className="text-sm text-ink-muted">Bu aramayla eşleşen ilan yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {searchResults.map((listing) => (
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
      ) : (
        // Varsayılan görünüm: her kategori kendi yatay kayan rafında.
        <div className="pb-6">
          {MARKETPLACE_CATEGORIES.map((c) => (
            <CategoryShelf
              key={c.key}
              id={`shelf-${c.key}`}
              title={c.label}
              listings={withCover.filter((l) => l.category === c.key)}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <MarketplaceFooter />
    </>
  );
}
