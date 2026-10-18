"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { SupplierAdminPanel } from '@/components/cockpit/supplier-admin-panel';
import { Booking, Complaint, PropertyListing, Experience, ServiceRequest, Hotel } from '@/lib/types';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  TrendingUp,
  QrCode,
  ArrowRight,
  Settings,
  ShieldCheck,
  Compass,
  Scale,
  Sparkles,
  Users,
  MapPin,
  FileCheck,
  DollarSign,
  Mail,
  Phone,
  BellRing,
  Bot,
  PieChart,
  BarChart3,
  Edit3,
  Save,
  Plus,
  Minus,
  Utensils,
  Home,
  Check,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function MasterAdminDashboard() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'quotas' | 'catalog'>('overview');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [providerSearch, setProviderSearch] = useState<string>('');

  // Editable Quota Map state
  const [quotas, setQuotas] = useState<Record<string, number>>({});

  useEffect(() => {
    const refresh = () => {
      const h = XeniosStore.getHotels();
      const b = XeniosStore.getBookings();
      const c = XeniosStore.getComplaints();
      const p = XeniosStore.getPropertyListings();
      const e = XeniosStore.getExperiences();
      const r = XeniosStore.getRequests();

      setHotels(h);
      setBookings(b);
      setComplaints(c);
      setProperties(p);
      setExperiences(e);
      setRequests(r);

      const qMap: Record<string, number> = {};
      e.forEach(item => {
        qMap[item.id] = item.availableSlots ?? 12;
      });
      setQuotas(qMap);
    };
    refresh();

    window.addEventListener('xenios_bookings_updated', refresh);
    window.addEventListener('xenios_complaints_updated', refresh);
    window.addEventListener('xenios_properties_updated', refresh);
    window.addEventListener('xenios_experiences_updated', refresh);
    window.addEventListener('xenios_requests_updated', refresh);
    window.addEventListener('xenios_demo_updated', refresh);

    return () => {
      window.removeEventListener('xenios_bookings_updated', refresh);
      window.removeEventListener('xenios_complaints_updated', refresh);
      window.removeEventListener('xenios_properties_updated', refresh);
      window.removeEventListener('xenios_experiences_updated', refresh);
      window.removeEventListener('xenios_requests_updated', refresh);
      window.removeEventListener('xenios_demo_updated', refresh);
    };
  }, []);

  const totalPosRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const platformCommission = Math.round(totalPosRevenue * 0.15);
  const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);

    // Comus AI Guest Profile Stats & Live Counts
  const aiStats = {
    totalConversations: bookings.length + requests.length > 0 ? (bookings.length + requests.length) : 0,
    personas: [
      { name: 'Romantik Çiftler (Couple)', percentage: 38, count: 0, color: 'bg-rose-500' },
      { name: 'Lüks & Boğaz Tutkunları (Luxury)', percentage: 29, count: 0, color: 'bg-amber-500' },
      { name: 'Tarih & Kültür Kaşifleri (Heritage)', percentage: 18, count: 0, color: 'bg-blue-500' },
      { name: 'Gurme & Gastronomi (Foodie)', percentage: 15, count: 0, color: 'bg-emerald-500' }
    ],
    dietary: [
      { name: 'Helal / Alkol Hassasiyeti', count: 0 },
      { name: 'Deniz Ürünleri & Balık', count: 0 },
      { name: 'Vejetaryen / Vegan', count: 0 },
      { name: 'Glutensiz', count: 0 }
    ],
    topInterests: ['Özel Yat ile Boğaz Turu', 'Tarihi Yarımada VIP Rehber', 'Osmanlı Saray Mutfağı', 'Türk Hamamı & Spa', 'Boğaz Manzaralı Restoranlar']
  };

  // In-Room Service Request Stats (Strictly Live Data)
  const housekeepingCount = requests.filter(r => (r.department || '').toLowerCase().includes('house') || (r.department || '').toLowerCase().includes('temiz')).length;
  const roomServiceCount = requests.filter(r => (r.department || '').toLowerCase().includes('mutfak') || (r.department || '').toLowerCase().includes('room')).length;
  const conciergeCount = requests.filter(r => (r.department || '').toLowerCase().includes('concierge') || (r.department || '').toLowerCase().includes('taksi')).length;
  const receptionCount = requests.filter(r => (r.department || '').toLowerCase().includes('resepsiyon') || (r.department || '').toLowerCase().includes('ön büro')).length;

  const requestStats = {
    total: requests.length,
    housekeeping: housekeepingCount,
    roomService: roomServiceCount,
    concierge: conciergeCount,
    reception: receptionCount,
    avgResponseMinutes: requests.length > 0 ? '4.2 dk' : '-'
  };

  // All categories from experiences
  const categories = useMemo(() => {
    const set = new Set(experiences.map(e => e.category));
    return ['all', ...Array.from(set)];
  }, [experiences]);

  const filteredCatalog = experiences.filter(e => {
    return catalogCategory === 'all' || e.category === catalogCategory;
  });

  // Providers Directory (Experiences + Properties)
  const providersList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      category: string;
      contactPerson: string;
      phone: string;
      email: string;
      listingTitle: string;
      type: 'experience' | 'property';
    }> = [];

    experiences.forEach((exp, i) => {
      list.push({
        id: `exp-${exp.id}`,
        name: exp.provider || exp.title,
        category: exp.category,
        contactPerson: 'Rezervasyon & Operasyon Yetkilisi',
        phone: exp.phone || '+90 212 514 00 00',
        email: exp.providerEmail || `operasyon@${exp.provider.toLowerCase().replace(/[^a-z0-9]/g, '') || 'istanbulguide'}.com`,
        listingTitle: exp.title,
        type: 'experience'
      });
    });

    properties.forEach((prop, i) => {
      list.push({
        id: `prop-${prop.id}`,
        name: prop.agency || prop.developer || 'TEKCE Overseas / Istanbul Homes',
        category: 'Gayrimenkul Yatırım Portföyü',
        contactPerson: 'VIP Yatırım Danışmanı',
        phone: prop.contactPhone || '+90 850 811 07 00',
        email: 'invest@tekce.com',
        listingTitle: prop.title,
        type: 'property'
      });
    });

    return list.filter(p => {
      if (!providerSearch) return true;
      const s = providerSearch.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.listingTitle.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.phone.includes(s);
    });
  }, [experiences, properties, providerSearch]);

  const handleUpdateQuota = (id: string, newSlots: number) => {
    setQuotas(prev => ({ ...prev, [id]: Math.max(0, newSlots) }));
    XeniosStore.updateExperienceQuota(id, Math.max(0, newSlots));
    toast.success("Müsaitlik kontenjanı anlık olarak güncellendi.");
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-4 sm:space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      {/* Top Deck Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-100/40 to-amber-50/70 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-300 shadow-xs space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 font-mono whitespace-nowrap">
            XENIOS MASTER OPERATIONS DECK
          </span>
          <span className="text-xs text-zinc-600 dark:text-slate-400 font-medium">Merkezi Operasyon & Partnerlik Masası</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 leading-snug">
          İstanbul Turizm, Otel Envanteri & Partnerlik Yönetimi
        </h1>
        <p className="text-xs text-zinc-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Platform geneli {hotels.length} partner otel ({totalRooms.toLocaleString('tr-TR')}+ birim), {experiences.length} doğrulanmış İstanbul deneyimi & restoranı, {properties.length} gayrimenkul yatırım portföyü, Comus AI profil istatistikleri ve misafir hakem masası kontrolü.
        </p>
      </div>

      {/* 🔴 CANLI BİLDİRİMLER / İŞLEM AKIŞI (Header Alanının Altında) */}
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-xs space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0 mt-1 sm:mt-0" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-start sm:items-center gap-1.5 min-w-0">
              <BellRing className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-snug">Canlı Misafir Talepleri, Rezervasyon & Satın Alma Akışı</span>
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap shrink-0">
            Canlı Senkronize
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Son Rezervasyon */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60 text-xs space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-zinc-500 dark:text-slate-400 text-[10px]">
              <span className="font-bold text-emerald-800 uppercase flex items-center gap-1 truncate">
                <CreditCard className="w-3 h-3 shrink-0" /> Tur Satın Alma & POS
              </span>
              <span className="font-mono shrink-0">10 dk önce</span>
            </div>
            <strong className="text-zinc-900 dark:text-slate-100 block font-bold truncate">Özel Yat ile Boğazda Günbatımı Turu</strong>
            <p className="text-zinc-600 dark:text-slate-400 text-[11px] truncate">Marc & Sophie Laurent • Hotel Sultanahmet (Birim 204)</p>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-mono font-bold">€250 Ödendi</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Onaylandı</span>
            </div>
          </div>

          {/* Son Konaklama İçi Hizmet Talebi */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60 text-xs space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-zinc-500 dark:text-slate-400 text-[10px]">
              <span className="font-bold text-amber-800 uppercase flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 shrink-0" /> Konaklama İçi Hizmet Talebi
              </span>
              <span className="font-mono shrink-0">18 dk önce</span>
            </div>
            <strong className="text-zinc-900 dark:text-slate-100 block font-bold truncate">Ekstra Banyo Havlusu & Buklet Seti</strong>
            <p className="text-zinc-600 dark:text-slate-400 text-[11px] truncate">Elena Rostova • Grand Pera Hotel (Birim 302)</p>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-slate-400 font-mono">Housekeeping</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold animate-pulse">İşlemde</span>
            </div>
          </div>

          {/* Son Yatırım Keşif Turu Talebi */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60 text-xs space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-zinc-500 dark:text-slate-400 text-[10px]">
              <span className="font-bold text-sky-800 uppercase flex items-center gap-1 truncate">
                <Home className="w-3 h-3 shrink-0" /> VIP Yatırım Keşif Turu
              </span>
              <span className="font-mono shrink-0">42 dk önce</span>
            </div>
            <strong className="text-zinc-900 dark:text-slate-100 block font-bold truncate">Cihangir Sanatçılar Sokağı Panoramik Daire</strong>
            <p className="text-zinc-600 dark:text-slate-400 text-[11px] truncate">Tarih: 22 Ağustos • TEKCE Overseas</p>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-sky-700 font-mono font-bold">$220.000 İlan</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">Randevu Alındı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs - 2x2 Grid on Mobile so zero horizontal overflow */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 w-full">
        {[
          { id: 'overview', label: '📊 Genel İstatistikler & Oteller' },
          { id: 'providers', label: '📞 İlan Sahipleri & Rehber' },
          { id: 'quotas', label: '⚡ Kontenjan & Müsaitlik' },
          { id: 'catalog', label: '🗺️ Kategori Deneyim Kataloğu' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold leading-snug text-center transition cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-600 dark:text-slate-400 hover:bg-amber-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENEL İSTATİSTİKLER & ANLAŞMALI OTELLER */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-1 text-zinc-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-900 dark:text-slate-100 truncate">Platform POS Cirosu</span>
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-700 truncate">
                €{totalPosRevenue.toLocaleString('tr-TR')}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                Komisyon: <strong className="text-amber-800 font-mono">€{platformCommission}</strong> (%15)
              </p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-1 text-zinc-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-900 dark:text-slate-100 truncate">Partner Tesisler</span>
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100 truncate">
                {hotels.length} Tesis
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                Kapasite: <strong className="text-amber-800 font-mono">{totalRooms.toLocaleString('tr-TR')}+ Birim</strong>
              </p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-1 text-zinc-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-900 dark:text-slate-100 truncate">İlan Portföyü</span>
                <Compass className="w-4 h-4 text-sky-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-sky-700 truncate">
                {experiences.length} + {properties.length}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                {experiences.length} Deneyim + {properties.length} Yatırım
              </p>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-1 text-zinc-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-900 dark:text-slate-100 truncate">Comus AI Etkileşimi</span>
                <Bot className="w-4 h-4 text-purple-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-bold font-mono text-purple-700 truncate">
                {aiStats.totalConversations}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-slate-400 truncate">
                Misafir AI Sohbet Oturumu
              </p>
            </div>
          </div>

          {/* İKİ ANALİTİK PANELİ: KONAKLAMA KULLANIMI & COMUS AI PROFİL BİLGİLERİ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* 1. Xenios Konaklama İçi Kullanım İstatistikleri */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-amber-700 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-slate-100 truncate">Konaklama İçi Misafir Kullanım İstatistikleri</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 whitespace-nowrap">
                  Ort. Yanıt: {requestStats.avgResponseMinutes}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between gap-2 text-xs font-semibold mb-1">
                    <span className="text-zinc-700 truncate">Housekeeping / Temizlik & Havlu</span>
                    <span className="text-zinc-900 dark:text-slate-100 font-mono font-bold shrink-0">%45 ({requestStats.housekeeping})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between gap-2 text-xs font-semibold mb-1">
                    <span className="text-zinc-700 truncate">Kahvaltı & Yeme-İçme</span>
                    <span className="text-zinc-900 dark:text-slate-100 font-mono font-bold shrink-0">%30 ({requestStats.roomService})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between gap-2 text-xs font-semibold mb-1">
                    <span className="text-zinc-700 truncate">Concierge & Taksi / Transfer</span>
                    <span className="text-zinc-900 dark:text-slate-100 font-mono font-bold shrink-0">%15 ({requestStats.concierge})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between gap-2 text-xs font-semibold mb-1">
                    <span className="text-zinc-700 truncate">Ön Büro & Resepsiyon İletişimi</span>
                    <span className="text-zinc-900 dark:text-slate-100 font-mono font-bold shrink-0">%10 ({requestStats.reception})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Comus AI Profilleme & Misafir Tercihleri */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-4 h-4 text-purple-600 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-slate-100 truncate">Comus AI Misafir Profil İstatistikleri</h3>
                </div>
                <span className="text-[10px] font-mono text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 whitespace-nowrap">
                  {aiStats.totalConversations} Profil
                </span>
              </div>

              {/* Persona Distribution */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-zinc-700 text-[11px] block">Baskın Seyahat Tarzı Dağılımı:</span>
                <div className="grid grid-cols-2 gap-2">
                  {aiStats.personas.map((p, idx) => (
                    <div key={idx} className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-100 space-y-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-700 font-semibold truncate">{p.name.split(' ')[0]}</span>
                        <strong className="font-mono text-zinc-900 dark:text-slate-100 font-bold shrink-0">%{p.percentage}</strong>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dietary preferences */}
              <div className="pt-2 border-t border-zinc-100 text-xs">
                <span className="font-bold text-zinc-700 text-[11px] block mb-1.5">Diyet & Mutfak Tercihleri:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiStats.dietary.map((d, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-zinc-700">
                      <strong>{d.name}:</strong> <span className="font-mono text-amber-800">{d.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Anlaşmalı Oteller Tablosu */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-slate-100">Anlaşmalı Partner Tesisler Envanteri ({hotels.length})</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400">Tesislerin birim kapasiteleri, lokasyonları ve misafir etkileşimleri</p>
              </div>
              <Link href="/hotels" className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 shrink-0">
                <span>Tümünü Gör</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {hotels.slice(0, 6).map((hotel) => (
                <div key={hotel.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200 inline-block">
                        {hotel.type}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-slate-100 mt-1 truncate">{hotel.name}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-amber-800 font-bold bg-white dark:bg-slate-900 dark:border-slate-800 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                      ★ {hotel.ratingStr.split(' ')[0]}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 dark:text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">{hotel.district}, İstanbul</span>
                  </p>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-zinc-500 dark:text-slate-400">
                    <span>{hotel.rooms.length} Tanımlı Birim</span>
                    <span className="text-emerald-700 font-mono font-bold">● Aktif Tesis</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANLAŞMALI İŞLETMELER, TEDARİKÇİLER & MÜLK YÖNETİCİLERİ */}
      {activeTab === 'providers' && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0 overflow-x-hidden">
          <div className="border-b border-amber-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-slate-100">
              Purelyİstanbul Anlaşmalı İşletmeler, Tedarikçiler & Mülk Yöneticileri
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Yeni işletme kaydı, sözleşme/komisyon oranı yönetimi, iletişim rehberi ve bağlı ilan takibi
            </p>
          </div>
          <SupplierAdminPanel />
        </div>
      )}

      {/* TAB 3: KONTENJAN & MÜSAİTLİK REVİZYONU */}
      {activeTab === 'quotas' && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0">
          <div className="border-b border-amber-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-slate-100">Kontenjanlı İlanların Müsaitlik & Kişi Sayısı Revizyonu</h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Günlük kontenjanı olan turların ve etkinliklerin kalan müsait kişi sayısını anlık olarak artırın veya azaltın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {experiences.slice(0, 16).map((exp) => {
              const currentSlots = quotas[exp.id] ?? (exp.availableSlots || 12);
              return (
                <div
                  key={exp.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between gap-3 text-xs min-w-0"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold inline-block">
                      {exp.category}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-slate-100 truncate mt-0.5">{exp.title}</h4>
                    <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-mono">Fiyat: {exp.price} {exp.currency}</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateQuota(exp.id, currentSlots - 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <div className="w-10 sm:w-12 text-center">
                      <span className="text-sm font-bold font-mono text-zinc-900 dark:text-slate-100 block">{currentSlots}</span>
                      <span className="text-[8px] text-zinc-400 uppercase">Kişi</span>
                    </div>

                    <button
                      onClick={() => handleUpdateQuota(exp.id, currentSlots + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: KATEGORİ BAZLI DENEYİM KATALOĞU */}
      {activeTab === 'catalog' && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-4 min-w-0">
          <div className="border-b border-amber-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-slate-100">Konaklama Sayfasında Yayınlanan Hizmet & Deneyimler Kataloğu</h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400">Özel kategorilerde yayınlanan tur, restoran ve deneyim ilanları ({filteredCatalog.length})</p>
          </div>

          {/* Category Filter Pills - wrapped so no horizontal overflow on mobile */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatalogCategory(cat)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer border ${
                  catalogCategory === cat
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-amber-50/50 border-amber-200 text-zinc-600 dark:text-slate-400 hover:bg-amber-100'
                }`}
              >
                {cat === 'all' ? 'Tüm Kategoriler' : cat}
              </button>
            ))}
          </div>

          {/* Categorized Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCatalog.map((exp) => (
              <div
                key={exp.id}
                className={`p-4 rounded-2xl border transition space-y-2 flex flex-col justify-between min-w-0 ${
                  exp.status === 'suspended'
                    ? 'bg-zinc-100/70 border-zinc-300 opacity-75'
                    : 'bg-amber-50/40 border-amber-200/70 hover:border-amber-400'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold truncate">
                      {exp.category}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700 shrink-0">
                      {exp.price} {exp.currency}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-slate-100 leading-snug line-clamp-2">{exp.title}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400 truncate">{exp.provider}</p>
                </div>

                <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2 text-[10px] text-zinc-500 dark:text-slate-400 font-mono">
                  <span className="truncate">Süre: {exp.duration}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus = exp.status === 'suspended' ? 'active' : 'suspended';
                        XeniosStore.updateExperience(exp.id, { status: nextStatus });
                        toast.success(nextStatus === 'active' ? 'İlan yayına alındı.' : 'İlan askıya alındı.');
                      }}
                      className="px-2 py-1 rounded-md border border-amber-300 bg-white text-amber-800 font-sans font-bold text-[10px] hover:bg-amber-50 cursor-pointer"
                    >
                      {exp.status === 'suspended' ? 'Yayına Al' : 'Askıya Al'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        XeniosStore.deleteExperience(exp.id);
                        toast.error('İlan silindi.');
                      }}
                      className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 font-sans font-bold text-[10px] hover:bg-red-100 cursor-pointer"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

