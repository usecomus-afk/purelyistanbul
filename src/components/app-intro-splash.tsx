"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export function AppIntroSplash() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const alreadyPlayed = sessionStorage.getItem("purely_splash_played") || sessionStorage.getItem("xenios_splash_played");
      if (alreadyPlayed || window.location.pathname.startsWith("/hotel-portal") || window.location.pathname.startsWith("/marketplace")) {
        return false;
      }
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

    if (sessionStorage.getItem("purely_splash_played") || sessionStorage.getItem("xenios_splash_played") || pathname?.startsWith("/hotel-portal") || pathname?.startsWith("/marketplace")) {
      setIsVisible(false);
      return;
    }

    sessionStorage.setItem("purely_splash_played", "true");

    // 1. Force video attributes for strict iOS WKWebView autoplay
    const vid = videoRef.current;
    if (vid) {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute("muted", "");
      vid.setAttribute("playsinline", "");
      vid.setAttribute("webkit-playsinline", "");

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Graceful fallback to pure CSS & brand graphics animation
        });
      }
    }

    // 2. Smooth 2.6s display timer
    const timer = setTimeout(() => {
      handleDismiss();
    }, 2600);

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

      {/* Fullscreen Video Animation Layer */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        controls={false}
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="/purely-intro.mp4" type="video/mp4" />
        <source src="/intro.mp4" type="video/mp4" />
        <source src="/xenios1618.mp4" type="video/mp4" />
      </video>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-20 pointer-events-none overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          style={{
            animation: "progressFill 2.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
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
