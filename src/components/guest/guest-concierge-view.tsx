"use client";

import Image from 'next/image';
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
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Bell, 
  X, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Clock, Camera 
} from 'lucide-react';

interface GuestConciergeViewProps {
  initialHotelId?: string;
  initialRoomId?: string;
}

export function GuestConciergeView({ initialHotelId, initialRoomId }: GuestConciergeViewProps = {}) {
  const hotels = XeniosStore.getHotels();
  const allExperiences = XeniosStore.getExperiences() as Experience[];

  const [activeHotelId, setActiveHotelId] = useState(() => initialHotelId || XeniosStore.getActiveHotelId());
  const [activeRoomNumber, setActiveRoomNumber] = useState(() => initialRoomId || XeniosStore.getActiveRoomId());
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
    if (initialHotelId) {
      setActiveHotelId(initialHotelId);
      XeniosStore.setActiveHotelId(initialHotelId);
    }
    if (initialRoomId) {
      setActiveRoomNumber(initialRoomId);
      XeniosStore.setActiveRoomId(initialRoomId);
    }
  }, [initialHotelId, initialRoomId]);

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

    const handleSessionUpdate = () => {
      setActiveHotelId(XeniosStore.getActiveHotelId());
      setActiveRoomNumber(XeniosStore.getActiveRoomId());
    };
    window.addEventListener('xenios_session_updated', handleSessionUpdate);
    window.addEventListener('storage', handleSessionUpdate);

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
      window.removeEventListener('xenios_session_updated', handleSessionUpdate);
      window.removeEventListener('storage', handleSessionUpdate);
      window.removeEventListener('xenios_tab_changed', handleTab);
      window.removeEventListener('xenios_open_ai', handleOpenAi);
    };
  }, []);

  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];
  const t = getT(lang);

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(allExperiences.map(e => e.category)))];

  const categoryShowcase = [
    { key: t.categoriesList.history.title, rawKey: "Tarih & Müzeler", targetCategory: "Tarih & Müzeler", iconPath: '/icons/categories/tarih-muzeler.png', count: 8, desc: t.categoriesList.history.desc },
    { key: t.categoriesList.gastronomy.title, rawKey: "Gastronomi & Gurme", targetCategory: "Gastronomi & Gurme", iconPath: '/icons/categories/gastronomi-gurme.png', count: 6, desc: t.categoriesList.gastronomy.desc },
    { key: t.categoriesList.art.title, rawKey: "Sanat & Semazen", targetCategory: "Sanat & Semazen", iconPath: '/icons/categories/sanat-semazen.png', count: 4, desc: t.categoriesList.art.desc },
    { key: t.categoriesList.shopping.title, rawKey: "Alışveriş & Çarşılar", targetCategory: "Alışveriş & Çarşılar", iconPath: '/icons/categories/alisveris-carsilar.png', count: 4, desc: t.categoriesList.shopping.desc },
    { key: t.categoriesList.bosphorus.title, rawKey: "Boğaz Turları & Yat", targetCategory: "Boğaz Turları & Yat", iconPath: '/icons/categories/bogaz-yatturlari.png', count: 7, desc: t.categoriesList.bosphorus.desc },
    { key: t.categoriesList.culture.title, rawKey: "Kültürel Miras", targetCategory: "Kültürel Miras", iconPath: '/icons/categories/kulturel-miras.png', count: 5, desc: t.categoriesList.culture.desc },
    { key: t.categoriesList.hamam.title, rawKey: "Türk Hamamı & Spa", targetCategory: "Türk Hamamı & Spa", iconPath: '/icons/categories/turk-hamami-spa.png', count: 4, desc: t.categoriesList.hamam.desc },
    { key: t.categoriesList.photo.title, rawKey: "Fotoğraf & Kostüm", targetCategory: "Fotoğraf & Kostüm", iconPath: '/icons/categories/fotograf-kostum.svg', count: 5, desc: t.categoriesList.photo.desc },
    { key: t.categoriesList.transfer.title, rawKey: "Özel VIP Transfer", targetCategory: "Özel VIP Transfer", iconPath: '/icons/categories/ozel-vip-transfer.png', count: 2, desc: t.categoriesList.transfer.desc },
    { key: t.categoriesList.restaurants.title, rawKey: "Önerdiğimiz Restoranlar", targetCategory: "Önerdiğimiz Restoranlar", iconPath: '/icons/categories/onerdigimiz-restoranlar.png', count: 20, desc: t.categoriesList.restaurants.desc },
    { key: t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik", rawKey: "Medikal Estetik & Güzellik", targetCategory: "Medikal Estetik & Güzellik", iconPath: '/icons/categories/aesthetic-beauty.png', count: 12, desc: t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı" },
    { key: t.categoriesList.invest.title, rawKey: "İstanbul'da Yatırım", targetCategory: "İstanbul'da Yatırım", iconPath: '/icons/categories/invest.png', count: 20, desc: t.categoriesList.invest.desc, tab: 'invest' }
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_lang_changed', { detail: { lang: newLang } }));
    }
  };

  const activePendingRequests = requests.filter(r => r.status !== 'completed');


  return (
    <div className="w-full text-white min-h-screen relative">
      {/* Global Fixed Background for Guest App */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
          src="/images/services-bg.jpg" 
          alt="Guest Background"
          fill
          priority
          quality={80}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full h-full">
        {/* Hotel Header & Credentials */}
      <HotelHeader
        hotel={currentHotel}
        roomNumber={activeRoomNumber}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        activeRequestsCount={activePendingRequests.length}
        onOpenRequests={() => setShowRequestsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        activeTab={activeTab}
      />

      {/* Main Content Area */}
      <main className={`max-w-4xl mx-auto px-3.5 sm:px-4 w-full ${activeTab === 'services' ? 'mt-1 sm:mt-2 space-y-3 sm:space-y-4' : 'mt-3 sm:mt-4 space-y-5 sm:space-y-6'}`}>
        
        {/* TAB 1: In-Room Services (Otel İçi Hizmetler) */}
        {activeTab === 'services' && (
          <div>
            <InRoomServices
              hotel={currentHotel}
              roomNumber={activeRoomNumber}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 2: Experiences & Tours Grid (Tüm İlanlar) */}
        {activeTab === 'experiences' && (
          <div className="space-y-4">
            {selectedCategory === 'Önerdiğimiz Restoranlar' || selectedCategory.toLowerCase().includes('restoran') ? (
              <div>
                <h2 className="text-xl font-bold font-serif text-white">{t.categoriesList.restaurants.title}</h2>
                <p className="text-xs text-white/70">{t.categoriesList.restaurants.desc}</p>
              </div>
            ) : selectedCategory.toLowerCase().includes('estetik') || selectedCategory.toLowerCase().includes('aesthetic') || selectedCategory.toLowerCase().includes('güzellik') ? (
              <div>
                <h2 className="text-xl font-bold font-serif text-white">{t.categoriesList.aesthetic?.title || 'Medikal Estetik & Güzellik'}</h2>
                <p className="text-xs text-white/70">{t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı"}</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold font-serif text-white">{t.experiencesTitle}</h2>
                <p className="text-xs text-white/70">{t.experiencesSubtitle}</p>
              </div>
            )}

            {/* Search & Category Filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-white/60 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
                    if (lower.includes('günübirlik') || lower.includes('şehir dışı')) return (t.categoriesList as any).dayTrips?.title || cleaned;
                    if (lower.includes('transfer') || lower.includes('vip')) return t.categoriesList.transfer.title;
                    if (lower.includes('fotoğraf') || lower.includes('kostüm')) return t.categoriesList.photo.title;
                    if (lower.includes('gece hayatı') || lower.includes('pub crawl')) return (t.categoriesList as any).nightlife?.title || cleaned;
                    if (lower.includes('alışveriş') || lower.includes('çarşı')) return t.categoriesList.shopping.title;
                    if (lower.includes('aile') || lower.includes('çocuk') || lower.includes('eğlence')) return (t.categoriesList as any).family?.title || cleaned;
                    if (lower.includes('semazen') || lower.includes('sanat')) return t.categoriesList.art.title;
                    if (lower.includes('kültür') || lower.includes('miras')) return t.categoriesList.culture.title;
                    if (lower.includes('macera') || lower.includes('doğa')) return t.categoriesList.adventure.title;
                    if (lower.includes('hamam') || lower.includes('spa')) return t.categoriesList.hamam.title;
                    if (lower.includes('yatırım') || lower.includes('invest')) return t.categoriesList.invest.title;
                    return cleaned;
                  };

                  return (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-white/20 text-white font-bold shadow-sm'
                          : 'bg-black/20 backdrop-blur-md text-white/80 hover:bg-white/10 border border-amber-200/60'
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
              <div className="text-center py-12 bg-black/20 backdrop-blur-md rounded-3xl border border-white/20 p-6 space-y-2">
                <Compass className="w-10 h-10 text-amber-500/40 mx-auto" />
                <h3 className="text-sm font-bold text-white">{t.noRequests}</h3>
                <p className="text-xs text-white/70 max-w-xs mx-auto">
                  Arama kriterlerinize uygun ilan bulunamadı. Lütfen filtreyi temizleyiniz.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-amber-700 bg-white/10 px-4 py-2 rounded-xl border border-amber-200"
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
              <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                <span>{t.categoriesTitle}</span>
              </h2>
              <p className="text-xs text-white/70 max-w-xl font-medium">
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
                    className="p-4 sm:p-5 flex flex-col items-center text-center justify-start gap-3 h-full min-h-[155px] sm:min-h-[170px] group relative cursor-pointer bg-black/10 backdrop-blur-[3px] rounded-[24px] border border-white/30 shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-4px_6px_rgba(0,0,0,0.6)] transition-all duration-300 hover:bg-black/15 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-6px_8px_rgba(0,0,0,0.7)]"
                  >
                    {/* 3D Icon Box matching in-room services */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform relative">
                      <div 
                          className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 scale-[1.7]"
                          style={{
                            WebkitMaskImage: `url(${cat.iconPath})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskImage: `url(${cat.iconPath})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center'
                          }}
                        />
                    </div>

                    {/* Title & Description */}
                    <div className="w-full">
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-tight block">
                        {cat.key}
                      </span>
                      <span className="text-[10px] text-white/60 line-clamp-1 mt-0.5 block">
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
              <h2 className="text-xl font-bold font-serif text-white">{t.practicalTitle}</h2>
              <p className="text-xs text-white/70">{t.practicalSubtitle}</p>
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
              className="relative w-full max-w-lg bg-black/20 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-700">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.activeRequests}</h3>
                    <p className="text-[11px] text-white/70">{currentHotel.name} - {t.room} {activeRoomNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRequestsModal(false)} 
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-8 text-center text-white/60 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-amber-400 opacity-50" />
                  <p className="text-xs">{t.noRequests}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white/10 p-3.5 rounded-2xl border border-white/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <strong className="text-white block">{req.serviceTitle}</strong>
                        {req.notes && <p className="text-[11px] text-white/80">{req.notes}</p>}
                        <div className="flex items-center gap-1 text-[10px] text-white/60 font-mono">
                          <Clock className="w-3.5 h-3.5 text-white/60" />
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
    </div>
  );
}
