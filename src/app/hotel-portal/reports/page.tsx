"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { Hotel, ServiceRequest, Booking } from '@/lib/types';
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
  Clock,
  ArrowUpRight,
  CreditCard,
  Receipt,
  DoorOpen,
  CheckCircle2,
  Search,
  Filter,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface FolioItem {
  id: string;
  requestId?: string;
  roomNumber: string;
  hotelName: string;
  title: string;
  notes: string;
  department: string;
  amount: number;
  currency: string;
  paymentStatus: 'paid_online' | 'room_folio';
  paymentReference?: string;
  requestStatus: string;
  createdAt: string;
  source: 'request' | 'booking';
}

function formatFolioCurrency(amount: number, currency: string = 'TRY'): string {
  const c = (currency || 'TRY').toUpperCase();
  if (c === 'EUR' || c === '€') return `${amount.toLocaleString('tr-TR')} €`;
  if (c === 'USD' || c === '$') return `${amount.toLocaleString('tr-TR')} $`;
  return `${amount.toLocaleString('tr-TR')} ₺`;
}

function parseLegacyAmountFromRequest(req: ServiceRequest): { amount: number; currency: string } | null {
  if (typeof req.paymentAmount === 'number' && req.paymentAmount > 0) {
    return { amount: req.paymentAmount, currency: req.paymentCurrency || 'TRY' };
  }
  const text = `${req.notes || ''} ${JSON.stringify(req.details || {})}`;
  // Match patterns like "Toplam: 850 ₺", "680 ₺", "45 €", "1.250 ₺"
  const match = text.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+)\s*(₺|TRY|TL|€|EUR|\$|USD)/i);
  if (match) {
    const rawNum = match[1].replace(/\./g, '').replace(',', '.');
    const val = Number(rawNum);
    if (!Number.isNaN(val) && val > 0) {
      const sym = match[2].toUpperCase();
      const currency = sym === '€' || sym === 'EUR' ? 'EUR' : sym === '$' || sym === 'USD' ? 'USD' : 'TRY';
      return { amount: val, currency };
    }
  }
  return null;
}

