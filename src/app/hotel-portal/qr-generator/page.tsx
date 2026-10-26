"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room } from '@/lib/types';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Building2,
  DoorOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CalendarSync,
  MapPin,
  Wifi,
  Sparkles,
  KeyRound,
  Cpu,
  BookOpen,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';

// Helper to extract { lat, lng } from Google Maps URL or "41.0082, 28.9784" string
function parseCoordsFromInput(input: string): { lat: number; lng: number } | undefined {
  if (!input) return undefined;
  // Pattern 1: @41.0082,28.9784 or ?q=41.0082,28.9784 or ll=41.0082,28.9784
  const match = input.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return undefined;
}

// Helper component to render QR image from dataURL
function QrCodeCardImage({ url, roomNumber }: { url: string; roomNumber: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    })
      .then((res) => {
        if (isMounted) setDataUrl(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!dataUrl) {
    return (
      <div className="w-[150px] h-[150px] bg-amber-50 rounded-2xl flex items-center justify-center animate-pulse" />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Kod - Birim ${roomNumber}`}
      className="w-[150px] h-[150px] object-contain rounded-xl"
    />
  );
}

interface UnitDraftState {
  locationAddress: string;
  mapsUrl: string;
  wifiSsid: string;
  wifiPass: string;
  doorCode: string;
  applianceGuide: string;
  houseGuideNotes: string;
}

export default function HotelPortalQrPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [selectedHotelId, setSelectedHotelId] = useState<string>(() =>
    XeniosStore.getActiveHotelId()
  );
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Per-unit inline drafts for Location & Comus AI House Guide
  const [unitDrafts, setUnitDrafts] = useState<Record<string, UnitDraftState>>({});
  const [expandedGuideRooms, setExpandedGuideRooms] = useState<Record<string, boolean>>({});
  const [savedBadgeRooms, setSavedBadgeRooms] = useState<Record<string, boolean>>({});

  // Room Modal states (Add / Edit)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [modalRoomNumber, setModalRoomNumber] = useState('');
  const [modalRoomType, setModalRoomType] = useState('Standart Delüks');
  const [modalFloor, setModalFloor] = useState('2. Kat');
  const [modalLocationAddress, setModalLocationAddress] = useState('');
  const [modalMapsUrl, setModalMapsUrl] = useState('');
  const [modalWifiSsid, setModalWifiSsid] = useState('');
  const [modalWifiPass, setModalWifiPass] = useState('');
  const [modalDoorCode, setModalDoorCode] = useState('');
  const [modalApplianceGuide, setModalApplianceGuide] = useState('');
  const [modalHouseGuideNotes, setModalHouseGuideNotes] = useState('');

  const refresh = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    if (typeof window !== 'undefined') {
      const qHotel = new URLSearchParams(window.location.search).get('hotelId');
      if (qHotel && list.some((h) => h.id === qHotel)) {
        setSelectedHotelId(qHotel);
        return;
      }
    }
    const id = XeniosStore.getActiveHotelId();
    if (!selectedHotelId) setSelectedHotelId(id);
  };

  useEffect(() => {
    refresh();
    window.addEventListener('xenios_hotels_updated', refresh);
    return () => window.removeEventListener('xenios_hotels_updated', refresh);
  }, []);

  const currentHotel = hotels.find((h) => h.id === selectedHotelId) || hotels[0];
  const rooms = currentHotel?.rooms || [];

  // Sync unitDrafts whenever currentHotel or rooms update
  useEffect(() => {
    if (!currentHotel?.rooms) return;
    const nextDrafts: Record<string, UnitDraftState> = {};
    for (const r of currentHotel.rooms) {
      nextDrafts[r.number] = {
        locationAddress: r.locationAddress || '',
        mapsUrl:
          r.mapsUrl ||
          (r.coords?.lat && r.coords?.lng
            ? `https://maps.google.com/?q=${r.coords.lat},${r.coords.lng}`
            : ''),
        wifiSsid: r.wifiSsid || '',
        wifiPass: r.wifiPass || '',
        doorCode: r.doorCode || '',
        applianceGuide: r.applianceGuide || '',
        houseGuideNotes: r.houseGuideNotes || '',
      };
    }
    setUnitDrafts(nextDrafts);
  }, [currentHotel?.id, currentHotel?.updatedAt, rooms.length]);

  const updateDraftField = (
    roomNumber: string,
    field: keyof UnitDraftState,
    value: string
  ) => {
    setUnitDrafts((prev) => ({
      ...prev,
      [roomNumber]: {
        ...(prev[roomNumber] || {
          locationAddress: '',
          mapsUrl: '',
          wifiSsid: '',
          wifiPass: '',
          doorCode: '',
          applianceGuide: '',
          houseGuideNotes: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleUseCurrentGpsForUnit = (roomNumber: string) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Tarayıcınız GPS konum özelliğini desteklemiyor.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        updateDraftField(roomNumber, 'mapsUrl', url);
        toast.success(`Birim ${roomNumber} için GPS koordinatı alındı (${lat}, ${lng}).`);
      },
      () => {
        toast.error('Konum izni alınamadı. Harita linkini manuel yapıştırabilirsiniz.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveUnitCardDetails = (room: Room) => {
    if (!currentHotel) return;
    const draft = unitDrafts[room.number];
    if (!draft) return;

    const parsedCoords =
      parseCoordsFromInput(draft.mapsUrl) ||
      parseCoordsFromInput(draft.locationAddress) ||
      room.coords;

    const finalMapsUrl =
      draft.mapsUrl.trim() ||
      (parsedCoords
        ? `https://maps.google.com/?q=${parsedCoords.lat},${parsedCoords.lng}`
        : draft.locationAddress.trim()
          ? `https://maps.google.com/?q=${encodeURIComponent(draft.locationAddress.trim())}`
          : '');

    XeniosStore.updateRoomInHotel(currentHotel.id, room.number, {
      locationAddress: draft.locationAddress.trim(),
      mapsUrl: finalMapsUrl,
      ...(parsedCoords ? { coords: parsedCoords } : {}),
      wifiSsid: draft.wifiSsid.trim(),
      wifiPass: draft.wifiPass.trim(),
      doorCode: draft.doorCode.trim(),
      applianceGuide: draft.applianceGuide.trim(),
      houseGuideNotes: draft.houseGuideNotes.trim(),
      updatedAt: new Date().toISOString(),
    });

    setSavedBadgeRooms((prev) => ({ ...prev, [room.number]: true }));
    setTimeout(() => {
      setSavedBadgeRooms((prev) => ({ ...prev, [room.number]: false }));
    }, 2500);

    toast.success(
      `Birim ${room.number} konum ve Comus AI ev rehberi bilgileri QR koda işlendi!`
    );
    refresh();
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setModalRoomNumber('');
    setModalRoomType('Standart Delüks');
    setModalFloor('2. Kat');
    setModalLocationAddress('');
    setModalMapsUrl('');
    setModalWifiSsid('');
    setModalWifiPass('');
    setModalDoorCode('');
    setModalApplianceGuide('');
    setModalHouseGuideNotes('');
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    const draft = unitDrafts[room.number];
    setEditingRoom(room);
    setModalRoomNumber(room.number);
    setModalRoomType(room.type || 'Standart Delüks');
    setModalFloor(room.floor || '1. Kat');
    setModalLocationAddress(draft?.locationAddress ?? room.locationAddress ?? '');
    setModalMapsUrl(draft?.mapsUrl ?? room.mapsUrl ?? '');
    setModalWifiSsid(draft?.wifiSsid ?? room.wifiSsid ?? '');
    setModalWifiPass(draft?.wifiPass ?? room.wifiPass ?? '');
    setModalDoorCode(draft?.doorCode ?? room.doorCode ?? '');
    setModalApplianceGuide(draft?.applianceGuide ?? room.applianceGuide ?? '');
    setModalHouseGuideNotes(draft?.houseGuideNotes ?? room.houseGuideNotes ?? '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRoomNumber.trim()) {
      toast.error('Lütfen birim numarasını giriniz.');
      return;
    }

    const parsedCoords =
      parseCoordsFromInput(modalMapsUrl) ||
      parseCoordsFromInput(modalLocationAddress) ||
      editingRoom?.coords;

    const finalMapsUrl =
      modalMapsUrl.trim() ||
      (parsedCoords
        ? `https://maps.google.com/?q=${parsedCoords.lat},${parsedCoords.lng}`
        : modalLocationAddress.trim()
          ? `https://maps.google.com/?q=${encodeURIComponent(modalLocationAddress.trim())}`
          : '');

    if (editingRoom) {
      XeniosStore.updateRoomInHotel(currentHotel.id, editingRoom.number, {
        number: modalRoomNumber.trim(),
        type: modalRoomType,
        floor: modalFloor,
        locationAddress: modalLocationAddress.trim(),
        mapsUrl: finalMapsUrl,
        ...(parsedCoords ? { coords: parsedCoords } : {}),
        wifiSsid: modalWifiSsid.trim(),
        wifiPass: modalWifiPass.trim(),
        doorCode: modalDoorCode.trim(),
        applianceGuide: modalApplianceGuide.trim(),
        houseGuideNotes: modalHouseGuideNotes.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Birim ${modalRoomNumber} güncellendi.`);
    } else {
      const newRoom: Room = {
        id: `room-${modalRoomNumber.trim()}-${Date.now()}`,
        number: modalRoomNumber.trim(),
        type: modalRoomType,
        floor: modalFloor,
        wifiSsid: modalWifiSsid.trim(),
        wifiPass: modalWifiPass.trim(),
        locationAddress: modalLocationAddress.trim(),
        mapsUrl: finalMapsUrl,
        ...(parsedCoords ? { coords: parsedCoords } : {}),
        doorCode: modalDoorCode.trim(),
        applianceGuide: modalApplianceGuide.trim(),
        houseGuideNotes: modalHouseGuideNotes.trim(),
        updatedAt: new Date().toISOString(),
      };
      XeniosStore.addRoomToHotel(currentHotel.id, newRoom);
      toast.success(`Birim ${modalRoomNumber} işletmeye eklendi.`);
    }

    setIsRoomModalOpen(false);
    refresh();
  };

  const handleDeleteRoom = (roomNumber: string) => {
    if (confirm(`Birim ${roomNumber} kaydını ve QR kodunu silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteRoomFromHotel(currentHotel.id, roomNumber);
      toast.success(`Birim ${roomNumber} silindi.`);
      refresh();
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('iCal dışa aktarma bağlantısı kopyalandı.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRooms = rooms.filter((r) => {
    if (selectedRoomNumber === 'all') return true;
    return r.number === selectedRoomNumber;
  });

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://purelyistanbul.com';

  const testRoom: Room = {
    id: 'room-TEST',
    number: 'TEST',
    type: 'Test QR Kodu',
    floor: 'Önizleme',
    wifiSsid: '',
    wifiPass: '',
  };

  const displayRooms =
    selectedRoomNumber === 'all' || selectedRoomNumber === 'TEST'
      ? [testRoom, ...filteredRooms.filter((r) => r.number !== 'TEST')]
      : filteredRooms;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {currentHotel?.name}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              WhatsApp Konum & Comus AI Birim Hafızası Aktif
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-700" />
            <span>Birim QR Kodları, Konum & Comus AI Ev Rehberi Masası</span>
          </h1>
          <p className="text-xs text-zinc-600 dark:text-slate-400 mt-0.5">
            Her mülk/birim için ayrı konum (WhatsApp otomatik gönderim için) ve Comus AI&apos;ın misafire ev rehberi olarak sunacağı Wi-Fi, kapı şifresi ve elektrikli eşya kullanım bilgilerini buradan QR koda işleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Seçilen QR Kodları Yazdır</span>
          </button>
        </div>
      </div>

      {/* Property & Unit Selector Control Bar */}
      <div className="luxury-service-card p-5 rounded-3xl space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          {/* 1. İşletme Seçimi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>İşletme / Portföy Seçimi:</span>
            </label>
            <div className="relative">
              <select
                value={selectedHotelId}
                onChange={(e) => {
                  setSelectedHotelId(e.target.value);
                  setSelectedRoomNumber('all');
                }}
                className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer appearance-none pr-8"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.district})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 2. Birim Filtrele */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Birim / Daire Filtrele:</span>
            </label>
            <div className="relative">
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer appearance-none pr-8"
              >
                <option value="all">Tüm Birimler ({rooms.length} Birim)</option>
                {rooms.map((r) => (
                  <option key={r.number} value={r.number}>
                    Birim {r.number} - {r.type} ({r.floor})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Birim Ekle Butonu */}
          <div>
            <button
              onClick={handleOpenAddRoom}
              className="w-full p-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Birim / Daire Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Unit QR Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayRooms.map((room) => {
          const qrUrl = `${origin}/stay/${encodeURIComponent(currentHotel?.id || 'hotel-1')}/${encodeURIComponent(room.number)}`;
          const icsUrl = `${origin}/api/channels/ical/room-${encodeURIComponent(currentHotel?.id || 'hotel-1')}-${encodeURIComponent(room.number)}/export.ics`;
          const isCopied = copiedKey === `ics-${room.number}`;
          const draft: UnitDraftState = unitDrafts[room.number] || {
            locationAddress: room.locationAddress || '',
            mapsUrl: room.mapsUrl || '',
            wifiSsid: room.wifiSsid || '',
            wifiPass: room.wifiPass || '',
            doorCode: room.doorCode || '',
            applianceGuide: room.applianceGuide || '',
            houseGuideNotes: room.houseGuideNotes || '',
          };
          const isGuideExpanded = Boolean(expandedGuideRooms[room.number]);
          const hasLocationSaved = Boolean(room.locationAddress || room.mapsUrl || room.coords);
          const hasComusGuideSaved = Boolean(
            room.wifiSsid ||
              room.wifiPass ||
              room.doorCode ||
              room.applianceGuide ||
              room.houseGuideNotes
          );

          return (
            <div
              key={room.number}
              className="btn-3d p-6 flex flex-col justify-between text-center space-y-4 relative overflow-hidden group"
            >
              {/* Property & Unit Header Badge */}
              <div className="space-y-1.5 w-full border-b border-amber-100 pb-3">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider font-mono">
                  {currentHotel?.name || 'Purely İstanbul Partner İşletme'}
                </div>
                <div className="text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100">
                  BİRİM {room.number}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium">
                  {room.type} • {room.floor}
                </div>

                {room.number !== 'TEST' && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 print:hidden">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        hasLocationSaved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50/70 text-amber-800 border-amber-200'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      {hasLocationSaved ? 'Birim Konumu Kayıtlı' : 'Ana Tesis Konumu Kullanılıyor'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        hasComusGuideSaved
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {hasComusGuideSaved ? 'Comus AI Ev Rehberi Hazır' : 'Comus AI Rehberi Boş'}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code Canvas */}
              <div className="mx-auto p-3 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-amber-300 shadow-inner flex items-center justify-center">
                <QrCodeCardImage url={qrUrl} roomNumber={room.number} />
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-medium px-2 leading-relaxed">
                Kameranızı QR koda doğrultarak konaklama içi hizmet menüsüne ve Comus AI dijital ev rehberine anında bağlanın.
              </p>

              {/* 1. BİRİM KONUM BİLGİSİ ALANI (QR ROZETİNİN ALTINDA — PMC & WHATSAPP OTOMATİK KONUM GÖNDERİMİ İÇİN) */}
              {room.number !== 'TEST' && (
                <div className="w-full bg-emerald-50/50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-slate-700 text-left space-y-2.5 print:hidden">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Birim Konum Bilgisi (WhatsApp Otomatik Konum)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUseCurrentGpsForUnit(room.number)}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Bulunduğunuz dairenin GPS koordinatını otomatik çek"
                    >
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>GPS Konumu Al</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 dark:text-slate-400 leading-snug">
                    PMC daireleri farklı adreslerde olduğu için rezervasyon yapıldığında misafire gönderilen otomatik WhatsApp mesajı buradaki birim konumunu ve harita pinini yollar.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 block mb-0.5">
                        Birim Açık Adresi & Bina/Daire Tarifi
                      </label>
                      <input
                        type="text"
                        value={draft.locationAddress}
                        onChange={(e) =>
                          updateDraftField(room.number, 'locationAddress', e.target.value)
                        }
                        placeholder={
                          currentHotel?.address ||
                          'Örn: Kuloğlu Mah. Turnacıbaşı Cad. No:24 Daire:4, Cihangir / Beyoğlu'
                        }
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-700 rounded-xl text-[11px] text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 block mb-0.5">
                        Google Harita Linki veya Koordinat (lat, lng)
                      </label>
                      <input
                        type="text"
                        value={draft.mapsUrl}
                        onChange={(e) =>
                          updateDraftField(room.number, 'mapsUrl', e.target.value)
                        }
                        placeholder="https://maps.google.com/?q=41.0332,28.9834"
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-emerald-200 dark:border-slate-700 rounded-xl text-[11px] font-mono text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. COMUS AI BİRİM ÖZEL EV REHBERİ & CİHAZ BİLGİ BANKASI (QR KODA İŞLENEN ALAN) */}
              {room.number !== 'TEST' && (
                <div className="w-full bg-amber-50/60 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-200/90 dark:border-slate-700 text-left space-y-2.5 print:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGuideRooms((prev) => ({
                        ...prev,
                        [room.number]: !prev[room.number],
                      }))
                    }
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Comus AI Ev Rehberi & Birim Bilgi Bankası (Wi-Fi / Eşya / Ev Bilgisi)</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1 shrink-0">
                      <span>{isGuideExpanded ? 'Daralt' : 'Düzenle'}</span>
                      {isGuideExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>

                  <p className="text-[10px] text-zinc-600 dark:text-slate-400 leading-snug">
                    Ayrı bir ev rehberi sayfası oluşturmak yerine buraya girdiğiniz birim özel bilgileri, misafir QR kodu okutup Comus AI&apos;a sorduğunda (Wi-Fi, klima/kombi/çamaşır makinesi kullanımı, kapı şifresi, ev kuralları) otomatik yanıtlanır.
                  </p>

                  {/* Always show quick Wi-Fi inputs + expandable full appliance/house guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
                        <Wifi className="w-3 h-3 text-amber-700" />
                        <span>Birim Wi-Fi Ağ Adı (SSID)</span>
                      </label>
                      <input
                        type="text"
                        value={draft.wifiSsid}
                        onChange={(e) =>
                          updateDraftField(room.number, 'wifiSsid', e.target.value)
                        }
                        placeholder={`Örn: Purely_Suite_${room.number}`}
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-700 rounded-xl text-[11px] text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
                        <KeyRound className="w-3 h-3 text-amber-700" />
                        <span>Birim Wi-Fi Şifresi</span>
                      </label>
                      <input
                        type="text"
                        value={draft.wifiPass}
                        onChange={(e) =>
                          updateDraftField(room.number, 'wifiPass', e.target.value)
                        }
                        placeholder="Örn: Istanbul2026!"
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-700 rounded-xl text-[11px] font-mono text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  {isGuideExpanded && (
                    <div className="space-y-2.5 pt-1 border-t border-amber-200/60">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          <span>Kapı / Anahtar Kutusu (Lockbox) Şifresi & Giriş Tarifi</span>
                        </label>
                        <input
                          type="text"
                          value={draft.doorCode}
                          onChange={(e) =>
                            updateDraftField(room.number, 'doorCode', e.target.value)
                          }
                          placeholder="Örn: Bina dış kapı: #2480*, Daire yanı MasterLock kutusu: 1923"
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-700 rounded-xl text-[11px] text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
                          <Cpu className="w-3 h-3 text-amber-700" />
                          <span>Elektrikli Eşya & Cihaz Kullanımı (Klima, Kombi, Çamaşır/Bulaşık, TV, Kahve Makinesi)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={draft.applianceGuide}
                          onChange={(e) =>
                            updateDraftField(room.number, 'applianceGuide', e.target.value)
                          }
                          placeholder="Örn: Klima kumandası TV ünitesindedir. Kombi mutfak dolabındadır, sıcak su için 50°C'de açık bırakınız. Çamaşır makinesi hızlı yıkama programı P4'tür. Sigorta kutusu giriş kapısının arkasındadır."
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-700 rounded-xl text-[11px] text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 flex items-center gap-1 mb-0.5">
                          <BookOpen className="w-3 h-3 text-amber-700" />
                          <span>Ev Bilgileri, Kurallar & Yedek Malzeme Yerleri</span>
                        </label>
                        <textarea
                          rows={2}
                          value={draft.houseGuideNotes}
                          onChange={(e) =>
                            updateDraftField(room.number, 'houseGuideNotes', e.target.value)
                          }
                          placeholder="Örn: Çöpler akşam 20:00-22:00 arası bina önüne çıkarılır. Yedek çarşaf, yastık ve havlular yatak odası dolabının üst rafındadır."
                          className="w-full p-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-slate-700 rounded-xl text-[11px] text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveUnitCardDetails(room)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {savedBadgeRooms[room.number] ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>QR Koda & Comus AI Hafızasına Kaydedildi!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Birim Konum & Comus AI Rehberini QR Koda Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* iCal .ics Takvim Bağlantısı Kutusu */}
              {room.number !== 'TEST' && (
                <div className="w-full bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200 text-left space-y-1 print:hidden">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <CalendarSync className="w-3 h-3 text-amber-700" />
                      <span>iCal Dışa Aktarma (.ics)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(icsUrl, `ics-${room.number}`)}
                      className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 dark:border-slate-800 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                  <div
                    className="text-[10px] font-mono text-zinc-600 dark:text-slate-400 truncate"
                    title={icsUrl}
                  >
                    {icsUrl}
                  </div>
                </div>
              )}

              {/* Action Buttons: Edit, Delete, Direct Link */}
              <div className="w-full pt-3 border-t border-amber-100 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-1">
                  {room.number !== 'TEST' && (
                    <>
                      <button
                        onClick={() => handleOpenEditRoom(room)}
                        className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Birimi Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Detaylı Düzenle</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.number)}
                        className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Birimi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <span>Misafir QR Sayfasını Önizle</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unit Add / Edit Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="text-sm font-bold font-serif text-zinc-900 dark:text-slate-100">
                {editingRoom
                  ? `Birim ${editingRoom.number} — Konum & Comus AI Rehberi Düzenle`
                  : `Yeni Birim / Daire Ekle (${currentHotel?.name})`}
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 dark:text-slate-300 block">
                    Birim Numarası / Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={modalRoomNumber}
                    onChange={(e) => setModalRoomNumber(e.target.value)}
                    placeholder="Örn: 204 veya Daire 4"
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-mono text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 dark:text-slate-300 block">
                    Birim Tipi
                  </label>
                  <select
                    value={modalRoomType}
                    onChange={(e) => setModalRoomType(e.target.value)}
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    <option value="Standart Delüks">Standart Delüks</option>
                    <option value="Junior Suite">Junior Suite</option>
                    <option value="Executive Boğaz Manzaralı">Executive Boğaz Manzaralı</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                    <option value="Aile Süiti / Daire">Aile Süiti / Daire</option>
                    <option value="Rezidans Daire">Rezidans Daire</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 dark:text-slate-300 block">
                    Bulunduğu Kat
                  </label>
                  <input
                    type="text"
                    value={modalFloor}
                    onChange={(e) => setModalFloor(e.target.value)}
                    placeholder="Örn: 2. Kat"
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Birim Konum Bilgisi (WhatsApp Otomatik Konum Gönderimi İçin)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Açık Adres & Bina/Daire Tarifi
                  </label>
                  <input
                    type="text"
                    value={modalLocationAddress}
                    onChange={(e) => setModalLocationAddress(e.target.value)}
                    placeholder="Örn: Kuloğlu Mah. Turnacıbaşı Cad. No:24 D:4, Cihangir / Beyoğlu"
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Google Harita Linki veya Koordinat (lat, lng)
                  </label>
                  <input
                    type="text"
                    value={modalMapsUrl}
                    onChange={(e) => setModalMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=41.0332,28.9834"
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono text-zinc-900"
                  />
                </div>
              </div>

              {/* Comus AI House Guide Fields */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Comus AI Birim Özel Ev Rehberi & Cihaz Bilgileri</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 block">
                      Wi-Fi Ağ Adı (SSID)
                    </label>
                    <input
                      type="text"
                      value={modalWifiSsid}
                      onChange={(e) => setModalWifiSsid(e.target.value)}
                      placeholder="Örn: Purely_Suite_204"
                      className="w-full p-2 bg-white border border-amber-200 rounded-xl text-zinc-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-700 block">
                      Wi-Fi Şifresi
                    </label>
                    <input
                      type="text"
                      value={modalWifiPass}
                      onChange={(e) => setModalWifiPass(e.target.value)}
                      placeholder="Örn: Istanbul2026!"
                      className="w-full p-2 bg-white border border-amber-200 rounded-xl font-mono text-zinc-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Kapı / Anahtar Kutusu Şifresi & Giriş Talimatı
                  </label>
                  <input
                    type="text"
                    value={modalDoorCode}
                    onChange={(e) => setModalDoorCode(e.target.value)}
                    placeholder="Örn: Bina kapısı #2480*, Daire yanı kilit kutusu: 1923"
                    className="w-full p-2 bg-white border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Elektrikli Eşya Kullanımı (Klima, Kombi, Çamaşır/Bulaşık Makinesi, TV, Kahve)
                  </label>
                  <textarea
                    rows={3}
                    value={modalApplianceGuide}
                    onChange={(e) => setModalApplianceGuide(e.target.value)}
                    placeholder="Klima, kombi, sıcak su, çamaşır/bulaşık makinesi, kahve makinesi ve sigorta kutusu kullanımı..."
                    className="w-full p-2 bg-white border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 block">
                    Ev Bilgileri & Kurallar (Çöp, Yedek Havlu/Çarşaf, Otopark vb.)
                  </label>
                  <textarea
                    rows={2}
                    value={modalHouseGuideNotes}
                    onChange={(e) => setModalHouseGuideNotes(e.target.value)}
                    placeholder="Çöp saatleri, yedek havlu/çarşaf dolabı, sessizlik saatleri..."
                    className="w-full p-2 bg-white border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
