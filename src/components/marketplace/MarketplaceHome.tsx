"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Filter,
  Search,
  Baby,
  PawPrint,
  Clock,
  Users,
  X,
  ChevronDown,
  Check,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Compass,
  Sparkles,
  QrCode,
  Building2,
  ArrowRight,
  Globe2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { watchApprovedListings } from "@/lib/marketplace/listings";
import { toggleFavorite, watchUserFavoriteIds } from "@/lib/marketplace/favorites";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { CategoryFilterBar } from "@/components/marketplace/CategoryFilterBar";
import { CategoryShelf } from "@/components/marketplace/CategoryShelf";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { MARKETPLACE_CATEGORIES, isRemovedCategory } from "@/lib/marketplace/categories";
import { useCategoryConfigs } from "@/lib/marketplace/use-category-configs";
import { SEED_LISTINGS, getLiveCatalogListings } from "@/lib/marketplace/seed-listings";
import { FirestoreService } from "@/lib/firestore-service";
import type { GroupType, MarketplaceListing } from "@/lib/marketplace/types";
import { toast } from "sonner";

type DurationBucket = "" | "short" | "half" | "full";

const GROUP_TYPE_OPTIONS: { key: GroupType; label: string }[] = [
  { key: "single", label: "Solo" },
  { key: "couple", label: "Couple" },
  { key: "group", label: "Group" },
];

const DURATION_OPTIONS: { key: DurationBucket; label: string }[] = [
  { key: "short", label: "Short (≤ 1.5 hrs)" },
  { key: "half", label: "Half Day" },
  { key: "full", label: "Full Day" },
];

const GUIDING_PILLARS = [
  {
    number: "01",
    title: "Radical Transparency (Şeffaf)",
    description:
      "Real local rates, zero tourist markups, zero hidden backroom commissions, secure Stripe processing.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Fairness for All (Adil)",
    description:
      "While global platforms take 25-30% from local boat captains and artisans, we charge a modest 10-12% tech fee so authentic Turkish craftspeople thrive and travelers save.",
    icon: Scale,
  },
  {
    number: "03",
    title: "Genuine Hospitality (Misafirperver)",
    description:
      "The timeless Turkish hosting tradition digitized. If an experience doesn't match our verified standards, our dedicated guest care resolves it with empathy and speed.",
    icon: HeartHandshake,
  },
  {
    number: "04",
    title: "Hyper-Local & Sincere (Samimi)",
    description:
      "\"Nothing but Istanbul.\" We don't stretch across 100 cities. We know every cobble of Galata, every tea garden in Kadıköy, and every historical secret of Sultanahmet.",
    icon: Compass,
  },
];

function matchesDurationBucket(minutes: number | undefined, bucket: DurationBucket) {
  if (!bucket || minutes == null) return true;
  if (bucket === "short") return minutes <= 90;
  if (bucket === "half") return minutes > 90 && minutes <= 240;
  return minutes > 240;
}

function isDisallowedListing(item: MarketplaceListing): boolean {
  if (isRemovedCategory(item.category)) return true;
  const hay = `${item.title} ${item.description}`.toLowerCase();
  if (
    hay.includes("medikal estetik") ||
    hay.includes("saç ekimi") ||
    hay.includes("hair transplant") ||
    hay.includes("hollywood smile") ||
    hay.includes("botoks") ||
    hay.includes("bichectomy") ||
    hay.includes("bişektomi") ||
    hay.includes("medical tourism") ||
    hay.includes("istanbul'da yatırım")
  ) {
    return true;
  }
  return false;
}

