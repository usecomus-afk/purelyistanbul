"use client";

import Image from "next/image";
import { MARKETPLACE_CATEGORIES, type MarketplaceCategory } from "@/lib/marketplace/categories";
import { LuxuryCategoryIcon } from "@/components/guest/luxury-category-icon";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
  categories?: MarketplaceCategory[];
}

function isCustomUploadedIcon(icon?: string): boolean {
  if (!icon) return false;
  return !icon.startsWith("/icons/categories/") && !icon.startsWith("/icons/menu/");
}

export function CategoryFilterBar({ value, onChange, categories = MARKETPLACE_CATEGORIES }: CategoryFilterBarProps) {
  function handleSelect(c: MarketplaceCategory) {
    onChange(c.key);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("category", c.slug || c.key);
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      } catch {}
    }
    const target = document.getElementById(c.key === "all" ? "shelves-top" : `shelf-${c.key}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 w-full bg-sand-bg/92 backdrop-blur-md border-b border-sand-border/60 py-3.5">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6">
        <div
          className="flex items-stretch gap-2.5 sm:gap-2.5 overflow-x-auto pt-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-between"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((c) => {
            const isSelected = value === c.key;
            const hasCustomIcon = isCustomUploadedIcon(c.icon);
            const displayLabel = c.key === "cat-8" ? "Curated Artisan & Bazaar Shopping" : c.label;
            return (
              <button
                key={c.key}
                type="button"
                data-category-key={c.key}
                data-category-slug={c.slug || c.key}
                onClick={() => handleSelect(c)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-between gap-1.5 group cursor-pointer shrink-0 sm:flex-1 w-[86px] sm:w-auto sm:min-w-[92px] rounded-[20px] px-2 py-2.5 ${
                  isSelected ? "category-3d-module category-3d-module-active" : "category-3d-module"
                }`}
              >
                <span className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-200">
                  {hasCustomIcon && c.icon ? (
                    <span className="relative w-11 h-11 rounded-full gilded-icon-plinth flex items-center justify-center p-1.5">
                      <Image
                        src={c.icon}
                        alt=""
                        fill
                        unoptimized={!c.icon.startsWith("/")}
                        className="object-contain p-1.5 drop-shadow-[0_2px_3px_rgba(92,64,18,0.35)]"
                      />
                    </span>
                  ) : (
                    <LuxuryCategoryIcon
                      categoryKey={c.key || displayLabel}
                      className="w-12 h-12 sm:w-14 sm:h-14"
                    />
                  )}
                </span>
                <span
                  className={`text-[10.5px] sm:text-[11px] tracking-tight text-center leading-[1.18] w-full line-clamp-2 transition-colors ${
                    isSelected
                      ? "text-[#5C3D0E] font-bold"
                      : "text-[#2A2116] font-semibold group-hover:text-[#6E4912]"
                  }`}
                >
                  {displayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

