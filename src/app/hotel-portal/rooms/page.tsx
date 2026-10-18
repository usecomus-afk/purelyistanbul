"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, RoomOccupancyStatus, RoomStateInfo } from '@/lib/types';
import { QrCode, Search, UserPlus, Edit3, X, Check, UserCheck, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type RoomStatus = RoomOccupancyStatus;

export default function HotelRoomsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find((h) => h.id === activeHotelId) || hotels[0];

  const [roomStates, setRoomStates] = useState<Record<string, RoomStateInfo>>(() =>
    XeniosStore.getRoomStates(currentHotel?.id || '')
  );

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Guest / Reservation Modal State
  const [editingRoomNumber, setEditingRoomNumber] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<RoomStatus>('reserved');
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [checkoutInput, setCheckoutInput] = useState<string>('');

  const syncFromStore = () => {
    const list = XeniosStore.getHotels();
    const id = XeniosStore.getActiveHotelId();
    const active = list.find((h) => h.id === id) || list[0];
    setHotels(list);
    setActiveHotelId(active?.id || id);
    if (active?.id) {
      setRoomStates(XeniosStore.getRoomStates(active.id));
    }
  };

  useEffect(() => {
    syncFromStore();
    window.addEventListener('xenios_hotels_updated', syncFromStore);
    window.addEventListener('xenios_room_states_updated', syncFromStore);
    return () => {
      window.removeEventListener('xenios_hotels_updated', syncFromStore);
      window.removeEventListener('xenios_room_states_updated', syncFromStore);
    };
  }, []);

  const openGuestModal = (roomNum: string, targetStatus: RoomStatus, currentInfo?: RoomStateInfo) => {
    const existingGuest =
      currentInfo?.status === 'occupied' || currentInfo?.status === 'reserved'
        ? currentInfo?.guest || ''
        : '';
    const existingNote =
      currentInfo?.status === 'occupied' || currentInfo?.status === 'reserved'
        ? currentInfo?.checkout || ''
        : '';

    const defaultNote =
      targetStatus === 'reserved'
        ? existingNote && !existingNote.startsWith('Çıkış:')
          ? existingNote
          : 'Giriş: 14:00'
        : existingNote && !existingNote.startsWith('Giriş:')
        ? existingNote
        : 'Çıkış: 12:00';

    setEditingRoomNumber(roomNum);
    setEditingStatus(targetStatus);
    setGuestNameInput(existingGuest);
    setCheckoutInput(defaultNote);
  };

  const updateStatus = (roomNum: string, nextStatus: RoomStatus) => {
    if (!currentHotel) return;
    const prevInfo = roomStates[roomNum] || { status: 'clean' };

    if (nextStatus === 'clean' || nextStatus === 'cleaning') {
      // Clear guest name & checkout note immediately when marked Boş/Temiz or Temizlikte
      const clearedState: RoomStateInfo = {
        status: nextStatus,
        guest: '',
        checkout: '',
      };
      setRoomStates((prev) => ({
        ...prev,
        [roomNum]: clearedState,
      }));
      XeniosStore.updateRoomState(currentHotel.id, roomNum, clearedState);
      toast.success(
        nextStatus === 'clean'
          ? `Birim ${roomNum} Boş/Temiz olarak işaretlendi ve misafir bilgisi temizlendi.`
          : `Birim ${roomNum} Temizlikte olarak işaretlendi.`
      );
      return;
    }

    // For 'reserved' or 'occupied', persist status right away and open modal to enter guest name
    const existingGuest =
      prevInfo.status === 'occupied' || prevInfo.status === 'reserved'
        ? prevInfo.guest || ''
        : '';
    const defaultNote = nextStatus === 'reserved' ? 'Giriş: 14:00' : 'Çıkış: 12:00';
    const nextInfo: RoomStateInfo = {
      status: nextStatus,
      guest: existingGuest,
      checkout: prevInfo.checkout || defaultNote,
    };

    setRoomStates((prev) => ({
      ...prev,
      [roomNum]: nextInfo,
    }));
    XeniosStore.updateRoomState(currentHotel.id, roomNum, nextInfo);

    openGuestModal(roomNum, nextStatus, prevInfo);
  };

  const handleSaveGuestModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotel || !editingRoomNumber) return;

    const cleanGuest = guestNameInput.trim();
    const cleanNote =
      checkoutInput.trim() || (editingStatus === 'reserved' ? 'Giriş: 14:00' : 'Çıkış: 12:00');

    const updatedInfo: RoomStateInfo = {
      status: editingStatus,
      guest: cleanGuest,
      checkout: cleanNote,
    };

    setRoomStates((prev) => ({
      ...prev,
      [editingRoomNumber]: updatedInfo,
    }));
    XeniosStore.updateRoomState(currentHotel.id, editingRoomNumber, updatedInfo);

    toast.success(
      cleanGuest
        ? `Birim ${editingRoomNumber} (${editingStatus === 'reserved' ? 'Rezerve' : 'Dolu'}) — ${cleanGuest} adına kaydedildi.`
        : `Birim ${editingRoomNumber} durumu kaydedildi.`
    );
    setEditingRoomNumber(null);
  };

  if (!currentHotel) return null;

  const filteredRooms = (currentHotel.rooms || []).filter((r) => {
    const state = roomStates[r.number]?.status || 'clean';
    const guestStr =
      state === 'occupied' || state === 'reserved' ? roomStates[r.number]?.guest || '' : '';
    const matchesStatus = selectedStatus === 'all' || state === selectedStatus;
    const matchesSearch =
      !search ||
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      guestStr.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeRoomNumbers = new Set((currentHotel.rooms || []).map((r) => r.number));
  const activeStatesList = Array.from(activeRoomNumbers).map(
    (num) => roomStates[num]?.status || 'clean'
  );

  const counts = {
    total: activeStatesList.length,
    occupied: activeStatesList.filter((s) => s === 'occupied').length,
    clean: activeStatesList.filter((s) => s === 'clean').length,
    cleaning: activeStatesList.filter((s) => s === 'cleaning').length,
    reserved: activeStatesList.filter((s) => s === 'reserved').length,
  };

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {currentHotel.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1">
            Doluluk & Birim Panosu
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Tüm birimlerin anlık doluluk, temizlik ve rezervasyon durumlarını canlı yönetin.
          </p>
        </div>

        <Link
          href="/hotel-portal/qr-generator"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-xs"
        >
          <QrCode className="w-4 h-4" />
          <span>Toplu QR Kodları Yazdır</span>
        </Link>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-red-50/75 backdrop-blur-[18px] border border-red-200 shadow-xs">
          <span className="text-[10px] text-red-700 font-bold uppercase block">Dolu Birimler</span>
          <div className="text-xl font-bold text-red-800 mt-1 font-mono">{counts.occupied} Birim</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/75 backdrop-blur-[18px] border border-emerald-200 shadow-xs">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Boş & Temiz</span>
          <div className="text-xl font-bold text-emerald-800 mt-1 font-mono">{counts.clean} Birim</div>
        </div>

        <div className="luxury-service-card p-4 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase block">Temizleniyor / Kirli</span>
          <div className="text-xl font-bold text-amber-900 mt-1 font-mono">{counts.cleaning} Birim</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/75 backdrop-blur-[18px] border border-blue-200 shadow-xs">
          <span className="text-[10px] text-blue-700 font-bold uppercase block">Rezerve</span>
          <div className="text-xl font-bold text-blue-800 mt-1 font-mono">{counts.reserved} Birim</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="luxury-service-card w-full max-w-full box-border overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Birim no veya misafir adı ara..."
            className="w-full flex-1 min-w-0 box-border pl-9 pr-4 py-2 text-[16px] md:text-sm bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'occupied', 'clean', 'cleaning', 'reserved'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer border ${
                selectedStatus === st
                  ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-xs'
                  : 'golden-pill-badge backdrop-blur-[18px] text-[#2C1E0F] hover:bg-[rgba(240,195,70,0.48)]'
              }`}
            >
              {st === 'all'
                ? 'Tümü'
                : st === 'occupied'
                ? 'Dolu'
                : st === 'clean'
                ? 'Boş'
                : st === 'cleaning'
                ? 'Temizlikte'
                : 'Rezerve'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredRooms.map((room) => {
          const state = roomStates[room.number] || { status: 'clean' };
          const showGuestSection = state.status === 'occupied' || state.status === 'reserved';
          const hasGuestName = showGuestSection && Boolean(state.guest && state.guest.trim());

          return (
            <div
              key={room.number}
              className="luxury-service-card p-3.5 rounded-2xl flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <span className="text-base font-bold font-mono text-zinc-900 dark:text-slate-100 block truncate">
                    {room.number}
                  </span>
                  <span className="text-[10px] text-zinc-600 block truncate">{room.type}</span>
                </div>
                <span
                  className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    state.status === 'occupied'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : state.status === 'clean'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : state.status === 'cleaning'
                      ? 'golden-pill-badge text-[#2C1E0F]'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {state.status === 'occupied'
                    ? 'Dolu'
                    : state.status === 'clean'
                    ? 'Boş'
                    : state.status === 'cleaning'
                    ? 'Kirli'
                    : 'Rezerve'}
                </span>
              </div>

              {showGuestSection && (
                hasGuestName ? (
                  <button
                    type="button"
                    onClick={() => openGuestModal(room.number, state.status, state)}
                    className="w-full text-left text-[10px] text-zinc-800 bg-[rgba(245,215,130,0.28)] hover:bg-[rgba(245,215,130,0.45)] p-1.5 rounded-lg border border-[rgba(230,185,75,0.55)] transition group cursor-pointer"
                    title="Misafir / Rezervasyon Bilgisini Düzenle"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-bold">{state.guest}</span>
                      <Edit3 className="w-3 h-3 text-amber-800 opacity-70 group-hover:opacity-100 shrink-0" />
                    </div>
                    {state.checkout && (
                      <div className="text-zinc-600 text-[9px] truncate mt-0.5">{state.checkout}</div>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openGuestModal(room.number, state.status, state)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-dashed border-amber-500/70 bg-amber-50/50 hover:bg-amber-100/70 text-[10px] font-bold text-amber-900 transition cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3 shrink-0" />
                    <span>{state.status === 'reserved' ? 'Rezerve Adı Gir' : 'Misafir Adı Gir'}</span>
                  </button>
                )
              )}

              {/* Status Switch Dropdown */}
              <div className="pt-1.5 border-t border-[rgba(230,185,75,0.4)] flex items-center justify-between gap-1">
                <select
                  value={state.status}
                  onChange={(e) => updateStatus(room.number, e.target.value as RoomStatus)}
                  className="text-[11px] bg-amber-50/70 border border-amber-200 rounded-lg px-1.5 py-1 text-zinc-800 focus:outline-none cursor-pointer flex-1 min-w-0"
                >
                  <option value="occupied">Dolu</option>
                  <option value="clean">Boş/Temiz</option>
                  <option value="cleaning">Temizlikte</option>
                  <option value="reserved">Rezerve</option>
                </select>

                <Link
                  href={`/hotel-portal/qr-generator?hotelId=${currentHotel.id}&room=${room.number}`}
                  className="p-1 text-zinc-500 dark:text-slate-400 hover:text-amber-700 shrink-0"
                  title="Birim QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rezervasyon / Misafir Bilgisi Modalı */}
      {editingRoomNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="luxury-service-card w-full max-w-md rounded-2xl p-5 shadow-2xl border border-amber-300 bg-[#FAF6EC] text-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-900">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Birim {editingRoomNumber} —{' '}
                    {editingStatus === 'reserved' ? 'Rezervasyon Bilgisi' : 'Konaklayan Misafir Bilgisi'}
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    {editingStatus === 'reserved'
                      ? 'Bu birimin kimin adına rezerve edildiğini girin.'
                      : 'Bu birimde konaklayan misafirin adını girin.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoomNumber(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-amber-100/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuestModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  {editingStatus === 'reserved'
                    ? 'Rezervasyon Sahibi (Misafir Adı Soyadı)'
                    : 'Konaklayan Misafir Adı Soyadı'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-3.5 py-2.5 text-[16px] bg-white/90 border border-amber-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {editingStatus === 'reserved'
                      ? 'Giriş Saati / Rezervasyon Notu'
                      : 'Çıkış Saati / Konaklama Notu'}
                  </span>
                </label>
                <input
                  type="text"
                  value={checkoutInput}
                  onChange={(e) => setCheckoutInput(e.target.value)}
                  placeholder={editingStatus === 'reserved' ? 'Örn: Giriş: 14:00' : 'Örn: Çıkış: 12:00'}
                  className="w-full px-3.5 py-2.5 text-[16px] bg-white/90 border border-amber-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={() => setEditingRoomNumber(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-600 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
