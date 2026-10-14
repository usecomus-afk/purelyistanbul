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
      <div className="grid grid-cols-2 grid-rows-4 gap-2.5 sm:gap-3.5 h-full flex-1">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="p-2.5 sm:p-3 flex flex-col items-center text-center justify-center gap-1.5 h-full min-h-0 group relative bg-gradient-to-br from-[#ffffff] to-[#e8eaed] rounded-[22px] border-2 border-white/80 shadow-[0_8px_16px_rgba(0,0,0,0.12),inset_4px_4px_8px_rgba(255,255,255,1),inset_-4px_-4px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_20px_rgba(0,0,0,0.15),inset_4px_4px_8px_rgba(255,255,255,1),inset_-4px_-4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,1),inset_-2px_-2px_4px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform relative">
              <Image
                src={mod.iconPath}
                alt={mod.title}
                width={64}
                height={64}
                unoptimized
                className="w-full h-full object-contain drop-shadow-sm"
              />
              {mod.hasPulse && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
              )}
            </div>
            <div className="w-full">
              <span className="text-[12px] sm:text-[14px] font-[800] text-[#1e293b] leading-snug block px-1">
                {mod.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


