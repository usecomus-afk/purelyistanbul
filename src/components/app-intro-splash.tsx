"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { XeniosStore } from "@/lib/store";

/**
 * Tam ekran açılış videosu (Splash).
 *  - Native uygulama & Ana Ekrana Eklenen PWA: her oturum başlangıcında tam ekran gösterilir.
 *  - Web/QR: otel misafiri QR oturumunda (/stay/..., /guest) gösterilir.
 *  - Video bitince, 10.4 saniye sonra veya dokunmayla kapanır ve uygulama açılır.
 */

function isNativeOrStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  if (Capacitor.isNativePlatform() || w.Capacitor?.isNativePlatform?.() || w.webkit?.messageHandlers?.bridge) {
    return true;
  }
  return false;
}

function shouldSkipSplash(pathname: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  if (w.__PURELY_NATIVE_VIDEO_SPLASH_V7__) return true;

  const alreadyPlayed = sessionStorage.getItem("purely_splash_v7_played");
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

  if (isNativeOrStandaloneApp()) return false;
  if (pathname?.startsWith("/stay") || pathname === "/guest" || pathname?.startsWith("/guest/")) {
    return false;
  }
  return true;
}

export function AppIntroSplash() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasStartedRef = useRef(false);
  const dismissedRef = useRef(false);

  // SSR ve ilk istemci render'ında aynı değeri (true) kullanarak React 19 body
  // hydrasyon uyumsuzluğunu (orphaned DOM node) tamamen engelliyoruz.
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setFadingOut(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("purely_splash_v7_played", "true");
        sessionStorage.setItem("purely_splash_played", "true");
      } catch {}
      try {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = "none";
        }
      } catch {}
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {}
    }
    setTimeout(() => {
      setVisible(false);
      if (typeof document !== "undefined") {
        document.querySelectorAll("#purely-intro-splash").forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (!hasStartedRef.current) {
      if (shouldSkipSplash(pathname)) {
        dismissedRef.current = true;
        setVisible(false);
        return;
      }
      hasStartedRef.current = true;
    } else if (
      pathname?.startsWith("/usepurelydashboard") ||
      pathname?.startsWith("/pilot") ||
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/hotel-portal") ||
      pathname?.startsWith("/dashboard") ||
      pathname?.startsWith("/qr-generator")
    ) {
      dismiss();
      return;
    }

    if (typeof window !== "undefined") {
      try {
        (window as any).Capacitor?.Plugins?.SystemBars?.show?.({});
      } catch {}
      try {
        sessionStorage.setItem("purely_splash_v7_played", "true");
        sessionStorage.setItem("purely_splash_played", "true");
      } catch {}
    }

    const v = videoRef.current;
    if (v) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Düşük Güç Modu vb. nedeniyle otomatik oynatma engellenirse ekranı kilitleme
          setTimeout(dismiss, 1200);
        });
      }
    }

    const timer = setTimeout(dismiss, 9400);
    return () => clearTimeout(timer);
  }, [dismiss, pathname]);

  return (
    <div id="purely-intro-splash-root">
      {visible && (
        <div
          id="purely-intro-splash"
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
            backgroundColor: "#0F171E",
            backgroundImage: "url('/images/splash-poster-v2.jpg?v=7')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            transition: "opacity 400ms ease-out, transform 400ms ease-out",
            opacity: fadingOut ? 0 : 1,
            transform: fadingOut ? "scale(1.02)" : "scale(1)",
            pointerEvents: fadingOut ? "none" : "auto",
          }}
        >
          {/* Tam ekran açılış videosu */}
          <video
            ref={videoRef}
            src="/videos/splash-intro.mp4?v=7"
            poster="/images/splash-poster-v2.jpg?v=7"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={dismiss}
            onError={dismiss}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (video.duration && video.currentTime >= video.duration - 0.15) {
                dismiss();
              }
            }}
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
                animation: "splashProgress 9.0s cubic-bezier(0.4,0,0.2,1) forwards",
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
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var w=window,p=location.pathname||'';var isApp=!!(w.Capacitor&&w.Capacitor.isNativePlatform&&w.Capacitor.isNativePlatform())||!!(w.webkit&&w.webkit.messageHandlers&&w.webkit.messageHandlers.bridge)||p.indexOf('/stay')===0||p==='/guest'||p.indexOf('/guest/')===0;var skip=!!w.__PURELY_NATIVE_VIDEO_SPLASH_V7__||!!sessionStorage.getItem('purely_splash_v7_played')||!isApp||['/usepurelydashboard','/pilot','/admin','/hotel-portal','/dashboard','/qr-generator'].some(function(x){return p.indexOf(x)===0;});if(skip){var el=document.getElementById('purely-intro-splash');if(el)el.style.display='none';}}catch(e){}})();`,
        }}
      />
    </div>
  );
}
