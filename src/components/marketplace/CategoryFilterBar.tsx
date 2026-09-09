"use client";

import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/** Header'ın altında yer alan, kategori başlıklarının yan yana sıralandığı ince gezinme çubuğu. */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  return (
    <div className="sticky top-[84px] z-30 bg-sand-bg/90 backdrop-blur-md border-b border-sand-border/70">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="flex items-center gap-7 overflow-x-auto py-4">
          <button
            onClick={() => onChange("all")}
            className={`flex flex-col items-center gap-2 shrink-0 pb-3 border-b-[1.5px] transition-colors ${
              value === "all" ? "border-ink text-ink" : "border-transparent text-ink-muted/70 hover:text-ink"
            }`}
          >
            <LayoutGrid className="w-[19px] h-[19px]" strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">Tümü</span>
          </button>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => onChange(c.key)}
              className={`flex flex-col items-center gap-2 shrink-0 pb-3 border-b-[1.5px] transition-colors ${
                value === c.key ? "border-ink text-ink" : "border-transparent text-ink-muted/70 hover:text-ink"
              }`}
            >
              <span className={`relative w-[19px] h-[19px] transition-opacity ${value === c.key ? "opacity-100" : "opacity-60"}`}>
                <Image src={c.icon} alt="" fill className="object-contain" />
              </span>
              <span className="text-[11px] font-medium tracking-wide whitespace-nowrap">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
