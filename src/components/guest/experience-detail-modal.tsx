"use client";

import { Experience, Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { 
  X, Star, MapPin, Clock, ShieldCheck, Heart, Share2, 
  Check, ArrowLeft, Phone, Globe, ExternalLink,
  CreditCard, Navigation, Utensils, Sparkles, Users, Activity
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
    if (lower.includes('fotoğraf') || lower.includes('kostüm')) return t.categoriesList.photo.title;
    if (lower.includes('macera') || lower.includes('doğa')) return t.categoriesList.adventure.title;
    if (lower.includes('hamam') || lower.includes('spa')) return t.categoriesList.hamam.title;
    if (lower.includes('alışveriş') || lower.includes('çarşı')) return t.categoriesList.shopping.title;
    if (lower.includes('semazen') || lower.includes('sanat')) return t.categoriesList.art.title;
    if (lower.includes('kültür') || lower.includes('miras')) return t.categoriesList.culture.title;
    if (lower.includes('transfer') || lower.includes('vip')) return t.categoriesList.transfer.title;
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
      className="fixed inset-0 z-50 bg-white overflow-y-scroll overflow-x-hidden text-zinc-900"
      style={{ 
        WebkitOverflowScrolling: 'touch'
      }}
    >
      
      {/* Top Floating Airbnb Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition cursor-pointer"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-zinc-600 truncate max-w-[200px] sm:max-w-md">
          {experience.location} · {experience.categoryTag || experience.category}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition cursor-pointer"
            title="Paylaş"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsLiked(!isLiked);
              toast.success(isLiked ? "Favorilerden çıkarıldı" : "Favorilere eklendi!");
            }}
            className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition cursor-pointer"
            title="Favorilere Ekle"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-48 space-y-7">
        
        {/* Hero Photo Carousel Card */}
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-lg bg-zinc-900">
          <Image
            src={imageSrc}
            alt={experience.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* TÜRSAB / Verified Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-zinc-900 text-xs font-bold shadow-md backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isRestaurant ? 'Doğrulanmış Restoran' : t.tursabCertified}</span>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 text-amber-300 text-xs font-bold shadow-md backdrop-blur-md border border-amber-400/40">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{experience.scoreStr || '4.8/5'}</span>
          </div>
        </div>

        {/* Title, Category & Location */}
        <div className="space-y-3 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
              {getLocalizedTag()}
            </span>
            {experience.cuisine && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800">
                🍽️ {experience.cuisine}
              </span>
            )}
            {experience.priceLevel && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                💰 {experience.priceLevel}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 leading-tight">
            {experience.title}
          </h1>

          <p className="text-sm text-zinc-600 leading-relaxed font-sans">
            {experience.agentNote}
          </p>

          {/* Öne Çıkan Lezzetler / Specialties Section */}
          {experience.specialties && experience.specialties.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{t.specialties}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {experience.specialties.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-zinc-800 border border-amber-300 shadow-2xs"
                  >
                    <span className="text-amber-600">✦</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 pt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>purelyİstanbul Güvencesi</span>
            </span>
          </div>
        </div>

        {/* NELER YAPACAKSINIZ? (Timeline Step-by-Step) */}
        <div className="space-y-4 pb-7 border-b border-zinc-200">
          <h2 className="text-lg sm:text-xl font-bold font-serif text-zinc-900">
            {t.programSteps}
          </h2>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3.5 rounded-2xl bg-zinc-50 hover:bg-amber-50/40 border border-zinc-100 transition">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-zinc-200 shadow-xs">
                  <Image
                    src={step.img}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-900">{step.title}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BULUŞACAĞIMIZ YER (Meeting Point & Map) */}
        <div className="space-y-3 pb-7 border-b border-zinc-200">
          <h2 className="text-lg sm:text-xl font-bold font-serif text-zinc-900">
            {experience.location}, İstanbul
          </h2>

          {/* Live Open Google Maps Container */}
          <div className="space-y-2.5">
            <div className="relative h-64 w-full rounded-3xl overflow-hidden border border-zinc-300 shadow-md bg-zinc-100">
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
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.openInGoogleMaps}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>

              <button
                type="button"
                onClick={() => onOpenTransit(experience)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{t.transitTitle}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING BOTTOM BAR (Sticky Footer) */}
      <div className="fixed bottom-[64px] sm:bottom-[68px] inset-x-0 bg-white/95 backdrop-blur-lg border-t border-zinc-200 p-3.5 sm:p-4 z-40 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>purelyİstanbul Onaylı Mekan</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                {isRestaurant ? t.priceLevel : t.price}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold font-mono text-zinc-900">
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
                  className="px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
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
                  className="px-3.5 sm:px-5 py-3 rounded-2xl bg-white hover:bg-rose-50/80 text-rose-900 text-xs sm:text-sm font-bold border border-rose-300 shadow-sm flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-rose-600" />
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
                  className="px-5 sm:px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/25 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{t.reserveTable}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTransit(experience)}
                  className="px-3.5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold border border-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                  title="Yol Tarifi"
                >
                  <Navigation className="w-4 h-4 text-amber-700" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenCheckout(experience)}
                className="px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-lg shadow-black/20 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>{t.buyNow}</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
