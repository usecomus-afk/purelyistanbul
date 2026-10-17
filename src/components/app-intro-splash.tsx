"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { XeniosStore } from "@/lib/store";

/**
 * Tam ekran açılış görseli (Splash).
 *  - Native uygulama: her açılışta tam ekran (safe-area şeritleri olmadan) gösterilir.
 *  - Web/PWA: yalnızca otel misafiri QR oturumunda gösterilir, normal
 *    marketplace ziyaretlerinde atlanır.
 *  - 5 saniye sonra veya dokunmayla kapanır.
 *  - sessionStorage bayrağı ile oturum içi tekrar gösterilmez.
 */

function shouldSkipSplash(pathname: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  const alreadyPlayed =
    sessionStorage.getItem("purely_splash_played") ||
    sessionStorage.getItem("xenios_splash_played");
  if (
    alreadyPlayed ||
    pathname?.startsWith("/usepurelydashboard") ||
    pathname?.startsWith("/pilot") ||
    pathname?.startsWith("/admin") ||
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

  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [ready, setReady] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [bleed, setBleed] = useState({ top: 64, bottom: 44 });

  const dismiss = useCallback(() => {
    setFadingOut(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("purely_splash_played", "true");
      try {
        (window as any).Capacitor?.Plugins?.SystemBars?.show?.({});
      } catch {}
    }
    setTimeout(() => setVisible(false), 450);
  }, []);

  useEffect(() => {
    if (shouldSkipSplash(pathname)) {
      setVisible(false);
      setReady(true);
      return;
    }

    // iOS WKWebView safe-area contentInset telafisi:
    // Eğer native kabukta contentInset: 'automatic' aktifse, window.screen.height > window.innerHeight
    // farkı kadar üst ve alt şerit boşluğu oluşur. Bunu birebir ölçüp negatif inset ile tam ekran kaplıyoruz.
    if (typeof window !== "undefined") {
      const screenH = window.screen?.height || 0;
      const innerH = window.innerHeight || 0;
      const gap = screenH > innerH + 20 ? screenH - innerH : 0;
      if (gap > 0) {
        const bottomInset = 34;
        const topInset = Math.max(0, gap - bottomInset);
        setBleed({ top: topInset + 4, bottom: bottomInset + 4 });
      } else {
        setBleed({ top: 0, bottom: 0 });
      }

      try {
        (window as any).Capacitor?.Plugins?.SystemBars?.hide?.({});
      } catch {}
    }

    // Gündüz/Gece kontrolü (Akşam 18:00 - Sabah 06:00 arası gece kabul edilir)
    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour < 6) {
      setIsNight(true);
    }

    setVisible(true);
    setFadingOut(false);
    setReady(true);
    sessionStorage.setItem("purely_splash_played", "true");

    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [dismiss, pathname]);

  // Henüz hydrasyon tamamlanmadıysa tam ekran (üst/alt safe-area dahil) sabit arka plan katmanı döndür.
  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          top: -70,
          bottom: -50,
          left: 0,
          right: 0,
          zIndex: 999999,
          backgroundColor: "#F6F1E7",
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
        top: `calc(-1 * env(safe-area-inset-top, 0px) - ${bleed.top}px)`,
        bottom: `calc(-1 * env(safe-area-inset-bottom, 0px) - ${bleed.bottom}px)`,
        left: `calc(-1 * env(safe-area-inset-left, 0px))`,
        right: `calc(-1 * env(safe-area-inset-right, 0px))`,
        zIndex: 999999,
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: "#F6F1E7",
        transition: "opacity 500ms ease-out, transform 500ms ease-out",
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.03)" : "scale(1)",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      {/* Görsel üst ve alt safe-area alanları dahil tüm fiziksel ekranı kaplar */}
      <img
        src={isNight ? "/images/splash-night.jpg" : "/images/splash-day.jpg"}
        alt="purelyİstanbul"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
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
            background: "linear-gradient(90deg, #8E7252, #C9AE82, #8E7252)",
            boxShadow: "0 0 12px rgba(142,114,82,0.5)",
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
