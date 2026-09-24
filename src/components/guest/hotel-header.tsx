"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Hotel, Language, XeniosUser } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { LanguageSelector } from './language-selector';
import { PwaNotificationModal } from '../pwa-notification-modal';
import { OnlineCheckinModal } from './online-checkin-modal';
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

  useEffect(() => {
    setUser(XeniosStore.getUser());
    if (typeof window !== 'undefined') {
      setPwaPerm(PwaNotificationManager.getPermission());
    }

    const handleAuth = () => {
      setUser(XeniosStore.getUser());
    };
    window.addEventListener('xenios_auth_updated', handleAuth);
    return () => window.removeEventListener('xenios_auth_updated', handleAuth);
  }, []);

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

  return (
    <header className={`pt-10 pb-3 px-3.5 sm:px-4 w-full relative z-40 overflow-hidden transition-colors duration-300 ${isHotelServices ? 'bg-transparent border-b-transparent' : 'bg-gradient-to-b from-amber-500/10 via-amber-100/20 to-transparent border-b border-amber-200/50'}`}>
      <div className={`max-w-4xl mx-auto ${isHotelServices ? 'flex flex-col items-center justify-center gap-4' : 'space-y-2.5'}`}>
        
        {isHotelServices ? (
          <>
            {/* NEW DESIGN: Centered Hotel Name */}
            <h1 className="font-serif text-[14px] sm:text-[16px] tracking-[0.25em] font-light text-white/95 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center mt-2 mb-1">
              {hotel.name}
            </h1>

            {/* NEW DESIGN: Unified Single Pill */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-black/10 backdrop-blur-[4px] border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] relative z-50">
              
              {/* 1. PWA Notification Bell */}
              <button
                type="button"
                onClick={() => setShowPwaModal(true)}
                className="w-8 h-8 rounded-full transition flex items-center justify-center relative cursor-pointer hover:bg-white/10 text-white"
                title="PWA Bildirim Ayarları"
              >
                <BellRing className="w-4 h-4 text-white" />
                {pwaPerm === 'granted' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 ring-1.5 ring-white" />
                )}
              </button>

              <span className="w-px h-4 bg-white/30" />

              {/* 2. Language Selector */}
              <LanguageSelector currentLang={lang} onSelect={onLanguageChange} theme="dark" />

              <span className="w-px h-4 bg-white/30" />

              {/* 3. Building Modal Trigger */}
              <button onClick={() => setShowHotelModal(true)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition cursor-pointer">
                <Building2 className="w-4 h-4 text-white" />
              </button>

              <span className="w-px h-4 bg-white/30" />

              {/* 4. Wi-Fi & Room Badge */}
              <button onClick={() => setShowHotelModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-full text-white text-xs font-bold transition cursor-pointer shadow-2xs">
                <Wifi className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3 opacity-80" />
                <span>Oda {roomNumber}</span>
              </button>

              {/* TEST MODE ONLY: Auth & Portal */}
              {roomNumber.toUpperCase() === 'TEST' && (
                <>
                  <span className="w-px h-4 bg-white/30" />
                  <a
                    href="/hotel-portal"
                    className="px-3 py-1.5 rounded-full bg-white text-amber-950 font-bold flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    Panel
                  </a>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Original Layout for other tabs */}
            <div className="flex items-center justify-between gap-2 relative z-50 w-full max-w-full">
              <Link href="/" className="flex items-baseline shrink-0 tracking-tight font-serif font-bold text-lg sm:text-xl text-zinc-900 leading-none select-none pl-0">
                <span>purely</span><span className="text-red-600 font-bold">İstanbul</span>
              </Link>
              
              <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-0.5 sm:p-1 rounded-full border border-amber-200/90 shadow-xs shrink-0 relative z-50">
                <button
                  onClick={() => setShowPwaModal(true)}
                  className="w-7 h-7 rounded-full hover:bg-amber-50 text-zinc-700 transition flex items-center justify-center relative cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-800" />
                  {pwaPerm === 'granted' && <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-0.5 right-0.5 ring-1.5 ring-white" />}
                </button>
                <span className="w-px h-3.5 bg-amber-200/80" />
                <LanguageSelector currentLang={lang} onSelect={onLanguageChange} theme="light" />

                {roomNumber.toUpperCase() === 'TEST' && (
                  <>
                    <span className="w-px h-3.5 bg-amber-200/80" />
                    {user ? (
                      <button onClick={handleLogout} className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </button>
                    ) : (
                      <button onClick={onOpenAuth} className="w-7 h-7 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center text-xs">
                        <User className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="w-px h-3.5 bg-amber-200/80" />
                    <a href="/hotel-portal" className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-950 font-bold flex items-center gap-1 text-[10px]">
                      <Building2 className="w-3.5 h-3.5 text-amber-800" />
                      Panel
                    </a>
                  </>
                )}
              </div>
            </div>

            <div 
              onClick={() => setShowHotelModal(true)}
              className="bg-white/95 hover:bg-white rounded-2xl px-3.5 py-2.5 shadow-xs hover:shadow-sm border border-amber-200/80 flex items-center justify-between gap-2.5 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold text-xs text-zinc-900 truncate">
                  {hotel.name}
                </span>
                <span className="text-zinc-300">|</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[11px] font-bold shrink-0">
                  <DoorOpen className="w-3 h-3" />
                  <span>{t.room} {roomNumber}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeRequestsCount > 0 && onOpenRequests && (
                  <button onClick={(e) => { e.stopPropagation(); onOpenRequests(); }} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-xl text-[11px] font-bold animate-pulse">
                    <BellRing className="w-3 h-3" />
                    <span>{t.myRequests} ({activeRequestsCount})</span>
                  </button>
                )}
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  <Wifi className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">{t.wifiTitle}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FULL HOTEL & WI-FI DETAILS MODAL (Tıklanınca Açılan Pencere) */}
      {showHotelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95 text-zinc-900 relative">
            
            <button
              onClick={() => setShowHotelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hotel Title & Badge */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold uppercase tracking-wider">
                  {hotel.type}
                </span>
                <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                  {t.room} {roomNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-zinc-900">{hotel.name}</h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{hotel.address}</span>
              </p>
            </div>

            {/* Wi-Fi Credentials Box */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-50 p-4 rounded-2xl border border-amber-300/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-zinc-900 block">{t.wifiNetwork}</strong>
                    <span className="text-[11px] text-zinc-600 font-mono">{wifiSsid}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyWifi}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.wifiCopied : t.wifiCopy}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{t.wifiPassword}:</span>
                <code className="bg-white px-2.5 py-1 rounded-lg text-amber-900 font-mono font-bold border border-amber-200 text-xs">
                  {wifiPass}
                </code>
              </div>
            </div>

            {/* Key Hotel Schedules & Services Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{t.breakfast}</span>
                <strong className="text-zinc-800 block text-xs">{hotel.breakfastHours}</strong>
                <span className="text-[10px] text-zinc-500">Ana Restoran / Teras</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{t.checkout}</span>
                <strong className="text-zinc-800 block text-xs">{hotel.checkoutTime}</strong>
                <span className="text-[10px] text-zinc-500">Geç çıkış için resepsiyon</span>
              </div>
            </div>

            {/* Reception Direct Call & Online Check-in / Taleplerim */}
            <div className="space-y-2 pt-1">
              <div className={hotel.modules?.enable_guest_self_kbs !== false ? "grid grid-cols-2 gap-2" : ""}>
                {/* 50% Width Reception Extension Badge */}
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <div className="truncate">
                      <strong className="text-zinc-900 block text-[11px] truncate">{t.receptionExt}</strong>
                      <span className="text-[9px] text-zinc-500 block truncate">Dahili Hat</span>
                    </div>
                  </div>
                  <strong className="text-xs font-mono text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200 font-bold shrink-0 ml-1">
                    {hotel.receptionExt}
                  </strong>
                </div>

                {/* 50% Width Online Check-in & KBS Button */}
                {hotel.modules?.enable_guest_self_kbs !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHotelModal(false);
                      setShowCheckinModal(true);
                    }}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-300/80 flex items-center gap-2 text-left transition cursor-pointer group shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
                      <Image 
                        src="/icons/kbs-online-checkin.png" 
                        alt="Online Check-in" 
                        width={24} 
                        height={24} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-[11px] font-bold text-amber-950 block truncate group-hover:text-amber-900">
                        Online Check-in
                      </strong>
                      <span className="text-[9px] text-amber-700 block truncate">
                        Kimlik & KBS
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
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
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
        onClose={() => { 
          setShowPwaModal(false); 
          setPwaPerm(PwaNotificationManager.getPermission()); 
        }} 
      />

      {/* ONLINE CHECK-IN & KBS MODAL */}
      {showCheckinModal && (
        <OnlineCheckinModal
          hotel={hotel}
          roomNumber={roomNumber}
          lang={lang}
          onClose={() => setShowCheckinModal(false)}
        />
      )}
    </header>
  );
}
