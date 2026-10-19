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
import { Footer } from "@/components/marketplace/Footer";
import { MARKETPLACE_CATEGORIES, isRemovedCategory, resolveCategoryParam } from "@/lib/marketplace/categories";
import { useCategoryConfigs } from "@/lib/marketplace/use-category-configs";
import { SEED_LISTINGS, getLiveCatalogListings, isRestaurantListing } from "@/lib/marketplace/seed-listings";
import { FirestoreService } from "@/lib/firestore-service";
import { XeniosStore } from "@/lib/store";
import type { GroupType, MarketplaceListing } from "@/lib/marketplace/types";
import { MarketplaceCategoryIcon } from "@/components/marketplace/MarketplaceCategoryIcon";
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
    title: "Clear & Direct (Transparent)",
    description:
      "Closed to surprises, open to Istanbul. We don't just give you fancy words; we provide clear experience details and the city's true local context. You know exactly where you're going and what you'll experience from the very beginning, and you can secure your spot in seconds with our easy digital booking platform.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Genuine Hospitality (Welcoming)",
    description:
      "True hospitality isn't just about a smiling face; it's about ensuring you have an absolutely wonderful time in this city. We set out to offer you a seamless, attentive, and sincere companionship throughout your Istanbul journey. That’s exactly why we brought Comus to life—your specially trained, Gemini-based AI guide. Plus, we don't want to bother you with downloading apps; we designed it as a highly practical mobile web app that you can start using instantly just by tapping \"add to home screen.\"",
    icon: HeartHandshake,
  },
  {
    number: "03",
    title: "Hyper-Local and Intimate (Sincere)",
    description:
      "\"Only Istanbul.\" We haven't expanded to other cities; we have no intention of being everywhere. We are only in Istanbul, and to always provide the best, we will continue to say \"Only Istanbul.\" This city is captivating, but let's admit, as it turns into a massive metropolis, it has corners that lose their sparkle. While it is home to wonderful local artisans and shopkeepers, it's also possible to encounter weary faces in the crowds. Our sole purpose is to host Istanbul’s guests in a manner worthy of this city; presenting them with what is good, beautiful, and valuable, while protecting these treasures and helping them flourish.",
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
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const resolved = resolveCategoryParam(params.get("category"));
        if (resolved) {
          setCategory(resolved);
          setFilterCategory(resolved);
        }
      } catch {}
    }
  }, []);

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
    const deletedIds =
      typeof window !== "undefined" ? XeniosStore.getDeletedExperienceIds() : new Set<string>();
    const hiddenOrSuspendedIds = new Set<string>();
    if (typeof window !== "undefined") {
      XeniosStore.getExperiences().forEach((e) => {
        if (e.status === "suspended" || e.publishToWeb === false || e.deleted) {
          hiddenOrSuspendedIds.add(e.id);
        }
      });
    }

    const map = new Map<string, MarketplaceListing>();
    listings.forEach((item) => {
      if (
        item.status === "approved" &&
        !isDisallowedListing(item) &&
        !deletedIds.has(item.id) &&
        !hiddenOrSuspendedIds.has(item.id)
      ) {
        map.set(item.id, item);
      }
    });
    catalogListings.forEach((item) => {
      if (
        item.status === "approved" &&
        !isDisallowedListing(item) &&
        !deletedIds.has(item.id) &&
        !hiddenOrSuspendedIds.has(item.id)
      ) {
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
      <section className="relative w-full bg-sand-bg flex flex-col items-center justify-center pt-5 pb-2 md:pt-7 md:pb-3 lg:pt-8 lg:pb-4">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/marketplace-hero.webp"
            alt="Purely Istanbul Map"
            fill
            preload={true}
            sizes="100vw"
            className="object-cover opacity-20 md:opacity-25 mix-blend-multiply"
            style={{ objectPosition: "50% 0%" }}
          />
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-sand-bg/75 to-transparent" />
          <div className="absolute left-1/2 bottom-[4%] -translate-x-1/2 w-[88%] max-w-[760px] h-[56%] bg-sand-bg rounded-[100%] blur-3xl opacity-100" />
          <div className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-[76%] max-w-[580px] h-[46%] bg-sand-bg rounded-[100%] blur-2xl opacity-100" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sand-bg via-sand-bg/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-sand-bg" />
        </div>

        <div className="relative z-10 w-52 max-w-[220px] sm:w-64 sm:max-w-[270px] md:w-80 md:max-w-[340px] lg:w-full lg:max-w-[440px] xl:max-w-[460px] mx-auto flex flex-col items-center justify-center pointer-events-none">
          <Image
            src="/images/skyline-drawing-transparent.png"
            alt="Purely Istanbul — nothing but İstanbul."
            width={640}
            height={360}
            preload={true}
            className="w-full h-auto object-contain brightness-0 opacity-100 drop-shadow-sm"
          />
        </div>
      </section>

      {/* Category Filter Bar */}
      <div className="relative z-20 mt-2 md:mt-3 lg:mt-4">
        <CategoryFilterBar value={category} onChange={setCategory} categories={visibleCategories} />
      </div>

      {/* Search Bar */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 md:px-8 pt-5 pb-3 text-center">
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
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                          {filterCategory === c.key ? (
                            <Check className="w-5 h-5 text-terracotta" strokeWidth={2.5} />
                          ) : (
                            <MarketplaceCategoryIcon categoryKey={c.key || c.label} className="w-7 h-7" />
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
                  {filterCategory === "dining-guide"
                    ? "Comus Curated Dining Guide"
                    : categoryConfigs.find((c) => c.key === filterCategory)?.label}
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
                title={c.key === "cat-8" ? "Curated Artisan & Bazaar Shopping" : c.label}
                subtitle={
                  c.key === "cat-8"
                    ? "Authentic craftsmanship, private bazaar access, and bespoke atelier visits"
                    : c.subtitle
                }
                icon={c.icon}
                listings={withCover.filter((l) => l.category === c.key && !isRestaurantListing(l))}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onTitleClick={() => {
                  setFilterCategory(c.key);
                  if (typeof window !== "undefined") {
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.set("category", c.slug || c.key);
                      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
                    } catch {}
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ))}

          <CategoryShelf
            id="shelf-dining-guide"
            title="Comus Curated Dining Guide"
            subtitle="An independent, price-free informational guide to Istanbul's finest culinary landmarks, Michelin-starred tables, and historic lokantas — curated by Comus."
            icon="Utensils"
            listings={withCover.filter((l) => isRestaurantListing(l))}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onTitleClick={() => {
              setFilterCategory("dining-guide");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* SECTION: Guiding Pillars */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-12 pb-8">
        <div className="rounded-3xl border border-sand-border bg-white p-6 sm:p-10 md:p-12 shadow-[0_8px_36px_rgba(11,25,44,0.05)]">
          <div className="max-w-3xl">
            <h2 className="font-luxury-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-tight">
              &lsquo;Tanrı Misafiri&rsquo;: The True Spirit of Istanbul
            </h2>
            <p className="mt-4 text-sm sm:text-base text-ink leading-relaxed font-medium">
              We will never let you feel like a &ldquo;walking wallet&rdquo; while exploring Istanbul. Rooted in our centuries-old belief of the &ldquo;Guest of God&rdquo; (Tanrı Misafiri), we see you as the honored guest of this city. Alongside the trusted locals we work with, we remove all the question marks and anxieties from your journey, replacing them with trust, transparency, and the pure Istanbul experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
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
              Every partner on <span translate="no" className="notranslate">Purely Istanbul</span> is pre-vetted for licensing, transparent local pricing, and genuine Turkish hospitality.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: About Us & Brand Story */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        <div className="rounded-3xl bg-[#0B192C] text-white p-6 sm:p-10 md:p-12 shadow-[0_16px_48px_rgba(11,25,44,0.16)] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D47A43]">
              <Globe2 className="w-3.5 h-3.5" />
              About Us &amp; Brand Story
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D47A43]/20 border border-[#D47A43]/40 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5 text-[#D47A43]" strokeWidth={1.75} />
              </div>
              <h3 className="font-luxury-serif text-lg font-semibold text-white mb-2">Who Are We?</h3>
              <p className="text-[13.5px] text-white/75 leading-relaxed">
                <span translate="no" className="notranslate">Purely Istanbul</span> was created by the proud locals of this city for one single purpose: to keep you completely away from tourist traps and navigate you directly to the true heart of Istanbul. With us, you experience the city not as a tourist, but as a local.
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D47A43]/20 border border-[#D47A43]/40 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-[#D47A43]" strokeWidth={1.75} />
              </div>
              <h3 className="font-luxury-serif text-lg font-semibold text-white mb-2">Vetted Local Perfection</h3>
              <p className="text-[13.5px] text-white/75 leading-relaxed">
                Every experience is hand-selected and operated by licensed TÜRSAB Group A agencies, certified D2 luxury fleets, and time-honored Istanbul artisans at transparent local rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