export function MarketplaceHome() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [catalogListings, setCatalogListings] = useState<MarketplaceListing[]>(SEED_LISTINGS);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(MARKETPLACE_CATEGORIES[0]?.key ?? "");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
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
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    const unsub = watchUserFavoriteIds(user.uid, setFavoriteIds);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const refreshCatalog = () => {
      setCatalogListings(getLiveCatalogListings());
    };
    refreshCatalog();

    const unsubCatalog = FirestoreService.subscribeToCatalogSync();
    window.addEventListener("xenios_experiences_updated", refreshCatalog);
    window.addEventListener("xenios_properties_updated", refreshCatalog);
    window.addEventListener("xenios_hotels_updated", refreshCatalog);

    const unsub = watchApprovedListings((data) => {
      setListings(data);
      setLoading(false);
    });
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => {
      unsub();
      unsubCatalog();
      window.removeEventListener("xenios_experiences_updated", refreshCatalog);
      window.removeEventListener("xenios_properties_updated", refreshCatalog);
      window.removeEventListener("xenios_hotels_updated", refreshCatalog);
      clearTimeout(timeout);
    };
  }, []);

  const source = useMemo(() => {
    const map = new Map<string, MarketplaceListing>();
    listings.forEach((item) => {
      if (item.status === "approved" && !isDisallowedListing(item)) {
        map.set(item.id, item);
      }
    });
    catalogListings.forEach((item) => {
      if (item.status === "approved" && !isDisallowedListing(item)) {
        map.set(item.id, item);
      } else {
        map.delete(item.id);
      }
    });
    return Array.from(map.values());
  }, [listings, catalogListings]);

  const categoryConfigs = useCategoryConfigs();
  const hiddenCategoryKeys = useMemo(
    () => new Set(categoryConfigs.filter((c) => c.hidden).map((c) => c.key)),
    [categoryConfigs]
  );
  const withCover = useMemo(
    () => source.filter((l) => !!l.coverImageUrl && !hiddenCategoryKeys.has(l.category)),
    [source, hiddenCategoryKeys]
  );
  const visibleCategories = useMemo(
    () => categoryConfigs.filter((c) => !c.hidden && withCover.some((l) => l.category === c.key)),
    [categoryConfigs, withCover]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !filterCategory && activeAdvancedFilterCount === 0) return null;
    return withCover.filter((l) => {
      const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.district.toLowerCase().includes(q);
      const matchesCategory = !filterCategory || l.category === filterCategory;
      const matchesGroup = !groupType || (l.suitableFor?.includes(groupType) ?? true);
      const matchesChild = !childFriendly || l.childFriendly !== false;
      const matchesPet = !petFriendly || l.petFriendly !== false;
      const matchesDuration = matchesDurationBucket(l.durationMinutes, durationBucket);
      return matchesQuery && matchesCategory && matchesGroup && matchesChild && matchesPet && matchesDuration;
    });
  }, [withCover, search, filterCategory, activeAdvancedFilterCount, groupType, childFriendly, petFriendly, durationBucket]);

  async function handleToggleFavorite(listing: MarketplaceListing) {
    if (!user) {
      toast.error("Please sign in to save experiences to your wishlist.");
      return;
    }
    const wasFav = favoriteIds.has(listing.id);
    const nowFavorite = await toggleFavorite(user.uid, listing.id, wasFav);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavorite) next.add(listing.id);
      else next.delete(listing.id);
      return next;
    });
  }

  return (
    <>
      {/* Hero — Map & Skyline */}
      <section className="relative w-full bg-sand-bg flex flex-col justify-end -mt-[84px] pt-[84px]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/marketplace-hero.webp"
            alt="Purely Istanbul Map"
            fill
            preload={true}
            sizes="100vw"
            className="object-cover opacity-25 mix-blend-multiply"
            style={{ objectPosition: "50% 0%" }}
          />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-sand-bg via-sand-bg/80 to-transparent" />
          <div className="absolute left-1/2 bottom-[5%] -translate-x-1/2 w-[90%] max-w-[800px] h-[50%] bg-sand-bg rounded-[100%] blur-3xl opacity-100" />
          <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[80%] max-w-[600px] h-[40%] bg-sand-bg rounded-[100%] blur-2xl opacity-100" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sand-bg via-sand-bg/95 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-sand-bg" />
        </div>

        <div className="relative z-10 w-full max-w-[380px] mx-auto px-6 flex justify-center pointer-events-none mt-12 sm:mt-4 pb-0">
          <Image
            src="/images/skyline-drawing-transparent.png"
            alt="Purely Istanbul — Nothing but Istanbul"
            width={600}
            height={320}
            preload={true}
            className="w-full h-auto object-contain brightness-0 opacity-100 drop-shadow-2xl"
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center pt-1 pb-2">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-terracotta mb-1.5">
            London-Registered Hospitality Technology SaaS &amp; Curated Marketplace
          </p>
          <h1 className="font-luxury-serif text-xl sm:text-2xl md:text-3xl font-semibold text-ink tracking-tight">
            Purely Istanbul — Nothing but Istanbul.
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted max-w-2xl mx-auto mt-1.5 leading-relaxed">
            The in-room hospitality operating system and curated city companion for travelers staying in Istanbul&apos;s finest boutique hotels and designer suites.
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      <div className="relative z-20 mt-1 sm:mt-2">
        <CategoryFilterBar value={category} onChange={setCategory} categories={visibleCategories} />
      </div>

      {/* Search Bar */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 md:px-8 pt-7 pb-4 text-center">
        <div className="flex items-center justify-between gap-3 w-full mx-auto rounded-full border border-sand-border bg-white shadow-[0_4px_24px_rgba(11,25,44,0.04)] p-1.5 pl-5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by neighborhood or experience — e.g. Sultanahmet"
              className="w-full bg-transparent text-[13.5px] py-2 outline-none placeholder:text-ink-muted/60"
            />
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-4 border-l border-sand-border">
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-1.5 bg-transparent text-[13.5px] font-medium text-ink outline-none cursor-pointer hover:text-terracotta transition"
              >
                <span className="truncate max-w-[200px]">
                  {filterCategory ? visibleCategories.find((c) => c.key === filterCategory)?.label : "All Categories"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-ink-muted transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                />
              </button>

              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowCategoryDropdown(false)} />
                  <div className="absolute right-0 top-full mt-4 w-[320px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(11,25,44,0.14)] border border-sand-border py-2 z-40 max-h-[60vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCategory("");
                        setShowCategoryDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-sand-bg transition"
                    >
                      <div className="w-6 flex justify-center shrink-0">
                        {!filterCategory && <Check className="w-5 h-5 text-terracotta" strokeWidth={2.5} />}
                      </div>
                      <span
                        className={`text-[13.5px] ${!filterCategory ? "font-semibold text-terracotta" : "font-medium text-ink"}`}
                      >
                        All Categories
                      </span>
                    </button>
                    {visibleCategories.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          setFilterCategory(c.key);
                          setShowCategoryDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-sand-bg transition group"
                      >
                        <div className="w-6 flex justify-center shrink-0">
                          {filterCategory === c.key ? (
                            <Check className="w-5 h-5 text-terracotta" strokeWidth={2.5} />
                          ) : (
                            c.icon && (
                              <Image
                                src={c.icon}
                                alt=""
                                width={24}
                                height={24}
                                className="object-contain opacity-50 group-hover:opacity-100 transition"
                              />
                            )
                          )}
                        </div>
                        <span
                          className={`text-[13.5px] ${
                            filterCategory === c.key
                              ? "font-semibold text-terracotta"
                              : "font-medium text-ink group-hover:text-terracotta"
                          }`}
                        >
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink hover:text-terracotta transition"
            >
              <Filter className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
              <span className="hidden sm:inline">Filters</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-terracotta text-white text-[10px] font-semibold ml-0.5">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                document.getElementById("marketplace-listings")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-ink text-white text-[13px] font-medium px-6 py-2.5 cursor-pointer hover:bg-terracotta transition"
            >
              Explore
            </button>
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
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-bg hover:bg-sand-border/60 flex items-center justify-center text-ink-muted transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-luxury-serif text-xl font-semibold tracking-tight text-ink mb-5">Filters</h2>

            <div className="space-y-6">
              <div>
                <p className="text-[12.5px] font-semibold text-ink-muted mb-2 flex items-center gap-1.5">Date Range</p>
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
                  Group Type
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
                  Experience Duration
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
                  <span className="text-[13.5px] text-ink">Family-friendly</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petFriendly}
                    onChange={(e) => setPetFriendly(e.target.checked)}
                    className="w-4 h-4 rounded accent-terracotta"
                  />
                  <PawPrint className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
                  <span className="text-[13.5px] text-ink">Pet-friendly</span>
                </label>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={clearAdvancedFilters}
                className="flex-1 rounded-full border border-sand-border text-ink-muted font-semibold py-2.5 text-sm hover:border-ink/40 hover:text-ink transition"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="flex-1 rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p id="marketplace-listings" className="text-sm text-ink-muted text-center py-16">
          Loading curated Istanbul experiences...
        </p>
      ) : searchResults ? (
        <div id="marketplace-listings" className="max-w-6xl mx-auto px-5 md:px-8 py-6">
          {filterCategory && !search.trim() && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-luxury-serif text-xl sm:text-2xl font-semibold text-ink">
                  {categoryConfigs.find((c) => c.key === filterCategory)?.label}
                </h2>
              </div>
              <button
                onClick={() => setFilterCategory("")}
                className="text-xs font-semibold text-terracotta border border-terracotta/30 rounded-full px-4 py-1.5 hover:bg-terracotta/5 transition"
              >
                ← All Categories
              </button>
            </div>
          )}
          {searchResults.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-sand-border rounded-2xl">
              <p className="text-sm text-ink-muted">No experiences match your current search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-10">
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
        <div id="marketplace-listings" className="pb-6">
          {categoryConfigs
            .filter((c) => !c.hidden)
            .map((c) => (
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

      {/* SECTION: Our Ethical Charter & The 4 Guiding Pillars */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-12 pb-8">
        <div className="rounded-3xl border border-sand-border bg-white p-6 sm:p-10 md:p-12 shadow-[0_8px_36px_rgba(11,25,44,0.05)]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 border border-terracotta/25 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta mb-4">
              Our Ethical Charter &amp; Guest Commitment
            </span>
            <h2 className="font-luxury-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-tight">
              Honored Guests, Never Walking Wallets.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-ink leading-relaxed font-medium">
              &ldquo;At Purely Istanbul, we believe every traveler should experience Istanbul not as a walking wallet, but as an honored guest (&apos;Tanrı Misafiri&apos;). We replace anxiety with authenticity through radical transparency, pre-vetted local partners, and direct accountability.&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
            {GUIDING_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="rounded-2xl border border-sand-border bg-sand-bg/70 p-6 flex flex-col justify-between hover:border-terracotta/40 hover:bg-white transition-all duration-300 shadow-[0_2px_12px_rgba(11,25,44,0.03)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center">
                        <Icon className="w-5 h-5 text-terracotta" strokeWidth={1.75} />
                      </div>
                      <span className="font-mono text-xs font-semibold text-terracotta">{pillar.number}</span>
                    </div>
                    <h3 className="font-luxury-serif text-lg font-semibold text-ink mb-2">{pillar.title}</h3>
                    <p className="text-[13px] text-ink-muted leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-sand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-ink-muted">
              Every partner on Purely Istanbul is pre-vetted for licensing, transparent local pricing, and genuine Turkish hospitality.
            </p>
            <Link
              href="/our-philosophy"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-terracotta hover:text-ink transition shrink-0"
            >
              Read Our Full Ethical Charter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: About Us & Brand Story */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="rounded-3xl bg-[#0B192C] text-white p-6 sm:p-10 md:p-12 shadow-[0_16px_48px_rgba(11,25,44,0.16)] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D47A43] mb-4">
              <Globe2 className="w-3.5 h-3.5" />
              About Us &amp; Brand Story
            </span>
            <h2 className="font-luxury-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Purely Istanbul — Nothing but Istanbul.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
              The in-room hospitality operating system and curated city companion for travelers staying in Istanbul&apos;s finest boutique hotels and designer suites.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D47A43]/20 border border-[#D47A43]/40 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5 text-[#D47A43]" strokeWidth={1.75} />
              </div>
              <h3 className="font-luxury-serif text-lg font-semibold text-white mb-2">The Genesis</h3>
              <p className="text-[13.5px] text-white/75 leading-relaxed">
                Founded in London by proud locals, Purely Istanbul was created to end predatory tourist traps and bridge discerning world travelers directly to the city’s heart.
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D47A43]/20 border border-[#D47A43]/40 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-[#D47A43]" strokeWidth={1.75} />
              </div>
              <h3 className="font-luxury-serif text-lg font-semibold text-white mb-2">The Trojan Horse Innovation</h3>
              <p className="text-[13.5px] text-white/75 leading-relaxed">
                An in-room smart QR stand offering instant Wi-Fi access, seamless PWA guest services (maintenance, catering, laundry), and vetted city excursions without downloading an app.
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D47A43]/20 border border-[#D47A43]/40 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-[#D47A43]" strokeWidth={1.75} />
              </div>
              <h3 className="font-luxury-serif text-lg font-semibold text-white mb-2">ComusAI Spotlight</h3>
              <p className="text-[13.5px] text-white/75 leading-relaxed">
                Meet &ldquo;ComusAI&rdquo; — our proprietary Gemini-powered hyper-local AI concierge. It automatically speaks the guest&apos;s native browser language, offers scam-free live navigation, and crafts tailored daily walks like a trusted local friend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: For Boutique Hotels & Property Managers (B2B Hospitality SaaS) */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="rounded-3xl border border-sand-border bg-white p-6 sm:p-10 md:p-12 shadow-[0_8px_36px_rgba(11,25,44,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 border border-ink/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              <Building2 className="w-3.5 h-3.5 text-terracotta" />
              For Boutique Hotels &amp; Property Managers
            </span>
            <h2 className="font-luxury-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Zero Software Fees, Zero Extra Work.
            </h2>
            <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
              Enhance your guest satisfaction with a branded in-room PWA, automate Wi-Fi &amp; housekeeping requests, and earn passive ancillary revenue on every city experience booked by your guests.
            </p>
            <p className="text-xs sm:text-sm font-medium text-terracotta">
              Custom in-room acrylic stands provided to verified partners with zero upfront friction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/marketplace/partner/extranet"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink hover:bg-terracotta text-white font-semibold px-6 py-3 text-sm transition"
            >
              For Boutique Hotels &amp; Property Managers
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/marketplace/partner/kayit"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sand-border hover:border-ink text-ink font-semibold px-6 py-3 text-sm transition"
            >
              Apply as a Verified Partner
            </Link>
          </div>
        </div>
      </section>

      <MarketplaceFooter />
    </>
  );
}
