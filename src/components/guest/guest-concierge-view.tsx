"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { Hotel, Experience, ServiceRequest, Language } from '@/lib/types';
import { getT, detectBrowserLanguage, getLocalizedCategoryTitle } from '@/lib/i18n';
import { getExperienceCategoryKey } from '@/lib/marketplace/seed-listings';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/categories';
import { useCategoryConfigs } from '@/lib/marketplace/use-category-configs';
import { HotelHeader } from '@/components/guest/hotel-header';
import { InRoomServices } from '@/components/guest/in-room-services';
import { LuxuryCategoryIcon } from '@/components/guest/luxury-category-icon';
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

interface ShowcaseEntry {
  /** Misafirin dilinde gösterilecek kategori adı */
  key: string;
  rawKey: string;
  /** Panel kategori anahtarı (cat-1 … cat-12 veya özel cat-c-xxxx) */
  catKey: string;
  desc: string;
  /** Panelden yüklenen özel ikon (yoksa hazır 3D ikon kullanılır) */
  customIcon?: string;
  order: number;
  tab?: 'invest';
}

interface GuestConciergeViewProps {
  initialHotelId?: string;
  initialRoomId?: string;
}

export function GuestConciergeView({ initialHotelId, initialRoomId }: GuestConciergeViewProps = {}) {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [allExperiences, setAllExperiences] = useState<Experience[]>(() =>
    XeniosStore.getExperiences().filter((e) => e.status !== 'suspended' && e.publishToMobile !== false)
  );
  const [activePropertiesCount, setActivePropertiesCount] = useState<number>(() =>
    XeniosStore.getPropertyListings().filter((p) => p.status !== 'suspended').length
  );

  const [activeHotelId, setActiveHotelId] = useState(() => initialHotelId || XeniosStore.getActiveHotelId());
  const [activeRoomNumber, setActiveRoomNumber] = useState(() => initialRoomId || XeniosStore.getActiveRoomId());
  const [lang, setLang] = useState<Language>('en');
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

    const handleCatalogUpdate = () => {
      setHotels(XeniosStore.getHotels());
      setAllExperiences(
        XeniosStore.getExperiences().filter((e) => e.status !== 'suspended' && e.publishToMobile !== false)
      );
      setActivePropertiesCount(
        XeniosStore.getPropertyListings().filter((p) => p.status !== 'suspended').length
      );
    };
    handleCatalogUpdate();
    const unsubCatalog = FirestoreService.subscribeToCatalogSync();
    window.addEventListener('xenios_experiences_updated', handleCatalogUpdate);
    window.addEventListener('xenios_properties_updated', handleCatalogUpdate);
    window.addEventListener('xenios_hotels_updated', handleCatalogUpdate);

    const handleReqUpdate = () => {
      setRequests(XeniosStore.getRequests());
    };
    window.addEventListener('xenios_requests_updated', handleReqUpdate);

    const handleSessionUpdate = () => {
      setActiveHotelId(XeniosStore.getActiveHotelId());
      setActiveRoomNumber(XeniosStore.getActiveRoomId());
      const currentStoredLang = XeniosStore.getLanguage();
      if (currentStoredLang) setLang(currentStoredLang);
    };
    const handleExternalLangChange = (e: any) => {
      if (e.detail?.lang) setLang(e.detail.lang);
    };
    window.addEventListener('xenios_session_updated', handleSessionUpdate);
    window.addEventListener('storage', handleSessionUpdate);
    window.addEventListener('xenios_lang_changed', handleExternalLangChange);

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
      unsubCatalog();
      window.removeEventListener('xenios_experiences_updated', handleCatalogUpdate);
      window.removeEventListener('xenios_properties_updated', handleCatalogUpdate);
      window.removeEventListener('xenios_hotels_updated', handleCatalogUpdate);
      window.removeEventListener('xenios_requests_updated', handleReqUpdate);
      window.removeEventListener('xenios_session_updated', handleSessionUpdate);
      window.removeEventListener('storage', handleSessionUpdate);
      window.removeEventListener('xenios_lang_changed', handleExternalLangChange);
      window.removeEventListener('xenios_tab_changed', handleTab);
      window.removeEventListener('xenios_open_ai', handleOpenAi);
    };
  }, []);

  // Lock vertical movement when on the Otel ('services') page without clipping document.body safe-area bleed
  useEffect(() => {
    const container = document.getElementById('guest-scroll-container');
    if (activeTab === 'services') {
      document.body.style.overscrollBehavior = 'none';
      if (container) {
        container.style.overflowY = 'hidden';
        container.scrollTop = 0;
      }
    } else {
      document.body.style.overscrollBehavior = '';
      if (container) {
        container.style.overflowY = 'auto';
      }
    }
    return () => {
      document.body.style.overscrollBehavior = '';
      if (container) {
        container.style.overflowY = 'auto';
      }
    };
  }, [activeTab]);

  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];
  const t = getT(lang);

  // Panelden düzenlenen kategoriler (ad, ikon, sıra, gizli/açık) — web ile ortak
  const categoryConfigs = useCategoryConfigs();
  const hiddenCategoryKeys = new Set(categoryConfigs.filter((c) => c.hidden).map((c) => c.key));
  // Gizlenen kategorilerin ilanları uygulamada hiç görünmez
  const visibleExperiences = allExperiences.filter(
    (e) => !hiddenCategoryKeys.has(getExperienceCategoryKey(e))
  );

  const builtinShowcase = MARKETPLACE_CATEGORIES.map((def) => ({
    catKey: def.key,
    key: getLocalizedCategoryTitle(def.key, lang),
    rawKey: def.label,
    targetCategory: def.label,
    iconPath: def.icon,
    desc: "",
  }));

  const cfgByKey = new Map(categoryConfigs.map((c) => [c.key, c]));
  const localizedAdminLabel = (cfg: { key?: string; label: string; labelEn?: string }) => {
    if (cfg.key) {
      const byKey = getLocalizedCategoryTitle(cfg.key, lang);
      if (byKey && byKey !== cfg.key) return byKey;
    }
    const byLabel = getLocalizedCategoryTitle(cfg.label, lang);
    if (byLabel && byLabel !== cfg.label) return byLabel;
    return lang === 'en' ? (cfg.labelEn || cfg.label) : cfg.label;
  };

  const builtinEntries: ShowcaseEntry[] = builtinShowcase.map((item, i) => {
    const catKey = item.catKey;
    const cfg = cfgByKey.get(catKey);
    const def = MARKETPLACE_CATEGORIES[i];
    const iconEdited =
      !!cfg &&
      !!def &&
      cfg.icon !== def.icon &&
      !!cfg.icon &&
      !cfg.icon.startsWith('/icons/categories/') &&
      !cfg.icon.startsWith('/icons/menu/');
    return {
      key: item.key,
      rawKey: item.rawKey,
      catKey,
      desc: cfg?.description || item.desc,
      customIcon: iconEdited && cfg ? cfg.icon : undefined,
      order: cfg?.order ?? i,
    };
  });

  const customEntries: ShowcaseEntry[] = categoryConfigs
    .filter((c) => c.custom)
    .map((c) => ({
      key: localizedAdminLabel(c),
      rawKey: c.label,
      catKey: c.key,
      desc: c.description || '',
      customIcon: c.icon || undefined,
      order: c.order,
    }));

  const categoryShowcase: ShowcaseEntry[] = [...builtinEntries, ...customEntries]
    .filter((cat) => {
      if (cfgByKey.get(cat.catKey)?.hidden) return false;
      const expCount = visibleExperiences.filter(
        (e) => getExperienceCategoryKey(e) === cat.catKey
      ).length;
      return expCount > 0;
    })
    .sort((a, b) => a.order - b.order);

  // Deneyimler sekmesindeki kategori çipleri (yatırım kartı ayrı sekmeye gider)
  const categories = ['all', ...categoryShowcase.filter((c) => c.tab !== 'invest').map((c) => c.catKey)];

  // Filter experiences (admin-suspended listings never reach the guest catalog)
  const filteredExperiences = visibleExperiences.filter(e => {
    if (e.status === 'suspended') return false;
    const expCatKey = getExperienceCategoryKey(e);
    const matchesCat =
      selectedCategory === 'all' ||
      expCatKey === selectedCategory ||
      e.category === selectedCategory ||
      expCatKey === getExperienceCategoryKey({ category: selectedCategory });
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      e.title.toLowerCase().includes(q) ||
      e.provider.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q);
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


  const getCategoryLabel = (categoryRaw: string) => {
    if (categoryRaw === 'all') return t.allCategories;
    const dynamicEntry = categoryShowcase.find((c) => c.catKey === categoryRaw);
    if (dynamicEntry) return dynamicEntry.key;
    return getLocalizedCategoryTitle(categoryRaw, lang);
  };

  return (
    <div className={`w-full text-[#221F1C] ${activeTab === 'services' ? 'fixed inset-0 h-[100dvh] w-screen overscroll-none' : 'min-h-[100dvh]'} relative`}>
      {/* Global Fixed Background — Subtle Sepia / Warm-Tinted Soft-Focus Istanbul Mosque Silhouette */}
      <div className="fixed -top-[70px] -bottom-[50px] left-0 right-0 z-0 pointer-events-none overflow-hidden bg-[#F6F1E7]">
        <Image 
          src="/images/light-mosque-bg.jpg" 
          alt="Historic Istanbul Mosque Silhouette"
          fill
          priority
          quality={90}
          unoptimized
          className="object-cover object-center scale-[1.01] blur-[2px] sepia-[0.18] saturate-[0.88] brightness-[1.01] contrast-[0.98]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F0]/68 via-[#F5EFE6]/14 to-transparent" />
      </div>

      <div id="guest-scroll-container" className={`relative z-10 w-full ${activeTab === 'services' ? 'h-full overflow-hidden flex flex-col justify-start overscroll-none touch-none' : 'h-full pb-[calc(88px+env(safe-area-inset-bottom,24px))] overflow-y-auto'}`}>
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
      <main className={`max-w-4xl mx-auto px-3.5 sm:px-4 w-full ${activeTab === 'services' ? 'flex-1 min-h-0 h-full flex flex-col pt-0.5 pb-[calc(86px+env(safe-area-inset-bottom,24px))] overflow-hidden touch-none' : 'pt-1 pb-[28px] space-y-4'}`}>
        
        {/* TAB 1: In-Room Services (Otel İçi Hizmetler) */}
        {activeTab === 'services' && (
          <div className="flex-1 h-full w-full flex flex-col">
            <InRoomServices
              hotel={currentHotel}
              roomNumber={activeRoomNumber}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 2: Experiences & Tours Grid (Tüm İlanlar) */}
        {activeTab === 'experiences' && (
          <div className="space-y-4 px-1">
            {selectedCategory && selectedCategory !== 'all' ? (
              <div className="flex items-center justify-between">
                <h2 className="font-luxury-serif text-[20px] sm:text-[22px] font-semibold tracking-[0.04em] uppercase text-[#141414]">
                  {getCategoryLabel(selectedCategory)}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('categories')}
                  className="font-luxury-sans text-[11px] font-bold text-[#7D5E2A] bg-[#FAF8F4]/90 px-3 py-1.5 rounded-xl border border-[#C4B8A4] shadow-sm hover:bg-[#F3ECE0] transition cursor-pointer"
                >
                  ← {t.allCategories}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="font-luxury-serif text-[20px] sm:text-[22px] font-semibold tracking-[0.04em] uppercase text-[#141414]">
                  {t.experiencesTitle}
                </h2>
                <p className="font-luxury-sans text-xs text-[#5C4938]">{t.experiencesSubtitle}</p>
              </div>
            )}

            {/* Search & Category Filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8E7252] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-luxury-sans text-[#141414] placeholder:text-[#78716C] bg-[#FAF8F4]/90 backdrop-blur-md rounded-2xl border-[1.5px] border-[#C4B8A4]/85 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                />
              </div>

              {/* Horizontal Scroll Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat, cIdx) => {
                  return (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`font-luxury-sans text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold shadow-sm border border-[#7D5E2A]'
                          : 'bg-[#FAF8F4]/90 backdrop-blur-md text-[#221F1C] font-semibold hover:bg-[#F3ECE0] border border-[#C4B8A4]/80'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experiences Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {(filteredExperiences.length > 0 || searchQuery.trim().length > 0
                ? filteredExperiences
                : visibleExperiences
              ).map((exp) => (
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
          </div>
        )}

        {/* TAB 3: Category Catalog View — Identical Luxury Visual Style to Hotel Services Page */}
        {activeTab === 'categories' && (
          <div className="relative z-10 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-1.5 sm:p-4 -mx-1 sm:mx-0">
            {categoryShowcase.map((cat, idx) => (
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
                  setSearchQuery('');
                  setSelectedCategory(cat.catKey);
                  setActiveTab('experiences');
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="luxury-service-card px-3 py-3.5 flex flex-col items-center text-center justify-center gap-2 min-h-[132px] sm:min-h-[150px] group relative cursor-pointer"
              >
                {/* 3D Gilded Embossed Icon (özel ikon yüklendiyse o gösterilir) */}
                <div className="shrink-0 flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-300 relative">
                  {cat.customIcon ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gilded-icon-plinth flex items-center justify-center p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.customIcon}
                        alt={cat.key}
                        className="w-full h-full object-contain drop-shadow-[0_2px_3px_rgba(92,64,18,0.35)]"
                      />
                    </div>
                  ) : (
                    <LuxuryCategoryIcon categoryKey={cat.catKey || cat.rawKey} className="w-16 h-16 sm:w-20 sm:h-20" />
                  )}
                </div>

                {/* Clean Bold Modern Sans-Serif Card Label */}
                <div className="w-full px-1">
                  <span className="font-luxury-sans text-[13.5px] sm:text-[15px] font-bold tracking-[-0.01em] text-[#221A0F] group-hover:text-[#5C3D0E] leading-[1.18] block transition-colors">
                    {cat.key}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* TAB 4: Practical Info & Ombudsman (Rehber & Haklar) */}
        {activeTab === 'practical' && (
          <div className="space-y-4">
            <div className="px-1">
              <h2 className="font-luxury-serif text-[20px] sm:text-[22px] font-semibold tracking-[0.04em] uppercase text-[#141414]">
                {t.practicalTitle}
              </h2>
              <p className="font-luxury-sans text-xs text-[#5C4938]">{t.practicalSubtitle}</p>
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
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/45 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRequestsModal(false);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="luxury-service-card relative w-full max-w-lg p-5 sm:p-6 space-y-4 animate-in zoom-in-95 text-[#141414]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#D8CBB8] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF8F4] border border-[#C4B8A4] flex items-center justify-center text-[#8E7252] shadow-sm">
                    <Bell className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="font-luxury-serif text-base font-bold text-[#141414]">{t.activeRequests}</h3>
                    <p className="font-luxury-sans text-[11px] text-[#5C4938]">
                      {activeTab === 'services' ? currentHotel.name : 'Purely Istanbul'} - {t.room} {activeRoomNumber}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRequestsModal(false)} 
                  className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] hover:bg-[#EFE8DA] text-[#141414] flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-8 text-center text-[#5C4938] space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-[#8E7252] opacity-60 stroke-[1.6]" />
                  <p className="font-luxury-sans text-xs">{t.noRequests}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#FAF8F4]/90 p-3.5 rounded-2xl border border-[#C4B8A4]/80 flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div className="space-y-1">
                        <strong className="font-luxury-sans text-[#141414] font-bold block">{req.serviceTitle}</strong>
                        {req.notes && <p className="font-luxury-sans text-[11px] text-[#3D352E]">{req.notes}</p>}
                        <div className="flex items-center gap-1 text-[10px] text-[#6B5A48] font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#8E7252]" />
                          <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <span className={`font-luxury-sans text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                        req.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : req.status === 'in_progress'
                            ? 'bg-amber-50 text-[#7D5E2A] border-[#D8CBB8]'
                            : 'bg-[#FAF3E6] text-[#8C6D46] border-[#C4B8A4] animate-pulse'
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
        onExploreCategory={(catKey) => {
          setSearchQuery('');
          setSelectedCategory(catKey);
          setActiveTab('experiences');
          setIsAiOpen(false);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
      </div>
    </div>
  );
}

