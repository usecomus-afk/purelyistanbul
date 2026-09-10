"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { marketplaceFont } from "@/lib/marketplace/font";

/**
 * Purely Istanbul Marketplace route grubu. Mevcut (guest)/(cockpit)/hotel-portal
 * layout'larından bağımsızdır — bu grup dışındaki hiçbir sayfa AuthProvider'a
 * sarılmaz, mevcut arayüz/davranış değişmez.
 */
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className={`min-h-screen bg-sand-bg text-ink ${marketplaceFont.className}`}>
        <MarketplaceHeader />
        {/* fixed header h-[84px] için içerik aşağıdan başlar */}
        <div className="pt-[84px]">
          {children}
        </div>
        <MarketplaceFooter />
      </div>
    </AuthProvider>
  );
}
