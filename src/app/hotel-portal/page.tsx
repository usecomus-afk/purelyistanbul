"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest, Hotel } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight
} from 'lucide-react';

interface PortalModule {
  id: string;
  title: string;
  desc: string;
  href: string;
  iconPath: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'success' | 'neutral';
  hasPulse?: boolean;
}

export default function HotelPortalDashboard() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const refresh = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    const id = XeniosStore.getActiveHotelId();
    setActiveHotelId(id);
    setRequests(XeniosStore.getRequests().filter(r => r.hotelId === id || !r.hotelId));
  };

  useEffect(() => {
    refresh();
    window.addEventListener('xenios_requests_updated', refresh);
    window.addEventListener('xenios_hotels_updated', refresh);
    return () => {
      window.removeEventListener('xenios_requests_updated', refresh);
      window.removeEventListener('xenios_hotels_updated', refresh);
    };
  }, []);

  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0] || {
    id: 'hotel-1',
    name: 'Pera Palace Hotel',
    district: 'Beyoğlu',
    type: 'Tarihi Lüks Otel',
    rooms: []
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const hasUnread = pendingRequests.length > 0;

  const modules: PortalModule[] = [
    {
      id: 'requests',
      title: 'Canlı Oda Talepleri',
      desc: 'Oda içi servisler, kat hizmetleri, mutfak ve resepsiyon talepleri masası',
      href: '/hotel-portal/requests',
      iconPath: '/icons/hotel-portal/canli-oda-talepleri.png',
      badge: hasUnread ? `${pendingRequests.length} Yeni Talep` : 'Talep Yok',
      badgeType: hasUnread ? 'danger' : 'neutral',
      hasPulse: hasUnread
    },
    {
      id: 'services',
      title: 'Otel İçi Hizmetler & Menü Yönetimi',
      desc: '16+ Otel içi servis kontrolü, F&B oda servisi menüsüne ürün, içerik ve fiyat ekleme',
      href: '/hotel-portal/services',
      iconPath: '/icons/hotel-portal/otel-ici-hizmetler-menu.png',
      badge: 'Canlı Senkronize',
      badgeType: 'success'
    },
    {
      id: 'rooms',
      title: 'Oda Panosu',
      desc: 'Oda durumları, kat envanteri, anlık doluluk ve temizlik takibi',
      href: '/hotel-portal/rooms',
      iconPath: '/icons/hotel-portal/oda-panosu.png',
      badge: `${currentHotel.rooms?.length || 0} Tanımlı Oda`,
      badgeType: 'neutral'
    },
    {
      id: 'channels',
      title: 'iCal & OTA Kanalları',
      desc: 'Airbnb, Booking.com, VRBO ve Expedia 2 yönlü takvim entegrasyonu',
      href: '/hotel-portal/channels',
      iconPath: '/icons/hotel-portal/ical-ota-kanallari.png',
      badge: '2 Yönlü Eşitleme',
      badgeType: 'success'
    },
    {
      id: 'qr-generator',
      title: 'Oda QR Kodları',
      desc: 'Her odaya özel dijital concierge standee QR kodları ve .ics takvim adresleri',
      href: '/hotel-portal/qr-generator',
      iconPath: '/icons/hotel-portal/oda-qr-kodlari.png',
      badge: 'Yazdır & İndir',
      badgeType: 'neutral'
    },
    {
      id: 'profile',
      title: 'Otel & Profil Ayarları',
      desc: 'Otel iletişim bilgileri, ön büro yöneticisi profili ve anlık bildirim tercihleri',
      href: '/hotel-portal/profile',
      iconPath: '/icons/hotel-portal/otel-profil-ayarlari.png',
      badge: 'Yönetici Profili',
      badgeType: 'neutral'
    },
    {
      id: 'kbs',
      title: 'Online Check-in & KBS',
      desc: 'Google Cloud Document AI OCR ile pasaport tarama ve EGM KBS kimlik bildirim sistemi',
      href: '/hotel-portal/kbs',
      iconPath: '/icons/hotel-portal/online-checkin-kbs.png',
      badge: 'EGM Uyumlu',
      badgeType: 'success'
    },
    {
      id: 'reports',
      title: 'Raporlar',
      desc: 'Misafir uygulama kullanımı, satış/randevu metrikleri ve Comus AI pasta dilimi dağılımı',
      href: '/hotel-portal/reports',
      iconPath: '/icons/hotel-portal/raporlar.png',
      badge: 'Canlı Analitik',
      badgeType: 'success'
    }
  ];

  return (
    <div className="h-full flex-1 flex flex-col justify-between overflow-hidden">
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3.5 h-full flex-1">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="btn-3d p-2 sm:p-2.5 md:p-3.5 flex flex-col justify-between gap-1 sm:gap-1.5 group cursor-pointer text-left h-full min-h-0 shadow-xs"
          >
            {/* Top Row: Icon & Badge */}
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50/90 border border-amber-200/80 p-1 sm:p-1.5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                <Image
                  src={mod.iconPath}
                  alt={mod.title}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-full h-full object-contain"
                />
                {mod.hasPulse && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                )}
              </div>

              {mod.badge && (
                <span
                  className={`text-[8.5px] sm:text-[9.5px] font-bold px-2 py-0.5 rounded-full border shadow-2xs shrink-0 truncate max-w-[100px] sm:max-w-none ${
                    mod.badgeType === 'danger'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : mod.badgeType === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {mod.badge}
                </span>
              )}
            </div>

            {/* Middle: Title & Description */}
            <div className="space-y-0.5 min-w-0">
              <h2 className="text-[11px] sm:text-xs md:text-sm font-bold text-zinc-900 dark:text-slate-100 group-hover:text-amber-800 transition-colors leading-tight truncate">
                {mod.title}
              </h2>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-slate-400 leading-tight line-clamp-1">
                {mod.desc}
              </p>
            </div>

            {/* Bottom: Action Arrow */}
            <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[9px] sm:text-[10px] md:text-[11px] font-bold text-amber-700 group-hover:text-amber-900">
              <span>Modülü Aç</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform text-amber-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

