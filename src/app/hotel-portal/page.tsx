"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest, Hotel } from '@/lib/types';
import { LuxuryPortalIcon } from '@/components/hotel/luxury-portal-icon';
import Link from 'next/link';

interface PortalModule {
  id: string;
  title: string;
  desc: string;
  href: string;
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
    setRequests(XeniosStore.getRequests());
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
    name: 'Old City Heritage Hotel Istanbul',
    district: 'Fatih',
    type: 'Tarihi Lüks Otel',
    rooms: []
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const hasUnread = pendingRequests.length > 0;

  const modules: PortalModule[] = [
    {
      id: 'requests',
      title: 'Canlı Misafir Talepleri',
      desc: 'Birim içi servisler, kat hizmetleri, mutfak ve resepsiyon talepleri masası',
      href: '/hotel-portal/requests',
      badge: hasUnread ? `${pendingRequests.length} Yeni Talep` : undefined,
      badgeType: hasUnread ? 'danger' : 'neutral',
      hasPulse: hasUnread
    },
    {
      id: 'services',
      title: 'Konaklama İçi Hizmetler & Menü',
      desc: '16+ Konaklama içi servis kontrolü, F&B menüsüne ürün, içerik ve fiyat ekleme',
      href: '/hotel-portal/services',
    },
    {
      id: 'rooms',
      title: 'Doluluk & Birim Panosu',
      desc: 'Birim durumları, kat envanteri, anlık doluluk ve temizlik takibi',
      href: '/hotel-portal/rooms',
      badge: currentHotel.rooms?.length ? `${currentHotel.rooms.length} Birim` : undefined,
    },
    {
      id: 'channels',
      title: 'iCal & OTA Kanalları',
      desc: 'Airbnb, Booking.com, VRBO ve Expedia 2 yönlü takvim entegrasyonu',
      href: '/hotel-portal/channels',
    },
    {
      id: 'qr-generator',
      title: 'Birim QR Kodları',
      desc: 'Her birime özel dijital concierge standee QR kodları ve .ics takvim adresleri',
      href: '/hotel-portal/qr-generator',
    },
    {
      id: 'profile',
      title: 'İşletme & Profil Ayarları',
      desc: 'İşletme iletişim bilgileri, yönetici profili ve anlık bildirim tercihleri',
      href: '/hotel-portal/profile',
    },
    {
      id: 'kbs',
      title: 'Online Check-in & KBS',
      desc: 'Google Cloud Document AI OCR ile pasaport tarama ve EGM KBS kimlik bildirim sistemi',
      href: '/hotel-portal/kbs',
    },
    {
      id: 'reports',
      title: 'Raporlar',
      desc: 'Misafir uygulama kullanımı, satış/randevu metrikleri ve Comus AI pasta dilimi dağılımı',
      href: '/hotel-portal/reports',
    }
  ];

  return (
    <div className="h-full flex-1 flex flex-col justify-between overflow-hidden">
      <div className="grid grid-cols-2 grid-rows-4 gap-3 sm:gap-3.5 h-full flex-1">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="luxury-service-card p-2.5 sm:p-3.5 flex flex-col items-center text-center justify-center gap-1.5 sm:gap-2 h-full min-h-0 group relative cursor-pointer select-none"
          >
            {mod.hasPulse && mod.badge && (
              <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#9E2A2B] text-[#FAF8F4] font-luxury-sans text-[9.5px] font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>{mod.badge}</span>
              </span>
            )}

            <div className="shrink-0 flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-300 relative">
              <LuxuryPortalIcon id={mod.id} className="w-[78px] h-[78px] sm:w-24 sm:h-24" />
            </div>

            <div className="w-full px-1">
              <span className="font-luxury-sans text-[13.5px] sm:text-[15px] font-bold tracking-[-0.01em] text-[#141414] leading-[1.18] block line-clamp-2">
                {mod.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
