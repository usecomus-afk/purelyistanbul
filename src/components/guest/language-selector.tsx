"use client";

import { Language } from '@/lib/types';
import { useState } from 'react';

const langs: { code: Language; flag: string; label: string }[] = [
  { code: 'tr', flag: '🇹🇷', label: 'TR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'ar', flag: '🇸🇦', label: 'AR' },
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
];

export function LanguageSelector({ currentLang, onSelect, theme = 'light' }: { currentLang: Language; onSelect: (l: Language) => void; theme?: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-1.5 py-1 rounded-full text-[11.5px] font-bold tracking-wide transition cursor-pointer ${
          theme === 'dark'
            ? 'text-white hover:bg-white/10'
            : 'text-[#5C4938] hover:bg-[#EFE7DA]/80'
        }`}
      >
        <span className="text-[12px] leading-none">{langs.find(l => l.code === currentLang)?.flag || '🇬🇧'}</span>
        <span>{currentLang.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-36 bg-[#FDFBF7]/95 backdrop-blur-xl rounded-2xl shadow-[0_14px_34px_rgba(32,26,18,0.14)] border border-[#D8C7A8]/80 p-1.5 z-[100] animate-in fade-in zoom-in-95 text-[#23201D]">
            {langs.map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  onSelect(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition cursor-pointer ${
                  currentLang === l.code
                    ? 'bg-[#F3E9D6] font-semibold text-[#6E501E]'
                    : 'text-[#3A3530] hover:bg-[#F7F2E8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span className="tracking-wide">{l.label}</span>
                </div>
                {currentLang === l.code && <span className="text-[#9E7B42] text-xs font-semibold">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
