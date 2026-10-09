"use client";

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Language } from '@/lib/types';
import { getT } from '@/lib/i18n';

interface PaperArtHeaderProps {
  lang?: Language;
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
  activeCategory?: string;
}

export function PaperArtHeader({
  lang = 'tr',
  onSearch,
  onCategorySelect,
  activeCategory = 'Mekanlar'
}: PaperArtHeaderProps) {
  const t = getT(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(activeCategory);

  const pills = [
    { id: 'Mekanlar', label: 'Mekanlar' },
    { id: 'Müzeler', label: 'Müzeler' },
    { id: 'Lezzetler', label: 'Lezzetler' },
    { id: 'Etkinlikler', label: 'Etkinlikler' },
    { id: 'Tarih', label: 'Tarih' },
    { id: 'Semtler', label: 'Semtler' }
  ];

  const handleCatClick = (catId: string) => {
    setSelectedCat(catId);
    onCategorySelect?.(catId);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#87CEEB] via-[#B0E0E6] to-white rounded-3xl p-4 sm:p-5 shadow-lg border border-sky-200/80 text-slate-900 mb-4 overflow-hidden relative">
      {/* Header Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif mb-3">
        İstanbul'u Keşfet
      </h1>

      {/* Search Input Bar with Filter Button (Matching PDF Page 1) */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Neyi keşfetmek istersiniz?"
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white   text-slate-800 placeholder-slate-400 rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <button
          type="button"
          className="p-2.5 bg-white   text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm cursor-pointer transition flex items-center justify-center shrink-0"
          title="Filtrele"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Paper-Art Skyline Illustration Graphic (Matching PDF Page 1) */}
      <div className="w-full h-24 sm:h-28 rounded-2xl overflow-hidden relative mb-4 bg-gradient-to-b from-sky-300 to-sky-100 flex items-end justify-center border border-sky-200/60 shadow-inner">
        {/* Layer 1: Distant Mosques & Minarets Silhouette */}
        <div className="absolute bottom-0 w-full h-16 opacity-40 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-600 via-sky-500 to-transparent" />
        
        {/* SVG Paper-Art Skyline Art */}
        <svg className="w-full h-full object-cover" viewBox="0 0 500 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Clouds */}
          <path d="M40 30 Q55 20 70 30 Q85 20 100 30 L100 40 L40 40 Z" fill="#FFFFFF" opacity="0.8" />
          <path d="M380 25 Q395 15 410 25 Q425 15 440 25 L440 35 L380 35 Z" fill="#FFFFFF" opacity="0.8" />

          {/* Background Minarets & Domes */}
          <path d="M60 120 L60 50 L65 50 L65 120 Z" fill="#4B9CD3" />
          <path d="M62.5 42 L65 50 L60 50 Z" fill="#2B6CB0" />
          <path d="M80 120 Q105 70 130 120 Z" fill="#3182CE" />
          
          <path d="M220 120 L220 40 L226 40 L226 120 Z" fill="#4B9CD3" />
          <path d="M223 32 L226 40 L220 40 Z" fill="#2B6CB0" />
          <path d="M230 120 L230 55 L235 55 L235 120 Z" fill="#4B9CD3" />
          <path d="M235 120 Q255 75 275 120 Z" fill="#3182CE" />
          <path d="M280 120 L280 40 L286 40 L286 120 Z" fill="#4B9CD3" />

          <path d="M400 120 L400 45 L405 45 L405 120 Z" fill="#4B9CD3" />
          <path d="M402.5 37 L405 45 L400 45 Z" fill="#2B6CB0" />
          <path d="M410 120 Q430 80 450 120 Z" fill="#3182CE" />

          {/* Galata Tower Silhouette */}
          <path d="M175 120 L175 60 L180 50 L185 60 L185 120 Z" fill="#DD6B20" />
          <path d="M180 40 L185 50 L175 50 Z" fill="#C05621" />

          {/* Foreground Bosphorus Sea Waves */}
          <path d="M0 100 Q125 90 250 100 Q375 110 500 100 L500 120 L0 120 Z" fill="#3182CE" opacity="0.9" />
          <path d="M0 108 Q125 100 250 108 Q375 116 500 108 L500 120 L0 120 Z" fill="#2B6CB0" />

          {/* Boat */}
          <path d="M300 102 L320 102 L315 108 L302 108 Z" fill="#FFFFFF" />
          <path d="M308 96 L310 96 L310 102 L308 102 Z" fill="#E53E3E" />
        </svg>
      </div>

      {/* Horizontal Scroll Category Pills (Matching PDF Page 1) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {pills.map((pill) => {
          const isActive = selectedCat === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleCatClick(pill.id)}
              className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/90 text-slate-700 hover:bg-white   border border-slate-200'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
