"use client";

import { useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { calculateTransitOptions } from '@/lib/transit';
import { getT } from '@/lib/i18n';
import { MapPin, Navigation, Car, Sparkles, Train, ExternalLink, X, Compass } from 'lucide-react';
import Image from 'next/image';

interface TransitModalProps {
  experience: Experience;
  hotel: Hotel;
  lang: Language;
  onClose: () => void;
}

export function TransitModal({ experience, hotel, lang, onClose }: TransitModalProps) {
  
  const t = getT(lang);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  const transit = calculateTransitOptions(hotel.coords, experience.coords, hotel.district, experience.location);

  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotel.name + ', ' + hotel.address)}&destination=${encodeURIComponent(experience.location + ', Istanbul')}&travelmode=transit`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-3 sm:p-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-6">
        <div 
          className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-200 my-auto space-y-4 animate-in zoom-in-95 text-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div>
            <h3 className="text-base font-bold font-serif text-zinc-900">{t.transitTitle}</h3>
            <p className="text-xs text-zinc-500">
              <span className="font-semibold text-zinc-700">{hotel.name}</span> → <span className="text-amber-800 font-semibold">{experience.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-800 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distance Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-100/30 to-amber-500/10 p-3.5 rounded-2xl flex items-center justify-between border border-amber-200">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-700" />
            <div>
              <span className="text-xs text-zinc-600 block">Kuşuçuşu / Rota Mesafesi</span>
              <strong className="text-sm text-zinc-900 font-mono font-bold">~{transit.distanceKm} km</strong>
            </div>
          </div>

          <a
            href={googleMapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-900 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-50 shadow-sm transition"
          >
            <span>Google Haritalarda Aç</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </a>
        </div>

        {/* 3 Transit Alternatives */}
        <div className="space-y-3">
          {/* 1. Yellow Taxi */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  🚕
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{t.taxiOption}</h4>
                  <span className="text-[11px] text-zinc-500">~{transit.taxi.durationMin} dakika</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-zinc-900 font-mono">~{transit.taxi.costTl} TL</span>
                <span className="text-[10px] text-zinc-400 block">Taksimetre tahmini</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-600">{transit.taxi.desc}</p>
          </div>

          {/* 2. VIP Transfer */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 text-white space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center shrink-0">
                  <Image 
                    src="/icons/categories/ozel-vip-transfer.png" 
                    alt="VIP Transfer" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-400">{t.vipOption}</h4>
                  <span className="text-[11px] text-zinc-400">~{transit.vipTransfer.durationMin} dakika (Özel Şoförlü)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-400 font-mono">€{transit.vipTransfer.costEur}</span>
                <span className="text-[10px] text-zinc-400 block">Sabit fiyat</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-300">{transit.vipTransfer.desc}</p>
          </div>

          {/* 3. Public Transit (İETT / Tram / Metro) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-300 p-1 flex items-center justify-center shrink-0">
                  <Image 
                    src="/icons/istanbulkart.png" 
                    alt="İstanbulkart" 
                    width={32} 
                    height={22} 
                    className="object-contain" 
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{t.transitOption}</h4>
                  <span className="text-[11px] text-zinc-500">~{transit.publicTransit.durationMin} dakika ({transit.publicTransit.lineName})</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-900 font-mono">~{transit.publicTransit.costTl} TL</span>
                <span className="text-[10px] text-blue-700 block">İstanbulkart</span>
              </div>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl text-[11px] text-zinc-700 space-y-1 border border-blue-100">
              <strong className="text-blue-900 block text-[10px] uppercase tracking-wider">Adım Adım Güzergah:</strong>
              {transit.publicTransit.routeSteps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-zinc-800 transition"
          >
            Kapat
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
