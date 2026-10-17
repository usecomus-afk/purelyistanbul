"use client";

import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { 
  Star, MapPin, ShieldCheck, Heart, Share2, 
  ArrowLeft, Phone, ExternalLink,
  CreditCard, Navigation, Utensils, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ExperienceDetailModalProps {
  experience: Experience | null;
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onClose: () => void;
  onOpenTransit: (exp: Experience) => void;
  onOpenCheckout: (exp: Experience) => void;
  onOpenRestaurantReserve?: (exp: Experience) => void;
  onOpenAestheticBooking?: (exp: Experience) => void;
  onOpenAestheticInquiry?: (exp: Experience) => void;
}

export function ExperienceDetailModal({
  experience,
  hotel,
  roomNumber,
  lang,
  onClose,
  onOpenTransit,
  onOpenCheckout,
  onOpenRestaurantReserve,
  onOpenAestheticBooking,
  onOpenAestheticInquiry
}: ExperienceDetailModalProps) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (experience) {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
      return () => {
        window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
      };
    }
  }, [experience]);

  if (!experience) return null;

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

  // Dynamic tailored steps based on category
  const steps = [
    {
      title: isRestaurant ? "Masa Rezervasyonu & Karşılama" : "Buluşma & Sıcak Karşılama",
      desc: isRestaurant 
        ? `${experience.title} ekibi tarafından kapıda karşılama ve ayrılan masanıza yerleşim.` 
        : `${experience.provider} ekibi tarafından belirlenen noktada Türk çayı veya ikramlarla samimi bir karşılama.`,
      img: imageSrc
    },
    {
      title: isRestaurant ? "Menü & Gurme Tadım Rehberi" : "Tarih ve Zanaat Hikayesi",
      desc: isRestaurant 
        ? `${experience.cuisine || 'Şef'} imzalı mevsimlik lezzetler ve imza spesiyallerin tanıtımı.` 
        : "Uzman rehber ve zanaatkarlardan deneyimin köklü İstanbul tarihi ve inceliklerini öğrenin.",
      img: "/images/istanbul/499db9bf1acc9374f13ea0b3d0043ce6.webp"
    },
    {
      title: isRestaurant ? "Ana Lezzet & Gastronomi Şöleni" : "Uygulama & Ana Deneyim",
      desc: isRestaurant 
        ? `Taze yerel malzemeler ve usta şefler tarafından hazırlanan özel tabakların sunumu.` 
        : `Rehberlik eşliğinde ${experience.title.toLowerCase()} sürecine bizzat dahil olun.`,
      img: "/images/istanbul/63bab1fbccecc867bfd70f0f41b0d943.webp"
    },
    {
      title: isRestaurant ? "Geleneksel Tatlı & İkramlar" : "İkramlar & Fotoğraf Çekimi",
      desc: isRestaurant 
        ? "İstanbul usulü kahve veya geleneksel tatlı ikramlarıyla lezzet deneyiminin tamamlanması." 
        : "Geleneksel Türk lezzetlerinin tadını çıkarırken unutulmaz anı fotoğrafları çekilin.",
      img: "/images/istanbul/il_1588xN.7346047570_63w8.webp"
    }
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: experience.title,
        text: experience.agentNote,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Bağlantı kopyalandı!");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] bg-[#F7F3EA] overflow-y-scroll overflow-x-hidden text-[#141414]"
      style={{ 
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Top Floating Luxury Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#D8CBB8] px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] flex items-center justify-center text-[#141414] transition cursor-pointer shadow-2xs"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
        </button>

        <span className="font-luxury-serif text-[13px] font-bold uppercase tracking-[0.06em] text-[#5C4938] truncate max-w-[200px] sm:max-w-md">
          {experience.location} · {getLocalizedTag()}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] flex items-center justify-center text-[#141414] transition cursor-pointer"
            title="Paylaş"
          >
            <Share2 className="w-4 h-4 stroke-[1.7]" />
          </button>
          <button
            onClick={() => {
              setIsLiked(!isLiked);
              toast.success(isLiked ? "Favorilerden çıkarıldı" : "Favorilere eklendi!");
            }}
            className="w-9 h-9 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] flex items-center justify-center text-[#141414] transition cursor-pointer"
            title="Favorilere Ekle"
          >
            <Heart className={`w-4 h-4 stroke-[1.7] ${isLiked ? 'fill-[#8E7252] text-[#8E7252]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-48 space-y-5">
        
        {/* Hero Photo Card */}
        <div className="relative h-72 sm:h-96 w-full rounded-[22px] overflow-hidden shadow-md border-[1.5px] border-[#C4B8A4] bg-[#1D2025]">
          <Image
            src={imageSrc}
            alt={experience.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
          
          {/* TÜRSAB / Verified Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F4]/95 text-[#141414] border border-[#C4B8A4] font-luxury-sans text-xs font-bold shadow-md backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-[#7D5E2A]" />
            <span>{isRestaurant ? 'Doğrulanmış Restoran' : t.tursabCertified}</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-[#1D2025]/85 text-[#E5C896] font-luxury-sans text-xs font-bold shadow-md backdrop-blur-md border border-[#8E7252]/60">
            <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
            <span>{experience.scoreStr || '4.8/5'}</span>
          </div>
        </div>

        {/* Title, Category & Location Card */}
        <div className="luxury-service-card p-5 space-y-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-luxury-sans px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F4] text-[#7D5E2A] border border-[#C4B8A4]">
              {getLocalizedTag()}
            </span>
            {experience.cuisine && (
              <span className="font-luxury-sans px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F4] text-[#141414] border border-[#D8CBB8]">
                {experience.cuisine}
              </span>
            )}
            {experience.priceLevel && (
              <span className="font-luxury-sans px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F4] text-[#7D5E2A] border border-[#C4B8A4]">
                {experience.priceLevel}
              </span>
            )}
          </div>

          <h1 className="font-luxury-serif text-2xl sm:text-3xl font-bold text-[#141414] leading-tight">
            {experience.title}
          </h1>

          <p className="font-luxury-sans text-sm text-[#221F1C] leading-relaxed">
            {experience.agentNote}
          </p>

          {/* Öne Çıkan Lezzetler / Specialties Section */}
          {experience.specialties && experience.specialties.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-2">
              <div className="flex items-center gap-1.5 font-luxury-sans text-xs font-bold text-[#7D5E2A] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#8E7252]" />
                <span>{t.specialties}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {experience.specialties.map((item, idx) => (
                  <span
                    key={idx}
                    className="font-luxury-sans inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-[#141414] border border-[#D8CBB8] shadow-2xs"
                  >
                    <span className="text-[#8E7252]">✦</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 font-luxury-sans text-xs font-bold text-[#141414] pt-1">
            <span className="px-3 py-1 rounded-full bg-[#FAF8F4] text-[#7D5E2A] border border-[#C4B8A4] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8E7252]" />
              <span>purelyİstanbul Güvencesi</span>
            </span>
          </div>
        </div>

        {/* NELER YAPACAKSINIZ? (Timeline Step-by-Step) */}
        <div className="luxury-service-card p-5 space-y-4">
          <h2 className="font-luxury-serif text-lg sm:text-xl font-bold uppercase tracking-[0.04em] text-[#141414]">
            {t.programSteps}
          </h2>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#D8CBB8] transition">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-[#EFE8DA] border border-[#C4B8A4] shadow-xs">
                  <Image
                    src={step.img}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-luxury-serif text-[15px] font-bold text-[#141414]">{step.title}</h4>
                  <p className="font-luxury-sans text-xs text-[#3D352E] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BULUŞACAĞIMIZ YER (Meeting Point & Map) */}
        <div className="luxury-service-card p-5 space-y-3.5">
          <h2 className="font-luxury-serif text-lg sm:text-xl font-bold uppercase tracking-[0.04em] text-[#141414]">
            {experience.location}, İstanbul
          </h2>

          {/* Live Open Google Maps Container */}
          <div className="space-y-3">
            <div className="relative h-64 w-full rounded-2xl overflow-hidden border-[1.5px] border-[#C4B8A4] shadow-sm bg-[#EFE8DA]">
              <iframe
                title="Google Maps Buluşma Noktası"
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: 'none' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(experience.location + ', Istanbul, Turkey')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(experience.location + ', Istanbul, Turkey')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
                aria-label="Google Maps"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(experience.location + ', Istanbul, Turkey')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-luxury-sans px-3.5 py-2.5 rounded-xl bg-[#1D2025] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{t.openInGoogleMaps}</span>
                <ExternalLink className="w-3 h-3 text-[#C4B8A4]" />
              </a>

              <button
                type="button"
                onClick={() => onOpenTransit(experience)}
                className="font-luxury-sans px-3.5 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{t.transitTitle}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING BOTTOM BAR (Sticky Footer) */}
      <div className="fixed bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))] inset-x-0 bg-[#FAF8F4]/96 backdrop-blur-lg border-t border-[#D8CBB8] p-3.5 sm:p-4 z-40 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 font-luxury-sans text-[11px] text-[#7D5E2A] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8E7252]" />
              <span>purelyİstanbul Onaylı Mekan</span>
            </div>
            <div>
              <span className="font-luxury-sans text-[10px] text-[#6B5A48] uppercase font-semibold block">
                {isRestaurant ? t.priceLevel : t.price}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-luxury-serif text-lg sm:text-xl font-bold text-[#141414]">
                  {experience.priceLevel || formatPrice(experience.price, experience.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAesthetic ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAestheticBooking) {
                      onOpenAestheticBooking(experience);
                    }
                  }}
                  className="font-luxury-sans px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Randevu Oluştur</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAestheticInquiry) {
                      onOpenAestheticInquiry(experience);
                    }
                  }}
                  className="font-luxury-sans px-3.5 sm:px-5 py-3 rounded-2xl bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] text-xs sm:text-sm font-bold border border-[#C4B8A4] shadow-sm flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#8E7252]" />
                  <span>Bilgi Almak İstiyorum</span>
                </button>
              </>
            ) : isRestaurant ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRestaurantReserve) {
                      onOpenRestaurantReserve(experience);
                    }
                  }}
                  className="font-luxury-sans px-5 sm:px-7 py-3 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{t.reserveTable}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTransit(experience)}
                  className="px-3.5 py-3 rounded-2xl bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] text-xs sm:text-sm font-bold border border-[#C4B8A4] flex items-center gap-1.5 transition cursor-pointer"
                  title="Yol Tarifi"
                >
                  <Navigation className="w-4 h-4 text-[#8E7252]" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenCheckout(experience)}
                className="font-luxury-sans px-6 py-3 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t.buyNow}</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
