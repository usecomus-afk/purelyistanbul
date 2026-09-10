"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { XeniosStore } from "@/lib/store";

/**
 * This intro splash GIF plays on native app launch, and on web only for a
 * real hotel-guest session (QR check-in) — never for an organic visit to the
 * public marketplace website, even at "/". It auto-advances after 3.5 seconds
 * or on tap, and sets sessionStorage so internal navigation during the
 * session remains instantaneous.
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
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !shouldSkipSplash(window.location.pathname);
    }
    return true;
  });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("purely_splash_played", "true");
    }
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  }, []);

  useEffect(() => {
    setMounted(true);

    if (shouldSkipSplash(pathname)) {
      setIsVisible(false);
      return;
    }

    // Bu instance kalıcı kök layout'ta yaşar ve rota değişiminde REMOUNT OLMAZ.
    // Otel oturumu QR akışında (/stay/[hotelId]/[roomId] -> /) bu efekt İKİNCİ
    // kez, ilk mount'tan SONRA kurulur; ilk mount'ta oturum henüz yokken
    // isVisible zaten false'a çekilmiş olabilir — bu yüzden burada açıkça
    // true'ya geri almak gerekir.
    setIsVisible(true);
    setIsFadingOut(false);
    sessionStorage.setItem("purely_splash_played", "true");

    // Smooth 5s display timer for new GIF animation
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleDismiss, pathname]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      onClick={handleDismiss}
      onTouchStart={handleDismiss}
      className={`fixed inset-0 z-[999999] w-screen h-[100dvh] flex flex-col items-center justify-center transition-all duration-500 ease-out select-none cursor-pointer overflow-hidden ${
        isFadingOut
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        backgroundColor: "#F3F2EE",
        backgroundImage: "url('/texture.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 1. Subtle luxury ambient backlight */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Screen-Fitted GIF Animation Layer */}
      <div className="relative z-10 w-full h-full max-w-lg mx-auto flex items-center justify-center px-4 py-6">
        <img
          src="/intro.gif"
          alt="purelyİstanbul Intro"
          className="w-full h-full max-h-full max-w-full object-contain pointer-events-none drop-shadow-sm"
        />
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-300/40 z-20 pointer-events-none overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]"
          style={{
            animation: "progressFill 5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
