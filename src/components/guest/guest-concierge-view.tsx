"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { PwaNotificationManager } from '@/lib/pwa-notifications';
import { shouldReceiveStaffRequestAlerts } from '@/lib/hotel-audio-notification';
import { Hotel, Experience, ServiceRequest, Language } from '@/lib/types';
import { getT, detectBrowserLanguage, getLocalizedCategoryTitle } from '@/lib/i18n';
import { toast } from 'sonner';
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
import {
  OnlineRequestPayModal,
  ONLINE_PAYMENT_I18N,
  formatCurrencyAmount,
} from '@/components/guest/inline-online-payment-box';

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
  Clock, Camera, CreditCard, CheckCircle2
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
  const [payModalRequest, setPayModalRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (initialHotelId && initialRoomId) {
      setActiveHotelId(initialHotelId);
      setActiveRoomNumber(initialRoomId);
      XeniosStore.setActiveHotelSession(initialHotelId, initialRoomId);
    } else {
      if (initialHotelId) {
        setActiveHotelId(initialHotelId);
        XeniosStore.setActiveHotelId(initialHotelId);
      }
      if (initialRoomId) {
        setActiveRoomNumber(initialRoomId);
        XeniosStore.setActiveRoomId(initialRoomId);
      }
    }
  }, [initialHotelId, initialRoomId]);

  useEffect(() => {
    // 🏨 Auto-redirect if hotel management role is active on root app launch (never on explicit /stay/[hotelId]/[roomId] QR scan)
    if (typeof window !== 'undefined' && !initialHotelId && !window.location.pathname.startsWith('/stay/')) {
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
      if (!initialHotelId) setActiveHotelId(XeniosStore.getActiveHotelId());
      if (!initialRoomId) setActiveRoomNumber(XeniosStore.getActiveRoomId());
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
      const urlPartnerId =
        urlParams.get('partner_id') ||
        urlParams.get('property_id') ||
        urlParams.get('hotelId');
      const urlUnitId =
        urlParams.get('unit_id') ||
        urlParams.get('roomId') ||
        urlParams.get('room');
      if (urlPartnerId && urlUnitId) {
        setActiveHotelId(urlPartnerId);
        setActiveRoomNumber(urlUnitId);
        XeniosStore.setActiveHotelSession(urlPartnerId, urlUnitId);
      } else {
        if (urlPartnerId) {
          setActiveHotelId(urlPartnerId);
          XeniosStore.setActiveHotelId(urlPartnerId);
        }
        if (urlUnitId) {
          setActiveRoomNumber(urlUnitId);
          XeniosStore.setActiveRoomId(urlUnitId);
        }
      }
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

  // Subscribe to live request status updates for the guest's unit
  useEffect(() => {
    const statusMap = new Map<string, string>();
    let seeded = false;

    const unsubLiveReqs = FirestoreService.subscribeToLiveRequests(null, (liveReqs) => {
      setRequests(liveReqs);
      const unitNorm = (activeRoomNumber || '').trim().toUpperCase();
      if (!unitNorm) return;

      for (const req of liveReqs) {
        if ((req.roomNumber || '').trim().toUpperCase() !== unitNorm) continue;
        const prevStatus = statusMap.get(req.id);
        statusMap.set(req.id, req.status);

        if (seeded && prevStatus && prevStatus !== req.status && !shouldReceiveStaffRequestAlerts()) {
          const pwaPrefs = PwaNotificationManager.getPreferences();
          if (pwaPrefs.roomRequests !== false) {
            if (req.status === 'in_progress') {
              const title = lang === 'tr' ? '🛎️ Talebiniz Hazırlanıyor' : '🛎️ Request In Progress';
              const body = `${req.serviceTitle} (${lang === 'tr' ? 'Birim' : 'Unit'} ${req.roomNumber})`;
              toast.info(`${title}: ${body}`);
              PwaNotificationManager.showNotification(title, body, window.location.pathname);
            } else if (req.status === 'completed') {
              const title = lang === 'tr' ? '✅ Talebiniz Tamamlandı' : '✅ Request Completed';
              const body = `${req.serviceTitle} (${lang === 'tr' ? 'Birim' : 'Unit'} ${req.roomNumber})`;
              toast.success(`${title}: ${body}`);
              PwaNotificationManager.showNotification(title, body, window.location.pathname);
            }
          }
        }
      }
      seeded = true;
    });

    return () => {
      unsubLiveReqs();
    };
  }, [activeRoomNumber, lang]);

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
    <div className="w-full max-w-[100vw] overflow-x-clip overscroll-x-none touch-pan-y box-border text-[#221F1C] relative">
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

      <div className="relative z-10 w-full max-w-full overflow-x-clip overscroll-x-none touch-pan-y box-border">
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
        <main className="max-w-4xl mx-auto px-3.5 sm:px-4 w-full max-w-full box-border pt-1 space-y-4">
          
          {/* TAB 1: In-Room Services (Otel İçi Hizmetler) */}
          {activeTab === 'services' && (
            <div className="w-full max-w-full box-border">
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
                  className="golden-pill-badge font-luxury-sans text-[11px] font-bold text-[#2C1E0F] px-3.5 py-1.5 rounded-full backdrop-blur-[18px] shadow-xs hover:bg-[rgba(240,195,70,0.48)] active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer"
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
                <Search className="w-4 h-4 text-[#7D5E2A] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-luxury-sans text-[#141414] placeholder:text-[#5C4938]/80 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] rounded-2xl border-[1.5px] border-[rgba(230,185,75,0.55)] shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
                />
              </div>

              {/* Horizontal Scroll Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat, cIdx) => {
                  return (
                    <button
                      key={cIdx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`font-luxury-sans text-[11px] px-3.5 py-1.5 rounded-full whitespace-nowrap active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold shadow-sm border border-[#7D5E2A]'
                          : 'golden-pill-badge backdrop-blur-[18px] text-[#2C1E0F] font-semibold hover:bg-[rgba(240,195,70,0.48)]'
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
          <div className="relative z-10 w-full max-w-full box-border grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-1 sm:p-4 mx-0">
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
                    <div className="w-[78px] h-[78px] sm:w-24 sm:h-24 rounded-full gilded-icon-plinth flex items-center justify-center p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.customIcon}
                        alt={cat.key}
                        className="w-full h-full object-contain drop-shadow-[0_2px_3px_rgba(92,64,18,0.35)]"
                      />
                    </div>
                  ) : (
                    <LuxuryCategoryIcon categoryKey={cat.catKey || cat.rawKey} className="w-[78px] h-[78px] sm:w-24 sm:h-24" />
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
                  {requests.map((req) => {
                    const payUi = ONLINE_PAYMENT_I18N[lang] || ONLINE_PAYMENT_I18N.en;
                    const isPaidOnline = req.paymentStatus === 'paid_online';
                    const hasPayableAmount = typeof req.paymentAmount === 'number' && req.paymentAmount > 0;
                    return (
                      <div
                        key={req.id}
                        className="bg-[#FAF8F4]/90 p-3.5 rounded-2xl border border-[#C4B8A4]/80 flex flex-col gap-2.5 text-xs shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <strong className="font-luxury-sans text-[#141414] font-bold block">{req.serviceTitle}</strong>
                            {req.notes && <p className="font-luxury-sans text-[11px] text-[#3D352E] leading-relaxed">{req.notes}</p>}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-[#6B5A48] font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#8E7252]" />
                                {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isPaidOnline && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-luxury-sans font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {payUi.paidOnlineBadge}
                                  {hasPayableAmount ? ` · ${formatCurrencyAmount(req.paymentAmount!, req.paymentCurrency)}` : ''}
                                  {req.paymentReference ? ` (#${req.paymentReference})` : ''}
                                </span>
                              )}
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

                        {!isPaidOnline && hasPayableAmount && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5DAC8]">
                            <span className="font-luxury-sans text-[10.5px] font-semibold text-[#5C4938]">
                              {payUi.roomFolioBadge}: <strong className="text-[#141414]">{formatCurrencyAmount(req.paymentAmount!, req.paymentCurrency)}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setPayModalRequest(req)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-luxury-sans text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{payUi.payNowButton}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {payModalRequest && (
        <OnlineRequestPayModal
          request={payModalRequest}
          lang={lang}
          onClose={() => setPayModalRequest(null)}
          onPaid={(updated) => {
            setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setPayModalRequest(null);
          }}
        />
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

