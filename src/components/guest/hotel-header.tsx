"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Hotel, Language, XeniosUser } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { LanguageSelector } from './language-selector';
import { PwaNotificationModal } from '../pwa-notification-modal';
import { OnlineCheckinModal } from './online-checkin-modal';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { PwaNotificationManager } from '@/lib/pwa-notifications';
import { BrandMark } from '../brand-mark';
import { XeniosStore } from '@/lib/store';
import { 
  Wifi, 
  MapPin, 
  Copy, 
  Check, 
  BellRing, 
  User, 
  DoorOpen, 
  LogOut, 
  ChevronDown, 
  Building2, 
  Clock, 
  Phone, 
  X, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface HotelHeaderProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onLanguageChange: (l: Language) => void;
  activeRequestsCount?: number;
  onOpenRequests?: () => void;
  onOpenAuth?: () => void;
  activeTab?: string;
}

export function HotelHeader({ 
  hotel, 
  roomNumber, 
  lang, 
  onLanguageChange,
  activeRequestsCount = 0,
  onOpenRequests,
  onOpenAuth,
  activeTab = 'services'
}: HotelHeaderProps) {
  const t = getT(lang);
  const isHotelServices = activeTab === 'services';
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<XeniosUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [pwaPerm, setPwaPerm] = useState<NotificationPermission>('default');
  const [isGuestSelfKbsEnabled, setIsGuestSelfKbsEnabled] = useState<boolean>(() =>
    XeniosStore.getGuestSelfKbsEnabled(hotel?.id)
  );
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const ignoreScrollUntilRef = useRef(0);

  useEffect(() => {
    setIsHeaderHidden(false);
    lastScrollYRef.current = 0;
    ignoreScrollUntilRef.current = Date.now() + 550;
  }, [activeTab]);

  useEffect(() => {
    const getScrollY = (target?: EventTarget | null) => {
      if (
        target instanceof HTMLElement &&
        target.id === 'guest-scroll-container' &&
        target.scrollTop > 0
      ) {
        return target.scrollTop;
      }
      return (
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };

    const handleScroll = (e: Event) => {
      if (Date.now() < ignoreScrollUntilRef.current) return;
      const rawY = getScrollY(e.target);
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const currentY = Math.max(0, Math.min(rawY, maxScroll > 0 ? maxScroll : rawY));
      const prevY = lastScrollYRef.current;
      const diff = currentY - prevY;

      if (Math.abs(diff) < 6) return;

      if (diff > 0) {
        // Aşağı kaydırırken üstteki Header gizlenir
        setIsHeaderHidden(true);
      } else if (diff < 0) {
        // Yukarı kaydırırken üstteki Header açılır
        setIsHeaderHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (Date.now() < ignoreScrollUntilRef.current) return;
      if (touchStartYRef.current === null || e.touches.length !== 1) return;
      const currentTouchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentTouchY; // > 0 means scrolling down, < 0 means scrolling up

      if (Math.abs(deltaY) < 14) return;

      if (deltaY > 0) {
        // Aşağı kaydırırken üstteki Header gizlenir
        setIsHeaderHidden(true);
        touchStartYRef.current = currentTouchY;
      } else if (deltaY < 0) {
        // Yukarı kaydırırken üstteki Header açılır
        setIsHeaderHidden(false);
        touchStartYRef.current = currentTouchY;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Date.now() < ignoreScrollUntilRef.current) return;
      if (Math.abs(e.deltaY) < 8) return;
      if (e.deltaY > 0) {
        setIsHeaderHidden(true);
      } else if (e.deltaY < 0) {
        setIsHeaderHidden(false);
      }
    };

    const handleTabReset = () => {
      setIsHeaderHidden(false);
      lastScrollYRef.current = 0;
      ignoreScrollUntilRef.current = Date.now() + 550;
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('xenios_tab_changed', handleTabReset);
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('xenios_tab_changed', handleTabReset);
    };
  }, []);

  useEffect(() => {
    setUser(XeniosStore.getUser());
    if (typeof window !== 'undefined') {
      setPwaPerm(PwaNotificationManager.getPermission());
    }

    const syncKbsState = () => {
      const enabled = XeniosStore.getGuestSelfKbsEnabled(hotel?.id);
      setIsGuestSelfKbsEnabled(enabled);
      if (!enabled) {
        setShowCheckinModal(false);
      }
    };

    syncKbsState();

    const handleAuth = () => {
      setUser(XeniosStore.getUser());
    };
    window.addEventListener('xenios_auth_updated', handleAuth);
    window.addEventListener('xenios_hotels_updated', syncKbsState);
    window.addEventListener('xenios_module_settings_updated', syncKbsState);
    window.addEventListener('storage', syncKbsState);
    return () => {
      window.removeEventListener('xenios_auth_updated', handleAuth);
      window.removeEventListener('xenios_hotels_updated', syncKbsState);
      window.removeEventListener('xenios_module_settings_updated', syncKbsState);
      window.removeEventListener('storage', syncKbsState);
    };
  }, [hotel?.id, hotel?.modules?.enable_guest_self_kbs, showHotelModal]);


  const room = hotel.rooms?.find(r => r.number === roomNumber) || hotel.rooms?.[0] || {
    wifiPass: 'purely2026!',
    wifiSsid: 'Hotel_Guest'
  };
  const wifiPass = room?.wifiPass || 'purely2026!';
  const wifiSsid = room?.wifiSsid || `${hotel.name.split(' ')[0]}_Guest`;

  const copyWifi = () => {
    navigator.clipboard.writeText(wifiPass);
    setCopied(true);
    toast.success(t.wifiCopied);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = () => {
    XeniosStore.logout();
    setShowUserDropdown(false);
    toast.info("Oturum kapatıldı.");
  };

  const hideBar = isHeaderHidden && !showHotelModal && !showPwaModal && !showCheckinModal && !showUserDropdown;

  return (
    <>
    <header
      className={`sticky top-0 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.35rem))] pb-1.5 px-3.5 sm:px-4 w-full max-w-full box-border z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-transparent border-b-transparent ${
        hideBar
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100 pointer-events-auto'
      }`}
    >
      <div className="max-w-4xl mx-auto w-full max-w-full box-border flex flex-col items-center justify-center gap-2">
        
        {/* Centered Logo/Name — Hotel Name ONLY on Hotel page; PURELY ISTANBUL on all other pages */}
        <h1
          translate="no"
          className="notranslate font-luxury-serif text-[18px] sm:text-[21px] tracking-[0.14em] font-normal text-[#141414] uppercase text-center leading-[1.28] select-none mt-0.5 max-w-full"
        >
          {isHotelServices ? (
            hotel.name.toUpperCase().endsWith(' ISTANBUL') ? (
              <>
                {hotel.name.slice(0, -9)}
                <br />
                ISTANBUL
              </>
            ) : (
              hotel.name
            )
          ) : (
            <span translate="no" className="notranslate">PURELY ISTANBUL</span>
          )}
        </h1>

        {/* Clean Neomorphic Top Bar Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 max-w-full box-border rounded-full bg-[#F3EFE8]/92 backdrop-blur-md border border-white/90 shadow-[0_8px_22px_rgba(36,28,18,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)] relative z-50">
          
          {/* 1. Notification Bell Icon */}
          <button
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="w-7 h-7 rounded-full transition flex items-center justify-center relative cursor-pointer hover:bg-white/60 text-[#8C6D46]"
            title={
              lang === 'tr' ? "PWA Bildirim Ayarları" :
              lang === 'ar' ? "إعدادات الإشعارات" :
              lang === 'ru' ? "Настройки уведомлений" :
              lang === 'de' ? "Benachrichtigungseinstellungen" :
              lang === 'fr' ? "Paramètres de notification" :
              "Notification Settings"
            }
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#8C6D46]" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pwaPerm === 'granted' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D46] absolute top-1.5 right-1.5 ring-1 ring-white" />
            )}
          </button>

          <span className="w-px h-4 bg-[#C4B7A3]" />

          {/* 2. Language Selector */}
          <LanguageSelector currentLang={lang} onSelect={onLanguageChange} theme="light" />

          <span className="w-px h-4 bg-[#C4B7A3]" />

          {/* 3. Building Icon */}
          <button
            type="button"
            onClick={() => setShowHotelModal(true)}
            className="w-7 h-7 rounded-full hover:bg-white/60 flex items-center justify-center transition cursor-pointer"
            title={isHotelServices ? hotel.name : 'Purely Istanbul'}
          >
            <Building2 className="w-4 h-4 text-[#8C6D46] stroke-[1.6]" />
          </button>

          <span className="w-px h-4 bg-[#C4B7A3]" />

          {/* 4. Wi-Fi & Room Number ("Oda TEST") */}
          <button
            type="button"
            onClick={() => setShowHotelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F4]/90 hover:bg-white border border-[#CFC4B2] rounded-full text-[#141414] text-[11.5px] font-bold transition cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
          >
            <Wifi className="w-3.5 h-3.5 text-[#8C6D46] stroke-[1.6]" />
            <ChevronDown className="w-3 h-3 text-[#8C6D46] stroke-[1.6]" />
            <span>{t.room} {roomNumber}</span>
          </button>

          {/* 5. Panel Button (No vertical divider before Panel, matching reference image) */}
          {roomNumber.toUpperCase() === 'TEST' && (
            <a
              href="/hotel-portal"
              className="px-3.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] text-[#5C3D1E] font-bold flex items-center text-[11px] cursor-pointer shadow-[0_2px_6px_rgba(32,24,16,0.06)] transition"
            >
              {lang === 'tr' ? 'Panel' : lang === 'ar' ? 'لوحة التحكم' : lang === 'ru' ? 'Панель' : lang === 'fr' ? 'Panneau' : 'Panel'}
            </a>
          )}
        </div>
      </div>
    </header>
      {/* FULL HOTEL & WI-FI DETAILS MODAL (Tıklanınca Açılan Pencere) */}
      {showHotelModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHotelModal(false);
          }}
        >
          <div 
            className="luxury-service-card max-w-lg w-full p-5 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95 text-[#141414] relative font-luxury-sans"
            onClick={(e) => e.stopPropagation()}
          >
            
            <button
              onClick={() => setShowHotelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>

            {/* Hotel Title & Badge */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#FAF8F4] border border-[#C4B8A4] text-[#7D5E2A] font-bold uppercase tracking-wider">
                  {hotel.type === 'Butik Otel & Konak'
                    ? (lang === 'tr' ? 'Butik Otel & Konak' :
                       lang === 'ar' ? 'فندق بوتيك وقصر تاريخي' :
                       lang === 'ru' ? 'Бутик-отель и особняк' :
                       lang === 'de' ? 'Boutique-Hotel & Herrenhaus' :
                       lang === 'fr' ? 'Hôtel Boutique & Manoir' :
                       'Boutique Hotel & Mansion')
                    : hotel.type}
                </span>
                <span className="px-2.5 py-0.5 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white rounded-full text-xs font-bold">
                  {t.room} {roomNumber}
                </span>
              </div>
              <h2 className="font-luxury-serif text-xl font-bold uppercase tracking-[0.04em] text-[#141414]">
                {isHotelServices ? hotel.name : 'Purely Istanbul'}
              </h2>
              <p className="text-xs text-[#5C4938] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8E7252] shrink-0" />
                <span>{hotel.address}</span>
              </p>
            </div>

            {/* Wi-Fi Credentials Box */}
            <div className="bg-[#FAF8F4]/90 p-4 rounded-2xl border border-[#C4B8A4] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#C4B8A4] text-[#8E7252] flex items-center justify-center shadow-2xs">
                    <Wifi className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div>
                    <strong className="font-luxury-serif text-sm font-bold text-[#141414] block">{t.wifiNetwork}</strong>
                    <span className="text-[11px] text-[#5C4938] font-mono">{wifiSsid}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyWifi}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.wifiCopied : t.wifiCopy}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#D8CBB8] flex items-center justify-between text-xs">
                <span className="text-[#5C4938] font-semibold">{t.wifiPassword}:</span>
                <code className="bg-white px-2.5 py-1 rounded-lg text-[#7D5E2A] font-mono font-bold border border-[#C4B8A4] text-xs">
                  {wifiPass}
                </code>
              </div>
            </div>

            {/* Key Hotel Schedules & Services Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7D5E2A] block">{t.breakfast}</span>
                <strong className="font-luxury-serif text-[#141414] block text-sm font-bold">{hotel.breakfastHours}</strong>
                <span className="text-[10px] text-[#5C4938]">
                  {lang === 'tr' ? 'Ana Restoran / Teras' :
                   lang === 'ar' ? 'المطعم الرئيسي / التراس' :
                   lang === 'ru' ? 'Главный ресторан / Терраса' :
                   lang === 'de' ? 'Hauptrestaurant / Terrasse' :
                   lang === 'fr' ? 'Restaurant Principal / Terrasse' :
                   'Main Restaurant / Terrace'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7D5E2A] block">{t.checkout}</span>
                <strong className="font-luxury-serif text-[#141414] block text-sm font-bold">{hotel.checkoutTime}</strong>
                <span className="text-[10px] text-[#5C4938]">
                  {lang === 'tr' ? 'Geç çıkış için resepsiyon' :
                   lang === 'ar' ? 'الاستقبال للخروج المتأخر' :
                   lang === 'ru' ? 'Ресепшн для позднего выезда' :
                   lang === 'de' ? 'Rezeption für späten Check-out' :
                   lang === 'fr' ? 'Réception pour départ tardif' :
                   'Reception for late check-out'}
                </span>
              </div>
            </div>

            {/* Reception Direct Call & Online Check-in / Taleplerim */}
            <div className="space-y-2 pt-1">
              <div className={isGuestSelfKbsEnabled ? "grid grid-cols-2 gap-2" : ""}>
                {/* 50% Width Reception Extension Badge */}
                <div className="p-3 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-[#8E7252] shrink-0" />
                    <div className="truncate">
                      <strong className="text-[#141414] block text-[11px] truncate">{t.receptionExt}</strong>
                      <span className="text-[9px] text-[#5C4938] block truncate">
                        {lang === 'tr' ? 'Dahili Hat' :
                         lang === 'ar' ? 'الخط الداخلي' :
                         lang === 'ru' ? 'Внутренняя линия' :
                         lang === 'de' ? 'Interne Durchwahl' :
                         lang === 'fr' ? 'Ligne Interne' :
                         'Internal Line'}
                      </span>
                    </div>
                  </div>
                  <strong className="text-xs font-mono text-[#7D5E2A] bg-white px-2 py-0.5 rounded-lg border border-[#C4B8A4] font-bold shrink-0 ml-1">
                    {hotel.receptionExt}
                  </strong>
                </div>

                {/* 50% Width Online Check-in & KBS Button */}
                {isGuestSelfKbsEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHotelModal(false);
                      setShowCheckinModal(true);
                    }}
                    className="p-2.5 rounded-2xl bg-[#FAF8F4]/90 hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center gap-2 text-left transition cursor-pointer group shadow-2xs"
                  >
                    <div className="shrink-0">
                      <LuxuryCategoryIcon categoryKey="kbs" className="w-9 h-9" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-[11px] font-bold text-[#141414] block truncate">
                        {lang === 'ar' ? 'تسجيل الدخول' : lang === 'ru' ? 'Онлайн Чекин' : lang === 'fr' ? 'Enregistrement' : 'Online Check-in'}
                      </strong>
                      <span className="text-[9px] text-[#7D5E2A] font-semibold block truncate">
                        {lang === 'tr' ? 'Kimlik & KBS' :
                         lang === 'ar' ? 'الهوية والجواز' :
                         lang === 'ru' ? 'Паспорт и ID' :
                         lang === 'de' ? 'Ausweis & KBS' :
                         lang === 'fr' ? 'Identité & KBS' :
                         'ID & KBS'}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {onOpenRequests && (
                <button
                  type="button"
                  onClick={() => {
                    setShowHotelModal(false);
                    onOpenRequests();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>{t.activeRequests} ({activeRequestsCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PWA NOTIFICATION SETTINGS MODAL */}
      <PwaNotificationModal 
        isOpen={showPwaModal} 
        lang={lang}
        onClose={() => { 
          setShowPwaModal(false); 
          setPwaPerm(PwaNotificationManager.getPermission()); 
        }} 
      />

      {/* ONLINE CHECK-IN & KBS MODAL */}
      {showCheckinModal && isGuestSelfKbsEnabled && (
        <OnlineCheckinModal
          hotel={hotel}
          roomNumber={roomNumber}
          lang={lang}
          onClose={() => setShowCheckinModal(false)}
        />
      )}
    </>
  );
}
