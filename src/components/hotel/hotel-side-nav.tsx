"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { XeniosStore } from "@/lib/store";
import { Hotel } from "@/lib/types";
import {
  LayoutDashboard,
  BellRing,
  LayoutGrid,
  DoorOpen,
  CalendarSync,
  CreditCard,
  QrCode,
  X,
  ChevronDown,
  Building2,
  UserCog
} from "lucide-react";

interface HotelSideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function HotelSideNav({ isOpen, onClose }: HotelSideNavProps) {
  const pathname = usePathname();
  const hotels = XeniosStore.getHotels();
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const [pendingReqCount, setPendingReqCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const id = XeniosStore.getActiveHotelId();
      setActiveHotelId(id);
      const reqs = XeniosStore.getRequests().filter(r => r.status === 'pending');
      setPendingReqCount(reqs.length);
    };
    refresh();
    window.addEventListener('xenios_requests_updated', refresh);
    window.addEventListener('xenios_demo_updated', refresh);
    return () => {
      window.removeEventListener('xenios_requests_updated', refresh);
      window.removeEventListener('xenios_demo_updated', refresh);
    };
  }, []);

  const activeHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setActiveHotelId(newId);
    XeniosStore.setActiveHotelId(newId);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const navItems = [
    { href: "/hotel-portal", label: "Otel Yönetim Paneli", icon: LayoutDashboard },
    { href: "/hotel-portal/requests", label: "Canlı Oda Talepleri", icon: BellRing, badge: pendingReqCount > 0 ? `${pendingReqCount} Canlı` : undefined },
    { href: "/hotel-portal/kbs", label: "Online Check-in & KBS", iconImage: "/icons/kbs-online-checkin.png" },
    { href: "/hotel-portal/services", label: "Otel İçi Hizmetler & Menü", icon: LayoutGrid },
    { href: "/hotel-portal/rooms", label: "Oda Durumları & Envanter", icon: DoorOpen },
    { href: "/hotel-portal/channels", label: "iCal & OTA Kanalları", icon: CalendarSync },
    { href: "/hotel-portal/bookings", label: "Misafir Rezervasyon & Gelir", icon: CreditCard },
    { href: "/hotel-portal/qr-generator", label: "Oda QR Kodları", icon: QrCode },
    { href: "/hotel-portal/profile", label: "Otel & Profil Ayarları", icon: UserCog },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white text-zinc-900 border-r border-amber-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="border-b border-amber-100 px-5 py-4 flex items-center justify-between">
        <div>
          <BrandMark size={34} showText={true} theme="light" href="/hotel-portal" />
          <p className="text-[10px] text-amber-800 font-mono tracking-wider mt-1 uppercase font-bold">
            Partner Otel Yönetim Portalı
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

      {/* Hotel Switcher Selector */}
      <div className="p-3 border-b border-amber-100 bg-amber-50/50">
        <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-1.5">
          <Building2 className="w-3 h-3 text-amber-700" /> Aktif Yönetilen Otel
        </label>
        <div className="relative">
          <select
            value={activeHotel.id}
            onChange={handleHotelChange}
            className="w-full text-xs font-bold bg-white border border-amber-300 text-amber-950 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none cursor-pointer shadow-xs"
          >
            {hotels.map((h) => (
              <option key={h.id} value={h.id} className="text-zinc-900">
                {h.name} ({h.district})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-amber-700 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 px-0.5">
          <span>{activeHotel.rooms.length} Tanımlı Oda</span>
          <span className="text-emerald-700 font-mono font-bold">● Canlı Bağlantı</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/hotel-portal' && pathname.startsWith(item.href));
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
                {item.iconImage ? (
                  <Image 
                    src={item.iconImage} 
                    alt={item.label} 
                    width={18} 
                    height={18} 
                    className="w-4 h-4 shrink-0 object-contain" 
                  />
                ) : Icon ? (
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-700' : 'text-zinc-500'}`} />
                ) : null}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Guest PWA Preview Link */}
      <div className="p-3 border-t border-amber-100 space-y-2 bg-amber-50/30">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-white hover:bg-zinc-50 text-zinc-600 rounded-xl text-[11px] font-semibold border border-zinc-200 transition"
        >
          <span>Misafir PWA Ekranı (Önizleme)</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 md:flex md:flex-col">
        {content}
      </aside>

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
