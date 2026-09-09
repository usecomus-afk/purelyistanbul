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
  Hotel
} from "lucide-react";

interface CockpitSideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CockpitSideNav({ isOpen, onClose }: CockpitSideNavProps) {
  const pathname = usePathname();

  // Xenios Proje Yöneticisi Master Admin Menüsü
  const navItems = [
    { href: "/pilot", label: "Pilot & Kurucu Masası", icon: Sparkles, badge: "Pilot" },
    { href: "/dashboard", label: "Yönetici Özeti & Finans", icon: LayoutDashboard },
    { href: "/hotels", label: "Partner Oteller & Tesisler", icon: Building2 },
    { href: "/admin", label: "İlan & Portföy Yönetimi", icon: Lock, badge: "Admin" },
    { href: "/host-applications", label: "Host Başvuruları (Marketplace)", icon: Building2, badge: "Yeni" },
    { href: "/disputes", label: "Misafir Hakları & Hakem", icon: Scale, badge: "Hakem" },
    { href: "/bookings", label: "Sanal POS & Finansal Raporlar", icon: CreditCard },
    { href: "/experiences", label: "Deneyim Kataloğu", icon: Compass },
    { href: "/qr-generator", label: "Toplu QR Kod Üretici", icon: QrCode },
    { href: "/settings", label: "Sistem & AI Ayarları", icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white text-zinc-900 border-r border-amber-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="border-b border-amber-100 px-5 py-4 flex items-center justify-between">
        <div>
          <BrandMark size={36} showText={true} theme="light" />
          <p className="text-[10px] text-amber-800 font-mono tracking-wider mt-1 uppercase font-bold">
            Master Proje Yöneticisi
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Switcher to Partner Hotel Dashboard */}
      <div className="p-3 border-b border-amber-100 bg-amber-50/50">
        <Link
          href="/hotel-portal"
          onClick={onClose}
          className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 text-amber-950 text-xs font-bold transition shadow-xs group"
        >
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-amber-700" />
            <span>Otel Yönetim Paneli</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? "bg-amber-500/15 text-amber-950 border border-amber-300 font-bold shadow-xs"
                  : "text-zinc-600 hover:bg-amber-50/60 hover:text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-700' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  item.badge === 'Hakem' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Return to Guest App */}
      <div className="p-3 border-t border-amber-100 space-y-2 bg-amber-50/30">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white hover:bg-amber-50 text-zinc-700 rounded-xl text-xs font-bold border border-amber-200 shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
          <span>Misafir PWA Moduna Geç</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden w-64 shrink-0 md:flex md:flex-col">
        {content}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
