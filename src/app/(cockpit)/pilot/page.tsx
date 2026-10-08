"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Building2, 
  Compass, 
  TrendingUp, 
  Bot, 
  DollarSign, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Save, 
  RefreshCw, 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  CreditCard, 
  DoorOpen, 
  Wifi, 
  BarChart3, 
  MessageSquare, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ExternalLink,
  Download,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Power,
  ShieldAlert,
  BellRing,
  HelpCircle
} from 'lucide-react';
import { XeniosStore } from '@/lib/store';
import { Experience, Hotel, Room, XeniosUser, PropertyListing, InvestmentLead, Booking, ServiceRequest } from '@/lib/types';
import { toast } from 'sonner';

export default function PilotMasterDeckPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'experiences' | 'invest' | 'hotels' | 'finance' | 'ai'>('overview');
  const [user, setUser] = useState<XeniosUser | null>(null);

  // Experience state
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [searchExp, setSearchExp] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState(false);

  // New Experience Form state
  const [newExp, setNewExp] = useState<Partial<Experience>>({
    title: '',
    category: 'Boğaz Turları & Yat',
    provider: '',
    location: 'Sultanahmet, Fatih',
    phone: '+90 532 000 00 00',
    website: 'https://',
    agentNote: '',
    price: 1500,
    currency: '₺',
    duration: '2.5 Saat',
    rating: 5,
    categoryTag: 'Boğaz & Deniz',
    iconName: 'anchor',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80'
  });

  // Real Estate (Invest) state
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [investmentLeads, setInvestmentLeads] = useState<InvestmentLead[]>([]);
  const [searchProp, setSearchProp] = useState('');
  const [editingProp, setEditingProp] = useState<PropertyListing | null>(null);
  const [isNewPropModalOpen, setIsNewPropModalOpen] = useState(false);

  // New Property Form state
  const [newProp, setNewProp] = useState<Partial<PropertyListing>>({
    title: '',
    district: 'Beşiktaş / Boğaz Hattı',
    propertyType: 'Rezidans Dairesi',
    priceUSD: 450000,
    bedrooms: 2,
    areaM2: 120,
    description: '',
    highlights: ['Boğaz Manzarası', 'Akıllı Ev Altyapısı', 'Yüksek Kira Getirisi'],
    developer: 'Xenios Prime Real Estate',
    citizenshipEligible: true,
    roiEstimate: '%8.5 Yıllık USD Getiri',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  });

  // Hotel state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isNewHotelModalOpen, setIsNewHotelModalOpen] = useState(false);

  // New Hotel Form state
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelDistrict, setNewHotelDistrict] = useState('Sultanahmet / Fatih');
  const [newHotelType, setNewHotelType] = useState('Butik Otel & Konak');
  const [newHotelAddress, setNewHotelAddress] = useState('');
  const [newHotelPhone, setNewHotelPhone] = useState('+90 212 500 00 00');
  const [newHotelWebsite, setNewHotelWebsite] = useState('https://');
  const [newHotelRoomCount, setNewHotelRoomCount] = useState(15);
  const [newHotelWifiSsid, setNewHotelWifiSsid] = useState('Hotel_Guest');
  const [newHotelWifiPass, setNewHotelWifiPass] = useState('Xenios2026!');
  const [newHotelBreakfast, setNewHotelBreakfast] = useState('07:30 - 10:30');
  const [newHotelCheckout, setNewHotelCheckout] = useState('11:30');
  const [newHotelReceptionExt, setNewHotelReceptionExt] = useState('9');

  // Broadcast state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('📢 Özel VIP Boğaz Turu Duyurusu');
  const [broadcastBody, setBroadcastBody] = useState('Bu akşama özel gün batımı yat turlarımızda partner otel misafirlerine %15 indirim fırsatı!');

  const refreshAll = () => {
    setUser(XeniosStore.getUser());
    setExperiences(XeniosStore.getExperiences());
    setProperties(XeniosStore.getPropertyListings());
    setInvestmentLeads(XeniosStore.getInvestmentLeads());
    setHotels(XeniosStore.getHotels());
    setBookings(XeniosStore.getBookings());
    setRequests(XeniosStore.getRequests());
  };

  useEffect(() => {
    refreshAll();
    window.addEventListener('xenios_experiences_updated', refreshAll);
    window.addEventListener('xenios_properties_updated', refreshAll);
    window.addEventListener('xenios_investment_leads_updated', refreshAll);
    window.addEventListener('xenios_hotels_updated', refreshAll);
    window.addEventListener('xenios_bookings_updated', refreshAll);
    window.addEventListener('xenios_requests_updated', refreshAll);
    return () => {
      window.removeEventListener('xenios_experiences_updated', refreshAll);
      window.removeEventListener('xenios_properties_updated', refreshAll);
      window.removeEventListener('xenios_investment_leads_updated', refreshAll);
      window.removeEventListener('xenios_hotels_updated', refreshAll);
      window.removeEventListener('xenios_bookings_updated', refreshAll);
      window.removeEventListener('xenios_requests_updated', refreshAll);
    };
  }, []);

  // Financial Calculations
  const grossPosRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  }, [bookings]);

  const xeniosCommission = useMemo(() => {
    return Math.round(grossPosRevenue * 0.15);
  }, [grossPosRevenue]);

  const providerPayout = useMemo(() => {
    return grossPosRevenue - xeniosCommission;
  }, [grossPosRevenue, xeniosCommission]);

  // 1. Experience CRUD handlers
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;
    XeniosStore.updateExperience(editingExp.id, editingExp);
    toast.success(`"${editingExp.title}" başarıyla güncellendi!`);
    setEditingExp(null);
  };

  const handleCreateExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title) {
      toast.error('Lütfen ilan başlığı giriniz.');
      return;
    }
    const created: Experience = {
      id: 'exp_' + Date.now(),
      title: newExp.title || 'Yeni Deneyim',
      category: newExp.category || 'Boğaz Turları & Yat',
      provider: newExp.provider || 'Xenios Partner',
      location: newExp.location || 'Sultanahmet, Fatih',
      phone: newExp.phone || '+90 532 000 00 00',
      website: newExp.website || 'https://',
      agentNote: newExp.agentNote || '',
      scoreStr: '4.9/5',
      price: Number(newExp.price) || 1000,
      currency: newExp.currency || '₺',
      duration: newExp.duration || '2 Saat',
      rating: Number(newExp.rating) || 5,
      coords: { lat: 41.0082, lng: 28.9784 },
      categoryTag: newExp.categoryTag || 'Özel Deneyim',
      iconName: newExp.iconName || 'sparkles',
      image: newExp.image || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
      availableSlots: 15
    };
    XeniosStore.addExperience(created);
    toast.success(`"${created.title}" başarıyla yayınlandı!`);
    setIsNewExpModalOpen(false);
    setNewExp({
      title: '',
      category: 'Boğaz Turları & Yat',
      provider: '',
      location: 'Sultanahmet, Fatih',
      phone: '+90 532 000 00 00',
      website: 'https://',
      agentNote: '',
      price: 1500,
      currency: '₺',
      duration: '2.5 Saat',
      rating: 5,
      categoryTag: 'Boğaz & Deniz',
      iconName: 'anchor',
      image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80'
    });
  };

  const handleDeleteExp = (id: string, title: string) => {
    if (confirm(`"${title}" ilanını kalıcı olarak silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteExperience(id);
      toast.info(`"${title}" katalogdan silindi.`);
    }
  };

  const handleAdjustSlot = (id: string, delta: number) => {
    const exp = experiences.find(e => e.id === id);
    if (!exp) return;
    const current = exp.availableSlots ?? 12;
    const next = Math.max(0, current + delta);
    XeniosStore.updateExperience(id, { availableSlots: next });
    toast.success(`Kontenjan güncellendi: ${next} slot`);
  };

  // 2. Real Estate CRUD handlers
  const handleSaveProp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;
    XeniosStore.updatePropertyListing(editingProp.id, editingProp);
    toast.success(`"${editingProp.title}" yatırım projesi güncellendi!`);
    setEditingProp(null);
  };

  const handleCreateProp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title) {
      toast.error('Lütfen proje başlığı giriniz.');
      return;
    }
    const created: PropertyListing = {
      id: 'prop_' + Date.now(),
      title: newProp.title || 'Yeni Proje',
      district: newProp.district || 'Beşiktaş / Boğaz Hattı',
      propertyType: newProp.propertyType || 'Rezidans Dairesi',
      personas: ['citizenship', 'luxury_lifestyle'],
      priceUSD: Number(newProp.priceUSD) || 400000,
      bedrooms: Number(newProp.bedrooms) || 2,
      areaM2: Number(newProp.areaM2) || 120,
      description: newProp.description || 'Yüksek kira getirili lüks yatırım fırsatı.',
      highlights: typeof newProp.highlights === 'string' ? (newProp.highlights as string).split(',') : (newProp.highlights || ['Boğaz Manzarası']),
      developer: newProp.developer || 'Xenios Prime Real Estate',
      contactPhone: '+90 212 500 00 00',
      contactWebsite: 'https://usecomus.com',
      image: newProp.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      coords: { lat: 41.0082, lng: 28.9784 },
      citizenshipEligible: newProp.citizenshipEligible ?? true,
      roiEstimate: newProp.roiEstimate || '%8.5 Yıllık USD Getiri',
      status: 'active'
    };
    XeniosStore.addPropertyListing(created);
    toast.success(`"${created.title}" yatırım projesi yayına alındı!`);
    setIsNewPropModalOpen(false);
  };

  const handleDeleteProp = (id: string, title: string) => {
    if (confirm(`"${title}" projesini silmek istediğinize emin misiniz?`)) {
      XeniosStore.deletePropertyListing(id);
      toast.info(`"${title}" portföyden silindi.`);
    }
  };

  const handleTogglePropStatus = (p: PropertyListing) => {
    const nextStatus = p.status === 'suspended' ? 'active' : 'suspended';
    XeniosStore.updatePropertyListing(p.id, { status: nextStatus });
    toast.success(`"${p.title}" durumu: ${nextStatus === 'active' ? 'YAYINDA' : 'ASKIYA ALINDI'}`);
  };

  // 3. Hotel CRUD handlers
  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    XeniosStore.updateHotel(editingHotel.id, editingHotel);
    toast.success(`"${editingHotel.name}" bilgileri güncellendi!`);
    setEditingHotel(null);
  };

  const handleCreateHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim()) {
      toast.error('Lütfen otel adını giriniz.');
      return;
    }
    const hotelId = 'hotel_' + Date.now();
    const roomsCount = Number(newHotelRoomCount) || 15;
    const generatedRooms: Room[] = Array.from({ length: roomsCount }, (_, i) => ({
      id: 'rm_' + hotelId + '_' + (101 + i),
      number: String(101 + i),
      type: i % 3 === 0 ? 'Suite' : i % 2 === 0 ? 'Deluxe' : 'Standard',
      floor: String(Math.floor(i / 5) + 1),
      wifiSsid: newHotelWifiSsid,
      wifiPass: newHotelWifiPass
    }));

    const created: Hotel = {
      id: hotelId,
      name: newHotelName.trim(),
      district: newHotelDistrict,
      type: newHotelType,
      address: newHotelAddress || `${newHotelDistrict}, İstanbul`,
      phone: newHotelPhone,
      website: newHotelWebsite,
      ratingStr: '4.8/5',
      targetReason: 'Lüks & Konaklama Deneyimi',
      coords: { lat: 41.0082, lng: 28.9784 },
      breakfastHours: newHotelBreakfast,
      checkoutTime: newHotelCheckout,
      receptionExt: newHotelReceptionExt,
      rooms: generatedRooms
    };

    XeniosStore.addHotel(created);
    toast.success(`"${created.name}" partner otel olarak eklendi (${roomsCount} oda oluşturuldu)!`);
    setIsNewHotelModalOpen(false);
    setNewHotelName('');
  };

  const handleDeleteHotel = (id: string, name: string) => {
    if (confirm(`"${name}" otelini ve tüm oda envanterini silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteHotel(id);
      toast.info(`"${name}" partner listesinden silindi.`);
    }
  };

  // 4. CSV Financial Export Handler
  const handleExportCSV = () => {
    let csv = "Rezervasyon ID,Misafir Adi,Otel / Oda,Deneyim / Hizmet,Tutar (TRY),Xenios Komisyon (15%),Otel Hakedis (85%),Durum,Tarih\n";
    bookings.forEach(b => {
      const comm = Math.round((b.amount || 0) * 0.15);
      const payout = (b.amount || 0) - comm;
      csv += `"${b.id}","${b.guestName || 'Misafir'}","${b.hotelId || 'Xenios'} - Oda ${b.roomNumber || '-'}","${b.experienceTitle}","${b.amount}","${comm}","${payout}","${b.status}","${new Date(b.createdAt).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Xenios_Finansal_Rapor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Finansal rapor CSV formatında başarıyla indirildi!");
  };

  // Dynamic categories list from all live catalog items
  const categories = useMemo(() => {
    const set = new Set(experiences.map(e => e.category || e.categoryTag || 'Genel'));
    return ['ALL', ...Array.from(set)];
  }, [experiences]);

  const filteredExperiences = experiences.filter(exp => {
    const matchCat = selectedCategory === 'ALL' || exp.category === selectedCategory || exp.categoryTag === selectedCategory;
    const matchSearch = !searchExp || exp.title.toLowerCase().includes(searchExp.toLowerCase()) || exp.provider.toLowerCase().includes(searchExp.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredProperties = properties.filter(p => {
    return !searchProp || p.title.toLowerCase().includes(searchProp.toLowerCase()) || p.district.toLowerCase().includes(searchProp.toLowerCase());
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      
      {/* Top Banner with Pilot Identity & Financial Pill */}
      <div className="bg-gradient-to-r from-zinc-900 via-[#171a22] to-zinc-900 p-6 sm:p-7 rounded-3xl border border-amber-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md font-mono tracking-wider">
              ✨ Pilot & Kurucu Masası
            </span>
            <span className="text-xs text-amber-300/80 font-mono">
              Xenios v2.0 Operations Deck
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            İstanbul Merkezi Operasyon Kontrol Masası
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Tüm deneyim ilanları, partner oteller, gayrimenkul yatırım projeleri, sanal POS hakedişleri ve yapay zekâ model altyapısı tek ekranda.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center px-4">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">Toplam Ciro (POS)</span>
            <strong className="text-base sm:text-lg font-mono font-bold text-white">₺{grossPosRevenue.toLocaleString()}</strong>
          </div>
          <div className="p-3 bg-amber-500/20 backdrop-blur-md rounded-2xl border border-amber-500/40 text-center px-4">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">Xenios %15 Gelir</span>
            <strong className="text-base sm:text-lg font-mono font-bold text-amber-400">₺{xeniosCommission.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-amber-200/80 no-scrollbar">
        {[
          { id: 'overview', label: '🎮 Genel Kontrol', count: null },
          { id: 'experiences', label: '⛵ Deneyimler & İlanlar', count: experiences.length },
          { id: 'invest', label: "🏢 İstanbul'da Yatırım", count: properties.length },
          { id: 'hotels', label: '🏨 Partner Oteller', count: hotels.length },
          { id: 'finance', label: '📊 Finans & Raporlama', count: bookings.length },
          { id: 'ai', label: '🤖 Yapay Zekâ & Sistem', count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-amber-50 text-zinc-700 border border-zinc-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW (GENEL KONTROL) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Aktif Oteller</span>
              <strong className="text-xl font-bold text-zinc-900 dark:text-slate-100 block">{hotels.length}</strong>
              <span className="text-[10px] text-emerald-600 font-semibold">{hotels.reduce((s, h) => s + (h.rooms?.length || 0), 0)} Canlı Oda</span>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Katalog İlanları</span>
              <strong className="text-xl font-bold text-amber-800 block">{experiences.length}</strong>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400">7 Ana Kategori</span>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Yatırım Projeleri</span>
              <strong className="text-xl font-bold text-blue-700 block">{properties.length}</strong>
              <span className="text-[10px] text-blue-600 font-semibold">{investmentLeads.length} VIP Talep</span>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Rezervasyonlar</span>
              <strong className="text-xl font-bold text-emerald-700 block">{bookings.length}</strong>
              <span className="text-[10px] text-emerald-600 font-semibold">Sanal POS Onaylı</span>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Oda Talepleri</span>
              <strong className="text-xl font-bold text-orange-600 block">{requests.length}</strong>
              <span className="text-[10px] text-orange-500 font-semibold">{requests.filter(r => r.status === 'pending').length} Bekleyen</span>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Yapay Zekâ AI</span>
              <strong className="text-xl font-bold text-purple-700 block">Gemini 2.5</strong>
              <span className="text-[10px] text-purple-600 font-semibold">%78 Token Tasarrufu</span>
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Hızlı Operasyon Eylemleri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => {
                  toast.success("Tüm partner otellere anlık canlı sistem yayını gönderildi!");
                }}
                className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-2xl flex items-center justify-between transition cursor-pointer"
              >
                <span>📢 Otellere Anlık Canlı Bildirim Gönder</span>
                <ArrowUpRight className="w-4 h-4 text-amber-700" />
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('xenios_ai_cache_v2');
                  toast.success("ComusAI Soru-Cevap Token Önbelleği temizlendi!");
                }}
                className="p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 font-bold rounded-2xl flex items-center justify-between transition cursor-pointer"
              >
                <span>⚡ Gemini Token Önbelleğini Sıfırla</span>
                <RefreshCw className="w-4 h-4 text-purple-700" />
              </button>

              <button
                onClick={handleExportCSV}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold rounded-2xl flex items-center justify-between transition cursor-pointer"
              >
                <span>📑 Finansal Raporu İndir (.CSV)</span>
                <Download className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPERIENCES CRUD (DENEYİMLER VE İLANLAR) */}
      {activeTab === 'experiences' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchExp}
                  onChange={(e) => setSearchExp(e.target.value)}
                  placeholder="İlan veya sağlayıcı ara..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsNewExpModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni İlan Ekle</span>
            </button>
          </div>

          {/* Experiences Table */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf8f1] border-b border-amber-200 text-zinc-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Görsel & Başlık</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Fiyat / Süre</th>
                    <th className="p-3.5">Kontenjan</th>
                    <th className="p-3.5">Sağlayıcı / Konum</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredExperiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-amber-50/40 transition">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={exp.image || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=400&q=80'}
                          alt={exp.title}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-200 shrink-0"
                        />
                        <div>
                          <strong className="text-zinc-900 dark:text-slate-100 block font-bold text-xs">{exp.title}</strong>
                          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-mono">ID: {exp.id}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          {exp.categoryTag || exp.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-amber-800 font-mono font-bold">{exp.price} {exp.currency}</strong>
                        <span className="text-[10px] text-zinc-400 block">{exp.duration}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustSlot(exp.id, -1)}
                            className="w-5 h-5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-zinc-800 dark:text-slate-200 w-6 text-center">{exp.availableSlots ?? 12}</span>
                          <button
                            onClick={() => handleAdjustSlot(exp.id, 1)}
                            className="w-5 h-5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-zinc-800 dark:text-slate-200 font-semibold block">{exp.provider}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{exp.location}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setEditingExp(exp)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExp(exp.id, exp.title)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVEST IN ISTANBUL CRUD (GAYRİMENKUL YATIRIMLARI) */}
      {activeTab === 'invest' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchProp}
                onChange={(e) => setSearchProp(e.target.value)}
                placeholder="Yatırım projesi veya ilçe ara..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <button
              onClick={() => setIsNewPropModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Yatırım Projesi Ekle</span>
            </button>
          </div>

          {/* Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full bg-zinc-900">
                    <img src={p.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'} alt={p.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {p.district}
                      </span>
                      {p.citizenshipEligible && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Vatandaşlık Uygun
                        </span>
                      )}
                    </div>

                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'suspended' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {p.status === 'suspended' ? 'ASKIDA' : 'YAYINDA'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">{p.propertyType}</span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 font-serif">{p.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{p.description}</p>
                    
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-amber-50/60 rounded-xl text-center text-[10px] font-bold border border-amber-200/60">
                      <div>
                        <span className="text-zinc-400 block text-[9px]">FİYAT</span>
                        <span className="text-amber-900 font-mono font-bold">${p.priceUSD?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px]">ODA</span>
                        <span className="text-zinc-800 dark:text-slate-200">{p.bedrooms} Y. Odası</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[9px]">ALAN</span>
                        <span className="text-zinc-800 dark:text-slate-200">{p.areaM2} m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-zinc-100 flex items-center justify-between gap-2 mt-3">
                  <button
                    onClick={() => handleTogglePropStatus(p)}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                      p.status === 'suspended' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                        : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {p.status === 'suspended' ? 'Yayına Al' : 'Askıya Al'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingProp(p)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProp(p.id, p.title)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PARTNER HOTELS CRUD (OTELLER VE ODALAR) */}
      {activeTab === 'hotels' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-3xl border border-amber-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Partner Otel Portföyü ({hotels.length})</h3>
            <button
              onClick={() => setIsNewHotelModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Partner Otel Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map((h) => (
              <div key={h.id} className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                      {h.type}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100 font-serif">{h.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{h.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingHotel(h)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition cursor-pointer"
                      title="Otel Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHotel(h.id, h.name)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition cursor-pointer"
                      title="Otel Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hotel Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#fbf8f1] p-3 rounded-2xl border border-amber-200/60 text-center">
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-bold">TOPLAM ODA</span>
                    <strong className="text-zinc-900 dark:text-slate-100 font-mono">{h.rooms?.length || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-bold">WIFI AĞI</span>
                    <strong className="text-zinc-800 dark:text-slate-200 font-mono text-[11px] truncate block">{h.rooms?.[0]?.wifiSsid || 'Hotel_Guest'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-bold">KAHVALTI</span>
                    <strong className="text-zinc-800 dark:text-slate-200 text-[11px] block">{h.breakfastHours || '07:30 - 10:30'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-bold">RESEPSİYON</span>
                    <strong className="text-amber-800 font-mono font-bold block">Dahili {h.receptionExt || '9'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FINANCE & REPORTING (FİNANS & RAPORLAMA) */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Toplam Brüt Ciro</span>
              <strong className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100 block">₺{grossPosRevenue.toLocaleString()}</strong>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400">Sanal POS üzerinden gerçekleşen tüm rezervasyonlar</p>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl border border-amber-300 shadow-sm bg-gradient-to-br from-white to-amber-50/50 space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Xenios Platform Payı (%15)</span>
              <strong className="text-2xl font-bold font-mono text-amber-700 block">₺{xeniosCommission.toLocaleString()}</strong>
              <p className="text-[11px] text-amber-900/70">Sistem hakediş ve platform net gelir payı</p>
            </div>

            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl border border-zinc-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Tedarikçi & Otel Hakedişi (%85)</span>
              <strong className="text-2xl font-bold font-mono text-emerald-700 block">₺{providerPayout.toLocaleString()}</strong>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400">Partner deneyim sağlayıcılarına aktarılacak tutar</p>
            </div>
          </div>

          {/* Bookings Table with Export */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Sanal POS İşlem Geçmişi ({bookings.length})</h3>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Raporu CSV Olarak İndir</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fbf8f1] border-b border-amber-200 text-zinc-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Sipariş ID</th>
                    <th className="p-3">Misafir & İletişim</th>
                    <th className="p-3">Deneyim / Rezervasyon</th>
                    <th className="p-3">Tutar</th>
                    <th className="p-3">Komisyon (%15)</th>
                    <th className="p-3">Durum</th>
                    <th className="p-3">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-amber-50/30">
                      <td className="p-3 font-mono font-bold text-amber-900">{b.id}</td>
                      <td className="p-3">
                        <strong className="text-zinc-900 dark:text-slate-100 block">{b.guestName || 'Misafir'}</strong>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400">{b.hotelId || 'Otel'} - Oda {b.roomNumber || '-'}</span>
                      </td>
                      <td className="p-3 font-semibold text-zinc-800 dark:text-slate-200">{b.experienceTitle}</td>
                      <td className="p-3 font-mono font-bold text-zinc-900 dark:text-slate-100">₺{b.amount?.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold text-amber-700">₺{Math.round((b.amount || 0) * 0.15).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500 dark:text-slate-400 font-mono text-[10px]">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI & SYSTEM (YAPAY ZEKÂ VE SİSTEM) */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-700">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100">ComusAI Gemini Concierge & Sistem Yönetimi</h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">PWA push bildirimleri ve merkezi yapay zekâ operasyonları</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  <span>📢 PWA Bildirimi Gönder</span>
                </button>
              </div>
            </div>

            {/* Olympus Central Telemetry Notice */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Canlı Token Telemetrisi:</strong> LLM token tüketimi, maliyet ve tasarruf verileri merkezi <strong>Olympus Master Cockpit</strong> üzerinden izlenmektedir.</span>
              </div>
            </div>

            {/* Architecture Details */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs text-zinc-700">
              <h4 className="font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3 Kademeli Akıllı Token Tasarruf Mimarisi</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-600 dark:text-slate-400">
                <li><strong>Kademe 1 (0 Token):</strong> Otel Wi-Fi şifresi, kahvaltı saatleri, oda numarası ve ombudsman turizm şikayetleri anında yerel motordan (0 maliyet) döner.</li>
                <li><strong>Kademe 2 (Önbellek Hit):</strong> Misafir aynı veya benzer soruları sorduğunda yanıt in-memory semantik cache üzerinden üretilir.</li>
                <li><strong>Kademe 3 (Gemini 2.5 Flash):</strong> Sadece derin konsiyerj, rota planlama ve randevu oluşturma adımlarında canlı LLM çağrısı yapılır.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ İLAN EKLE */}
      {isNewExpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-4">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <h3 className="text-base font-bold font-serif">Yeni Deneyim / Restoran İlanı Ekle</h3>
                <button onClick={() => setIsNewExpModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateExp} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">İlan Başlığı</label>
                  <input
                    type="text"
                    required
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    placeholder="Örn: Boğazda Gün Batımı Özel Yat Turu"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Kategori</label>
                    <select
                      value={newExp.category}
                      onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    >
                      {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Fiyat (TRY)</label>
                    <input
                      type="number"
                      required
                      value={newExp.price}
                      onChange={(e) => setNewExp({ ...newExp, price: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Sağlayıcı / Acente</label>
                    <input
                      type="text"
                      value={newExp.provider}
                      onChange={(e) => setNewExp({ ...newExp, provider: e.target.value })}
                      placeholder="Örn: Bosphorus VIP Cruise"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Konum / İlçe</label>
                    <input
                      type="text"
                      value={newExp.location}
                      onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                      placeholder="Örn: Kuruçeşme, Beşiktaş"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Görsel URL</label>
                  <input
                    type="text"
                    value={newExp.image}
                    onChange={(e) => setNewExp({ ...newExp, image: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Açıklama & Notlar</label>
                  <textarea
                    value={newExp.agentNote}
                    onChange={(e) => setNewExp({ ...newExp, agentNote: e.target.value })}
                    placeholder="Misafir için özel deneyim detayları..."
                    rows={2}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setIsNewExpModalOpen(false)} className="py-2.5 px-4 bg-zinc-100 rounded-xl font-bold">Vazgeç</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md">İlanı Yayınla</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: İLAN DÜZENLE */}
      {editingExp && (
        <div className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-4">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <h3 className="text-base font-bold font-serif">İlanı Düzenle: {editingExp.title}</h3>
                <button onClick={() => setEditingExp(null)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveExp} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">İlan Başlığı</label>
                  <input
                    type="text"
                    required
                    value={editingExp.title}
                    onChange={(e) => setEditingExp({ ...editingExp, title: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Fiyat (TRY)</label>
                    <input
                      type="number"
                      required
                      value={editingExp.price}
                      onChange={(e) => setEditingExp({ ...editingExp, price: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Süre</label>
                    <input
                      type="text"
                      value={editingExp.duration}
                      onChange={(e) => setEditingExp({ ...editingExp, duration: e.target.value })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Açıklama</label>
                  <textarea
                    value={editingExp.agentNote}
                    onChange={(e) => setEditingExp({ ...editingExp, agentNote: e.target.value })}
                    rows={3}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setEditingExp(null)} className="py-2.5 px-4 bg-zinc-100 rounded-xl font-bold">Vazgeç</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md">Değişiklikleri Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ YATIRIM PROJESİ EKLE */}
      {isNewPropModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-4">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <h3 className="text-base font-bold font-serif">Yeni Gayrimenkul Yatırım Projesi Ekle</h3>
                <button onClick={() => setIsNewPropModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateProp} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Proje Başlığı</label>
                  <input
                    type="text"
                    required
                    value={newProp.title}
                    onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                    placeholder="Örn: Bosphorus Panorama Luxury Residences"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">İlçe / Bölge</label>
                    <input
                      type="text"
                      required
                      value={newProp.district}
                      onChange={(e) => setNewProp({ ...newProp, district: e.target.value })}
                      placeholder="Beşiktaş / Boğaz Hattı"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Fiyat (USD)</label>
                    <input
                      type="number"
                      required
                      value={newProp.priceUSD}
                      onChange={(e) => setNewProp({ ...newProp, priceUSD: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Yatak Odası</label>
                    <input
                      type="number"
                      value={newProp.bedrooms}
                      onChange={(e) => setNewProp({ ...newProp, bedrooms: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Brüt Alan (m²)</label>
                    <input
                      type="number"
                      value={newProp.areaM2}
                      onChange={(e) => setNewProp({ ...newProp, areaM2: Number(e.target.value) })}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Geliştirici / Acente</label>
                  <input
                    type="text"
                    value={newProp.developer}
                    onChange={(e) => setNewProp({ ...newProp, developer: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Proje Açıklaması</label>
                  <textarea
                    value={newProp.description}
                    onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                    rows={2}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setIsNewPropModalOpen(false)} className="py-2.5 px-4 bg-zinc-100 rounded-xl font-bold">Vazgeç</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md">Projeyi Yayına Al</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ PARTNER OTEL EKLE */}
      {isNewHotelModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-4">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <h3 className="text-base font-bold font-serif">Yeni Partner Otel / Konak Ekle</h3>
                <button onClick={() => setIsNewHotelModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-sm font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateHotel} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Otel / Tesis Adı</label>
                  <input
                    type="text"
                    required
                    value={newHotelName}
                    onChange={(e) => setNewHotelName(e.target.value)}
                    placeholder="Örn: Bosphorus Palace Hotel"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Bölge / İlçe</label>
                    <input
                      type="text"
                      value={newHotelDistrict}
                      onChange={(e) => setNewHotelDistrict(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Oda Sayısı</label>
                    <input
                      type="number"
                      value={newHotelRoomCount}
                      onChange={(e) => setNewHotelRoomCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Wi-Fi Ağ Adı (SSID)</label>
                    <input
                      type="text"
                      value={newHotelWifiSsid}
                      onChange={(e) => setNewHotelWifiSsid(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Wi-Fi Şifresi</label>
                    <input
                      type="text"
                      value={newHotelWifiPass}
                      onChange={(e) => setNewHotelWifiPass(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setIsNewHotelModalOpen(false)} className="py-2.5 px-4 bg-zinc-100 rounded-xl font-bold">Vazgeç</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md">Oteli Sisteme Ekle</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PWA CANLI DUYURU & BİLDİRİM GÖNDER */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4 text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-700">
                  <BellRing className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-serif">PWA Canlı Bildirim Yayını</h3>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('xenios_broadcast_notification', {
                    detail: {
                      title: broadcastTitle,
                      body: broadcastBody,
                      url: '/'
                    }
                  }));
                }
                toast.success('PWA Canlı Bildirimi tüm bağlı misafir ve otel panellerine iletildi!');
                setIsBroadcastModalOpen(false);
              }} 
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold block mb-1">Bildirim Başlığı</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Bildirim Mesajı (İçerik)</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">⚡ Anlık İletim Protokolü:</span>
                <p>Bu bildirim Service Worker Web Push, sistem çanı ve in-app toast uyarıları üzerinden eşzamanlı yayınlanır.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsBroadcastModalOpen(false)} 
                  className="py-2.5 px-4 bg-zinc-100 rounded-xl font-bold"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-500/20"
                >
                  📢 Bildirimi Herkese Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
