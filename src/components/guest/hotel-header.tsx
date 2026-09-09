"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
}

export function HotelHeader({ 
  hotel, 
  roomNumber, 
  lang, 
  onLanguageChange,
  activeRequestsCount = 0,
  onOpenRequests,
  onOpenAuth
}: HotelHeaderProps) {
  const t = getT(lang);
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
    <header className="bg-gradient-to-b from-amber-500/10 via-amber-100/20 to-transparent pt-3 pb-3 px-3.5 sm:px-4 border-b border-amber-200/50 w-full relative z-40 overflow-visible">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Top Bar: Brand Logo + Compact Unified Action Pill (Bell, Lang, User) */}
        <div className="flex items-center justify-between gap-2 relative z-50">
          <div className="shrink-0">
            <BrandMark size={32} showText={true} theme="light" />
          </div>
          
          {/* Unified Compact Action Pill to ensure 100% symmetric margins without backdrop-blur trapping */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-amber-200/90 shadow-xs shrink-0 relative z-50">
            {/* 1. PWA Notification Bell */}
            <button
              type="button"
              onClick={() => setShowPwaModal(true)}
              className="w-7 h-7 rounded-full hover:bg-amber-50 text-zinc-700 hover:text-zinc-900 transition flex items-center justify-center relative cursor-pointer"
              title="PWA Bildirim Ayarları"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-800" />
              {pwaPerm === 'granted' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-0.5 right-0.5 ring-1.5 ring-white" />
              )}
            </button>

            {/* Subtle Divider */}
            <span className="w-px h-3.5 bg-amber-200/80" />

            {/* 2. Language Selector */}
            <LanguageSelector currentLang={lang} onSelect={onLanguageChange} />

            {/* Subtle Divider */}
            <span className="w-px h-3.5 bg-amber-200/80" />

            {/* 3. User Session Profile Badge / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs transition cursor-pointer overflow-hidden"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </button>

                {/* User Dropdown with Click-Outside Backdrop */}
                {showUserDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90] bg-transparent" 
                      onClick={() => setShowUserDropdown(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-300 z-[100] space-y-2 animate-in fade-in zoom-in-95 text-zinc-900">
                      <div className="border-b border-zinc-100 pb-2">
                        <strong className="text-xs text-zinc-900 block truncate">{user.name}</strong>
                        <span className="text-[10px] text-zinc-500 block truncate">{user.email}</span>
                        <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-md mt-1 inline-block">
                          {user.role === 'pilot' ? '✨ Pilot & Kurucu' : user.role === 'hotel' ? 'Otel Yöneticisi' : 'Misafir Hesabı'}
                        </span>
                      </div>

                      {user.role === 'hotel' && (
                        <a
                          href="/hotel-portal"
                          className="block px-2 py-1.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs text-center hover:bg-amber-600 transition shadow-xs"
                        >
                          Otel Yönetim Paneli ➔
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-1.5 px-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-black text-amber-400 flex items-center justify-center text-xs shadow-2xs transition cursor-pointer"
                title={t.loginRegister}
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )}

            {/* 4. Otel Yönetim Paneli Hızlı Giriş Butonu */}
            <span className="w-px h-3.5 bg-amber-200/80" />
            <a
              href="/hotel-portal"
              className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500 text-amber-950 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              title="Otel Yönetim Paneli"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-800" />
              <span>Otel Paneli</span>
            </a>
          </div>
        </div>

        {/* SINGLE-LINE SLEEK HOTEL BAR (Tıklanınca Açılır Pencere) */}
        <div 
          onClick={() => setShowHotelModal(true)}
          className="bg-white/95 hover:bg-white rounded-2xl px-3.5 py-2.5 shadow-xs hover:shadow-sm border border-amber-200/80 flex items-center justify-between gap-2.5 cursor-pointer transition group relative z-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold text-xs text-zinc-900 truncate group-hover:text-amber-800 transition">
              {hotel.name}
            </span>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-2xs">
              <DoorOpen className="w-3 h-3" />
              <span>{t.room} {roomNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeRequestsCount > 0 && onOpenRequests && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRequests();
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-xs animate-pulse cursor-pointer"
              >
                <BellRing className="w-3 h-3" />
                <span>{t.myRequests} ({activeRequestsCount})</span>
              </button>
            )}

            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 group-hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 transition">
              <Wifi className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">{t.wifiTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-700 group-hover:translate-y-0.5 transition" />
            </div>
          </div>
        </div>
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
