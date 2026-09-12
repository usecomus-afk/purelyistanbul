"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { XeniosStore } from "@/lib/store";

/**
 * Tam ekran açılış GIF'i.
 *  - Native uygulama: her açılışta gösterilir.
 *  - Web/PWA: yalnızca otel misafiri QR oturumunda gösterilir, normal
 *    marketplace ziyaretlerinde atlanır.
 *  - 5 saniye sonra veya dokunmayla kapanır.
 *  - sessionStorage bayrağı ile oturum içi tekrar gösterilmez.
 *
 * Sorunlar ve düzeltmeler:
 *  1. İlk frame'de sayfa içeriği görünüyor (mounted=false anında null dönmek
 *     yerine, sayfanın üzerini kapatan statik bir overlay SSR'da render edilir).
 *  2. GIF tam ekran kaplamıyor: padding/max-width kaldırıldı, object-cover kullanıldı.
 */

function shouldSkipSplash(pathname: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  const alreadyPlayed =
    sessionStorage.getItem("purely_splash_played") ||
    sessionStorage.getItem("xenios_splash_played");
  if (
    alreadyPlayed ||
    pathname?.startsWith("/hotel-portal") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/qr-generator")
  ) {
    return true;
  }
  if (Capacitor.isNativePlatform()) return false;
  return !XeniosStore.hasActiveHotelSession();
}

export function AppIntroSplash() {
  const pathname = usePathname();

  // İstemci taraflı durum. Başlangıç değeri sunucuda bilinmez; "görünür" olarak
  // başlat ki hidrasyon öncesi beyaz/boş sayfa frame'i görünmesin.
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [ready, setReady] = useState(false);

  const dismiss = useCallback(() => {
    setFadingOut(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("purely_splash_played", "true");
    }
    setTimeout(() => setVisible(false), 450);
  }, []);

  useEffect(() => {
    // Hydrasyon tamamlandı; artık gerçek karar verilebilir.
    if (shouldSkipSplash(pathname)) {
      setVisible(false);
      setReady(true);
      return;
    }

    setVisible(true);
    setFadingOut(false);
    setReady(true);
    sessionStorage.setItem("purely_splash_played", "true");

    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss, pathname]);

  // Henüz hydrasyon tamamlanmadıysa SABİT arka plan katmanı döndür.
  // Bu, React'in sunucu HTML'si ile eşleşen minimal bir overlay'dir;
  // sayfa içeriğinin 1 frame görünmesini engeller.
  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999999,
          backgroundColor: "#F3F2EE",
          width: "100vw",
          height: "100dvh",
        }}
      />
    );
  }

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      onTouchStart={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: "#F3F2EE",
        transition: "opacity 500ms ease-out, transform 500ms ease-out",
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.05)" : "scale(1)",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      {/* GIF tam ekranı kaplar — padding/margin yok, kenarlar tam kesim */}
      <img
        src="/intro.gif"
        alt="purelyİstanbul"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* Alt progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: "rgba(180,170,150,0.4)",
          zIndex: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background:
              "linear-gradient(90deg, #dc2626, #f59e0b, #dc2626)",
            boxShadow: "0 0 12px rgba(220,38,38,0.5)",
            animation: "splashProgress 5s cubic-bezier(0.4,0,0.2,1) forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
