"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room, OTAChannelItem, RoomStateInfo } from '@/lib/types';
import {
  CalendarSync,
  RotateCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Building2,
  DoorOpen,
  Calendar,
  TrendingUp,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  Sparkles,
  Euro,
  Layers,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type ChannelSource = 'Direkt' | 'Airbnb' | 'Booking.com' | 'Expedia' | 'VRBO' | 'Bloke';

interface DayCellModalState {
  roomNumber: string;
  dateStr: string;
  status: 'available' | 'booked' | 'blocked';
  channel: ChannelSource;
  priceEur: number;
  guestName: string;
}

interface PricingDraft {
  basePriceEur: number;
  minStayNights: number;
  weekendMarkupPct: number;
  highOccupancyMarkupPct: number;
  lastMinuteDiscountPct: number;
  airbnbMarkup: number;
  bookingMarkup: number;
  expediaMarkup: number;
  vrboMarkup: number;
}

const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_NAMES_TR = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

function buildDateWindow(startOffsetDays: number, count: number = 14) {
  const out: Array<{
    dateStr: string;
    dayNum: number;
    dayName: string;
    monthName: string;
    isWeekend: boolean;
    isToday: boolean;
  }> = [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + startOffsetDays + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    out.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: DAY_NAMES_TR[dow],
      monthName: MONTH_NAMES_TR[d.getMonth()],
      isWeekend: dow === 5 || dow === 6, // Cuma & Cumartesi geceleri
      isToday: dateStr === todayStr,
    });
  }
  return out;
}

