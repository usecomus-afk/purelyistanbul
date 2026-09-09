"use client";

import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

interface CategoryFilterBarProps {
  value: string;
  onChange: (key: string) => void;
}

/** Header'ın altında yer alan, kategori başlıklarının yan yana buton olarak sıralandığı gezinme çubuğu. */
export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  return (
    <div className="border-b border-sand-border bg-sand-bg/95 sticky top-16 z-30">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="flex items-center gap-6 overflow-x-auto py-3">
          <button
            onClick={() => onChange("all")}
            className={`flex flex-col items-center gap-1.5 shrink-0 pb-1 border-b-2 transition ${
              value === "all" ? "border-terracotta text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[11px] font-medium whitespace-nowrap">Tümü</span>
          </button>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => onChange(c.key)}
              className={`flex flex-col items-center gap-1.5 shrink-0 pb-1 border-b-2 transition ${
                value === c.key ? "border-terracotta text-ink" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <span className="relative w-5 h-5">
                <Image src={c.icon} alt="" fill className="object-contain" />
              </span>
              <span className="text-[11px] font-medium whitespace-nowrap">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
