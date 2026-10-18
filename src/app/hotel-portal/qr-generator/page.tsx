"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room } from '@/lib/types';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Download, 
  Building2, 
  DoorOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Check,
  Copy,
  ChevronDown,
  ExternalLink,
  CalendarSync
} from 'lucide-react';
import { toast } from 'sonner';

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
        light: '#ffffff'
      }
    }).then((res) => {
      if (isMounted) setDataUrl(res);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!dataUrl) {
    return <div className="w-[150px] h-[150px] bg-amber-50 rounded-2xl flex items-center justify-center animate-pulse" />;
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Kod - Birim ${roomNumber}`}
      className="w-[150px] h-[150px] object-contain rounded-xl"
    />
  );
}

export default function HotelPortalQrPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [selectedHotelId, setSelectedHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Room Modal states (Add / Edit)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [modalRoomNumber, setModalRoomNumber] = useState('');
  const [modalRoomType, setModalRoomType] = useState('Standart Delüks');
  const [modalFloor, setModalFloor] = useState('2. Kat');

  const refresh = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    if (typeof window !== 'undefined') {
      const qHotel = new URLSearchParams(window.location.search).get('hotelId');
      if (qHotel && list.some(h => h.id === qHotel)) {
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

  const currentHotel = hotels.find(h => h.id === selectedHotelId) || hotels[0];
  const rooms = currentHotel?.rooms || [];

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setModalRoomNumber('');
    setModalRoomType('Standart Delüks');
    setModalFloor('2. Kat');
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setModalRoomNumber(room.number);
    setModalRoomType(room.type || 'Standart Delüks');
    setModalFloor(room.floor || '1. Kat');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRoomNumber.trim()) {
      toast.error("Lütfen birim numarasını giriniz.");
      return;
    }

    if (editingRoom) {
      // Edit Room
      XeniosStore.updateRoomInHotel(currentHotel.id, editingRoom.number, {
        number: modalRoomNumber.trim(),
        type: modalRoomType,
        floor: modalFloor
      });
      toast.success(`Birim ${modalRoomNumber} güncellendi.`);
    } else {
      // Add Room
      const newRoom: Room = {
        id: `room-${modalRoomNumber.trim()}-${Date.now()}`,
        number: modalRoomNumber.trim(),
        type: modalRoomType,
        floor: modalFloor,
        wifiSsid: '',
        wifiPass: ''
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

  const filteredRooms = rooms.filter(r => {
    if (selectedRoomNumber === 'all') return true;
    return r.number === selectedRoomNumber;
  });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const testRoom: Room = {
    id: 'room-TEST',
    number: 'TEST',
    type: 'test QR Kodu',
    floor: 'Önizleme',
    wifiSsid: '',
    wifiPass: ''
  };

  const displayRooms = selectedRoomNumber === 'all' || selectedRoomNumber === 'TEST' 
    ? [testRoom, ...filteredRooms.filter(r => r.number !== 'TEST')] 
    : filteredRooms;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-700" />
            <span>Birim QR Kodları & iCal Takvim Masası</span>
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Her birime özel dijital concierge standee QR kodları ve OTA takvim senkronizasyon .ics bağlantıları
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
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>İşletme Seçimi:</span>
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
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Birim Filtrele:</span>
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
              <span>Yeni Birim Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Unit QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRooms.map((room) => {
          const qrUrl = `${origin}/stay/${encodeURIComponent(currentHotel?.id || 'hotel-1')}/${encodeURIComponent(room.number)}`;
          const icsUrl = `${origin}/api/channels/ical/room-${encodeURIComponent(currentHotel?.id || 'hotel-1')}-${encodeURIComponent(room.number)}/export.ics`;
          const isCopied = copiedKey === `ics-${room.number}`;

          return (
            <div
              key={room.number}
              className="btn-3d p-6 flex flex-col items-center justify-between text-center space-y-4 relative overflow-hidden group"
            >
              {/* Property & Unit Header Badge */}
              <div className="space-y-1 w-full border-b border-amber-100 pb-3">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider font-mono">
                  {currentHotel?.name || 'purelyİstanbul Partner İşletme'}
                </div>
                <div className="text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100">
                  BİRİM {room.number}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium">
                  {room.type} • {room.floor}
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="p-3 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-amber-300 shadow-inner flex items-center justify-center">
                <QrCodeCardImage url={qrUrl} roomNumber={room.number} />
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-medium px-2 leading-relaxed">
                Kameranızı QR koda doğrultarak konaklama içi hizmet menüsüne ve dijital concierge rehberine anında bağlanın.
              </p>

              {/* iCal .ics Takvim Bağlantısı Kutusu */}
              {room.number !== 'TEST' && (
                <div className="w-full bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200 text-left space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <CalendarSync className="w-3 h-3 text-amber-700" />
                      <span>iCal Dışa Aktarma (.ics)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(icsUrl, `ics-${room.number}`)}
                      className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 dark:border-slate-800 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 dark:text-slate-400 truncate" title={icsUrl}>
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
                        className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Birimi Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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
                  <span>Önizle</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unit Add / Edit Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="text-sm font-bold font-serif text-zinc-900 dark:text-slate-100">
                {editingRoom ? `Birim ${editingRoom.number} Düzenle` : `Yeni Birim Ekle (${currentHotel?.name})`}
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 dark:text-slate-400 hover:bg-zinc-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">Birim Numarası / Adı</label>
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
                <label className="font-bold text-zinc-700 block">Birim Tipi</label>
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
                <label className="font-bold text-zinc-700 block">Bulunduğu Kat</label>
                <input
                  type="text"
                  value={modalFloor}
                  onChange={(e) => setModalFloor(e.target.value)}
                  placeholder="Örn: 2. Kat"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
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

