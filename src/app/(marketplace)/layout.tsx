"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { DemoSandboxBanner } from "@/components/marketplace/DemoSandboxBanner";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { Footer } from "@/components/marketplace/Footer";
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
        <DemoSandboxBanner />
        <MarketplaceHeader />
        <div>
          {children}
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
