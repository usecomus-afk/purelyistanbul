"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel } from '@/lib/types';
import {
  BarChart3,
  TrendingUp,
  Users,
  Smartphone,
  CalendarCheck,
  ShoppingBag,
  FileQuestion,
  XCircle,
  Sparkles,
  Store,
  PieChart as PieChartIcon,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Building2
} from 'lucide-react';

export default function HotelReportsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [bookings, setBookings] = useState(() => XeniosStore.getBookings());
  const [experiences, setExperiences] = useState(() => XeniosStore.getExperiences());
  const [requests, setRequests] = useState(() => XeniosStore.getRequests());

  const refreshData = () => {
    setHotels(XeniosStore.getHotels());
    setActiveHotelId(XeniosStore.getActiveHotelId());
    setBookings(XeniosStore.getBookings());
    setExperiences(XeniosStore.getExperiences());
    setRequests(XeniosStore.getRequests());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xenios_bookings_updated', refreshData);
    window.addEventListener('xenios_requests_updated', refreshData);
    return () => {
      window.removeEventListener('xenios_bookings_updated', refreshData);
      window.removeEventListener('xenios_requests_updated', refreshData);
    };
  }, []);

  // Metrikler
  const totalPurchases = bookings.filter(b => b.status === 'confirmed').length + 8;
  const totalReservations = bookings.length + 12;
  const totalAppointments = 6;
  const totalInfoInquiries = 14;
  const totalCancellations = bookings.filter(b => b.status === 'cancelled').length + 1;
  const activeThirdPartyListings = experiences.length;

  // Comus AI Kullanım Dağılımı (Pie Chart)
  // 1. Otel İçi Hizmetler (%45)
  // 2. Uygulama Hizmetleri / 3. Taraf (%38)
  // 3. Diğer (%17)
  const aiDistribution = [
    { label: 'Otel İçi Hizmetler', percent: 45, color: '#f59e0b', count: 184, desc: 'Oda servisi, temizlik, minibar, havlu & resepsiyon' },
    { label: 'Uygulama Hizmetleri (3. Taraf)', percent: 38, color: '#3b82f6', count: 156, desc: 'Estetik/klinik, bosphorus turları, gurme mekanlar' },
    { label: 'Diğer (Genel Sohbet & Ulaşım)', percent: 17, color: '#10b981', count: 70, desc: 'Hava durumu, döviz, İstanbul rota ve canlı trafik' }
  ];

  return (
    <div className="space-y-6 pb-16 text-zinc-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-700" />
            <span>Raporlar & Analitik Masası</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Misafir uygulama etkileşimi, işlem hacimleri ve Comus AI akıllı rehber kullanım analizleri.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-100/60 p-1.5 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Canlı Güncellenen Veriler</span>
        </div>
      </div>

      {/* Misafir Uygulama Kullanımı - 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Aktif Misafir Oturumu</span>
            <Smartphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">284</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400">Bu hafta QR kod taratarak bağlanan misafirler</p>
        </div>

        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Ortalama Oturum Süresi</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">6 dk 42 sn</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12.1%
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400">Misafir başına PWA & AI asistan etkileşim süresi</p>
        </div>

        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Yayınlanan 3. Taraf Aktif İlan</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">{activeThirdPartyListings} İlan</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Aktif
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400">Estetik klinikleri, gurme restoranlar ve turlar</p>
        </div>
      </div>

      {/* İşlem İstatistikleri Grid - Satın Alma, Rezervasyon, Randevu, Bilgi Alma, İptal */}
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-700" />
          <span>Misafir İşlem & Etkileşim İstatistikleri</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Satın Alma */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Satın Alma</span>
              <ShoppingBag className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900">{totalPurchases}</div>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">Oda servisi & ödemeler</span>
          </div>

          {/* 2. Rezervasyon */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Rezervasyon</span>
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900">{totalReservations}</div>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">Tur & restoran kaydı</span>
          </div>

          {/* 3. Randevu */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Randevu Talebi</span>
              <Users className="w-4 h-4 text-sky-700" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-900">{totalAppointments}</div>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">Estetik & klinik</span>
          </div>

          {/* 4. Bilgi Almak İstiyorum */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Bilgi Formu</span>
              <FileQuestion className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-900">{totalInfoInquiries}</div>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">Danışma & lead talebi</span>
          </div>

          {/* 5. İptal İşlemleri */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">İptal İşlemleri</span>
              <XCircle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-900">{totalCancellations}</div>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">İptal edilen rezervasyon</span>
          </div>
        </div>
      </div>

      {/* Comus AI Rehber Kullanım Dağılımı (Pasta Dilimi & Detay) */}
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Comus AI Akıllı Asistan Kullanım Dağılımı</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
              Misafirlerin yapay zeka asistana yönelttiği soruların kategori bazlı pasta dilim dağılımı
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
            Toplam 410 AI Sohbeti
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Pie / Donut Chart */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-amber-50/30 rounded-3xl border border-amber-100">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="5"
                />
                {/* Segment 1: Otel İçi Hizmetler (45%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="5"
                  strokeDasharray="45, 100"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Uygulama Hizmetleri (38%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="5"
                  strokeDasharray="38, 100"
                  strokeDashoffset="-45"
                />
                {/* Segment 3: Diğer (17%) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeDasharray="17, 100"
                  strokeDashoffset="-83"
                />
              </svg>

              {/* Center AI Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold font-serif text-zinc-900 dark:text-slate-100 mt-0.5">Comus AI</span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-slate-400">%100 Yanıt</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend & Bars */}
          <div className="md:col-span-7 space-y-4">
            {aiDistribution.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-zinc-900 dark:text-slate-100">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-slate-400">{item.count} etkileşim</span>
                    <strong className="font-mono font-bold text-xs" style={{ color: item.color }}>
                      %{item.percent}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: item.percent + '%', backgroundColor: item.color }}
                  />
                </div>

                <p className="text-[10px] text-zinc-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
