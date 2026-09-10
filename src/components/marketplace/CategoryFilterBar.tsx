"use client";

import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/**
 * Header'ın altında yer alan kategori gezinti çubuğu. Tüm kategoriler tek
 * satırda, ekrana orantılı sığar — kaydırma veya ok butonu yoktur; her öğe
 * eşit pay alır (flex-1), dar ekranlarda ikon/etiket küçülür.
 */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  function handleSelect(key: string) {
    onChange(key);
    const target = document.getElementById(key === "all" ? "shelves-top" : `shelf-${key}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 bg-sand-bg/95 backdrop-blur-md border-b border-sand-border/70 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto px-1.5 sm:px-6">
        <div className="flex items-start justify-between gap-0.5 sm:gap-2">
          {/* Tümü Butonu */}
          <button
            onClick={() => handleSelect("all")}
            className="flex flex-col items-center gap-1 group cursor-pointer flex-1 min-w-0"
          >
            <span
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 transition-all duration-200 ${
                value === "all"
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md scale-105"
                  : "bg-white/95 border-amber-400/70 text-zinc-700 shadow-xs hover:border-amber-500"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </span>
            <span
              className={`text-[8.5px] sm:text-[11px] font-semibold tracking-tight text-center leading-tight w-full line-clamp-2 transition-colors ${
                value === "all" ? "text-zinc-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
              }`}
            >
              Tümü
            </span>
          </button>

          {/* Dinamik Kategoriler */}
          {MARKETPLACE_CATEGORIES.map((c) => {
            const isSelected = value === c.key;
            return (
              <button
                key={c.key}
                onClick={() => handleSelect(c.key)}
                className="flex flex-col items-center gap-1 group cursor-pointer flex-1 min-w-0"
              >
                <span
                  className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 p-1.5 sm:p-2 transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-b from-amber-50 to-orange-50/70 border-amber-600 shadow-md scale-105"
                      : "bg-white/95 border-amber-400/70 shadow-xs hover:border-amber-500"
                  }`}
                >
                  <span className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={c.icon}
                      alt={c.label}
                      fill
                      className="object-contain drop-shadow-xs"
                    />
                  </span>
                </span>
                <span
                  className={`text-[8.5px] sm:text-[11px] font-semibold tracking-tight text-center leading-tight w-full line-clamp-2 transition-colors ${
                    isSelected ? "text-amber-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
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
