"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  QrCode,
  Search,
  ExternalLink,
  ArrowUpRight,
  Plus,
  Edit3,
  Trash2,
  Power,
  Save,
  X,
  DoorOpen,
  Wifi
} from 'lucide-react';

type HotelDraft = {
  name: string;
  district: string;
  type: string;
  address: string;
  phone: string;
  website: string;
  ratingStr: string;
  targetReason: string;
  breakfastHours: string;
  checkoutTime: string;
  receptionExt: string;
  roomCount: number;
  wifiSsid: string;
  wifiPass: string;
  commissionRate: number;
  managerName: string;
  contactEmail: string;
  publishToWeb: boolean;
  publishToMobile: boolean;
};

const EMPTY_HOTEL_DRAFT: HotelDraft = {
  name: '',
  district: 'Sultanahmet / Fatih',
  type: 'Butik Otel & Konak',
  address: '',
  phone: '+90 212 500 00 00',
  website: 'https://',
  ratingStr: '4.9 (Yeni Partner)',
  targetReason: 'Purelyİstanbul anlaşmalı konaklama ve dijital konsiyerj partneri.',
  breakfastHours: '07:30 - 10:30',
  checkoutTime: '12:00',
  receptionExt: '0',
  roomCount: 15,
  wifiSsid: 'Hotel_Guest_WiFi',
  wifiPass: 'Purely2026!',
  commissionRate: 15,
  managerName: '',
  contactEmail: '',
  publishToWeb: true,
  publishToMobile: true
};

function hotelToDraft(h: Hotel): HotelDraft {
  return {
    name: h.name,
    district: h.district,
    type: h.type,
    address: h.address,
    phone: h.phone,
    website: h.website || 'https://',
    ratingStr: h.ratingStr || '4.9',
    targetReason: h.targetReason || '',
    breakfastHours: h.breakfastHours || '07:30 - 10:30',
    checkoutTime: h.checkoutTime || '12:00',
    receptionExt: h.receptionExt || '0',
    roomCount: h.rooms?.length || 10,
    wifiSsid: h.rooms?.[0]?.wifiSsid || 'Hotel_Guest_WiFi',
    wifiPass: h.rooms?.[0]?.wifiPass || 'Purely2026!',
    commissionRate: h.commissionRate ?? 15,
    managerName: h.managerName || '',
    contactEmail: h.contactEmail || '',
    publishToWeb: h.publishToWeb ?? false,
    publishToMobile: h.publishToMobile !== false
  };
}

