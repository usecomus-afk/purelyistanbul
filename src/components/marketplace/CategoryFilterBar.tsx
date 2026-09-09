"use client";

import Image from "next/image";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/**
 * Header'ın altında, arama çubuğunun ÜSTÜNDE yer alan kategori çubuğu.
 * Bir kategoriye tıklamak o kategorinin yatay kayan ilan rafına atlar
 * (bkz. MarketplaceHome) — sadece bir filtre metni değil, görünür bir eylem.
 */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  function handleSelect(key: string) {
    onChange(key);
    document.getElementById(`shelf-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 bg-sand-bg/95 backdrop-blur-md border-b border-sand-border/70">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="flex items-center gap-4 overflow-x-auto py-3">
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => handleSelect(c.key)} className="flex flex-col items-center gap-1.5 shrink-0 group">
              <span
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 p-3 transition-colors ${
                  value === c.key
                    ? "bg-terracotta/10 border-terracotta"
                    : "bg-white border-sand-border group-hover:border-terracotta"
                }`}
              >
                <span className="relative w-full h-full">
                  <Image src={c.icon} alt="" fill className="object-contain" />
                </span>
              </span>
              <span className={`text-[11.5px] font-medium whitespace-nowrap ${value === c.key ? "text-ink" : "text-ink-muted"}`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