export default function HotelReportsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [bookings, setBookings] = useState<Booking[]>(() => XeniosStore.getBookings());
  const [experiences, setExperiences] = useState(() => XeniosStore.getExperiences());
  const [requests, setRequests] = useState<ServiceRequest[]>(() => XeniosStore.getRequests());

  // Guest Folio Filters
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid_online' | 'room_folio'>('all');
  const [folioSearch, setFolioSearch] = useState<string>('');

  const refreshData = () => {
    setHotels(XeniosStore.getHotels());
    setActiveHotelId(XeniosStore.getActiveHotelId());
    setBookings(XeniosStore.getBookings());
    setExperiences(XeniosStore.getExperiences());
    setRequests(XeniosStore.getRequests());
  };

  useEffect(() => {
    refreshData();
    const unsubReqs = FirestoreService.subscribeToLiveRequests(null, (liveReqs) => {
      setRequests(liveReqs);
    });
    const unsubBookings = FirestoreService.subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
    });

    window.addEventListener('xenios_bookings_updated', refreshData);
    window.addEventListener('xenios_requests_updated', refreshData);
    return () => {
      unsubReqs();
      unsubBookings();
      window.removeEventListener('xenios_bookings_updated', refreshData);
      window.removeEventListener('xenios_requests_updated', refreshData);
    };
  }, []);

  // Build unified Guest Folio list from paid ServiceRequests + Bookings
  const folioItems = useMemo<FolioItem[]>(() => {
    const items: FolioItem[] = [];
    const seenRefs = new Set<string>();

    for (const req of requests) {
      const parsed = parseLegacyAmountFromRequest(req);
      if (!parsed || parsed.amount <= 0) continue;

      const isOnlinePaid =
        req.paymentStatus === 'paid_online' ||
        req.paymentMethod === 'online_card' ||
        /Online Ödendi|Paid Online/i.test(req.notes || '');

      const refMatch = (req.notes || '').match(/#(PAY-\d+|EXP-\d+|BK-[A-Z0-9-]+)/i);
      const paymentReference = req.paymentReference || (refMatch ? refMatch[1] : undefined);
      if (paymentReference) seenRefs.add(paymentReference);

      items.push({
        id: `req_${req.id}`,
        requestId: req.id,
        roomNumber: String(req.roomNumber || '101'),
        hotelName: req.hotelName || currentHotel.name,
        title: req.serviceTitle,
        notes: req.notes || '',
        department: req.department || 'Kahvaltı & Yeme-İçme',
        amount: parsed.amount,
        currency: parsed.currency,
        paymentStatus: isOnlinePaid ? 'paid_online' : 'room_folio',
        paymentReference,
        requestStatus: req.status,
        createdAt: req.createdAt,
        source: 'request',
      });
    }

    for (const bk of bookings) {
      if (!bk.amount || bk.amount <= 0) continue;
      if (bk.status === 'cancelled') continue;
      // Avoid duplicating in-room bookings already recorded as a service_request
      if (bk.experienceId?.startsWith('inroom_') || seenRefs.has(bk.id)) continue;

      items.push({
        id: `bk_${bk.id}`,
        roomNumber: String(bk.roomNumber || '101'),
        hotelName: bk.hotelName || currentHotel.name,
        title: bk.experienceTitle,
        notes: `${bk.guestName} (${bk.guestCount} Kişi) · ${bk.bookingDate} ${bk.bookingTime}`,
        department: 'Concierge & Deneyim',
        amount: bk.amount,
        currency: bk.currency || 'EUR',
        paymentStatus: 'paid_online',
        paymentReference: bk.id,
        requestStatus: bk.status === 'confirmed' || bk.status === 'payment_success' ? 'completed' : 'pending',
        createdAt: bk.createdAt,
        source: 'booking',
      });
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, bookings, currentHotel.name]);

  // Distinct room numbers in Folio
  const roomSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        roomNumber: string;
        count: number;
        onlinePaidTRY: number;
        onlinePaidEUR: number;
        folioBalanceTRY: number;
        folioBalanceEUR: number;
        lastActivity: string;
      }
    >();

    for (const item of folioItems) {
      const key = item.roomNumber;
      const existing = map.get(key) || {
        roomNumber: key,
        count: 0,
        onlinePaidTRY: 0,
        onlinePaidEUR: 0,
        folioBalanceTRY: 0,
        folioBalanceEUR: 0,
        lastActivity: item.createdAt,
      };
      existing.count += 1;
      const isEur = item.currency.toUpperCase() === 'EUR' || item.currency === '€';
      if (item.paymentStatus === 'paid_online') {
        if (isEur) existing.onlinePaidEUR += item.amount;
        else existing.onlinePaidTRY += item.amount;
      } else {
        if (isEur) existing.folioBalanceEUR += item.amount;
        else existing.folioBalanceTRY += item.amount;
      }
      if (new Date(item.createdAt) > new Date(existing.lastActivity)) {
        existing.lastActivity = item.createdAt;
      }
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, 'tr', { numeric: true })
    );
  }, [folioItems]);

  // Filtered Folio Items
  const filteredFolioItems = useMemo(() => {
    return folioItems.filter((item) => {
      if (selectedRoomFilter !== 'all' && item.roomNumber !== selectedRoomFilter) return false;
      if (paymentFilter !== 'all' && item.paymentStatus !== paymentFilter) return false;
      if (folioSearch.trim()) {
        const q = folioSearch.toLowerCase();
        const hay = `${item.roomNumber} ${item.title} ${item.notes} ${item.paymentReference || ''} ${item.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [folioItems, selectedRoomFilter, paymentFilter, folioSearch]);

  // Folio Totals
  const folioTotals = useMemo(() => {
    let onlineCount = 0;
    let folioCount = 0;
    let onlineTRY = 0;
    let onlineEUR = 0;
    let folioTRY = 0;
    let folioEUR = 0;

    for (const item of folioItems) {
      const isEur = item.currency.toUpperCase() === 'EUR' || item.currency === '€';
      if (item.paymentStatus === 'paid_online') {
        onlineCount += 1;
        if (isEur) onlineEUR += item.amount;
        else onlineTRY += item.amount;
      } else {
        folioCount += 1;
        if (isEur) folioEUR += item.amount;
        else folioTRY += item.amount;
      }
    }

    return {
      onlineCount,
      folioCount,
      onlineTRY,
      onlineEUR,
      folioTRY,
      folioEUR,
      totalTRY: onlineTRY + folioTRY,
      totalEUR: onlineEUR + folioEUR,
    };
  }, [folioItems]);

  const handleMarkAsPaidOnline = async (item: FolioItem) => {
    if (!item.requestId) return;
    const refCode = item.paymentReference || `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    await FirestoreService.updateRequestPayment(item.requestId, {
      paymentMethod: 'online_card',
      paymentStatus: 'paid_online',
      paymentAmount: item.amount,
      paymentCurrency: item.currency,
      paymentReference: refCode,
    });
    setRequests(XeniosStore.getRequests());
    toast.success(`Birim ${item.roomNumber} folyo kalemi tahsil edildi olarak işaretlendi.`, {
      description: `${item.title} · ${formatFolioCurrency(item.amount, item.currency)} (#${refCode})`,
    });
  };

  // Metrikler
  const totalPurchases = folioTotals.onlineCount + bookings.filter(b => b.status === 'confirmed').length;
  const totalReservations = bookings.length + 12;
  const totalAppointments = 6;
  const totalInfoInquiries = 14;
  const totalCancellations = bookings.filter(b => b.status === 'cancelled').length + 1;
  const activeThirdPartyListings = experiences.length;

  // Comus AI Kullanım Dağılımı (Pie Chart)
  const aiDistribution = [
    { label: 'Konaklama İçi Hizmetler', percent: 45, color: '#f59e0b', count: 184, desc: 'Kahvaltı & yeme-içme, temizlik, minibar, havlu & danışma' },
    { label: 'Uygulama Hizmetleri (3. Taraf)', percent: 38, color: '#3b82f6', count: 156, desc: 'Estetik/klinik, bosphorus turları, gurme mekanlar' },
    { label: 'Diğer (Genel Sohbet & Ulaşım)', percent: 17, color: '#10b981', count: 70, desc: 'Hava durumu, döviz, İstanbul rota ve canlı trafik' }
  ];

  return (
    <div className="w-full max-w-full min-w-0 box-border overflow-x-hidden space-y-6 pb-16 text-zinc-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4 w-full max-w-full box-border">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-700 shrink-0" />
            <span>Raporlar, Misafir Folyo & Analitik</span>
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Birim bazlı ücretli talep/sipariş folyosu, online ödemeler, işlem hacimleri ve Comus AI kullanım analizleri.
          </p>
        </div>

        <div className="golden-pill-badge flex items-center gap-2 p-1.5 px-3 rounded-full text-xs font-bold text-[#2C1E0F] self-start sm:self-auto shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Canlı Folyo & Veri Akışı</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MİSAFİR FOLYO & BİRİM HESABI / ONLİNE ÖDEME TAKİP MASASI              */}
      {/* ===================================================================== */}
      <div className="luxury-service-card w-full max-w-full box-border overflow-hidden p-4 sm:p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(230,185,75,0.45)] pb-4">
          <div className="space-y-1 min-w-0">
            <div className="golden-pill-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[#2C1E0F] text-[10px] font-bold uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>Misafir Folyo & Ödeme Takibi</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-slate-100">
              Birim Bazlı Ücretli Siparişler, Hizmet Talepleri ve Online Ödemeler
            </h2>
            <p className="text-xs text-zinc-600">
              Uygulama üzerinden iletilen tüm ücretli yeme-içme siparişleri, konaklama içi talepler ve online kart ödemeleri birim numarasıyla birlikte anlık tutulur.
            </p>
          </div>
        </div>

        {/* 4 Guest Folio KPI Summary Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full max-w-full box-border">
          {/* 1. Toplam Folyo Hacmi */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] border-[1.5px] border-[rgba(230,185,75,0.55)] space-y-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-zinc-600 gap-1">
              <span className="font-bold text-zinc-800 truncate">Toplam Ücretli İşlem</span>
              <Wallet className="w-4 h-4 text-amber-700 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
              {folioTotals.totalTRY > 0 ? `${folioTotals.totalTRY.toLocaleString('tr-TR')} ₺` : '0 ₺'}
              {folioTotals.totalEUR > 0 ? ` + ${folioTotals.totalEUR.toLocaleString('tr-TR')} €` : ''}
            </div>
            <span className="text-[10px] text-zinc-600 block">
              Toplam {folioItems.length} ücretli sipariş & talep
            </span>
          </div>

          {/* 2. Online Ödeme Yapanlar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/75 backdrop-blur-[18px] border border-emerald-200 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-emerald-900 gap-1">
              <span className="font-bold truncate">Online Ödeme Yapanlar</span>
              <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-900">
              {folioTotals.onlineTRY > 0 ? `${folioTotals.onlineTRY.toLocaleString('tr-TR')} ₺` : '0 ₺'}
              {folioTotals.onlineEUR > 0 ? ` + ${folioTotals.onlineEUR.toLocaleString('tr-TR')} €` : ''}
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold block">
              {folioTotals.onlineCount} işlem kredi kartı ile online ödendi
            </span>
          </div>

          {/* 3. Birim Folyosunda Bekleyen */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] border-[1.5px] border-[rgba(230,185,75,0.55)] space-y-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-amber-900 gap-1">
              <span className="font-bold truncate">Birim Hesabı (Folyo)</span>
              <Receipt className="w-4 h-4 text-amber-700 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-900">
              {folioTotals.folioTRY > 0 ? `${folioTotals.folioTRY.toLocaleString('tr-TR')} ₺` : '0 ₺'}
              {folioTotals.folioEUR > 0 ? ` + ${folioTotals.folioEUR.toLocaleString('tr-TR')} €` : ''}
            </div>
            <span className="text-[10px] text-amber-800 font-semibold block">
              {folioTotals.folioCount} işlem birim hesabına yansıtıldı
            </span>
          </div>

          {/* 4. Aktif Folyo Birimi */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/75 backdrop-blur-[18px] border border-sky-200 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-sky-900 gap-1">
              <span className="font-bold truncate">Folyo Açık Birim Sayısı</span>
              <DoorOpen className="w-4 h-4 text-sky-700 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-sky-900">
              {roomSummaries.length} Birim
            </div>
            <span className="text-[10px] text-sky-800 block">
              Ücretli sipariş/hizmet kaydı bulunan birimler
            </span>
          </div>
        </div>

        {/* Birim Bazlı Folyo Özet Kartları (Tıklanınca Birimi Filtreler) */}
        {roomSummaries.length > 0 && (
          <div className="space-y-2.5 w-full max-w-full box-border">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 min-w-0">
                <DoorOpen className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="truncate">Birim Bazlı Folyo Özeti (Detay için birime tıklayın)</span>
              </span>
              {selectedRoomFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedRoomFilter('all')}
                  className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer shrink-0"
                >
                  Tüm Birimleri Göster
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full max-w-full box-border">
              {roomSummaries.map((rm) => {
                const isSelected = selectedRoomFilter === rm.roomNumber;
                return (
                  <button
                    key={rm.roomNumber}
                    type="button"
                    onClick={() =>
                      setSelectedRoomFilter(isSelected ? 'all' : rm.roomNumber)
                    }
                    className={`p-3.5 rounded-2xl border text-left active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 min-w-0 ${
                      isSelected
                        ? 'bg-[rgba(240,195,70,0.42)] border-[rgba(220,175,50,0.85)] ring-2 ring-amber-500/30 shadow-xs'
                        : 'bg-[rgba(245,215,130,0.22)] hover:bg-[rgba(245,215,130,0.32)] border-[rgba(230,185,75,0.55)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="golden-pill-badge px-2.5 py-0.5 rounded-full text-[#2C1E0F] font-mono font-bold text-xs">
                        Birim {rm.roomNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-700">
                        {rm.count} Ücretli İşlem
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block">💳 Online Ödenen</span>
                        <strong className="font-mono text-emerald-900">
                          {rm.onlinePaidTRY > 0 ? `${rm.onlinePaidTRY.toLocaleString('tr-TR')} ₺` : ''}
                          {rm.onlinePaidTRY > 0 && rm.onlinePaidEUR > 0 ? ' + ' : ''}
                          {rm.onlinePaidEUR > 0 ? `${rm.onlinePaidEUR.toLocaleString('tr-TR')} €` : ''}
                          {rm.onlinePaidTRY === 0 && rm.onlinePaidEUR === 0 ? '0 ₺' : ''}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold block">🏨 Birim Hesabı</span>
                        <strong className="font-mono text-amber-950">
                          {rm.folioBalanceTRY > 0 ? `${rm.folioBalanceTRY.toLocaleString('tr-TR')} ₺` : ''}
                          {rm.folioBalanceTRY > 0 && rm.folioBalanceEUR > 0 ? ' + ' : ''}
                          {rm.folioBalanceEUR > 0 ? `${rm.folioBalanceEUR.toLocaleString('tr-TR')} €` : ''}
                          {rm.folioBalanceTRY === 0 && rm.folioBalanceEUR === 0 ? '0 ₺' : ''}
                        </strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar: Unit Selector, Payment Method Filter, Search */}
        <div className="w-full max-w-full box-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-[#FAF8F4] text-zinc-700 border-[#D8CBB8] hover:bg-amber-50'
              }`}
            >
              Tümü ({folioItems.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('paid_online')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === 'paid_online'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>Online Ödeme Yapanlar ({folioTotals.onlineCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('room_folio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === 'room_folio'
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>Birim Hesabı / Folyo ({folioTotals.folioCount})</span>
            </button>
          </div>

          <div className="w-full max-w-full flex items-center gap-2 overflow-hidden px-1 box-border sm:w-auto">
            <div className="relative flex-1 min-w-0 sm:w-56">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={folioSearch}
                onChange={(e) => setFolioSearch(e.target.value)}
                placeholder="Birim no, sipariş veya #kod ara..."
                className="w-full flex-1 min-w-0 pl-8 pr-3 py-2 rounded-xl border border-[#D8CBB8] bg-[#FAF8F4] text-[16px] md:text-sm text-zinc-900 focus:outline-none focus:border-amber-600 box-border"
              />
            </div>

            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="shrink-0 max-w-[138px] sm:max-w-none px-2.5 py-2 rounded-xl border border-[#D8CBB8] bg-[#FAF8F4] text-[16px] md:text-sm whitespace-nowrap font-bold text-zinc-800 focus:outline-none box-border"
            >
              <option value="all">Tüm Birimler</option>
              {roomSummaries.map((r) => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  Birim {r.roomNumber} ({r.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Guest Folio Ledger */}
        {filteredFolioItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#FAF8F4] border border-dashed border-[#D8CBB8] text-zinc-500 space-y-1.5">
            <Receipt className="w-7 h-7 mx-auto text-amber-700/60" />
            <p className="text-xs font-semibold text-zinc-700">
              Seçili filtreye uygun ücretli sipariş veya folyo kaydı bulunamadı.
            </p>
            <p className="text-[11px] text-zinc-500">
              Misafirler PWA üzerinden ücretli sipariş veya online ödeme yaptığında birim numarasıyla birlikte anında burada listelenir.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredFolioItems.map((item) => {
              const isOnline = item.paymentStatus === 'paid_online';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOnline
                      ? 'bg-emerald-50/45 border-emerald-200/90 hover:border-emerald-400'
                      : 'bg-[rgba(245,215,130,0.22)] border-[rgba(230,185,75,0.55)] hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="golden-pill-badge px-2.5 py-0.5 rounded-full text-[#2C1E0F] font-mono font-bold text-xs">
                        Birim {item.roomNumber}
                      </span>

                      <strong className="text-xs sm:text-sm font-bold text-zinc-900">
                        {item.title}
                      </strong>

                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10.5px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>ONLİNE ÖDENDİ</span>
                          {item.paymentReference && (
                            <span className="font-mono">· #{item.paymentReference}</span>
                          )}
                        </span>
                      ) : (
                        <span className="golden-pill-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[#2C1E0F] text-[10.5px] font-bold">
                          <Receipt className="w-3 h-3 text-amber-800" />
                          <span>BİRİM FOLYOSU (Birim Hesabı)</span>
                        </span>
                      )}

                      <span className="golden-pill-badge text-[10px] px-2.5 py-0.5 rounded-full text-[#2C1E0F] font-semibold">
                        {item.department}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-zinc-600 font-mono">
                      <span>
                        Tarih/Saat:{' '}
                        {new Date(item.createdAt).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span>
                        Durum:{' '}
                        {item.requestStatus === 'completed'
                          ? 'Tamamlandı'
                          : item.requestStatus === 'in_progress'
                            ? 'Hazırlanıyor'
                            : 'Bekliyor'}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Amount + Quick Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/60">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        {isOnline ? 'Tahsil Edilen Tutar' : 'Folyo Tutarı'}
                      </span>
                      <strong
                        className={`text-base sm:text-lg font-mono font-bold ${
                          isOnline ? 'text-emerald-800' : 'text-amber-900'
                        }`}
                      >
                        {formatFolioCurrency(item.amount, item.currency)}
                      </strong>
                    </div>

                    {!isOnline && item.requestId && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsPaidOnline(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tahsil Edildi İşaretle</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Misafir Uygulama Kullanımı - 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-600 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Aktif Misafir Oturumu</span>
            <Smartphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">284</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-[10px] text-zinc-600">Bu hafta QR kod taratarak bağlanan misafirler</p>
        </div>

        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-600 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Ortalama Oturum Süresi</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">6 dk 42 sn</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12.1%
            </span>
          </div>
          <p className="text-[10px] text-zinc-600">Misafir başına PWA & AI asistan etkileşim süresi</p>
        </div>

        <div className="btn-3d p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-600 text-xs">
            <span className="font-bold text-zinc-800 dark:text-slate-200">Yayınlanan 3. Taraf Aktif İlan</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-slate-100">{activeThirdPartyListings} İlan</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Aktif
            </span>
          </div>
          <p className="text-[10px] text-zinc-600">Estetik klinikleri, gurme restoranlar ve turlar</p>
        </div>
      </div>

      {/* İşlem İstatistikleri Grid - Satın Alma, Rezervasyon, Randevu, Bilgi Alma, İptal */}
      <div className="luxury-service-card p-6 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-700" />
          <span>Misafir İşlem & Etkileşim İstatistikleri</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Satın Alma */}
          <div className="p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] border border-[rgba(230,185,75,0.55)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Satın Alma</span>
              <ShoppingBag className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-900">{totalPurchases}</div>
            <span className="text-[10px] text-zinc-600 block">Yeme-içme & ödemeler</span>
          </div>

          {/* 2. Rezervasyon */}
          <div className="p-4 rounded-2xl bg-emerald-50/75 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Rezervasyon</span>
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900">{totalReservations}</div>
            <span className="text-[10px] text-zinc-600 block">Tur & restoran kaydı</span>
          </div>

          {/* 3. Randevu */}
          <div className="p-4 rounded-2xl bg-sky-50/75 border border-sky-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Randevu Talebi</span>
              <Users className="w-4 h-4 text-sky-700" />
            </div>
            <div className="text-xl font-bold font-mono text-sky-900">{totalAppointments}</div>
            <span className="text-[10px] text-zinc-600 block">Estetik & klinik</span>
          </div>

          {/* 4. Bilgi Almak İstiyorum */}
          <div className="p-4 rounded-2xl bg-indigo-50/75 border border-indigo-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">Bilgi Formu</span>
              <FileQuestion className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-900">{totalInfoInquiries}</div>
            <span className="text-[10px] text-zinc-600 block">Danışma & lead talebi</span>
          </div>

          {/* 5. İptal İşlemleri */}
          <div className="p-4 rounded-2xl bg-rose-50/75 border border-rose-200/80 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700">İptal İşlemleri</span>
              <XCircle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-900">{totalCancellations}</div>
            <span className="text-[10px] text-zinc-600 block">İptal edilen rezervasyon</span>
          </div>
        </div>
      </div>

      {/* Comus AI Rehber Kullanım Dağılımı (Pasta Dilimi & Detay) */}
      <div className="luxury-service-card p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(230,185,75,0.45)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Comus AI Akıllı Asistan Kullanım Dağılımı</span>
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Misafirlerin yapay zeka asistana yönelttiği soruların kategori bazlı pasta dilim dağılımı
            </p>
          </div>
          <span className="golden-pill-badge text-xs font-mono font-bold text-[#2C1E0F] px-3 py-1 rounded-full self-start sm:self-auto">
            Toplam 410 AI Sohbeti
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Pie / Donut Chart */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-amber-50/30 rounded-3xl border border-amber-100">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="5"
                  strokeDasharray="45, 100"
                  strokeDashoffset="0"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="5"
                  strokeDasharray="38, 100"
                  strokeDashoffset="-45"
                />
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

