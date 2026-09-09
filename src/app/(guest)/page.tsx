"use client";

import { useState, useEffect } from "react";
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
    const native = !!(window as any).Capacitor?.isNativePlatform?.();
    setIsNative(native);
  }, []);

  // 1. Cihaza kurulu iOS IPA uygulaması açıldığında doğrudan otel içi menü ve konsiyerj gelir
  if (isMounted && isNative) {
    return <GuestConciergeView />;
  }

  // 2. Web sitesine (purelyistanbul.com) giren tüm genel kullanıcılar için herkese açık pazar yeri
  return (
    <AuthProvider>
      <div className={`min-h-screen bg-sand-bg text-ink -mb-28 ${marketplaceFont.className}`}>
        <MarketplaceHeader />
        <MarketplaceHome />
      </div>
    </AuthProvider>
  );
}
