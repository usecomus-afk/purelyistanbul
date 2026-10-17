"use client";

import { useEffect } from 'react';
import { Experience, Hotel, Language } from '@/lib/types';
import { calculateTransitOptions } from '@/lib/transit';
import { getT } from '@/lib/i18n';
import { getLocalizedExperience } from '@/lib/experience-i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { ExternalLink, X, Compass } from 'lucide-react';

interface TransitModalProps {
  experience: Experience;
  hotel: Hotel;
  lang: Language;
  onClose: () => void;
}

const TRANSIT_MODAL_I18N: Record<Language, {
  routeDistance: string;
  openInGoogleMaps: string;
  minutes: string;
  taximeterEstimate: string;
  privateChauffeur: string;
  fixedPrice: string;
  istanbulkart: string;
  stepByStepRoute: string;
  close: string;
}> = {
  tr: {
    routeDistance: 'Kuşuçuşu / Rota Mesafesi',
    openInGoogleMaps: 'Google Haritalarda Aç',
    minutes: 'dakika',
    taximeterEstimate: 'Taksimetre tahmini',
    privateChauffeur: 'Özel Şoförlü',
    fixedPrice: 'Sabit fiyat',
    istanbulkart: 'İstanbulkart',
    stepByStepRoute: 'Adım Adım Güzergah:',
    close: 'Kapat'
  },
  en: {
    routeDistance: 'Direct / Route Distance',
    openInGoogleMaps: 'Open in Google Maps',
    minutes: 'min',
    taximeterEstimate: 'Taximeter estimate',
    privateChauffeur: 'Private Chauffeur',
    fixedPrice: 'Fixed rate',
    istanbulkart: 'Istanbulkart',
    stepByStepRoute: 'Step-by-Step Route:',
    close: 'Close'
  },
  ar: {
    routeDistance: 'المسافة المباشرة / مسافة المسار',
    openInGoogleMaps: 'فتح في خرائط Google',
    minutes: 'دقيقة',
    taximeterEstimate: 'تقدير عداد التاكسي',
    privateChauffeur: 'سائق خاص',
    fixedPrice: 'سعر ثابت',
    istanbulkart: 'إسطنبول كارت',
    stepByStepRoute: 'المسار خطوة بخطوة:',
    close: 'إغلاق'
  },
  ru: {
    routeDistance: 'Прямое / Маршрутное расстояние',
    openInGoogleMaps: 'Открыть в Google Картах',
    minutes: 'мин',
    taximeterEstimate: 'По таксометру',
    privateChauffeur: 'Личный водитель',
    fixedPrice: 'Фиксированная цена',
    istanbulkart: 'Istanbulkart',
    stepByStepRoute: 'Пошаговый маршрут:',
    close: 'Закрыть'
  },
  de: {
    routeDistance: 'Luftlinie / Routenentfernung',
    openInGoogleMaps: 'In Google Maps öffnen',
    minutes: 'Min.',
    taximeterEstimate: 'Taxameter-Schätzung',
    privateChauffeur: 'Privater Chauffeur',
    fixedPrice: 'Festpreis',
    istanbulkart: 'Istanbulkart',
    stepByStepRoute: 'Schritt-für-Schritt-Route:',
    close: 'Schließen'
  },
  fr: {
    routeDistance: 'Distance directe / Itinéraire',
    openInGoogleMaps: 'Ouvrir dans Google Maps',
    minutes: 'min',
    taximeterEstimate: 'Estimation taximètre',
    privateChauffeur: 'Chauffeur privé',
    fixedPrice: 'Tarif fixe',
    istanbulkart: 'Istanbulkart',
    stepByStepRoute: 'Itinéraire étape par étape :',
    close: 'Fermer'
  }
};