export function HotelAdminPanel() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [draft, setDraft] = useState<HotelDraft>(EMPTY_HOTEL_DRAFT);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editDraft, setEditDraft] = useState<HotelDraft>(EMPTY_HOTEL_DRAFT);

  // Room Drawer / Modal state
  const [managingRoomsHotel, setManagingRoomsHotel] = useState<Hotel | null>(null);
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newRoomType, setNewRoomType] = useState('Deluxe Oda');
  const [newRoomFloor, setNewRoomFloor] = useState('1. Kat');

  const refresh = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    if (managingRoomsHotel) {
      const updated = list.find((h) => h.id === managingRoomsHotel.id);
      if (updated) setManagingRoomsHotel(updated);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener('xenios_hotels_updated', refresh);
    return () => window.removeEventListener('xenios_hotels_updated', refresh);
  }, [managingRoomsHotel?.id]);

  const districts = useMemo(
    () => ['all', ...Array.from(new Set(hotels.map((h) => h.district).filter(Boolean)))],
    [hotels]
  );

  const stats = useMemo(() => {
    const active = hotels.filter((h) => h.status !== 'suspended').length;
    const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
    return {
      total: hotels.length,
      active,
      suspended: hotels.length - active,
      totalRooms
    };
  }, [hotels]);

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      const matchesDistrict = selectedDistrict === 'all' || h.district === selectedDistrict;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q);
      return matchesDistrict && matchesSearch;
    });
  }, [hotels, selectedDistrict, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error('Lütfen otel adını giriniz.');
      return;
    }
    const count = Math.max(1, Math.min(200, Number(draft.roomCount) || 10));
    const generatedRooms: Room[] = Array.from({ length: count }, (_, idx) => {
      const floorNum = Math.floor(idx / 5) + 1;
      const roomNo = String(floorNum * 100 + ((idx % 5) + 1));
      return {
        id: `rm-${Date.now()}-${idx}`,
        number: roomNo,
        type: idx % 3 === 0 ? 'Bosphorus Suite' : 'Deluxe Room',
        floor: `${floorNum}. Kat`,
        wifiSsid: draft.wifiSsid.trim() || 'Hotel_WiFi',
        wifiPass: draft.wifiPass.trim() || 'Purely2026!'
      };
    });

    const created: Hotel = {
      id: 'hotel-' + Date.now(),
      name: draft.name.trim(),
      district: draft.district.trim() || 'Sultanahmet',
      type: draft.type.trim() || 'Butik Otel',
      address: draft.address.trim() || draft.district.trim(),
      phone: draft.phone.trim(),
      website: draft.website.trim(),
      ratingStr: draft.ratingStr || '4.9 (Partner)',
      targetReason: draft.targetReason || 'Purelyİstanbul anlaşmalı partner otel.',
      coords: { lat: 41.0082, lng: 28.9784 },
      rooms: generatedRooms,
      breakfastHours: draft.breakfastHours || '07:30 - 10:30',
      checkoutTime: draft.checkoutTime || '12:00',
      receptionExt: draft.receptionExt || '0',
      status: 'active',
      commissionRate: Number(draft.commissionRate) || 15,
      managerName: draft.managerName.trim() || undefined,
      contactEmail: draft.contactEmail.trim() || undefined,
      publishToWeb: draft.publishToWeb,
      publishToMobile: draft.publishToMobile
    };

    XeniosStore.addHotel(created);
    toast.success(`"${created.name}" (${generatedRooms.length} oda) eklendi ve canlıya alındı.`);
    setIsNewOpen(false);
    setDraft(EMPTY_HOTEL_DRAFT);
    refresh();
  };

  const openEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setEditDraft(hotelToDraft(hotel));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    if (!editDraft.name.trim()) {
      toast.error('Lütfen otel adını giriniz.');
      return;
    }

    const updatedRooms = (editingHotel.rooms || []).map((r) => ({
      ...r,
      wifiSsid: editDraft.wifiSsid || r.wifiSsid,
      wifiPass: editDraft.wifiPass || r.wifiPass
    }));

    XeniosStore.updateHotel(editingHotel.id, {
      name: editDraft.name.trim(),
      district: editDraft.district.trim(),
      type: editDraft.type.trim(),
      address: editDraft.address.trim(),
      phone: editDraft.phone.trim(),
      website: editDraft.website.trim(),
      ratingStr: editDraft.ratingStr,
      targetReason: editDraft.targetReason,
      breakfastHours: editDraft.breakfastHours,
      checkoutTime: editDraft.checkoutTime,
      receptionExt: editDraft.receptionExt,
      rooms: updatedRooms,
      commissionRate: Number(editDraft.commissionRate) || 15,
      managerName: editDraft.managerName.trim() || undefined,
      contactEmail: editDraft.contactEmail.trim() || undefined,
      publishToWeb: editDraft.publishToWeb,
      publishToMobile: editDraft.publishToMobile
    });

    toast.success(`"${editDraft.name}" güncellendi ve senkronize edildi.`);
    setEditingHotel(null);
    refresh();
  };

  const toggleStatus = (hotel: Hotel) => {
    const next = hotel.status === 'suspended' ? 'active' : 'suspended';
    XeniosStore.updateHotel(hotel.id, { status: next });
    toast.success(next === 'suspended' ? `"${hotel.name}" askıya alındı.` : `"${hotel.name}" aktif edildi.`);
    refresh();
  };

  const handleDelete = (hotel: Hotel) => {
    if (!confirm(`"${hotel.name}" otelini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    XeniosStore.deleteHotel(hotel.id);
    toast.info(`"${hotel.name}" silindi.`);
    refresh();
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingRoomsHotel || !newRoomNum.trim()) return;
    XeniosStore.addRoomToHotel(managingRoomsHotel.id, {
      id: `rm-${Date.now()}`,
      number: newRoomNum.trim(),
      type: newRoomType.trim() || 'Deluxe Oda',
      floor: newRoomFloor.trim() || '1. Kat',
      wifiSsid: managingRoomsHotel.rooms?.[0]?.wifiSsid || 'Hotel_Guest',
      wifiPass: managingRoomsHotel.rooms?.[0]?.wifiPass || 'Purely2026!'
    });
    toast.success(`Oda ${newRoomNum.trim()} eklendi.`);
    setNewRoomNum('');
    refresh();
  };

  const handleDeleteRoom = (roomNumber: string) => {
    if (!managingRoomsHotel) return;
    XeniosStore.deleteRoomFromHotel(managingRoomsHotel.id, roomNumber);
    toast.info(`Oda ${roomNumber} silindi.`);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Toplam Partner Otel</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Aktif Otel</span>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{stats.active}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Tanımlı Oda Envanteri</span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">{stats.totalRooms}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">Askıda</span>
          <div className="text-xl font-bold text-red-500 mt-1 font-mono">{stats.suspended}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Otel adı, semt, adres veya tesis tipi ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-amber-200/80 rounded-xl text-zinc-700 cursor-pointer"
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'Tüm Semtler / Bölgeler' : d}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsNewOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Partner Otel Ekle</span>
        </button>

        <Link
          href="/qr-generator"
          className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Toplu QR</span>
        </Link>
      </div>

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((hotel) => {
          const isSuspended = hotel.status === 'suspended';
          return (
            <div
              key={hotel.id}
              className={`p-5 rounded-3xl border transition space-y-3 flex flex-col justify-between shadow-xs ${
                isSuspended
                  ? 'bg-white/60 border-red-400/40'
                  : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        {hotel.type}
                      </span>
                      {isSuspended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                          ASKIDA
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mt-1.5 leading-snug">
                      {hotel.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                    ★ {(hotel.ratingStr || '4.9').split(' ')[0]}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{hotel.address || hotel.district}</span>
                </p>

                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-[11px] text-zinc-700 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <strong className="text-amber-800 font-bold">Kahvaltı: {hotel.breakfastHours}</strong>
                    <span className="font-mono text-zinc-500">Check-out: {hotel.checkoutTime}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-slate-400 line-clamp-2">{hotel.targetReason}</p>
                </div>

                <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {hotel.phone}
                  </span>
                  <button
                    onClick={() => setManagingRoomsHotel(hotel)}
                    className="text-amber-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>{hotel.rooms?.length || 0} Oda Yönet</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-100 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/hotel-portal?hotelId=${hotel.id}`}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 text-[11px] font-bold border border-amber-300 flex items-center justify-center gap-1 transition"
                  >
                    <span>Otel Kokpiti</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/qr-generator?hotelId=${hotel.id}`}
                    className="py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-amber-50 text-zinc-700 border border-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition"
                    title="Oda QR Kodları"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR
                  </Link>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(hotel)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-zinc-800 text-[11px] font-semibold border border-amber-200/80 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Düzenle
                  </button>
                  <button
                    onClick={() => toggleStatus(hotel)}
                    className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-[11px] font-semibold border border-amber-300/60 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Power className="w-3 h-3" /> {isSuspended ? 'Aktif Et' : 'Askıya Al'}
                  </button>
                  <button
                    onClick={() => handleDelete(hotel)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 transition cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Hotel Modal */}
      {(isNewOpen || editingHotel) && (
        <HotelFormModal
          title={editingHotel ? 'Partner Otel Bilgilerini Düzenle' : 'Yeni Anlaşmalı Partner Otel Ekle'}
          draft={editingHotel ? editDraft : draft}
          setDraft={editingHotel ? setEditDraft : setDraft}
          isEditing={!!editingHotel}
          onSubmit={editingHotel ? handleSaveEdit : handleCreate}
          onClose={() => {
            setIsNewOpen(false);
            setEditingHotel(null);
          }}
        />
      )}

      {/* Room Inventory Modal */}
      {managingRoomsHotel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">
                  {managingRoomsHotel.name} • Oda & Wi-Fi Envanteri
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Toplam {managingRoomsHotel.rooms?.length || 0} tanımlı oda • Mobil App QR eşleşmesi
                </p>
              </div>
              <button
                onClick={() => setManagingRoomsHotel(null)}
                className="p-1.5 rounded-lg bg-amber-50 text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                required
                value={newRoomNum}
                onChange={(e) => setNewRoomNum(e.target.value)}
                placeholder="Oda No (Örn: 305)"
                className="px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl font-mono"
              />
              <input
                type="text"
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                placeholder="Oda Tipi"
                className="px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl"
              />
              <input
                type="text"
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(e.target.value)}
                placeholder="Kat (Örn: 3. Kat)"
                className="px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Oda Ekle
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pt-1">
              {(managingRoomsHotel.rooms || []).map((room) => (
                <div
                  key={room.number}
                  className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="font-mono text-zinc-900">Oda {room.number}</strong>
                    <span className="block text-[10px] text-zinc-500">
                      {room.type} • {room.floor}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.number)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Odayı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HotelFormModal({
  title,
  draft,
  setDraft,
  isEditing,
  onSubmit,
  onClose
}: {
  title: string;
  draft: HotelDraft;
  setDraft: React.Dispatch<React.SetStateAction<HotelDraft>>;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-amber-200/80 rounded-3xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-amber-50 text-zinc-500 hover:text-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Otel / Tesis Adı *</label>
              <input
                type="text"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Örn: Heritage Palace Hotel Sultanahmet"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Semt / Bölge</label>
              <input
                type="text"
                value={draft.district}
                onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                placeholder="Sultanahmet / Fatih"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Tesis Tipi</label>
              <input
                type="text"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                placeholder="Butik Otel & Konak / 5 Yıldızlı Otel"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Açık Adres</label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                placeholder="Cankurtaran Mah. ... Fatih / İstanbul"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Resepsiyon / Otel Telefonu</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Web Sitesi</label>
              <input
                type="text"
                value={draft.website}
                onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Otel Yöneticisi / Müdür Adı</label>
              <input
                type="text"
                value={draft.managerName}
                onChange={(e) => setDraft({ ...draft, managerName: e.target.value })}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Yönetici E-Postası (Otel Paneli Girişi)</label>
              <input
                type="email"
                value={draft.contactEmail}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                placeholder="mudur@otel.com"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Otomatik Oluşturulacak Oda Sayısı</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={draft.roomCount}
                  onChange={(e) => setDraft({ ...draft, roomCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Konsiyerj Satış Komisyon Oranı (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.commissionRate}
                onChange={(e) => setDraft({ ...draft, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-amber-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Oda Wi-Fi Ağ Adı (SSID)</label>
              <input
                type="text"
                value={draft.wifiSsid}
                onChange={(e) => setDraft({ ...draft, wifiSsid: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Oda Wi-Fi Şifresi</label>
              <input
                type="text"
                value={draft.wifiPass}
                onChange={(e) => setDraft({ ...draft, wifiPass: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kahvaltı Saatleri</label>
              <input
                type="text"
                value={draft.breakfastHours}
                onChange={(e) => setDraft({ ...draft, breakfastHours: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Check-out Saati</label>
              <input
                type="text"
                value={draft.checkoutTime}
                onChange={(e) => setDraft({ ...draft, checkoutTime: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Operasyon & Partnerlik Notu</label>
              <textarea
                rows={2}
                value={draft.targetReason}
                onChange={(e) => setDraft({ ...draft, targetReason: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.publishToMobile}
                  onChange={(e) => setDraft({ ...draft, publishToMobile: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Mobil App & Otel İçi QR Konsiyerj Aktif
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.publishToWeb}
                  onChange={(e) => setDraft({ ...draft, publishToWeb: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Web Marketplace Konaklama Vitrininde Göster
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-amber-200/80">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-amber-50 text-zinc-700 font-semibold">
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet & Senkronize Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
