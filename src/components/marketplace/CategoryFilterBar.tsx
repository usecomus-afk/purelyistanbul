"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/**
 * Header'ın altında yer alan, zengin ve belirgin kategori gezinti çubuğu.
 * İkonlar büyük, renkli 3D illüstrasyonlarıyla öne çıkar; seçilen kategori
 * sıcak kehribar (amber) çerçeve ve halka vurgusuyla belirginleşir.
 */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  }

  function handleSelect(key: string) {
    onChange(key);
    const target = document.getElementById(key === "all" ? "shelves-top" : `shelf-${key}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[84px] z-30 bg-sand-bg/95 backdrop-blur-md border-b border-sand-border/70 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative group/bar">
        {/* Sol Kaydırma Butonu (Masaüstü) */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Sola kaydır"
            className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-stone-200 shadow-md items-center justify-center text-zinc-700 hover:bg-stone-50 hover:scale-105 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Sağ Kaydırma Butonu (Masaüstü) */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Sağa kaydır"
            className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-stone-200 shadow-md items-center justify-center text-zinc-700 hover:bg-stone-50 hover:scale-105 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Kategori Butonları Listesi */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto py-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1"
        >
          {/* Tümü Butonu */}
          <button
            onClick={() => handleSelect("all")}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <span
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-200 ${
                value === "all"
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md ring-4 ring-zinc-900/15 scale-105"
                  : "bg-white/95 border-amber-400/70 text-zinc-700 shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105"
              }`}
            >
              <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.75} />
            </span>
            <span
              className={`text-[12px] sm:text-[12.5px] font-semibold tracking-tight whitespace-nowrap transition-colors ${
                value === "all" ? "text-zinc-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
              }`}
            >
              Tümü
            </span>
            {value === "all" && <span className="w-5 h-1 rounded-full bg-zinc-900 -mt-0.5" />}
          </button>

          {/* Dinamik Kategoriler */}
          {MARKETPLACE_CATEGORIES.map((c) => {
            const isSelected = value === c.key;
            return (
              <button
                key={c.key}
                onClick={() => handleSelect(c.key)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <span
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 p-2 transition-all duration-200 ${
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
                  className={`text-[12px] sm:text-[12.5px] font-semibold tracking-tight whitespace-nowrap transition-colors ${
                    isSelected ? "text-amber-900 font-bold" : "text-zinc-600 group-hover:text-zinc-900"
                  }`}
                >
                  {c.label}
                </span>
                {isSelected && <span className="w-5 h-1 rounded-full bg-amber-600 -mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

