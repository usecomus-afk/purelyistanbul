"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room, OTAChannelItem } from '@/lib/types';
import {
  CalendarSync,
  CheckCircle2,
  RotateCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
  ShieldCheck,
  Building2,
  DoorOpen,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function HotelChannelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];
  const rooms = currentHotel?.rooms || [];

  const [channels, setChannels] = useState<OTAChannelItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Channel Form State
  const [newChanName, setNewChanName] = useState('Airbnb');
  const [newChanRoom, setNewChanRoom] = useState('all');
  const [newChanUrl, setNewChanUrl] = useState('');

  // Per-room custom feed URLs state
  const [roomFeeds, setRoomFeeds] = useState<Record<string, string>>({});

  const refreshData = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    const id = XeniosStore.getActiveHotelId();
    setActiveHotelId(id);
    setChannels(XeniosStore.getOTAChannels(id));
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xenios_ota_channels_updated', refreshData);
    return () => window.removeEventListener('xenios_ota_channels_updated', refreshData);
  }, [activeHotelId]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('iCal dışa aktarma adresi kopyalandı.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success(`Tüm OTA kanalları ve ${rooms.length} oda takvimi 2 yönlü eşitlendi.`);
    }, 1200);
  };

  const handleAddChannel = (e: React.FormEvent) => {
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
      active: true
    });

    toast.success(`${newChanName} kanalı takvime bağlandı.`);
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

  const handleSaveRoomFeed = (roomNumber: string) => {
    const url = roomFeeds[roomNumber] || '';
    if (!url.trim()) {
      toast.error('Lütfen bir URL giriniz.');
      return;
    }
    XeniosStore.addOTAChannel(currentHotel.id, {
      hotelId: currentHotel.id,
      name: 'Özel OTA',
      roomNumber: roomNumber,
      feedUrl: url.trim(),
      status: 'Senkronize',
      lastSync: 'Şimdi',
      active: true
    });
    toast.success(`Oda ${roomNumber} için dış iCal adresi kaydedildi.`);
    refreshData();
  };

  return (
    <div className="space-y-6 pb-12 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 mt-1">
            iCal & OTA Kanal Entegrasyon Masası
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Airbnb, Booking.com, VRBO ve Expedia takvimlerini purelyİstanbul oda envanteri ile 2 yönlü canlı senkronize edin.
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto disabled:opacity-50 shadow-xs"
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Eşitleniyor...' : 'Tüm Kanalları Eşitle'}</span>
        </button>
      </div>

      {/* Connected Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="btn-3d p-4 flex flex-col justify-between gap-3 text-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900">{ch.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {ch.status}
                </span>
              </div>

              <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Kapsam:</span>
                  <strong className="text-zinc-900">{ch.roomNumber === 'all' ? 'Tüm Odalar' : `Oda ${ch.roomNumber}`}</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Son Eşitleme:</span>
                  <strong className="text-zinc-900">{ch.lastSync || '5 dk önce'}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 truncate max-w-[120px]" title={ch.feedUrl}>
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
      <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <CalendarSync className="w-4 h-4 text-amber-700" />
          <span>Yeni OTA / Dış iCal Kanalı Bağla</span>
        </h2>

        <form onSubmit={handleAddChannel} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 block">Kanal Sağlayıcı</label>
            <select
              value={newChanName}
              onChange={(e) => setNewChanName(e.target.value)}
              className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
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
            <label className="text-xs font-bold text-zinc-700 block">Oda Seçimi</label>
            <select
              value={newChanRoom}
              onChange={(e) => setNewChanRoom(e.target.value)}
              className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
            >
              <option value="all">Tüm Odalar (Genel Otel Akışı)</option>
              {rooms.map((r) => (
                <option key={r.number} value={r.number}>
                  Oda {r.number} ({r.type || 'Standart'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-zinc-700 block">Dış iCal Takvim URL (.ics)</label>
            <input
              type="url"
              required
              value={newChanUrl}
              onChange={(e) => setNewChanUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/12345.ics?s=abcdef"
              className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <button
            type="submit"
            className="w-full p-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Kanalı Eşitle & Kaydet</span>
          </button>
        </form>
      </div>

      {/* Room-by-Room iCal Export & Import Table */}
      <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-amber-700" />
              <span>Odalara Özel iCal Dışa Aktarma (.ics) ve İçe Aktarma Masası</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Bu bağlantıları Airbnb veya Booking.com portalındaki "Takvimi İçe Aktar" alanına yapıştırınız.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => {
            const exportUrl = `${origin}/api/channels/ical/room-${currentHotel.id}-${room.number}/export.ics`;
            const isCopied = copiedKey === `exp-${room.number}`;

            return (
              <div
                key={room.number}
                className="btn-3d p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                {/* Room Info */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-mono font-bold text-amber-900">
                    {room.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">Oda {room.number}</h3>
                    <span className="text-[10px] text-zinc-500">{room.type || 'Standart Delüks'} • {room.floor || '2. Kat'}</span>
                  </div>
                </div>

                {/* Export URL */}
                <div className="flex-1 min-w-0 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">
                      purelyİstanbul Dışa Aktarma (.ics Linki)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-700 truncate block">
                      {exportUrl}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(exportUrl, `exp-${room.number}`)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer shadow-2xs"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

