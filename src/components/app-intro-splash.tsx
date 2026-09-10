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

    // Smooth 3.5s display timer for GIF animation
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, [handleDismiss, pathname]);

  if (!mounted || !isVisible) return null;

  return (
    <div
      onClick={handleDismiss}
      onTouchStart={handleDismiss}
      className={`fixed inset-0 z-[999999] w-screen h-[100dvh] bg-[#090807] flex flex-col items-center justify-center transition-all duration-450 ease-out select-none cursor-pointer overflow-hidden ${
        isFadingOut
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        backgroundColor: "#090807",
      }}
    >
      {/* 1. Ambient Luxury Radial Glow */}
      <div className="absolute w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-64 h-64 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Fullscreen GIF Animation Layer */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        <img
          src="/intro.gif"
          alt="purelyİstanbul Intro"
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-20 pointer-events-none overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          style={{
            animation: "progressFill 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
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
