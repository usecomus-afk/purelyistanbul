"use client";

import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/**
 * Header'ın altında yer alan kategori gezinti çubuğu. Kaydırma gerektirmeden
 * tüm kategoriler ekrana orantılı sığar — dar ekranlarda satır kaydırma
 * yerine ikinci satıra sarar (flex-wrap), yatay scroll/ok butonu yoktur.
 */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  function handleSelect(key: string) {
    onChange(key);
    const target = document.getElementById(key === "all" ? "shelves-top" : `shelf-${key}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 bg-sand-bg/95 backdrop-blur-md border-b border-sand-border/70 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-center gap-x-2.5 gap-y-3 sm:gap-x-3.5">
          {/* Tümü Butonu */}
          <button
            onClick={() => handleSelect("all")}
            className="flex flex-col items-center gap-1.5 group cursor-pointer basis-[54px] sm:basis-auto"
          >
            <span
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-200 ${
                value === "all"
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md ring-4 ring-zinc-900/15 scale-105"
                  : "bg-white/95 border-amber-400/70 text-zinc-700 shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105"
              }`}
            >
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
            </span>
            <span
              className={`text-[10px] sm:text-[12px] font-semibold tracking-tight whitespace-nowrap transition-colors ${
                value === "all" ? "text-zinc-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
              }`}
            >
              Tümü
            </span>
            {value === "all" && <span className="w-4 h-1 rounded-full bg-zinc-900 -mt-0.5" />}
          </button>

          {/* Dinamik Kategoriler */}
          {MARKETPLACE_CATEGORIES.map((c) => {
            const isSelected = value === c.key;
            return (
              <button
                key={c.key}
                onClick={() => handleSelect(c.key)}
                className="flex flex-col items-center gap-1.5 group cursor-pointer basis-[54px] sm:basis-auto"
              >
                <span
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 p-2 transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-b from-amber-50 to-orange-50/70 border-amber-600 shadow-md ring-4 ring-amber-500/25 scale-105"
                      : "bg-white/95 border-amber-400/70 shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105"
                  }`}
                >
                  <span className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={c.icon}
                      alt={c.label}
                      fill
                      className="object-contain drop-shadow-xs group-hover:scale-110 transition-transform duration-200"
                    />
                  </span>
                </span>
                <span
                  className={`text-[10px] sm:text-[12px] font-semibold tracking-tight text-center leading-tight max-w-[64px] sm:max-w-none sm:whitespace-nowrap transition-colors ${
                    isSelected ? "text-amber-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
                  }`}
                >
                  {c.label}
                </span>
                {isSelected && <span className="w-4 h-1 rounded-full bg-amber-600 -mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
