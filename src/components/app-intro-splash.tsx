"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

export function AppIntroSplash() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  }, []);

  useEffect(() => {
    setMounted(true);

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
  }, [handleDismiss]);

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

      {/* 2. Fullscreen Atmospheric Video Layer (blends over background if playable) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        controls={false}
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none"
      >
        <source src="/xenios1618.mp4" type="video/mp4" />
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* 3. Centered Premium Brand Logo & Animation */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-90 duration-700">
        
        {/* Glowing Halo Ring */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-amber-500/30 to-amber-300/30 blur-lg animate-pulse" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-950/90 border-2 border-amber-400/60 p-3.5 shadow-[0_0_35px_rgba(245,158,11,0.35)] backdrop-blur-xl flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Xenios"
              width={88}
              height={88}
              className="object-contain w-full h-full drop-shadow-md"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)]">
          XENIOS
        </h1>

        {/* Subtitle Badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-400/60" />
          <span className="px-3 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] tracking-[0.3em] font-mono font-bold uppercase shadow-xs">
            İSTANBUL
          </span>
          <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>

        {/* Tagline */}
        <p className="mt-2 text-[11px] sm:text-xs text-amber-100/75 font-serif italic tracking-wide">
          Digital Guest Directory & Concierge
        </p>
      </div>

      {/* 4. Bottom Progress Bar */}
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
