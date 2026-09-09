"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";

/**
 * Purely Istanbul Marketplace route grubu. Mevcut (guest)/(cockpit)/hotel-portal
 * layout'larından bağımsızdır — bu grup dışındaki hiçbir sayfa AuthProvider'a
 * sarılmaz, mevcut arayüz/davranış değişmez.
 */
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-sand-bg text-ink font-light">
        <MarketplaceHeader />
        {children}
      </div>
    </AuthProvider>
  );
}
