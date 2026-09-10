"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Filter, Search, Baby, PawPrint, Clock, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CategoryFilterBar } from "@/components/marketplace/CategoryFilterBar";
import { CategoryShelf } from "@/components/marketplace/CategoryShelf";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";
import { SEED_LISTINGS } from "@/lib/marketplace/seed-listings";
import type { GroupType, MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

type DurationBucket = "" | "short" | "half" | "full";

const GROUP_TYPE_OPTIONS: { key: GroupType; label: string }[] = [
  { key: "single", label: "Tek" },
  { key: "couple", label: "Çift" },
  { key: "group", label: "Grup" },
];

const DURATION_OPTIONS: { key: DurationBucket; label: string }[] = [
  { key: "short", label: "Kısa (≤ 1.5 saat)" },
  { key: "half", label: "Yarım Gün" },
  { key: "full", label: "Tam Gün" },
];

function matchesDurationBucket(minutes: number | undefined, bucket: DurationBucket) {
  if (!bucket || minutes == null) return true;
  if (bucket === "short") return minutes <= 90;
  if (bucket === "half") return minutes > 90 && minutes <= 240;
  return minutes > 240;
}

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

  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupType, setGroupType] = useState<GroupType | "">("");
  const [childFriendly, setChildFriendly] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [durationBucket, setDurationBucket] = useState<DurationBucket>("");

  const activeAdvancedFilterCount = [
    !!groupType,
    childFriendly,
    petFriendly,
    !!durationBucket,
    !!dateFrom || !!dateTo,
  ].filter(Boolean).length;

  function clearAdvancedFilters() {
    setDateFrom("");
    setDateTo("");
    setGroupType("");
    setChildFriendly(false);
    setPetFriendly(false);
    setDurationBucket("");
  }

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
    if (!q && !filterCategory && activeAdvancedFilterCount === 0) return null;
    return withCover.filter((l) => {
      const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.district.toLowerCase().includes(q);
      const matchesCategory = !filterCategory || l.category === filterCategory;
      const matchesGroup = !groupType || (l.suitableFor?.includes(groupType) ?? true);
      // Bu alanlar henüz her ilanda dolu değil (özellikle eski, gerçek host
      // ilanlarında) — bilinmiyor durumunda ilanı dışlamak yerine göstermeye
      // devam ederiz, yalnızca açıkça "uygun değil" işaretlenmişse gizleriz.
      const matchesChild = !childFriendly || l.childFriendly !== false;
      const matchesPet = !petFriendly || l.petFriendly !== false;
      const matchesDuration = matchesDurationBucket(l.durationMinutes, durationBucket);
      return matchesQuery && matchesCategory && matchesGroup && matchesChild && matchesPet && matchesDuration;
    });
  }, [withCover, search, filterCategory, activeAdvancedFilterCount, groupType, childFriendly, petFriendly, durationBucket]);

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
      {/* Hero — Harita ve Çizim */}
      <section className="relative w-full bg-sand-bg flex flex-col justify-end pt-[10vh] sm:pt-[14vh]">
        {/* Background Map Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/marketplace-hero.webp"
            alt="Purely İstanbul Map"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
            style={{ objectPosition: "50% 0%" }}
          />
          {/* Üst Kısım Şeffaflık Geçişi (Header için) */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sand-bg/95 via-sand-bg/60 to-transparent" />
          
          {/* Ortadaki eski çizimi gizlemek için maske (sand-bg renginde yumuşak bir daire/elips) */}
          <div className="absolute left-1/2 bottom-[5%] -translate-x-1/2 w-[90%] max-w-[800px] h-[50%] bg-sand-bg rounded-[100%] blur-3xl opacity-100" />
          <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[80%] max-w-[600px] h-[40%] bg-sand-bg rounded-[100%] blur-2xl opacity-100" />
          
          {/* En alttaki purely istanbul yazısını tamamen gizlemek için alt maske */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sand-bg via-sand-bg/95 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-sand-bg" />
        </div>

        {/* Yeni Skyline Çizimi */}
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 flex justify-center pointer-events-none mt-8 sm:mt-14 pb-4">
          <Image
            src="/images/skyline-drawing-transparent.png"
            alt="Nothing but Istanbul"
            width={600}
            height={320}
            className="w-full h-auto object-contain opacity-95"
          />
        </div>
      </section>

      {/* Kategori Çubuğu */}
      <div className="relative z-20 -mt-4 sm:-mt-6">
        <CategoryFilterBar value={category} onChange={setCategory} />
      </div>

      {/* Arama Kutusu (Kategorilerin Altında) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 md:px-8 pt-8 pb-4 text-center">
        <div className="flex items-center justify-between gap-3 w-full mx-auto rounded-full border border-sand-border bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-1.5 pl-5">
          
          {/* Sol: Arama İkonu ve Input */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Bölge veya ilan adı ara — örn. Sultanahmet"
              className="w-full bg-transparent text-[13.5px] py-2 outline-none placeholder:text-ink-muted/60"
            />
          </div>

          {/* Sağ: Kategoriler, Filtreler, Keşfet */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-4 border-l border-sand-border">
            {/* Tüm Kategoriler */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Kategoriye göre filtrele"
              className="appearance-none bg-transparent text-[13px] font-medium text-ink outline-none cursor-pointer hidden sm:block"
            >
              <option value="">Tüm Kategoriler</option>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Filtreler Butonu */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink hover:text-terracotta transition"
            >
              <Filter className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
              <span className="hidden sm:inline">Filtreler</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-terracotta text-white text-[10px] font-semibold ml-0.5">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </button>

            {/* Keşfet Butonu */}
            <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-ink text-white text-[13px] font-medium px-6 py-2.5 cursor-pointer hover:bg-terracotta transition">
              Keşfet
            </span>
          </div>
        </div>
      </div>

      {showFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-sand-border relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFilters(false)}
              aria-label="Kapat"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-bg hover:bg-sand-border/60 flex items-center justify-center text-ink-muted transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold tracking-tight text-ink mb-5">Filtreler</h2>

            <div className="space-y-6">
              <div>
                <p className="text-[12.5px] font-semibold text-ink-muted mb-2 flex items-center gap-1.5">
                  Tarih Aralığı
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 rounded-xl border border-sand-border bg-sand-bg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                  <span className="text-ink-muted text-xs">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 rounded-xl border border-sand-border bg-sand-bg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-semibold text-ink-muted mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Katılım Tipi
                </p>
                <div className="flex gap-2">
                  {GROUP_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setGroupType((prev) => (prev === opt.key ? "" : opt.key))}
                      className={`flex-1 rounded-full border px-3 py-2 text-[12.5px] font-medium transition ${
                        groupType === opt.key
                          ? "bg-ink text-white border-ink"
                          : "bg-white text-ink-muted border-sand-border hover:border-ink/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-semibold text-ink-muted mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Etkinlik Süresi
                </p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDurationBucket((prev) => (prev === opt.key ? "" : opt.key))}
                      className={`rounded-full border px-3 py-2 text-[12.5px] font-medium transition ${
                        durationBucket === opt.key
                          ? "bg-ink text-white border-ink"
                          : "bg-white text-ink-muted border-sand-border hover:border-ink/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={childFriendly}
                    onChange={(e) => setChildFriendly(e.target.checked)}
                    className="w-4 h-4 rounded accent-terracotta"
                  />
                  <Baby className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
                  <span className="text-[13.5px] text-ink">Çocuklara uygun</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petFriendly}
                    onChange={(e) => setPetFriendly(e.target.checked)}
                    className="w-4 h-4 rounded accent-terracotta"
                  />
                  <PawPrint className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
                  <span className="text-[13.5px] text-ink">Evcil hayvan kabul eden</span>
                </label>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={clearAdvancedFilters}
                className="flex-1 rounded-full border border-sand-border text-ink-muted font-semibold py-2.5 text-sm hover:border-ink/40 hover:text-ink transition"
              >
                Filtreleri Temizle
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="flex-1 rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted text-center py-16">Yükleniyor...</p>
      ) : searchResults ? (
        // Arama aktifken tek bir grid olarak sonuçlar gösterilir.
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6">
          {filterCategory && !search.trim() && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-ink">
                  {MARKETPLACE_CATEGORIES.find(c => c.key === filterCategory)?.label}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">{searchResults?.length ?? 0} ilan</p>
              </div>
              <button
                onClick={() => setFilterCategory("")}
                className="text-xs font-semibold text-terracotta border border-terracotta/30 rounded-full px-4 py-1.5 hover:bg-terracotta/5 transition"
              >
                ← Tüm Kategoriler
              </button>
            </div>
          )}
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
              icon={c.icon}
              listings={withCover.filter((l) => l.category === c.key)}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onTitleClick={() => {
                setFilterCategory(c.key);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ))}
        </div>
      )}

      <MarketplaceFooter />
    </>
  );
}
