"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HotelAuthGuard } from "@/components/hotel/hotel-auth-guard";
import { BrandMark } from "@/components/brand-mark";
import { Building2, BellRing, LogOut, ArrowLeft, ChevronDown, Volume2, VolumeX, Sparkles, DoorOpen } from "lucide-react";
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
    // Auto-request notification permissions on native device / browser
    HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
    const handlePrefsUpdate = () => setAudioPrefs(HotelAudioNotification.getPreferences());
    window.addEventListener('xenios_hotels_updated', refreshState);
    window.addEventListener('xenios_hotel_audio_prefs_updated', handlePrefsUpdate);

    // Live subscription to Firestore across all devices
    const unsubscribe = FirestoreService.subscribeToLiveRequests(activeHotelId, (reqs) => {
      const pending = reqs.filter(r => (r.hotelId === activeHotelId || !r.hotelId) && r.status === 'pending');
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
    name: 'Pera Palace Hotel',
    district: 'Beyoğlu',
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

  return (
    <HotelAuthGuard>
      <HotelLiveAlertBanner />
      <div className={`${isSubPage ? 'min-h-screen' : 'h-[100dvh] max-h-[100dvh] overflow-hidden'} bg-[#f8f6f0] text-zinc-900 flex flex-col`}>
        {/* Modern Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs px-3.5 sm:px-6 py-2 sm:py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            
            {/* Left: Brand & Title / Back Button */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/hotel-portal" className="flex items-center gap-2.5 shrink-0">
                <BrandMark size={32} showText={false} theme="light" asDiv />
                <div className="hidden xs:block">
                  <span className="font-serif font-extrabold text-sm sm:text-base text-zinc-900 tracking-tight block leading-tight">
                    purelyİstanbul
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Yönetim Paneli
                  </span>
                </div>
              </Link>

              {isSubPage && (
                <Link
                  href="/hotel-portal"
                  className="px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-200/80 shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yönetim Paneline Dön</span>
                  <span className="sm:hidden">Ana Sayfa</span>
                </Link>
              )}
            </div>

            {/* Right: Sound Toggle, Live Notifications & Logout */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Preview Guest Screen */}
              <Link
                href="/"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('xenios_app_role', 'guest');
                  }
                }}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                title="Misafir Ekranını Önizle"
              >
                <DoorOpen className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden lg:inline text-[11px]">Misafir Görünümü</span>
              </Link>

              {/* Quick Sound Control Button */}
              <button
                onClick={handleToggleSound}
                title={audioPrefs.soundEnabled ? "Sesli Bildirimler Açık (Tıkla ve Kapat)" : "Sesli Bildirimler Kapalı (Tıkla ve Aç)"}
                className={`p-2 rounded-2xl border transition shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  audioPrefs.soundEnabled
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 border-zinc-200'
                }`}
              >
                {audioPrefs.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-700 animate-pulse" />
                    <span className="hidden lg:inline text-[11px]">Ses Açık</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-zinc-400" />
                    <span className="hidden lg:inline text-[11px]">Sessiz</span>
                  </>
                )}
              </button>

              {/* Notification Button */}
              <Link
                href="/hotel-portal/requests"
                className={`p-2 rounded-2xl border transition relative shadow-xs flex items-center gap-1.5 text-xs font-bold ${
                  pendingReqCount > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                    : 'bg-white border-amber-200 text-zinc-700 hover:bg-amber-50'
                }`}
                title="Canlı Oda Talepleri"
              >
                <BellRing className={`w-4 h-4 ${pendingReqCount > 0 ? 'text-rose-600 animate-bounce' : 'text-zinc-600'}`} />
                {pendingReqCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>{pendingReqCount}</span>
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Çıkış</span>
              </button>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 w-full max-w-6xl mx-auto ${isSubPage ? 'p-3.5 sm:p-6 md:p-8 space-y-6 overflow-y-auto' : 'p-2 sm:p-3 md:p-4 overflow-hidden flex flex-col min-h-0'}`}>
          {children}
        </main>
      </div>
    </HotelAuthGuard>
  );
}


