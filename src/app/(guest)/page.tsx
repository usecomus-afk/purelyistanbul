"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceHome } from "@/components/marketplace/MarketplaceHome";
import { GuestConciergeView } from "@/components/guest/guest-concierge-view";
import { marketplaceFont } from "@/lib/marketplace/font";

export default function RootPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const w = window as any;
    const native =
      Capacitor.isNativePlatform() ||
      !!w.Capacitor?.isNativePlatform?.() ||
      !!w.webkit?.messageHandlers?.bridge ||
      !!w.__PURELY_NATIVE_VIDEO_SPLASH__ ||
      !!w.__PURELY_NATIVE_VIDEO_SPLASH_V2__ ||
      w.navigator?.standalone === true ||
      !!window.matchMedia?.("(display-mode: standalone)")?.matches;
    setIsNative(native);
  }, []);

  // 1. Cihaza kurulu iOS IPA uygulaması veya Ana Ekrana eklenen PWA açıldığında doğrudan otel içi menü ve konsiyerj gelir
  if (isMounted && isNative) {
    return <GuestConciergeView initialRoomId="TEST" />;
  }

  // 2. Web sitesine (purelyistanbul.com) giren tüm genel kullanıcılar için herkese açık pazar yeri
  return (
    <AuthProvider>
      <div className={`min-h-screen bg-sand-bg text-ink ${marketplaceFont.className}`}>
        <MarketplaceHeader />
        <MarketplaceHome />
      </div>
    </AuthProvider>
  );
}
