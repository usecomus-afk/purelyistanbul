"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Sparkles,
  CreditCard,
  Settings,
  ArrowLeft,
  Compass,
  Scale,
  Lock,
  ArrowUpRight,
  X,
  Hotel,
  ImageOff
} from "lucide-react";

interface CockpitSideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CockpitSideNav({ isOpen, onClose }: CockpitSideNavProps) {
  const pathname = usePathname();

  // Xenios Proje Yöneticisi Master Admin Menüsü
  const navItems = [
    { href: "/admin", label: "Merkezi Yönetim Paneli (Admin PWA)", icon: Sparkles, badge: "PWA" },
    { href: "/hotels", label: "Partner Oteller & Tesisler", icon: Building2 },
    { href: "/host-applications", label: "Host Başvuruları (Marketplace)", icon: Building2, badge: "Web" },
    { href: "/listing-approvals", label: "İlan Onayları (Marketplace)", icon: ImageOff, badge: "Web" },
    { href: "/qr-generator", label: "Toplu QR Kod Üretici", icon: QrCode },
    { href: "/dashboard", label: "Finans & Gelir Özeti", icon: LayoutDashboard },
    { href: "/bookings", label: "Sanal POS & Rezervasyonlar", icon: CreditCard },
    { href: "/disputes", label: "Misafir Hakları & Hakem", icon: Scale },
    { href: "/settings", label: "Sistem & AI Ayarları", icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#FFFCFA] text-[#2C2C1A] border-r border-[#C8C4B0]">
      {/* Brand Header */}
      <div className="border-b border-[#C8C4B0]/60 px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <BrandMark size={36} showText={true} theme="light" />
          <p className="text-[10px] text-[#3B6D11] tracking-widest mt-1 uppercase font-semibold">
            Purelyİstanbul Yönetim
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg bg-[#EDE8DE] text-[#6B6B55] hover:text-[#2C2C1A] border border-[#C8C4B0] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Switcher to Partner Hotel Dashboard */}
      <div className="p-3 border-b border-[#C8C4B0]/60 bg-[#F6F1E8]/60 shrink-0">
        <Link
          href="/hotel-portal"
          onClick={onClose}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF3DE] hover:bg-[#d8ebc2] border border-[#C0DD97] text-[#2C2C1A] text-xs font-medium transition group"
        >
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-[#3B6D11]" />
            <span>Otel Yönetim Paneli</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#3B6D11] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition ${
                active
                  ? "bg-[#EAF3DE] text-[#2C2C1A] border border-[#C0DD97] font-semibold"
                  : "text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#2C2C1A] font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#3B6D11]' : 'text-[#6B6B55]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Return to Guest App */}
      <div className="p-3 border-t border-[#C8C4B0]/60 bg-[#F6F1E8]/40 shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FFFCFA] hover:bg-[#EAF3DE] text-[#2C2C1A] rounded-full text-xs font-medium border border-[#C8C4B0] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#3B6D11]" />
          <span>purelyistanbul.com Vitrine Dön</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar with Independent Scroll */}
      <aside className="hidden w-64 shrink-0 md:flex md:flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
