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
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { BrandMark } from '@/components/brand-mark';

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
      alt={`QR Kod - Oda ${roomNumber}`}
      className="w-[150px] h-[150px] object-contain rounded-xl"
    />
  );
}

export default function QrGeneratorPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('all');
  
  // Room Modal states (Add / Edit)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [modalRoomNumber, setModalRoomNumber] = useState('');
  const [modalRoomType, setModalRoomType] = useState('Standart Delüks');
  const [modalFloor, setModalFloor] = useState('2. Kat');

  const refresh = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    if (list.length > 0 && !selectedHotelId) {
      setSelectedHotelId(list[0].id);
    }
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
      toast.error("Lütfen oda numarasını giriniz.");
      return;
    }

    if (editingRoom) {
      // Edit Room
      XeniosStore.updateRoomInHotel(currentHotel.id, editingRoom.number, {
        number: modalRoomNumber.trim(),
        type: modalRoomType,
        floor: modalFloor
      });
      toast.success(`Oda ${modalRoomNumber} güncellendi.`);
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
      toast.success(`Oda ${modalRoomNumber} otele eklendi.`);
    }

    setIsRoomModalOpen(false);
    refresh();
  };

  const handleDeleteRoom = (roomNumber: string) => {
    if (confirm(`Oda ${roomNumber} kaydını ve QR kodunu silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteRoomFromHotel(currentHotel.id, roomNumber);
      toast.success(`Oda ${roomNumber} silindi.`);
      refresh();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRooms = rooms.filter(r => {
    if (selectedRoomNumber === 'all') return true;
    return r.number === selectedRoomNumber;
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-700" />
            <span>Toplu QR Kod Üretici & Oda Envanter Masası</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Her odaya özel dijital concierge ve oda içi hizmet QR standee üretimi ve oda yönetimi
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Seçilen QR Kodları Yazdır</span>
        </button>
      </div>

      {/* Hotel & Room Selector Control Bar */}
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Otel Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Otel Seçimi:</span>
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

          {/* 2. Oda Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Oda Filtrele:</span>
            </label>
            <div className="relative">
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer appearance-none pr-8"
              >
                <option value="all">Tüm Odalar ({rooms.length} Oda)</option>
                {rooms.map((r) => (
                  <option key={r.number} value={r.number}>
                    Oda {r.number} - {r.type} ({r.floor})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Oda Ekle Butonu */}
          <div className="flex items-end">
            <button
              onClick={handleOpenAddRoom}
              className="w-full p-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Oda Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Room QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const qrUrl = `${origin}/stay/${currentHotel?.id || 'hotel-1'}/${room.number}`;

          return (
            <div
              key={room.number}
              className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 border-2 border-amber-200 shadow-sm flex flex-col items-center justify-between text-center space-y-4 relative overflow-hidden group hover:border-amber-400 transition"
            >
              {/* Hotel & Room Header Badge */}
              <div className="space-y-1 w-full border-b border-amber-100 pb-3">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider font-mono">
                  {currentHotel?.name || 'Xenios Partner Hotel'}
                </div>
                <div className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100">
                  ODA {room.number}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-slate-400">
                  {room.type} • {room.floor}
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="p-3 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-amber-300 shadow-xs flex items-center justify-center">
                <QrCodeCardImage url={qrUrl} roomNumber={room.number} />
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-slate-400 font-medium px-2 leading-relaxed">
                Kameranızı QR koda doğrultarak oda içi hizmet menüsüne ve İstanbul rehberine anında bağlanın.
              </p>

              {/* Action Buttons: Edit, Delete, Direct Link */}
              <div className="w-full pt-3 border-t border-amber-100 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditRoom(room)}
                    className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title="Odayı Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.number)}
                    className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Odayı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  Önizle →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Add / Edit Modal */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="text-sm font-bold font-serif text-zinc-900 dark:text-slate-100">
                {editingRoom ? `Oda ${editingRoom.number} Düzenle` : `Yeni Oda Ekle (${currentHotel?.name})`}
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
                <label className="font-bold text-zinc-700 block">Oda Numarası / Adı *</label>
                <input
                  type="text"
                  required
                  value={modalRoomNumber}
                  onChange={(e) => setModalRoomNumber(e.target.value)}
                  placeholder="Örn: 204"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl font-bold font-mono text-zinc-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">Oda Tipi</label>
                <select
                  value={modalRoomType}
                  onChange={(e) => setModalRoomType(e.target.value)}
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="Standart Delüks">Standart Delüks</option>
                  <option value="Panoramik Boğaz Süiti">Panoramik Boğaz Süiti</option>
                  <option value="Superior Queen">Superior Queen</option>
                  <option value="Executive Penthouse">Executive Penthouse</option>
                  <option value="Aile Süiti">Aile Süiti</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 block">Bulunduğu Kat</label>
                <input
                  type="text"
                  value={modalFloor}
                  onChange={(e) => setModalFloor(e.target.value)}
                  placeholder="Örn: 2. Kat"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold cursor-pointer transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-xs transition cursor-pointer"
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
