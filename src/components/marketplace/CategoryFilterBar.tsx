"use client";

import Image from "next/image";
import { MARKETPLACE_CATEGORIES, type MarketplaceCategory } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
  categories?: MarketplaceCategory[];
}

export function CategoryFilterBar({ value, onChange, categories = MARKETPLACE_CATEGORIES }: CategoryFilterBarProps) {
  function handleSelect(key: string) {
    onChange(key);
    const target = document.getElementById(key === "all" ? "shelves-top" : `shelf-${key}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 w-full bg-sand-bg/90 backdrop-blur-md border-b border-sand-border/60 py-3">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6">
        <div
          className="flex items-start gap-3 sm:gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-between"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((c) => {
            const isSelected = value === c.key;
            return (
              <button
                key={c.key}
                onClick={() => handleSelect(c.key)}
                aria-pressed={isSelected}
                className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0 sm:flex-1 w-[64px] sm:w-auto"
              >
                <span
                  className={`w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border p-2 transition-all duration-200 ${
                    isSelected
                      ? "bg-white border-terracotta/70 shadow-[0_6px_16px_-6px_rgba(196,91,54,0.45)]"
                      : "bg-white/70 border-sand-border group-hover:bg-white group-hover:border-terracotta/40"
                  }`}
                >
                  <span className="relative w-full h-full flex items-center justify-center">
                    {c.icon ? (
                      <Image
                        src={c.icon}
                        alt=""
                        fill
                        unoptimized={!c.icon.startsWith("/")}
                        className={`object-contain ${
                          c.icon.includes("kulturel-miras") ? "scale-[1.25]" : ""
                        }`}
                      />
                    ) : (
                      <span className="text-lg font-semibold text-terracotta">
                        {c.label.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`text-[10.5px] sm:text-[11.5px] tracking-tight text-center leading-tight w-full line-clamp-2 transition-colors ${
                    isSelected
                      ? "text-terracotta font-semibold"
                      : "text-ink-muted font-medium group-hover:text-ink"
                  }`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