export default function HotelChannelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() =>
    XeniosStore.getActiveHotelId()
  );
  const currentHotel = hotels.find((h) => h.id === activeHotelId) || hotels[0];
  const rooms = currentHotel?.rooms || [];

  const [roomStates, setRoomStates] = useState<Record<string, RoomStateInfo>>({});
  const [channels, setChannels] = useState<OTAChannelItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'calendar' | 'pricing' | 'ical'>('calendar');

  // Calendar offset in days from today
  const [dayOffset, setDayOffset] = useState(0);
  const [cellModal, setCellModal] = useState<DayCellModalState | null>(null);

  // Per-unit pricing drafts
  const [pricingDrafts, setPricingDrafts] = useState<Record<string, PricingDraft>>({});
  const [bulkBasePrice, setBulkBasePrice] = useState<string>('');

  // New Channel Form State
  const [newChanName, setNewChanName] = useState('Airbnb');
  const [newChanRoom, setNewChanRoom] = useState('all');
  const [newChanUrl, setNewChanUrl] = useState('');

  const refreshData = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    const id = activeHotelId || XeniosStore.getActiveHotelId();
    setChannels(XeniosStore.getOTAChannels(id));
    setRoomStates(XeniosStore.getRoomStates(id));
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xenios_ota_channels_updated', refreshData);
    window.addEventListener('xenios_hotels_updated', refreshData);
    window.addEventListener('xenios_room_states_updated', refreshData);
    return () => {
      window.removeEventListener('xenios_ota_channels_updated', refreshData);
      window.removeEventListener('xenios_hotels_updated', refreshData);
      window.removeEventListener('xenios_room_states_updated', refreshData);
    };
  }, [activeHotelId]);

  // Populate pricing drafts from rooms
  useEffect(() => {
    if (!currentHotel?.rooms) return;
    const next: Record<string, PricingDraft> = {};
    currentHotel.rooms.forEach((r, idx) => {
      const defaultBase =
        r.basePriceEur ||
        (r.type?.toLowerCase().includes('suite') || r.type?.toLowerCase().includes('boğaz')
          ? 185
          : 135 + (idx % 3) * 15);
      next[r.number] = {
        basePriceEur: defaultBase,
        minStayNights: r.minStayNights ?? 2,
        weekendMarkupPct: r.weekendMarkupPct ?? 15,
        highOccupancyMarkupPct: r.highOccupancyMarkupPct ?? 20,
        lastMinuteDiscountPct: r.lastMinuteDiscountPct ?? 10,
        airbnbMarkup: r.channelMarkups?.airbnb ?? 15,
        bookingMarkup: r.channelMarkups?.booking ?? 18,
        expediaMarkup: r.channelMarkups?.expedia ?? 18,
        vrboMarkup: r.channelMarkups?.vrbo ?? 15,
      };
    });
    setPricingDrafts(next);
  }, [currentHotel?.id, rooms.length]);

  const dateColumns = useMemo(() => buildDateWindow(dayOffset, 14), [dayOffset]);

  // Calculate live portfolio occupancy percentage
  const occupancyStats = useMemo(() => {
    if (rooms.length === 0) return { occupiedCount: 0, total: 0, pct: 0 };
    let busy = 0;
    for (const r of rooms) {
      const st = roomStates[r.number]?.status || r.status || 'clean';
      if (st === 'occupied' || st === 'reserved') busy++;
    }
    return {
      occupiedCount: busy,
      total: rooms.length,
      pct: Math.round((busy / rooms.length) * 100),
    };
  }, [rooms, roomStates]);

  const isHighOccupancyActive = occupancyStats.pct >= 70;

  // Resolves effective cell status & price for a room and date
  const resolveCellData = (room: Room, col: (typeof dateColumns)[number]) => {
    const draft = pricingDrafts[room.number] || {
      basePriceEur: room.basePriceEur || 140,
      minStayNights: 2,
      weekendMarkupPct: 15,
      highOccupancyMarkupPct: 20,
      lastMinuteDiscountPct: 10,
      airbnbMarkup: 15,
      bookingMarkup: 18,
      expediaMarkup: 18,
      vrboMarkup: 15,
    };

    const override = room.calendarOverrides?.[col.dateStr];
    let calculatedPrice = draft.basePriceEur;
    if (col.isWeekend) {
      calculatedPrice = Math.round(calculatedPrice * (1 + draft.weekendMarkupPct / 100));
    }
    if (isHighOccupancyActive) {
      calculatedPrice = Math.round(calculatedPrice * (1 + draft.highOccupancyMarkupPct / 100));
    }

    if (override) {
      return {
        status: override.status || 'available',
        channel: (override.channel as ChannelSource) || 'Direkt',
        priceEur: override.priceEur ?? calculatedPrice,
        guestName: override.guestName || '',
      };
    }

    // If today, reflect live roomStates from /hotel-portal/rooms
    if (col.isToday) {
      const liveState = roomStates[room.number];
      if (liveState?.status === 'occupied' || liveState?.status === 'reserved') {
        return {
          status: 'booked' as const,
          channel: 'Direkt' as ChannelSource,
          priceEur: calculatedPrice,
          guestName: liveState.guest || 'Aktif Misafir',
        };
      }
      if (liveState?.status === 'maintenance') {
        return {
          status: 'blocked' as const,
          channel: 'Bloke' as ChannelSource,
          priceEur: calculatedPrice,
          guestName: 'Bakım / Bloke',
        };
      }
    }

    return {
      status: 'available' as const,
      channel: 'Direkt' as ChannelSource,
      priceEur: calculatedPrice,
      guestName: '',
    };
  };

  const handleOpenCellModal = (room: Room, col: (typeof dateColumns)[number]) => {
    const cell = resolveCellData(room, col);
    setCellModal({
      roomNumber: room.number,
      dateStr: col.dateStr,
      status: cell.status,
      channel: cell.channel,
      priceEur: cell.priceEur,
      guestName: cell.guestName,
    });
  };

  const handleSaveCellModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellModal || !currentHotel) return;

    const targetRoom = rooms.find((r) => r.number === cellModal.roomNumber);
    if (!targetRoom) return;

    const nextOverrides = {
      ...(targetRoom.calendarOverrides || {}),
      [cellModal.dateStr]: {
        status: cellModal.status,
        channel: cellModal.status === 'blocked' ? ('Bloke' as const) : cellModal.channel,
        priceEur: Number(cellModal.priceEur) || 140,
        guestName: cellModal.status === 'available' ? '' : cellModal.guestName.trim(),
      },
    };

    XeniosStore.updateRoomInHotel(currentHotel.id, cellModal.roomNumber, {
      calendarOverrides: nextOverrides,
      updatedAt: new Date().toISOString(),
    });

    // If edited date is today, also synchronize with live RoomStates (/hotel-portal/rooms)
    const todayStr = new Date().toISOString().slice(0, 10);
    if (cellModal.dateStr === todayStr) {
      const mappedStatus =
        cellModal.status === 'booked'
          ? 'reserved'
          : cellModal.status === 'blocked'
            ? 'maintenance'
            : 'clean';
      XeniosStore.updateRoomState(currentHotel.id, cellModal.roomNumber, {
        status: mappedStatus,
        guest:
          cellModal.status === 'booked'
            ? cellModal.guestName.trim() || `${cellModal.channel} Misafiri`
            : '',
        checkout:
          cellModal.status === 'booked'
            ? `Kanal: ${cellModal.channel} · €${cellModal.priceEur}`
            : '',
      });
    }

    toast.success(
      `Birim ${cellModal.roomNumber} (${cellModal.dateStr}) takvim ve fiyat durumu güncellendi.`
    );
    setCellModal(null);
    refreshData();
  };

  const updatePricingField = (
    roomNumber: string,
    field: keyof PricingDraft,
    val: number
  ) => {
    setPricingDrafts((prev) => ({
      ...prev,
      [roomNumber]: {
        ...(prev[roomNumber] || {
          basePriceEur: 140,
          minStayNights: 2,
          weekendMarkupPct: 15,
          highOccupancyMarkupPct: 20,
          lastMinuteDiscountPct: 10,
          airbnbMarkup: 15,
          bookingMarkup: 18,
          expediaMarkup: 18,
          vrboMarkup: 15,
        }),
        [field]: val,
      },
    }));
  };

  const handleSaveUnitPricing = (roomNumber: string) => {
    if (!currentHotel) return;
    const draft = pricingDrafts[roomNumber];
    if (!draft) return;

    XeniosStore.updateRoomInHotel(currentHotel.id, roomNumber, {
      basePriceEur: draft.basePriceEur,
      minStayNights: draft.minStayNights,
      weekendMarkupPct: draft.weekendMarkupPct,
      highOccupancyMarkupPct: draft.highOccupancyMarkupPct,
      lastMinuteDiscountPct: draft.lastMinuteDiscountPct,
      channelMarkups: {
        airbnb: draft.airbnbMarkup,
        booking: draft.bookingMarkup,
        expedia: draft.expediaMarkup,
        vrbo: draft.vrboMarkup,
      },
      updatedAt: new Date().toISOString(),
    });

    toast.success(
      `Birim ${roomNumber} dinamik fiyat optimizasyonu ve kanal komisyon oranları kaydedildi!`
    );
    refreshData();
  };

  const handleApplyBulkBasePrice = () => {
    const num = Number(bulkBasePrice);
    if (!num || num <= 0 || !currentHotel) {
      toast.error('Lütfen geçerli bir baz fiyat (€) girin.');
      return;
    }
    for (const r of rooms) {
      const draft = pricingDrafts[r.number];
      XeniosStore.updateRoomInHotel(currentHotel.id, r.number, {
        basePriceEur: num,
        minStayNights: draft?.minStayNights ?? 2,
        weekendMarkupPct: draft?.weekendMarkupPct ?? 15,
        highOccupancyMarkupPct: draft?.highOccupancyMarkupPct ?? 20,
        lastMinuteDiscountPct: draft?.lastMinuteDiscountPct ?? 10,
        channelMarkups: {
          airbnb: draft?.airbnbMarkup ?? 15,
          booking: draft?.bookingMarkup ?? 18,
          expedia: draft?.expediaMarkup ?? 18,
          vrbo: draft?.vrboMarkup ?? 15,
        },
        updatedAt: new Date().toISOString(),
      });
    }
    toast.success(`Tüm ${rooms.length} birimin baz gecelik fiyatı €${num} olarak güncellendi!`);
    setBulkBasePrice('');
    refreshData();
  };

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://purelyistanbul.com';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('iCal dışa aktarma adresi kopyalandı.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const syncExternalFeedIntoCalendar = async (
    feedUrl: string,
    targetRoomNum: string,
    channelName: string
  ) => {
    try {
      const res = await fetch(
        `/api/channels/ical/room-${encodeURIComponent(currentHotel.id)}-sync/export.ics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedUrl }),
        }
      );
      if (!res.ok) return 0;
      const data = await res.json();
      const blockedDates: string[] = Array.isArray(data?.blockedDates) ? data.blockedDates : [];
      if (blockedDates.length === 0) return 0;

      const targetRooms =
        targetRoomNum === 'all'
          ? rooms
          : rooms.filter((r) => r.number === targetRoomNum);

      for (const r of targetRooms) {
        const nextOv = { ...(r.calendarOverrides || {}) };
        for (const dStr of blockedDates) {
          nextOv[dStr] = {
            status: 'booked',
            channel: (['Airbnb', 'Booking.com', 'Expedia', 'VRBO'].includes(channelName)
              ? channelName
              : 'Airbnb') as ChannelSource,
            priceEur: r.basePriceEur || 140,
            guestName: `${channelName} iCal Sync`,
          };
        }
        XeniosStore.updateRoomInHotel(currentHotel.id, r.number, {
          calendarOverrides: nextOv,
          updatedAt: new Date().toISOString(),
        });
      }
      return blockedDates.length;
    } catch {
      return 0;
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    let totalImported = 0;
    for (const ch of channels) {
      if (ch.feedUrl && ch.active) {
        const count = await syncExternalFeedIntoCalendar(
          ch.feedUrl,
          ch.roomNumber || 'all',
          ch.name
        );
        totalImported += count;
      }
    }
    setTimeout(() => {
      setIsSyncing(false);
      refreshData();
      toast.success(
        totalImported > 0
          ? `Tüm OTA kanalları eşitlendi (${totalImported} dolu gün takvime işlendi).`
          : `Tüm OTA kanalları ve ${rooms.length} birim takvimi 2 yönlü eşitlendi.`
      );
    }, 800);
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanUrl.trim()) {
      toast.error('Lütfen geçerli bir iCal feed URL adresi giriniz.');
      return;
    }

    XeniosStore.addOTAChannel(currentHotel.id, {
      hotelId: currentHotel.id,
      name: newChanName,
      roomNumber: newChanRoom,
      feedUrl: newChanUrl.trim(),
      status: 'Senkronize',
      lastSync: 'Şimdi',
      active: true,
    });

    const imported = await syncExternalFeedIntoCalendar(
      newChanUrl.trim(),
      newChanRoom,
      newChanName
    );

    toast.success(
      imported > 0
        ? `${newChanName} kanalı bağlandı ve ${imported} dolu gün takvime aktarıldı.`
        : `${newChanName} kanalı takvime bağlandı.`
    );
    setNewChanUrl('');
    refreshData();
  };

  const handleDeleteChannel = (id: string, name: string) => {
    if (confirm(`${name} kanal bağlantısını silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteOTAChannel(currentHotel.id, id);
      toast.success(`${name} bağlantısı kaldırıldı.`);
      refreshData();
    }
  };

  if (!currentHotel) return null;

  return (
    <div className="space-y-6 pb-16 text-zinc-900 dark:text-slate-100">
      {/* Header & Property Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {currentHotel.name}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Self-Servis PMS & Kanal Yöneticisi (PMC / Butik Otel)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1">
            Self-Servis Takvim, Fiyat Optimizasyonu & Canlı OTA Senkronizasyonu
          </h1>
          <p className="text-xs text-zinc-600 dark:text-slate-400 mt-0.5">
            Harici bir PMS yazılımına ihtiyaç duymadan tüm daire/oda takvimlerinizi yönetin, Airbnb/Booking/Expedia komisyon marjlarına göre fiyat optimize edin ve 2 yönlü iCal eşitleyin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Selector for PMC / Multi-Hotel Managers */}
          <div className="relative">
            <select
              value={activeHotelId}
              onChange={(e) => {
                setActiveHotelId(e.target.value);
                XeniosStore.setActiveHotelId(e.target.value);
              }}
              className="p-2.5 bg-amber-50/60 border border-amber-300 rounded-2xl text-xs font-bold text-zinc-900 dark:text-slate-100 pr-8 cursor-pointer"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.rooms?.length || 0} Birim)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Eşitleniyor...' : 'Tüm Kanalları & Takvimi Eşitle'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="btn-3d p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">
            Toplam Envanter
          </span>
          <div className="text-xl font-bold font-serif text-zinc-900">
            {rooms.length} Birim
          </div>
          <span className="text-[11px] text-zinc-600 block">
            {occupancyStats.occupiedCount} Dolu / Rezerve • %{occupancyStats.pct} Doluluk
          </span>
        </div>

        <div className="btn-3d p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">
            Bağlı OTA Kanalları
          </span>
          <div className="text-xl font-bold font-serif text-zinc-900">
            {channels.length} Aktif Kanal
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold block">
            Airbnb • Booking • Expedia • VRBO
          </span>
        </div>

        <div className="btn-3d p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">
            Dinamik Fiyat Motoru
          </span>
          <div className="text-xl font-bold font-serif text-zinc-900">
            {isHighOccupancyActive ? 'Yüksek Talep (+%20)' : 'Standart & Hafta Sonu'}
          </div>
          <span className="text-[11px] text-zinc-600 block">
            Otomatik Kanal Komisyon Koruması
          </span>
        </div>

        <div className="btn-3d p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">
            Çifte Rezervasyon Kalkanı
          </span>
          <div className="text-xl font-bold font-serif text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Aktif (7/24)</span>
          </div>
          <span className="text-[11px] text-zinc-600 block">
            2 Yönlü Canlı .ics Takvim Kilidi
          </span>
        </div>
      </div>

      {/* Navigation Tabs for the 3 Self-Service Modules */}
      <div className="flex flex-wrap items-center gap-2 bg-amber-50/70 p-1.5 rounded-2xl border border-amber-200">
        <button
          type="button"
          onClick={() => setActiveSection('calendar')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSection === 'calendar'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white/70'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>1. Görsel Birim Takvimi (PMS Tape Chart)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('pricing')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSection === 'pricing'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white/70'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. Fiyat Optimizasyonu & Kanal Marjları</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('ical')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSection === 'ical'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
              : 'text-zinc-700 hover:bg-white/70'
          }`}
        >
          <CalendarSync className="w-4 h-4" />
          <span>3. Canlı iCal (.ics) & OTA Bağlantı Masası</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MODULE 1: VISUAL MULTI-UNIT PMS CALENDAR (14-DAY TAPE CHART)          */}
      {/* ===================================================================== */}
      {activeSection === 'calendar' && (
        <div className="luxury-service-card p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>14 Günlük İnteraktif Birim Doluluk & Gecelik Fiyat Takvimi</span>
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Herhangi bir gün hücresine tıklayarak o birimi <strong>Rezerve (Airbnb / Booking / Expedia / Direkt)</strong> veya <strong>Bloke</strong> yapabilir, gecelik fiyatını değiştirebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDayOffset((d) => d - 7)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-zinc-800 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Önceki 7 Gün</span>
              </button>
              <button
                type="button"
                onClick={() => setDayOffset(0)}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 cursor-pointer"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => setDayOffset((d) => d + 7)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-zinc-800 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
              >
                <span>Sonraki 7 Gün</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Channel Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
              ● Müsait (Satışa Açık)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
              ● Airbnb Rezervasyonu
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
              ● Booking.com
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              ● Purely / Direkt Rezervasyon
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
              ● Expedia / VRBO
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-800 border border-zinc-400">
              ● Bloke / Kapalı
            </span>
          </div>

          {/* Scrollable Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white">
            <table className="w-full border-collapse text-xs min-w-[920px]">
              <thead>
                <tr className="bg-amber-50/90 border-b border-amber-200">
                  <th className="p-3 text-left font-bold text-zinc-900 sticky left-0 bg-amber-50 z-10 min-w-[170px] border-r border-amber-200">
                    Birim / Daire
                  </th>
                  {dateColumns.map((col) => (
                    <th
                      key={col.dateStr}
                      className={`p-2 text-center border-r border-amber-100 min-w-[68px] ${
                        col.isToday
                          ? 'bg-amber-200/70 text-amber-950'
                          : col.isWeekend
                            ? 'bg-amber-100/50 text-amber-900'
                            : 'text-zinc-700'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold">{col.dayName}</div>
                      <div className="text-sm font-bold font-mono">{col.dayNum}</div>
                      <div className="text-[9px] text-zinc-500">{col.monthName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.number}
                    className="border-b border-amber-100 hover:bg-amber-50/20"
                  >
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-amber-200">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px]">
                          {room.number}
                        </span>
                        <span className="truncate max-w-[100px]">{room.type}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[155px]">
                        {room.locationAddress || room.floor || 'Merkez Tesis'}
                      </div>
                    </td>

                    {dateColumns.map((col) => {
                      const cell = resolveCellData(room, col);
                      let badgeStyle =
                        'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-200';
                      let labelText = 'Müsait';

                      if (cell.status === 'blocked') {
                        badgeStyle =
                          'bg-zinc-200/90 hover:bg-zinc-300 text-zinc-800 border-zinc-400';
                        labelText = 'Bloke';
                      } else if (cell.status === 'booked') {
                        if (cell.channel === 'Airbnb') {
                          badgeStyle =
                            'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300';
                          labelText = 'Airbnb';
                        } else if (cell.channel === 'Booking.com') {
                          badgeStyle =
                            'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300';
                          labelText = 'Booking';
                        } else if (cell.channel === 'Expedia' || cell.channel === 'VRBO') {
                          badgeStyle =
                            'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300';
                          labelText = cell.channel;
                        } else {
                          badgeStyle =
                            'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300';
                          labelText = 'Direkt';
                        }
                      }

                      return (
                        <td
                          key={col.dateStr}
                          onClick={() => handleOpenCellModal(room, col)}
                          className="p-1 border-r border-amber-100 text-center cursor-pointer align-middle"
                          title={`Birim ${room.number} • ${col.dateStr} • ${labelText} (€${cell.priceEur}) — Düzenlemek için tıklayın`}
                        >
                          <div
                            className={`rounded-xl p-1.5 border transition flex flex-col items-center justify-center min-h-[52px] ${badgeStyle}`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-tight truncate max-w-[58px]">
                              {labelText}
                            </span>
                            <span className="text-[11px] font-bold font-mono mt-0.5">
                              €{cell.priceEur}
                            </span>
                            {cell.guestName && (
                              <span className="text-[8px] truncate max-w-[58px] opacity-85">
                                {cell.guestName}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODULE 2: SELF-SERVICE PRICE OPTIMIZATION & CHANNEL MARKUP ENGINE     */}
      {/* ===================================================================== */}
      {activeSection === 'pricing' && (
        <div className="space-y-5">
          {/* Portfolio Bulk Pricing Bar */}
          <div className="luxury-service-card p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h2 className="text-sm font-bold text-zinc-900">
                  Akıllı Fiyat Optimizasyonu & OTA Komisyon Koruma Motoru
                </h2>
              </div>
              <p className="text-xs text-zinc-600">
                Baz gecelik fiyatınızı belirleyin; sistem Airbnb (+%15), Booking.com (+%18), Expedia (+%18) komisyonlarını ve hafta sonu / yüksek doluluk artışlarını otomatik hesaplayarak net gelirinizi korur.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={20}
                value={bulkBasePrice}
                onChange={(e) => setBulkBasePrice(e.target.value)}
                placeholder="Toplu Baz Fiyat (€)"
                className="w-40 p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono text-zinc-900"
              />
              <button
                type="button"
                onClick={handleApplyBulkBasePrice}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Tüm Birimlere Uygula
              </button>
            </div>
          </div>

          {/* Per-Unit Dynamic Pricing Cards */}
          <div className="grid grid-cols-1 gap-4">
            {rooms.map((room) => {
              const draft = pricingDrafts[room.number] || {
                basePriceEur: room.basePriceEur || 140,
                minStayNights: 2,
                weekendMarkupPct: 15,
                highOccupancyMarkupPct: 20,
                lastMinuteDiscountPct: 10,
                airbnbMarkup: 15,
                bookingMarkup: 18,
                expediaMarkup: 18,
                vrboMarkup: 15,
              };

              const base = Number(draft.basePriceEur) || 140;
              const weekendRate = Math.round(base * (1 + draft.weekendMarkupPct / 100));
              const highOccRate = Math.round(base * (1 + draft.highOccupancyMarkupPct / 100));
              const lastMinRate = Math.round(base * (1 - draft.lastMinuteDiscountPct / 100));

              const airbnbRate = Math.round(base * (1 + draft.airbnbMarkup / 100));
              const bookingRate = Math.round(base * (1 + draft.bookingMarkup / 100));
              const expediaRate = Math.round(base * (1 + draft.expediaMarkup / 100));
              const vrboRate = Math.round(base * (1 + draft.vrboMarkup / 100));

              return (
                <div
                  key={room.number}
                  className="btn-3d p-5 space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white font-mono font-bold">
                          BİRİM {room.number}
                        </span>
                        <h3 className="text-sm font-bold text-zinc-900">
                          {room.type} ({room.floor})
                        </h3>
                      </div>
                      {room.locationAddress && (
                        <p className="text-[11px] text-zinc-600 mt-1">
                          📍 {room.locationAddress}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveUnitPricing(room.number)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Fiyat & Kanal Kurallarını Kaydet</span>
                    </button>
                  </div>

                  {/* Input Controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Baz Gecelik Fiyat (€)
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={draft.basePriceEur}
                        onChange={(e) =>
                          updatePricingField(
                            room.number,
                            'basePriceEur',
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Min. Konaklama (Gece)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={draft.minStayNights}
                        onChange={(e) =>
                          updatePricingField(
                            room.number,
                            'minStayNights',
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Hafta Sonu Artışı (+%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.weekendMarkupPct}
                        onChange={(e) =>
                          updatePricingField(
                            room.number,
                            'weekendMarkupPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Yüksek Doluluk (+%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.highOccupancyMarkupPct}
                        onChange={(e) =>
                          updatePricingField(
                            room.number,
                            'highOccupancyMarkupPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-zinc-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 block">
                        Son Dakika İndirimi (-%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={70}
                        value={draft.lastMinuteDiscountPct}
                        onChange={(e) =>
                          updatePricingField(
                            room.number,
                            'lastMinuteDiscountPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Live Channel Distribution & Rate Preview */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300">
                      <span className="text-[10px] font-bold text-amber-900 block">
                        Purely Direkt (%0)
                      </span>
                      <strong className="text-sm font-mono font-bold text-zinc-900">
                        €{base} / gece
                      </strong>
                      <span className="text-[9px] text-zinc-600 block">Net Kâr</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-900 block">
                        Airbnb (+%{draft.airbnbMarkup})
                      </span>
                      <strong className="text-sm font-mono font-bold text-rose-950">
                        €{airbnbRate} / gece
                      </strong>
                      <span className="text-[9px] text-rose-700 block">Komisyon Dahil</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-900 block">
                        Booking.com (+%{draft.bookingMarkup})
                      </span>
                      <strong className="text-sm font-mono font-bold text-blue-950">
                        €{bookingRate} / gece
                      </strong>
                      <span className="text-[9px] text-blue-700 block">Komisyon Dahil</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-900 block">
                        Expedia (+%{draft.expediaMarkup})
                      </span>
                      <strong className="text-sm font-mono font-bold text-purple-950">
                        €{expediaRate} / gece
                      </strong>
                      <span className="text-[9px] text-purple-700 block">Komisyon Dahil</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-900 block">
                        Hafta Sonu (Cum/Cmt)
                      </span>
                      <strong className="text-sm font-mono font-bold text-emerald-950">
                        €{weekendRate} / gece
                      </strong>
                      <span className="text-[9px] text-emerald-700 block">
                        Son Dakika: €{lastMinRate}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-[10px] font-bold text-indigo-900 block">
                        Yüksek Doluluk (&gt;%70)
                      </span>
                      <strong className="text-sm font-mono font-bold text-indigo-950">
                        €{highOccRate} / gece
                      </strong>
                      <span className="text-[9px] text-indigo-700 block">
                        VRBO: €{vrboRate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODULE 3: LIVE 2-WAY ICAL (.ICS) & SELF-SERVICE OTA CONNECTION DESK   */}
      {/* ===================================================================== */}
      {activeSection === 'ical' && (
        <div className="space-y-6">
          {/* Connected Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="btn-3d p-4 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900 dark:text-slate-100">
                      {ch.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {ch.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[rgba(245,215,130,0.22)] rounded-xl border border-[rgba(230,185,75,0.55)] text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Kapsam:</span>
                      <strong className="text-zinc-900 dark:text-slate-100">
                        {ch.roomNumber === 'all' ? 'Tüm Birimler' : `Birim ${ch.roomNumber}`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Son Eşitleme:</span>
                      <strong className="text-zinc-900 dark:text-slate-100">
                        {ch.lastSync || 'Şimdi'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(230,185,75,0.4)] flex items-center justify-between">
                  <span
                    className="text-[10px] text-zinc-600 truncate max-w-[140px]"
                    title={ch.feedUrl}
                  >
                    {ch.feedUrl}
                  </span>
                  <button
                    onClick={() => handleDeleteChannel(ch.id, ch.name)}
                    className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    title="Kanalı Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Channel Feed Form */}
          <div className="luxury-service-card p-5 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarSync className="w-4 h-4 text-amber-700" />
              <span>Yeni OTA / Dış iCal Kanalı Bağla (Airbnb, Booking.com, Expedia, VRBO)</span>
            </h2>

            <form
              onSubmit={handleAddChannel}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Kanal Sağlayıcı</label>
                <select
                  value={newChanName}
                  onChange={(e) => setNewChanName(e.target.value)}
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value="Airbnb">Airbnb iCal Feed</option>
                  <option value="Booking.com">Booking.com iCal Feed</option>
                  <option value="VRBO">VRBO / HomeAway</option>
                  <option value="Expedia">Expedia Partner Central</option>
                  <option value="Tripadvisor">Tripadvisor Rentals</option>
                  <option value="Diğer Özel OTA">Diğer Özel OTA</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Birim Seçimi</label>
                <select
                  value={newChanRoom}
                  onChange={(e) => setNewChanRoom(e.target.value)}
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  <option value="all">Tüm Birimler (Genel İşletme Akışı)</option>
                  {rooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      Birim {r.number} ({r.type || 'Standart'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-700 block">
                  Dış iCal Takvim URL (.ics)
                </label>
                <input
                  type="url"
                  required
                  value={newChanUrl}
                  onChange={(e) => setNewChanUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/12345.ics?s=abcdef"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <button
                type="submit"
                className="w-full p-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Kanalı Eşitle & Takvime Aktar</span>
              </button>
            </form>
          </div>

          {/* Unit-by-Unit iCal Export Table */}
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-amber-700" />
                <span>Birimlere Özel Canlı iCal Dışa Aktarma (.ics) Bağlantıları</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                Bu bağlantıları Airbnb, Booking.com veya Expedia Extranet üzerindeki &quot;Takvimi İçe Aktar (Import Calendar)&quot; alanına yapıştırın. Görsel birim takviminde kapattığınız veya rezerve ettiğiniz tüm tarihler bu .ics akışından anında yayınlanır.
              </p>
            </div>

            <div className="space-y-3">
              {rooms.map((room) => {
                const exportUrl = `${origin}/api/channels/ical/room-${encodeURIComponent(currentHotel.id)}-${encodeURIComponent(room.number)}/export.ics`;
                const isCopied = copiedKey === `exp-${room.number}`;

                return (
                  <div
                    key={room.number}
                    className="btn-3d p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-mono font-bold text-amber-900">
                        {room.number}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-slate-100">
                          Birim {room.number}
                        </h3>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400">
                          {room.type || 'Standart Delüks'} • {room.floor || '2. Kat'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">
                          Purely İstanbul Canlı .ics Dışa Aktarma Linki
                        </span>
                        <span className="text-[11px] font-mono text-zinc-700 truncate block">
                          {exportUrl}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(exportUrl, `exp-${room.number}`)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer shadow-2xs"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day Cell Edit Modal */}
      {cellModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 block">
                  {currentHotel.name}
                </span>
                <h3 className="text-sm font-bold font-serif text-zinc-900 dark:text-slate-100">
                  Birim {cellModal.roomNumber} • {cellModal.dateStr}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCellModal(null)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCellModal} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">Tarih Durumu</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'available', label: 'Müsait' },
                    { id: 'booked', label: 'Rezerve' },
                    { id: 'blocked', label: 'Bloke / Kapalı' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCellModal((prev) =>
                          prev ? { ...prev, status: opt.id as any } : null
                        )
                      }
                      className={`py-2 px-2.5 rounded-xl font-bold border text-center cursor-pointer transition ${
                        cellModal.status === opt.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-amber-50/50 text-zinc-700 border-amber-200 hover:bg-amber-100/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {cellModal.status === 'booked' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700 block">Rezervasyon Kanalı</label>
                    <select
                      value={cellModal.channel}
                      onChange={(e) =>
                        setCellModal((prev) =>
                          prev ? { ...prev, channel: e.target.value as ChannelSource } : null
                        )
                      }
                      className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold text-zinc-900"
                    >
                      <option value="Direkt">Purely Istanbul / Direkt</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Expedia">Expedia</option>
                      <option value="VRBO">VRBO</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700 block">
                      Misafir Adı / Not (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={cellModal.guestName}
                      onChange={(e) =>
                        setCellModal((prev) =>
                          prev ? { ...prev, guestName: e.target.value } : null
                        )
                      }
                      placeholder="Örn: Alex Morgan"
                      className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">
                  Bu Gece İçin Özel Fiyat (€)
                </label>
                <input
                  type="number"
                  min={10}
                  value={cellModal.priceEur}
                  onChange={(e) =>
                    setCellModal((prev) =>
                      prev ? { ...prev, priceEur: Number(e.target.value) } : null
                    )
                  }
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-mono font-bold text-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCellModal(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Takvime Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
