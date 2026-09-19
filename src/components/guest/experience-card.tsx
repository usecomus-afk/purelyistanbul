"use client";

import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { XeniosStore } from '@/lib/store';
import { MapPin, Clock, Star, Navigation, CreditCard, Info, Phone, Globe, Utensils, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ExperienceCardProps {
  experience: Experience;
  hotel: Hotel;
  lang: Language;
  onSelect: (exp: Experience) => void;
  onOpenTransit: (exp: Experience) => void;
  onOpenCheckout: (exp: Experience) => void;
  onOpenRestaurantReserve?: (exp: Experience) => void;
  onOpenAestheticBooking?: (exp: Experience) => void;
  onOpenAestheticInquiry?: (exp: Experience) => void;
}

export function ExperienceCard({ 
  experience, 
  hotel, 
  lang, 
  onSelect, 
  onOpenTransit, 
  onOpenCheckout,
  onOpenRestaurantReserve,
  onOpenAestheticBooking,
  onOpenAestheticInquiry
}: ExperienceCardProps) {
  const t = getT(lang);
  const imageSrc = experience.image || `/images/experiences/${experience.id}.jpg`;
  const isRestaurant = experience.category.toLowerCase().includes('restoran') || experience.id.startsWith('rest-');
  const isAesthetic = experience.category.toLowerCase().includes('estetik') || experience.categoryTag === 'Aesthetic' || experience.id.startsWith('exp-aesthetic-');

  const getLocalizedTag = () => {
    const raw = experience.categoryTag || (experience.category.includes('.') ? experience.category.split('.')[1].trim() : experience.category);
    const lower = raw.toLowerCase();
    if (lower.includes('estetik') || lower.includes('aesthetic') || lower.includes('güzellik') || experience.categoryTag === 'Aesthetic') return t.categoriesList.aesthetic?.title || 'Medikal Estetik & Güzellik';
    if (lower.includes('restoran')) return t.categoriesList.restaurants.title;
    if (lower.includes('boğaz') || lower.includes('yat')) return t.categoriesList.bosphorus.title;
    if (lower.includes('tarih') || lower.includes('müze')) return t.categoriesList.history.title;
    if (lower.includes('gastro') || lower.includes('gurme')) return t.categoriesList.gastronomy.title;
    if (lower.includes('günübirlik') || lower.includes('şehir dışı')) return (t.categoriesList as any).dayTrips?.title || raw;
    if (lower.includes('transfer') || lower.includes('vip')) return t.categoriesList.transfer.title;
    if (lower.includes('fotoğraf') || lower.includes('kostüm')) return t.categoriesList.photo.title;
    if (lower.includes('gece hayatı') || lower.includes('pub crawl')) return (t.categoriesList as any).nightlife?.title || raw;
    if (lower.includes('alışveriş') || lower.includes('çarşı')) return t.categoriesList.shopping.title;
    if (lower.includes('aile') || lower.includes('çocuk') || lower.includes('eğlence')) return (t.categoriesList as any).family?.title || raw;
    if (lower.includes('semazen') || lower.includes('sanat')) return t.categoriesList.art.title;
    if (lower.includes('kültür') || lower.includes('miras')) return t.categoriesList.culture.title;
    if (lower.includes('macera') || lower.includes('doğa')) return t.categoriesList.adventure.title;
    if (lower.includes('hamam') || lower.includes('spa')) return t.categoriesList.hamam.title;
    if (lower.includes('yatırım') || lower.includes('invest')) return t.categoriesList.invest.title;
    return raw;
  };

  const handleSelectWithTracking = () => {
    try {
      XeniosStore.addViewedListing({
        listing_id: experience.id,
        title: experience.title,
        category: experience.category,
        district: experience.location
      });
    } catch (e) {}
    onSelect(experience);
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-amber-200/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      {/* Clickable Card Header & Image Area */}
      <div 
        onClick={handleSelectWithTracking}
        className="cursor-pointer"
      >
        {/* Photo + Category + Rating Tag */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
          <Image
            src={imageSrc}
            alt={experience.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-amber-900 shadow-sm backdrop-blur-md">
              {getLocalizedTag()}
            </span>
            {experience.cuisine && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/90 text-white shadow-xs backdrop-blur-md hidden xs:inline-block">
                {experience.cuisine.split('&')[0].trim()}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/70 text-amber-300 backdrop-blur-md border border-amber-400/40 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{experience.scoreStr || '4.9/5'}</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <span className="text-[11px] text-amber-300 font-semibold block truncate">
              {experience.provider}
            </span>
            <h3 className="text-sm font-bold font-serif leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors">
              {experience.title}
            </h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1 truncate max-w-[200px]" title={experience.location}>
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{experience.location}</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-zinc-700 shrink-0">
              {isRestaurant && experience.priceLevel ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200/60">
                  {experience.priceLevel.split(' ')[0]}
                </span>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{experience.duration}</span>
                </>
              )}
            </div>
          </div>

          {/* Description / Agent Note */}
          <p className="text-xs text-zinc-600 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 min-h-[3.8rem]">
            {experience.agentNote}
          </p>

          {/* Öne Çıkan Lezzetler / Specialties Chips */}
          {experience.specialties && experience.specialties.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{t.specialties}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {experience.specialties.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-100/70 text-amber-950 border border-amber-200/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price & Details Bar */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                {isRestaurant ? t.priceLevel : t.price}
              </span>
              <span className="text-sm sm:text-base font-bold text-zinc-900 font-mono">
                {experience.priceLevel ? experience.priceLevel : formatPrice(experience.price, experience.currency)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(experience);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-semibold border border-amber-200 transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.details}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        {/* Transit / Map Route */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenTransit(experience);
          }}
          className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
          title={t.transitTitle}
        >
          <Navigation className="w-4 h-4 text-amber-700" />
        </button>

        {isAesthetic ? (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {/* Randevu Oluştur (Primary) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAestheticBooking) {
                  onOpenAestheticBooking(experience);
                } else {
                  onSelect(experience);
                }
              }}
              className="flex-1 py-2.5 px-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-[11px] font-bold shadow-md shadow-rose-500/25 flex items-center justify-center gap-1 transition transform active:scale-95 cursor-pointer truncate"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Randevu Oluştur</span>
            </button>

            {/* Bilgi Almak İstiyorum (Secondary Outline) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAestheticInquiry) {
                  onOpenAestheticInquiry(experience);
                } else {
                  onSelect(experience);
                }
              }}
              className="flex-1 py-2.5 px-2 rounded-2xl bg-white hover:bg-rose-50/70 text-rose-900 border border-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition transform active:scale-95 cursor-pointer truncate shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">Bilgi Almak İstiyorum</span>
            </button>
          </div>
        ) : isRestaurant ? (
          <>
            {/* Table Reservation Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenRestaurantReserve) {
                  onOpenRestaurantReserve(experience);
                } else {
                  onSelect(experience);
                }
              }}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t.reserveTable}</span>
            </button>

            {/* Website / Menu Button */}
            {experience.website && (
              <a
                href={experience.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
                title="Web Sitesi / Menü"
              >
                <Globe className="w-4 h-4 text-zinc-700" />
              </a>
            )}
          </>
        ) : (
          /* Book Now Button for standard experiences */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCheckout(experience);
            }}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t.buyNow}</span>
          </button>
        )}
      </div>
    </div>
  );
}
