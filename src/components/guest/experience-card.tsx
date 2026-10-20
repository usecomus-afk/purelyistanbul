"use client";

import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { XeniosStore } from '@/lib/store';
import { getLocalizedExperience, getLocalizedExperienceCategoryTag, EXPERIENCE_UI_I18N } from '@/lib/experience-i18n';
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
  const ui = EXPERIENCE_UI_I18N[lang] || EXPERIENCE_UI_I18N.en;
  const loc = getLocalizedExperience(experience, lang);
  const imageSrc = experience.image || `/images/experiences/${experience.id}.jpg`;
  const isRestaurant = experience.category.toLowerCase().includes('restoran') || experience.id.startsWith('rest-');
  const isAesthetic = experience.category.toLowerCase().includes('estetik') || experience.categoryTag === 'Aesthetic' || experience.id.startsWith('exp-aesthetic-');

  const getLocalizedTag = () => getLocalizedExperienceCategoryTag(experience, lang);

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
    <div className="luxury-service-card overflow-hidden flex flex-col justify-between group">
      {/* Clickable Card Header & Image Area */}
      <div 
        onClick={handleSelectWithTracking}
        className="cursor-pointer"
      >
        {/* Photo + Category + Rating Tag */}
        <div className="relative h-48 w-full overflow-hidden bg-[#1D2025]">
          <Image
            src={imageSrc}
            alt={loc.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-92"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/75 backdrop-blur-md text-amber-300 border border-amber-400/40">DEMO PREVIEW</span>
            <span className="golden-pill-badge font-luxury-sans px-2.5 py-1 rounded-full text-[10px] font-bold text-[#2C1E0F] backdrop-blur-[18px] shadow-xs">
              {getLocalizedTag()}
            </span>
            {loc.cuisine && (
              <span className="font-luxury-sans px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#8E7252]/95 text-white shadow-xs hidden xs:inline-block">
                {loc.cuisine.split('&')[0].trim()}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-luxury-sans font-bold bg-[#1D2025]/85 text-[#E5C896] backdrop-blur-md border border-[#8E7252]/60 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
            <span>{experience.scoreStr || '4.9/5'}</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <span className="font-luxury-sans text-[10.5px] text-[#E5C896] font-semibold uppercase tracking-[0.04em] block truncate">
              {loc.provider}
            </span>
            <h3 className="font-luxury-serif text-[16px] font-bold leading-snug line-clamp-1 text-[#FAF8F4] group-hover:text-[#E5C896] transition-colors">
              {loc.title}
            </h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between font-luxury-sans text-xs text-[#5C4938]">
            <div className="flex items-center gap-1 truncate max-w-[200px]" title={loc.location}>
              <MapPin className="w-3.5 h-3.5 text-[#8E7252] shrink-0" />
              <span className="truncate font-medium">{loc.location}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#3D352E] shrink-0">
              {isRestaurant && loc.priceLevel ? (
                <span className="golden-pill-badge px-2.5 py-0.5 rounded-full text-[#2C1E0F] font-bold text-[11px]">
                  {loc.priceLevel.split(' ')[0]}
                </span>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#8E7252]" />
                  <span>{loc.duration}</span>
                </>
              )}
            </div>
          </div>

          {/* Description / Agent Note */}
          <p className="font-luxury-sans text-xs text-[#221A0F] leading-relaxed bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] p-3 rounded-xl border border-[rgba(230,185,75,0.55)] min-h-[3.8rem]">
            {loc.agentNote}
          </p>

          {/* Öne Çıkan Lezzetler / Specialties Chips */}
          {loc.specialties && loc.specialties.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-1 font-luxury-sans text-[10px] font-bold text-[#141414] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#8E7252]" />
                <span>{t.specialties}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {loc.specialties.map((item, idx) => (
                  <span
                    key={idx}
                    className="golden-pill-badge font-luxury-sans inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#2C1E0F]"
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
              <span className="font-luxury-sans text-[10px] uppercase tracking-wider text-[#6B5A48] block font-semibold">
                {isRestaurant ? t.priceLevel : t.price}
              </span>
              <span className="font-luxury-serif text-base sm:text-lg font-bold text-[#141414]">
                {loc.priceLevel ? loc.priceLevel : formatPrice(experience.price, experience.currency)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(experience);
              }}
              className="golden-pill-badge font-luxury-sans flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[rgba(240,195,70,0.48)] text-[#2C1E0F] text-xs font-bold shadow-2xs active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[#7D5E2A]" />
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
          className="p-2.5 rounded-xl bg-[rgba(240,195,70,0.35)] hover:bg-[rgba(240,195,70,0.48)] text-[#2C1E0F] border border-[rgba(220,175,50,0.6)] text-xs font-semibold flex items-center justify-center shadow-2xs active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer"
          title={t.transitTitle}
        >
          <Navigation className="w-4 h-4 text-[#7D5E2A]" />
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
              className="font-luxury-sans flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-[11px] font-bold shadow-sm flex items-center justify-center gap-1 transition transform active:scale-95 cursor-pointer truncate"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ui.bookAppointment}</span>
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
              className="font-luxury-sans flex-1 py-2.5 px-2 rounded-xl bg-[rgba(240,195,70,0.35)] hover:bg-[rgba(240,195,70,0.48)] text-[#2C1E0F] border border-[rgba(220,175,50,0.6)] text-[11px] font-bold flex items-center justify-center gap-1 active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer truncate shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-[#7D5E2A] shrink-0" />
              <span className="truncate">{ui.requestInfo}</span>
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
              className="font-luxury-sans flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
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
                className="p-2.5 rounded-xl bg-[rgba(240,195,70,0.35)] hover:bg-[rgba(240,195,70,0.48)] text-[#2C1E0F] border border-[rgba(220,175,50,0.6)] text-xs font-semibold flex items-center justify-center shadow-2xs active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer"
                title={ui.websiteMenu}
              >
                <Globe className="w-4 h-4 text-[#7D5E2A]" />
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
            className="font-luxury-sans flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t.buyNow}</span>
          </button>
        )}
      </div>
    </div>
  );
}

