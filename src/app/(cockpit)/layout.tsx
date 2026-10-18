"use client";

import { useState, useEffect } from "react";
import { CockpitSideNav } from "@/components/cockpit/side-nav";
import { AdminAuthGuard } from "@/components/cockpit/admin-auth-guard";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ArrowLeft, Menu, Hotel, QrCode, LogOut, Sparkles } from "lucide-react";
import { XeniosStore } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.height = "auto";
  }, []);

  const handleLogout = () => {
    XeniosStore.setMasterAdminLoggedIn(false);
    auth?.signOut().catch(() => {});
    toast.info("Master Proje Yöneticisi oturumu kapatıldı.");
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F6F1E8] text-[#2C2C1A] flex flex-col md:flex-row">
        <CockpitSideNav
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Mobile Top Header */}
        <div className="md:hidden w-full max-w-full flex items-center justify-between gap-2 px-3.5 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] bg-[#FFFCFA] border-b border-[#C8C4B0] sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97] cursor-pointer shrink-0"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0 truncate">
              <BrandMark size={26} showText={true} theme="light" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/usepurelydashboard"
              className="px-2.5 py-1.5 bg-[#3B6D11] text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Sade Panel</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-[#EDE8DE] hover:bg-red-50 text-[#6B6B55] hover:text-red-700 border border-[#C8C4B0] rounded-lg transition cursor-pointer shrink-0"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#C8C4B0] bg-[#FFFCFA]/95 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#639922] animate-pulse" />
              <span className="text-xs text-[#2C2C1A] font-medium">
                purelyİstanbul Yönetim Masası
              </span>
              <Link
                href="/usepurelydashboard"
                className="text-[11px] px-3 py-1 rounded-lg bg-[#EAF3DE] text-[#3B6D11] font-medium border border-[#C0DD97] hover:bg-[#3B6D11] hover:text-white transition"
              >
                ✨ Yeni Sade Dashboard&apos;a Geç (/usepurelydashboard) →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/hotel-portal"
                className="px-3.5 py-1.5 bg-[#EDE8DE] hover:bg-[#EAF3DE] text-[#2C2C1A] border border-[#C8C4B0] rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Hotel className="w-3.5 h-3.5 text-[#3B6D11]" />
                <span>Otel Yönetim Paneli ↗</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-[#FFFCFA] hover:bg-red-50 text-[#6B6B55] hover:text-red-700 border border-[#C8C4B0] hover:border-red-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-3.5 py-4 sm:p-6 md:p-8 max-w-6xl w-full min-w-0 mx-auto space-y-5 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