export function TransitModal({ experience, hotel, lang, onClose }: TransitModalProps) {
  const t = getT(lang);
  const tm = TRANSIT_MODAL_I18N[lang] || TRANSIT_MODAL_I18N.en;
  const locExp = getLocalizedExperience(experience, lang);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  const transit = calculateTransitOptions(hotel.coords, experience.coords, hotel.district, experience.location, lang);

  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotel.name + ', ' + hotel.address)}&destination=${encodeURIComponent(experience.location + ', Istanbul')}&travelmode=transit`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-scroll bg-black/50 backdrop-blur-sm p-3 sm:p-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-6">
        <div 
          className="luxury-service-card relative w-full max-w-xl p-5 sm:p-6 my-auto space-y-4 animate-in zoom-in-95 text-[#141414]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
            <div>
              <h3 className="font-luxury-serif text-lg font-bold uppercase tracking-[0.04em] text-[#141414]">{t.transitTitle}</h3>
              <p className="font-luxury-sans text-xs text-[#5C4938]">
                <span className="font-semibold text-[#141414]">{hotel.name}</span> → <span className="text-[#7D5E2A] font-bold">{locExp.title}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] flex items-center justify-center text-[#141414] font-bold cursor-pointer">
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* Distance Banner */}
          <div className="bg-[#FAF8F4]/90 p-3.5 rounded-2xl flex items-center justify-between border border-[#C4B8A4]">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-[#8E7252]" />
              <div>
                <span className="font-luxury-sans text-[11px] text-[#5C4938] block">{tm.routeDistance}</span>
                <strong className="font-luxury-serif text-base text-[#141414] font-bold">~{transit.distanceKm} km</strong>
              </div>
            </div>

            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-luxury-sans flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <span>{tm.openInGoogleMaps}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 3 Transit Alternatives */}
          <div className="space-y-3 font-luxury-sans">
            {/* 1. Yellow Taxi */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    <LuxuryCategoryIcon categoryKey="taxi" className="w-11 h-11" />
                  </div>
                  <div>
                    <h4 className="font-luxury-serif text-[15px] font-bold text-[#141414]">{t.taxiOption}</h4>
                    <span className="text-[11px] text-[#5C4938]">~{transit.taxi.durationMin} {tm.minutes}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-luxury-serif text-sm font-bold text-[#141414]">~{transit.taxi.costTl} TL</span>
                  <span className="text-[10px] text-[#6B5A48] block">{tm.taximeterEstimate}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#3D352E] leading-relaxed">{transit.taxi.desc}</p>
            </div>

            {/* 2. VIP Transfer */}
            <div className="p-3.5 rounded-2xl bg-[#1D2025] text-white border border-[#8E7252] space-y-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF8F4] border border-[#C5A059] p-0.5 flex items-center justify-center shrink-0">
                    <LuxuryCategoryIcon categoryKey="transfer" className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-luxury-serif text-[15px] font-bold text-[#E5C896]">{t.vipOption}</h4>
                    <span className="text-[11px] text-[#D8CBB8]">~{transit.vipTransfer.durationMin} {tm.minutes} ({tm.privateChauffeur})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-luxury-serif text-sm font-bold text-[#E5C896]">€{transit.vipTransfer.costEur}</span>
                  <span className="text-[10px] text-[#D8CBB8] block">{tm.fixedPrice}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#EDE5D6] leading-relaxed">{transit.vipTransfer.desc}</p>
            </div>

            {/* 3. Public Transit (İETT / Tram / Metro) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    <LuxuryCategoryIcon categoryKey="istanbulkart" className="w-11 h-11" />
                  </div>
                  <div>
                    <h4 className="font-luxury-serif text-[15px] font-bold text-[#141414]">{t.transitOption}</h4>
                    <span className="text-[11px] text-[#5C4938]">~{transit.publicTransit.durationMin} {tm.minutes} ({transit.publicTransit.lineName})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-luxury-serif text-sm font-bold text-[#7D5E2A]">~{transit.publicTransit.costTl} TL</span>
                  <span className="text-[10px] text-[#6B5A48] block">{tm.istanbulkart}</span>
                </div>
              </div>

              <div className="bg-white/90 p-3 rounded-xl text-[11px] text-[#221F1C] space-y-1 border border-[#D8CBB8]">
                <strong className="text-[#7D5E2A] block text-[10px] uppercase tracking-wider">{tm.stepByStepRoute}</strong>
                {transit.publicTransit.routeSteps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-1.5">
                    <span className="text-[#8E7252] font-bold">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={onClose}
              className="font-luxury-sans w-full py-2.5 bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] rounded-xl text-xs font-bold text-[#141414] transition cursor-pointer"
            >
              {tm.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

