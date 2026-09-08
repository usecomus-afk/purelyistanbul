"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Experience, ServiceRequest, Language } from '@/lib/types';
import { getT, detectBrowserLanguage } from '@/lib/i18n';
import { HotelHeader } from '@/components/guest/hotel-header';
import { InRoomServices } from '@/components/guest/in-room-services';
import { ExperienceCard } from '@/components/guest/experience-card';
import { ExperienceDetailModal } from '@/components/guest/experience-detail-modal';
import { GuestTabBar } from '@/components/guest/guest-tab-bar';
import { TransitModal } from '@/components/guest/transit-modal';
import { VirtualPosModal } from '@/components/guest/virtual-pos-modal';
import { AiChatDrawer } from '@/components/guest/ai-chat-drawer';
import { AuthModal } from '@/components/auth-modal';
import { FairShoppingPolicy } from '@/components/guest/fair-shopping-policy';
import { InvestInIstanbul } from '@/components/guest/invest-in-istanbul';
import { RestaurantReservationModal } from '@/components/guest/restaurant-reservation-modal';
import { AestheticBookingModal } from '@/components/guest/aesthetic-booking-modal';
import { AestheticInquiryModal } from '@/components/guest/aesthetic-inquiry-modal';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Bell, 
  X, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function GuestPage() {
  const hotels = XeniosStore.getHotels();
  const allExperiences = XeniosStore.getExperiences() as Experience[];

  const [activeHotelId, setActiveHotelId] = useState(XeniosStore.getActiveHotelId());
  const [activeRoomNumber, setActiveRoomNumber] = useState(XeniosStore.getActiveRoomId());
  const [lang, setLang] = useState<Language>('tr');
  const [activeTab, setActiveTab] = useState<'services' | 'experiences' | 'categories' | 'ai' | 'practical' | 'invest'>('services');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [selectedDetailExp, setSelectedDetailExp] = useState<Experience | null>(null);
  const [transitExp, setTransitExp] = useState<Experience | null>(null);
  const [checkoutExp, setCheckoutExp] = useState<Experience | null>(null);
  const [restaurantReserveExp, setRestaurantReserveExp] = useState<Experience | null>(null);
  const [aestheticBookingExp, setAestheticBookingExp] = useState<Experience | null>(null);
  const [aestheticInquiryExp, setAestheticInquiryExp] = useState<Experience | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  useEffect(() => {
    // 🏨 Auto-redirect if hotel management role is active or remembered
    if (typeof window !== 'undefined') {
      const appRole = localStorage.getItem('xenios_app_role');
      const isHotelLoggedIn = XeniosStore.isHotelPortalLoggedIn();
      if (appRole === 'hotel' || isHotelLoggedIn) {
        window.location.replace('/hotel-portal');
        return;
      }
    }

    const detected = detectBrowserLanguage();
    setLang(detected);
    XeniosStore.setLanguage(detected);

    setRequests(XeniosStore.getRequests());

    const handleReqUpdate = () => {
      setRequests(XeniosStore.getRequests());
    };
    window.addEventListener('xenios_requests_updated', handleReqUpdate);

    const closeAllModals = () => {
      setSelectedDetailExp(null);
      setTransitExp(null);
      setCheckoutExp(null);
      setRestaurantReserveExp(null);
      setAestheticBookingExp(null);
      setAestheticInquiryExp(null);
      setShowRequestsModal(false);
      setShowAuthModal(false);
    };

    const handleTab = (e: any) => {
      const targetTab = e.detail?.tab;
      if (targetTab) {
        closeAllModals();
        if (targetTab === 'ai') {
          setIsAiOpen(true);
        } else {
          setActiveTab(targetTab);
          setIsAiOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    const handleOpenAi = () => {
      closeAllModals();
      setIsAiOpen(true);
    };

    window.addEventListener('xenios_tab_changed', handleTab);
    window.addEventListener('xenios_open_ai', handleOpenAi);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['services', 'experiences', 'categories', 'ai', 'practical', 'invest'].includes(tabParam)) {
        closeAllModals();
        if (tabParam === 'ai') {
          setIsAiOpen(true);
        } else {
          setActiveTab(tabParam as any);
        }
      }
    }

    return () => {
      window.removeEventListener('xenios_requests_updated', handleReqUpdate);
      window.removeEventListener('xenios_tab_changed', handleTab);
      window.removeEventListener('xenios_open_ai', handleOpenAi);
    };
  }, []);

  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];
  const t = getT(lang);

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(allExperiences.map(e => e.category)))];

  // Dynamic Category Showcase (13 Categories with localized title & description)
  const categoryShowcase = [
    { key: t.categoriesList.invest.title, rawKey: "İstanbul'da Yatırım", iconPath: '/icons/categories/invest.png', count: 20, desc: t.categoriesList.invest.desc, tab: 'invest' },
    { key: t.categoriesList.restaurants.title, rawKey: "Önerdiğimiz Restoranlar", targetCategory: "Önerdiğimiz Restoranlar", iconPath: '/icons/categories/onerdigimiz-restoranlar.png', count: 20, desc: t.categoriesList.restaurants.desc },
    { key: t.categoriesList.bosphorus.title, rawKey: "Boğaz Turları & Yat", targetCategory: "1. Boğaz & Tekne Deneyimleri", iconPath: '/icons/categories/bogaz-yatturlari.png', count: 7, desc: t.categoriesList.bosphorus.desc },
    { key: t.categoriesList.history.title, rawKey: "Tarih & Müzeler", targetCategory: "2. Tarihi Rota & Hızlı Geçiş Turları", iconPath: '/icons/categories/tarih-muzeler.png', count: 8, desc: t.categoriesList.history.desc },
    { key: t.categoriesList.gastronomy.title, rawKey: "Gastronomi & Gurme", targetCategory: "3. Gastronomi & Sokak Lezzetleri", iconPath: '/icons/categories/gastronomi-gurme.png', count: 6, desc: t.categoriesList.gastronomy.desc },
    { key: t.categoriesList.photo.title, rawKey: "Fotoğraf & Kostüm", targetCategory: "7. Fotoğrafçılık & Sosyal Medya Çekimleri", iconPath: '/icons/categories/fotograf-kostum.png', count: 5, desc: t.categoriesList.photo.desc },
    { key: t.categoriesList.adventure.title, rawKey: "Macera & Doğa", targetCategory: "13. Doğa, Macera & Açık Hava Aktiviteleri", iconPath: '/icons/categories/macera-doga.png', count: 4, desc: t.categoriesList.adventure.desc },
    { key: t.categoriesList.hamam.title, rawKey: "Türk Hamamı & Spa", targetCategory: "4. Geleneksel & Kültürel Deneyimler", iconPath: '/icons/categories/turk-hamami-spa.png', count: 4, desc: t.categoriesList.hamam.desc },
    { key: t.categoriesList.shopping.title, rawKey: "Alışveriş & Çarşılar", targetCategory: "9. Alışveriş, Stilist & Pazarlık Asistanlığı", iconPath: '/icons/categories/alisveris-carsilar.png', count: 4, desc: t.categoriesList.shopping.desc },
    { key: t.categoriesList.art.title, rawKey: "Sanat & Semazen", targetCategory: "11. Modern Sanat, Tasarım & Mimarlık Yürüyüşleri", iconPath: '/icons/categories/sanat-semazen.png', count: 4, desc: t.categoriesList.art.desc },
    { key: t.categoriesList.culture.title, rawKey: "Kültürel Miras", targetCategory: "12. Mistik, İnanç & Çok Kültürlü Miras Rotaları", iconPath: '/icons/categories/kulturel-miras.png', count: 5, desc: t.categoriesList.culture.desc },
    { key: t.categoriesList.transfer.title, rawKey: "Özel VIP Transfer", targetCategory: "6. Ulaşım, Transfer & Şehir Kartları", iconPath: '/icons/categories/ozel-vip-transfer.png', count: 2, desc: t.categoriesList.transfer.desc },
    { key: t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik", rawKey: "14. Medikal Estetik & Güzellik", targetCategory: "14. Medikal Estetik & Güzellik", iconPath: '/icons/categories/aesthetic-beauty.png', count: 12, desc: t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı" }
  ];

  // Filter experiences (admin-suspended listings never reach the guest catalog)
  const filteredExperiences = allExperiences.filter(e => {
    if (e.status === 'suspended') return false;
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    XeniosStore.setLanguage(newLang);
  };

  const activePendingRequests = requests.filter(r => r.status !== 'completed');

  return (
    <div className="w-full text-zinc-900">
      {/* Hotel Header & Credentials */}
      <HotelHeader
        hotel={currentHotel}
        roomNumber={activeRoomNumber}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        activeRequestsCount={activePendingRequests.length}
        onOpenRequests={() => setShowRequestsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-4 mt-3 sm:mt-4 space-y-5 sm:space-y-6 w-full">
        
        {/* TAB 1: In-Room Services (Otel İçi Hizmetler) */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <InRoomServices
              hotel={currentHotel}
              roomNumber={activeRoomNumber}
              lang={lang}
            />

            {/* Curated Istanbul Experiences Banner (Kataloğu Keşfet Modülü) */}
            <div className="btn-3d p-5 sm:p-6 space-y-4 relative overflow-hidden bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30">
              
              {/* Decorative subtle ambient light */}
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Centered Top Badge */}
              <div className="flex items-center justify-center w-full">
                <span className="px-4 py-1.5 rounded-full text-[11px] bg-amber-500 text-white font-extrabold uppercase tracking-widest shadow-xs text-center">
                  {t.catalogBadge}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 p-2 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs hidden sm:flex">
                    <Image 
                      src="/icons/katalogu-kesfet.png" 
                      alt="Kataloğu Keşfet" 
                      width={44} 
                      height={44} 
                      className="object-contain" 
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-base sm:text-lg font-bold font-serif text-zinc-900 leading-snug">
                      {t.catalogTitle}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-xl font-medium">
                      {t.catalogDesc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => setActiveTab('experiences')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Image 
                      src="/icons/katalogu-kesfet.png" 
                      alt="Katalog" 
                      width={28} 
                      height={28} 
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain brightness-0 invert shrink-0" 
                    />
                    <span>{t.exploreCatalogBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Experiences & Tours Grid (Tüm İlanlar) */}
        {activeTab === 'experiences' && (
          <div className="space-y-4">
            {selectedCategory === 'Önerdiğimiz Restoranlar' || selectedCategory.toLowerCase().includes('restoran') ? (
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-900">{t.categoriesList.restaurants.title}</h2>
                <p className="text-xs text-zinc-500">{t.categoriesList.restaurants.desc}</p>
              </div>
            ) : selectedCategory.toLowerCase().includes('estetik') || selectedCategory.toLowerCase().includes('aesthetic') || selectedCategory.toLowerCase().includes('güzellik') ? (
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-900">{t.categoriesList.aesthetic?.title || 'Medikal Estetik & Güzellik'}</h2>
                <p className="text-xs text-zinc-500">{t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı"}</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-900">{t.experiencesTitle}</h2>
                <p className="text-xs text-zinc-500">{t.experiencesSubtitle}</p>
              </div>
            )}

            {/* Search & Category Filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-2xl border border-amber-200/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Horizontal Scroll Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat, cIdx) => {
                  const getCategoryLabel = (categoryRaw: string) => {
                    if (categoryRaw === 'all') return t.allCategories;
                    const cleaned = categoryRaw.replace(/^[0-9]+\.\s*/, '');
                    const lower = cleaned.toLowerCase();
                    if (lower.includes('estetik') || lower.includes('aesthetic') || lower.includes('güzellik')) return t.categoriesList.aesthetic?.title || cleaned;
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
                    return cleaned;
                  };

                  return (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-white font-bold shadow-sm'
                          : 'bg-white text-zinc-600 hover:bg-amber-50 border border-amber-200/60'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experiences Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredExperiences.map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  hotel={currentHotel}
                  lang={lang}
                  onSelect={(selected) => setSelectedDetailExp(selected)}
                  onOpenTransit={(exp) => setTransitExp(exp)}
                  onOpenCheckout={(exp) => setCheckoutExp(exp)}
                  onOpenRestaurantReserve={(exp) => setRestaurantReserveExp(exp)}
                  onOpenAestheticBooking={(exp) => setAestheticBookingExp(exp)}
                  onOpenAestheticInquiry={(exp) => setAestheticInquiryExp(exp)}
                />
              ))}
            </div>

            {filteredExperiences.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-amber-200/80 p-6 space-y-2">
                <Compass className="w-10 h-10 text-amber-500/40 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-800">{t.noRequests}</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Arama kriterlerinize uygun ilan bulunamadı. Lütfen filtreyi temizleyiniz.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200"
                >
                  {t.allCategories}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Category Catalog View */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-zinc-900 flex items-center gap-2">
                <span>{t.categoriesTitle}</span>
              </h2>
              <p className="text-xs text-zinc-500 max-w-xl font-medium">
                {t.categoriesSubtitle}
              </p>
            </div>

            {/* 2-Column Grid matching In-Room Services modular style */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {categoryShowcase.map((cat, idx) => {
                const isScaledUp = [
                  'invest.png',
                  'onerdigimiz-restoranlar.png',
                  'bogaz-yatturlari.png',
                  'tarih-muzeler.png',
                  'gastronomi-gurme.png',
                  'fotograf-kostum.png',
                  'macera-doga.png',
                  'turk-hamami-spa.png',
                  'alisveris-carsilar.png',
                  'sanat-semazen.png',
                  'kulturel-miras.png',
                  'ozel-vip-transfer.png',
                  'aesthetic-beauty.png'
                ].some(iconName => cat.iconPath.endsWith(iconName));

                const isAesthetic = cat.iconPath.endsWith('aesthetic-beauty.png');

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if ((cat as any).tab === 'invest') {
                        setActiveTab('invest');
                        if (typeof window !== 'undefined') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        return;
                      }
                      const target = (cat as any).targetCategory || cat.rawKey;
                      const matched = categories.find(c => c === target || c.toLowerCase().includes(target.toLowerCase())) || target;
                      setSelectedCategory(matched);
                      setActiveTab('experiences');
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="btn-3d p-4 sm:p-5 flex flex-col items-center text-center justify-between gap-3 min-h-[155px] sm:min-h-[170px] group relative cursor-pointer"
                  >
                    {/* 3D Icon Box matching in-room services */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#fbf8f1] p-2 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100/60 shadow-inner overflow-hidden relative">
                      <img 
                        src={cat.iconPath} 
                        alt={cat.key} 
                        className={`w-full h-full object-contain drop-shadow-sm transition-transform ${isAesthetic ? 'scale-130' : isScaledUp ? 'scale-120' : 'scale-105'}`}
                      />
                      {cat.count > 0 && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-amber-600/90 text-white font-bold text-[9px] shadow-2xs leading-none">
                          {cat.count}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="w-full">
                      <span className="text-xs sm:text-sm font-bold text-zinc-800 group-hover:text-amber-800 transition-colors leading-tight block">
                        {cat.key}
                      </span>
                      <span className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 block">
                        {cat.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Practical Info & Ombudsman (Rehber & Haklar) */}
        {activeTab === 'practical' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-zinc-900">{t.practicalTitle}</h2>
              <p className="text-xs text-zinc-500">{t.practicalSubtitle}</p>
            </div>

            {/* Xenios Fair Shopping Policy & Misafir Kalkanı Component */}
            <FairShoppingPolicy lang={lang} />
          </div>
        )}

        {/* TAB 5: Invest & Live in Istanbul */}
        {activeTab === 'invest' && (
          <InvestInIstanbul hotel={currentHotel} roomNumber={activeRoomNumber} lang={lang} />
        )}
      </main>

      {/* Experience Detail Modal */}
      {selectedDetailExp && (
        <ExperienceDetailModal
          experience={selectedDetailExp}
          hotel={currentHotel}
          roomNumber={activeRoomNumber}
          lang={lang}
          onClose={() => setSelectedDetailExp(null)}
          onOpenTransit={(exp) => setTransitExp(exp)}
          onOpenCheckout={(exp) => setCheckoutExp(exp)}
          onOpenRestaurantReserve={(exp) => {
            setSelectedDetailExp(null);
            setRestaurantReserveExp(exp);
          }}
          onOpenAestheticBooking={(exp) => {
            setSelectedDetailExp(null);
            setAestheticBookingExp(exp);
          }}
          onOpenAestheticInquiry={(exp) => {
            setSelectedDetailExp(null);
            setAestheticInquiryExp(exp);
          }}
        />
      )}

      {/* Aesthetic & Beauty CRM Booking Modal */}
      {aestheticBookingExp && (
        <AestheticBookingModal
          experience={aestheticBookingExp}
          hotel={currentHotel}
          roomNumber={activeRoomNumber}
          lang={lang}
          onClose={() => setAestheticBookingExp(null)}
        />
      )}

      {/* Aesthetic & Beauty Lead Inquiry Modal */}
      {aestheticInquiryExp && (
        <AestheticInquiryModal
          experience={aestheticInquiryExp}
          hotel={currentHotel}
          roomNumber={activeRoomNumber}
          lang={lang}
          onClose={() => setAestheticInquiryExp(null)}
        />
      )}

      {/* Restaurant Reservation Modal */}
      {restaurantReserveExp && (
        <RestaurantReservationModal
          restaurant={restaurantReserveExp}
          hotel={currentHotel}
          roomNumber={activeRoomNumber}
          lang={lang}
          onClose={() => setRestaurantReserveExp(null)}
        />
      )}

      {/* Transit Options Modal */}
      {transitExp && (
        <TransitModal
          experience={transitExp}
          hotel={currentHotel}
          lang={lang}
          onClose={() => setTransitExp(null)}
        />
      )}

      {/* Virtual POS Checkout Modal */}
      {checkoutExp && (
        <VirtualPosModal
          experience={checkoutExp}
          hotel={currentHotel}
          roomNumber={activeRoomNumber}
          lang={lang}
          onClose={() => setCheckoutExp(null)}
        />
      )}

      {/* In-Room Requests Modal (Triggered from Top Hotel Card) */}
      {showRequestsModal && (
        <div 
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRequestsModal(false);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 text-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{t.activeRequests}</h3>
                    <p className="text-[11px] text-zinc-500">{currentHotel.name} - {t.room} {activeRoomNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRequestsModal(false)} 
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-amber-400 opacity-50" />
                  <p className="text-xs">{t.noRequests}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#fbf8f1] p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <strong className="text-zinc-900 block">{req.serviceTitle}</strong>
                        {req.notes && <p className="text-[11px] text-zinc-600">{req.notes}</p>}
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        req.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : req.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {t.requestStatus[req.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register / Hotel Cockpit Entry) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* AI Concierge Chat Drawer */}
      <AiChatDrawer
        hotel={currentHotel}
        roomNumber={activeRoomNumber}
        lang={lang}
        isOpen={isAiOpen || activeTab === 'ai'}
        onClose={() => {
          setIsAiOpen(false);
          if (activeTab === 'ai') setActiveTab('services');
        }}
      />
    </div>
  );
}
