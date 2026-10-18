"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HotelAuthGuard } from "@/components/hotel/hotel-auth-guard";
import { Building2, BellRing, LogOut, ArrowLeft, Volume2, VolumeX, DoorOpen } from "lucide-react";
import { XeniosStore } from "@/lib/store";
import { HotelAudioNotification, HotelAudioNotificationPrefs } from "@/lib/hotel-audio-notification";
import { HotelLiveAlertBanner } from "@/components/hotel/hotel-live-alert-banner";
import { FirestoreService } from "@/lib/firestore-service";
import { toast } from "sonner";

export default function HotelPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hotels, setHotels] = useState(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState(() => XeniosStore.getActiveHotelId());
  const [pendingReqCount, setPendingReqCount] = useState(0);
  const [audioPrefs, setAudioPrefs] = useState<HotelAudioNotificationPrefs>(() => HotelAudioNotification.getPreferences());

  const refreshState = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    const id = XeniosStore.getActiveHotelId();
    setActiveHotelId(id);
  };

  useEffect(() => {
    refreshState();
    HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
    const handlePrefsUpdate = () => setAudioPrefs(HotelAudioNotification.getPreferences());
    window.addEventListener('xenios_hotels_updated', refreshState);
    window.addEventListener('xenios_hotel_audio_prefs_updated', handlePrefsUpdate);

    const unsubscribe = FirestoreService.subscribeToLiveRequests(null, (reqs) => {
      const pending = reqs.filter(r => r.status === 'pending');
      setPendingReqCount(pending.length);
    });

    return () => {
      window.removeEventListener('xenios_hotels_updated', refreshState);
      window.removeEventListener('xenios_hotel_audio_prefs_updated', handlePrefsUpdate);
      unsubscribe();
    };
  }, [activeHotelId]);

  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0] || {
    id: 'hotel-1',
    name: 'Old City Heritage Hotel Istanbul',
    district: 'Fatih',
    rooms: []
  };

  const handleToggleSound = () => {
    const next = !audioPrefs.soundEnabled;
    HotelAudioNotification.savePreferences({ soundEnabled: next });
    setAudioPrefs(prev => ({ ...prev, soundEnabled: next }));
    if (next) {
      HotelAudioNotification.play();
      toast.success("Sesli bildirimler aktif edildi!");
    } else {
      toast.info("Sesli bildirimler sessize alındı.");
    }
  };

  const handleLogout = () => {
    XeniosStore.setHotelPortalLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xenios_app_role');
      localStorage.removeItem('xenios_hotel_remember_me');
    }
    toast.info("Yönetim Paneli oturumu kapatıldı.");
  };

  const isSubPage = pathname !== '/hotel-portal';
  const hotelNameUpper = (currentHotel.name || 'OLD CITY HERITAGE HOTEL ISTANBUL').toUpperCase();

  return (
    <HotelAuthGuard>
      <div className={`${isSubPage ? 'min-h-[100dvh]' : 'fixed inset-0 h-[100dvh] w-screen overscroll-none'} text-[#221F1C] flex flex-col relative`}>
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

        {/* Luxury Header Matching Hotel Page 1:1 */}
        <header className="pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-2 px-3.5 sm:px-4 w-full relative z-40">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-3">
            {/* Centered Two-Line European Luxury Serif Title */}
            <Link href="/hotel-portal" className="group text-center select-none mt-0.5">
              <h1 className="font-luxury-serif text-[18px] sm:text-[21px] tracking-[0.14em] font-normal text-[#141414] uppercase text-center leading-[1.28]">
                {hotelNameUpper.endsWith(' ISTANBUL') ? (
                  <>
                    {currentHotel.name.slice(0, -9)}
                    <br />
                    ISTANBUL
                  </>
                ) : (
                  currentHotel.name
                )}
              </h1>
            </Link>

            {/* Clean Neomorphic Top Bar Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-[#F3EFE8]/92 backdrop-blur-md border border-white/90 shadow-[0_8px_22px_rgba(36,28,18,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)] relative z-50">
              {/* Back Button on Sub-pages */}
              {isSubPage && (
                <>
                  <Link
                    href="/hotel-portal"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAE3D5]/95 hover:bg-[#E2D8C7] text-[#221F1C] border border-[#D4C9B8]/80 text-[11px] font-luxury-sans font-semibold transition cursor-pointer shrink-0"
                    title="Yönetim Menüsüne Dön"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#8E7252]" />
                    <span>Menü</span>
                  </Link>
                  <div className="w-[1px] h-3.5 bg-[#D5CBB8]" />
                </>
              )}

              {/* Live Guest Requests Bell */}
              <Link
                href="/hotel-portal/requests"
                title="Canlı Misafir Talepleri"
                className={`p-1.5 rounded-full transition relative cursor-pointer flex items-center gap-1 ${
                  pendingReqCount > 0
                    ? 'text-[#9E2A2B] bg-[#FDECEC] border border-[#E5B8B8]'
                    : 'text-[#2C2824] hover:bg-black/5'
                }`}
              >
                <BellRing className={`w-4 h-4 stroke-[1.7] ${pendingReqCount > 0 ? 'animate-bounce text-[#9E2A2B]' : ''}`} />
                {pendingReqCount > 0 && (
                  <span className="text-[10.5px] font-luxury-sans font-bold pr-1">
                    {pendingReqCount}
                  </span>
                )}
              </Link>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={audioPrefs.soundEnabled ? "Sesli Bildirimler Açık" : "Sesli Bildirimler Kapalı"}
                className={`p-1.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
                  audioPrefs.soundEnabled
                    ? 'text-[#8E7252] bg-[#FAF8F4]/90 border border-[#D4C9B8]/80'
                    : 'text-[#6E655B] hover:bg-black/5'
                }`}
              >
                {audioPrefs.soundEnabled ? (
                  <Volume2 className="w-4 h-4 stroke-[1.7]" />
                ) : (
                  <VolumeX className="w-4 h-4 stroke-[1.7]" />
                )}
              </button>

              <div className="w-[1px] h-3.5 bg-[#D5CBB8]" />

              {/* Portal Status Badge */}
              <Link
                href="/hotel-portal"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAE3D5]/90 border border-[#D4C9B8]/70 text-[#221F1C]"
              >
                <Building2 className="w-3.5 h-3.5 text-[#8E7252] stroke-[1.7]" />
                <span className="font-luxury-sans text-[11px] font-medium tracking-tight whitespace-nowrap">
                  Yönetim
                </span>
              </Link>

              {/* Preview Guest Screen */}
              <a
                href={`/stay/${encodeURIComponent(currentHotel.id || 'hotel-1')}/TEST`}
                onClick={(e) => {
                  e.preventDefault();
                  const targetHotelId = currentHotel.id || 'hotel-1';
                  XeniosStore.setActiveHotelSession(targetHotelId, 'TEST');
                  if (typeof window !== 'undefined') {
                    try {
                      sessionStorage.setItem('purely_splash_v6_played', 'true');
                      sessionStorage.setItem('purely_splash_played', 'true');
                    } catch {}
                    window.location.href = `/stay/${encodeURIComponent(targetHotelId)}/TEST`;
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F4]/90 hover:bg-white text-[#221F1C] border border-[#D4C9B8]/80 text-[11px] font-luxury-sans font-medium shadow-2xs transition cursor-pointer whitespace-nowrap"
                title="Misafir Ekranına Geç"
              >
                <DoorOpen className="w-3.5 h-3.5 text-[#8E7252] stroke-[1.7]" />
                <span>Misafir</span>
              </a>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-full bg-[#FAF8F4]/90 hover:bg-[#FDECEC] text-[#5C4938] hover:text-[#9E2A2B] border border-[#D4C9B8]/80 transition cursor-pointer"
                title="Oturumu Kapat"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[1.7]" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`relative z-10 flex-1 w-full max-w-4xl mx-auto ${
            isSubPage
              ? 'p-3.5 sm:p-6 space-y-5 overflow-y-auto pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1rem))]'
              : 'px-3.5 sm:px-4 pt-1 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))] overflow-hidden touch-none flex flex-col min-h-0'
          }`}
        >
          {children}
        </main>
      </div>
    </HotelAuthGuard>
  );
}
