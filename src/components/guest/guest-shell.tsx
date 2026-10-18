"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { XeniosStore } from '@/lib/store';
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav';

/**
 * (guest) rota grubunun kabuğu.
 *
 * Bu grup iki farklı deneyimi barındırır:
 *  1) Otel misafiri uygulaması (QR PWA / iOS uygulaması): sabit yükseklikli,
 *     kendi içinde kaydırılan ekran + alttaki sekme menüsü (Otel · Kategoriler · comusAI · Rehber).
 *  2) Herkese açık web sitesi (purelyistanbul.com): normal sayfa akışı, alt menü YOK.
 *
 * Alt menü ve sabit kabuk yalnızca gerçekten uygulama bağlamında gösterilir:
 *  - /stay/... (QR ile açılan oda sayfası) ve /guest rotaları,
 *  - iOS uygulaması veya "ana ekrana eklenmiş" PWA,
 *  - diğer misafir sayfalarında aktif otel oturumu olan kullanıcı.
 * "/" yalnızca iOS uygulamasında uygulama kabuğunu kullanır; web ziyaretçisi
 * pazar yerini normal (belge) kaydırmasıyla görür.
 *
 * Ağaç yapısı her iki modda aynı kalır (yalnızca sınıflar değişir); böylece mod
 * değişse bile çocuk bileşenler yeniden oluşturulmaz.
 */
function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/stay') || pathname === '/guest' || pathname.startsWith('/guest/');
}

export function GuestShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);
  const [hasHotelSession, setHasHotelSession] = useState(false);

  useEffect(() => {
    const w = window as any;
    const native =
      Capacitor.isNativePlatform() ||
      !!w.Capacitor?.isNativePlatform?.() ||
      !!w.webkit?.messageHandlers?.bridge ||
      !!w.__PURELY_NATIVE_VIDEO_SPLASH__ ||
      !!w.__PURELY_NATIVE_VIDEO_SPLASH_V2__ ||
      !!w.__PURELY_NATIVE_VIDEO_SPLASH_V6__;
    setIsNative(native);
    setHasHotelSession(native || XeniosStore.hasActiveHotelSession());
  }, [pathname]);

  const appMode =
    isAppRoute(pathname) ||
    (pathname === '/' ? isNative : hasHotelSession);

  return (
    <div
      id="app"
      className={
        appMode
          ? 'w-full max-w-[100vw] min-h-[100dvh] overflow-x-hidden overscroll-x-none touch-pan-y text-slate-900 antialiased relative box-border'
          : 'w-full max-w-[100vw] min-h-screen overflow-x-hidden antialiased box-border'
      }
    >
      <div
        id={appMode ? 'guest-scroll-container' : undefined}
        className={
          appMode
            ? 'w-full max-w-full min-h-[100dvh] overflow-x-hidden overscroll-x-none touch-pan-y box-border'
            : 'w-full max-w-full box-border'
        }
        style={
          appMode
            ? { paddingBottom: 'calc(75px + env(safe-area-inset-bottom, 20px))' }
            : undefined
        }
      >
        {children}
      </div>
      {appMode && <MobileFooterNav />}
    </div>
  );
}
