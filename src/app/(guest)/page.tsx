"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoSandboxBanner } from "@/components/marketplace/DemoSandboxBanner";
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
      !!w.__PURELY_NATIVE_VIDEO_SPLASH_V6__;
    setIsNative(native);

    if (!native) {
      try {
        if (localStorage.getItem("xenios_qr_verified") !== "1" && localStorage.getItem("xenios_room_id") === "TEST") {
          localStorage.removeItem("xenios_room_id");
          localStorage.removeItem("xenios_hotel_id");
        }
      } catch {}
    }
  }, []);

  // 1. Yalnızca cihaza kurulu Native iOS IPA uygulaması açıldığında konsiyerj gelir (purelyistanbul.com Ana Ekrana Ekle'de normal web sitesi açılır)
  if (isMounted && isNative) {
    return <GuestConciergeView initialRoomId="TEST" />;
  }

  // 2. Web sitesine (purelyistanbul.com) giren tüm genel kullanıcılar için herkese açık pazar yeri
  return (
    <AuthProvider>
      <div className={`min-h-screen bg-sand-bg text-ink ${marketplaceFont.className}`}>
        <DemoSandboxBanner />
        <MarketplaceHeader />
        <div>
          <MarketplaceHome />
        </div>
      </div>
    </AuthProvider>
  );
}
