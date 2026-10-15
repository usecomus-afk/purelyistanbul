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
    <header className="pt-6 pb-2 px-3.5 sm:px-4 w-full relative z-40 transition-colors duration-300 bg-transparent border-b-transparent">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-3">
        
        {/* Centered Logo/Name — Two-line European Luxury Serif */}
        <h1 className="font-luxury-serif text-[18px] sm:text-[21px] tracking-[0.14em] font-normal text-[#141414] uppercase text-center leading-[1.28] select-none mt-0.5">
          {hotel.name.toUpperCase().endsWith(' ISTANBUL') ? (
            <>
              {hotel.name.slice(0, -9)}
              <br />
              ISTANBUL
            </>
          ) : (
            hotel.name
          )}
        </h1>

        {/* Clean Neomorphic Top Bar Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-[#F3EFE8]/92 backdrop-blur-md border border-white/90 shadow-[0_8px_22px_rgba(36,28,18,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)] relative z-50">
          
          {/* 1. Notification Bell Icon */}
          <button
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="w-7 h-7 rounded-full transition flex items-center justify-center relative cursor-pointer hover:bg-white/60 text-[#8C6D46]"
            title="PWA Bildirim Ayarları"
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
            title={hotel.name}
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
            <span>Oda {roomNumber}</span>
          </button>

          {/* 5. Panel Button (No vertical divider before Panel, matching reference image) */}
          {roomNumber.toUpperCase() === 'TEST' && (
            <a
              href="/hotel-portal"
              className="px-3.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] text-[#5C3D1E] font-bold flex items-center text-[11px] cursor-pointer shadow-[0_2px_6px_rgba(32,24,16,0.06)] transition"
            >
              Panel
            </a>
          )}
        </div>
      </div>
      {/* FULL HOTEL & WI-FI DETAILS MODAL (Tıklanınca Açılan Pencere) */}
      {showHotelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white   rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95 text-slate-900  relative">
            
            <button
              onClick={() => setShowHotelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
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
              <h2 className="text-xl font-bold font-serif text-slate-900 ">{hotel.name}</h2>
              <p className="text-xs text-slate-500  flex items-center gap-1">
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
                    <strong className="text-xs text-slate-900  block">{t.wifiNetwork}</strong>
                    <span className="text-[11px] text-slate-600  font-mono">{wifiSsid}</span>
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
                <span className="text-slate-500 ">{t.wifiPassword}:</span>
                <code className="bg-white   px-2.5 py-1 rounded-lg text-amber-900 font-mono font-bold border border-amber-200 text-xs">
                  {wifiPass}
                </code>
              </div>
            </div>

            {/* Key Hotel Schedules & Services Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{t.breakfast}</span>
                <strong className="text-slate-800  block text-xs">{hotel.breakfastHours}</strong>
                <span className="text-[10px] text-slate-500 ">Ana Restoran / Teras</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">{t.checkout}</span>
                <strong className="text-slate-800  block text-xs">{hotel.checkoutTime}</strong>
                <span className="text-[10px] text-slate-500 ">Geç çıkış için resepsiyon</span>
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
                      <strong className="text-slate-900  block text-[11px] truncate">{t.receptionExt}</strong>
                      <span className="text-[9px] text-slate-500  block truncate">Dahili Hat</span>
                    </div>
                  </div>
                  <strong className="text-xs font-mono text-amber-800 bg-white   px-2 py-0.5 rounded-lg border border-amber-200 font-bold shrink-0 ml-1">
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
                    <div className="w-7 h-7 rounded-xl bg-white   border border-amber-200 flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
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
