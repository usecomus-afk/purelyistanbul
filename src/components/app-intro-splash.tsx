"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { XeniosStore } from "@/lib/store";

/**
 * Tam ekran açılış videosu (Splash).
 *  - Native uygulama: her açılışta tam ekran (safe-area şeritleri olmadan) gösterilir.
 *  - Web/PWA: yalnızca otel misafiri QR oturumunda gösterilir, normal
 *    marketplace ziyaretlerinde atlanır.
 *  - Video bitince, 5.2 saniye sonra veya dokunmayla kapanır.
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    if (shouldSkipSplash(pathname)) {
      setVisible(false);
      setReady(true);
      return;
    }

    if (typeof window !== "undefined") {
      try {
        (window as any).Capacitor?.Plugins?.SystemBars?.show?.({});
      } catch {}
    }

    setVisible(true);
    setFadingOut(false);
    setReady(true);
    sessionStorage.setItem("purely_splash_played", "true");

    const timer = setTimeout(dismiss, 5200);
    return () => clearTimeout(timer);
  }, [dismiss, pathname]);

  useEffect(() => {
    if (ready && visible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [ready, visible]);

  // Henüz hydrasyon tamamlanmadıysa tam ekran sabit arka plan katmanı döndür.
  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 999999,
          backgroundColor: "#2B6A6C",
          backgroundImage: "url('/images/splash-poster.jpg')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 999999,
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: "#2B6A6C",
        transition: "opacity 500ms ease-out, transform 500ms ease-out",
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.02)" : "scale(1)",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      {/* İlk kare poster katmanı (video yüklenirken sıfır gecikme sağlar) */}
      <img
        src="/images/splash-poster.jpg"
        alt="purelyİstanbul"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          objectPosition: "center center",
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* Tam ekran açılış videosu */}
      <video
        ref={videoRef}
        src="/videos/splash-intro.mp4"
        poster="/images/splash-poster.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
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
