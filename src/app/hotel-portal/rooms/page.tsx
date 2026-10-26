"use client";

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { XeniosStore } from '@/lib/store';
import { Hotel, Room, RoomOccupancyStatus, RoomStateInfo, HotelWhatsAppTemplate } from '@/lib/types';
import {
  QrCode,
  Search,
  UserPlus,
  Edit3,
  X,
  Check,
  UserCheck,
  CalendarClock,
  Phone,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Wifi,
  MapPin,
  BookmarkPlus,
  CheckCircle2,
} from 'lucide-react';
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

  // Step 1: Guest / Reservation Modal State
  const [editingRoomNumber, setEditingRoomNumber] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<RoomStatus>('reserved');
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [guestPhoneInput, setGuestPhoneInput] = useState<string>('');
  const [checkoutInput, setCheckoutInput] = useState<string>('');
  const [openWhatsappAfterSave, setOpenWhatsappAfterSave] = useState<boolean>(true);

  // Step 2: Automated WhatsApp Confirmation & Welcome Message Modal State
  const [whatsappModalRoom, setWhatsappModalRoom] = useState<string | null>(null);
  const [templates, setTemplates] = useState<HotelWhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-standard-full');
  const [isCustomNewMessage, setIsCustomNewMessage] = useState<boolean>(false);
  const [whatsappRecipientName, setWhatsappRecipientName] = useState<string>('');
  const [whatsappPhoneInput, setWhatsappPhoneInput] = useState<string>('');
  const [whatsappMessageBody, setWhatsappMessageBody] = useState<string>('');
  const [sendLocationPin, setSendLocationPin] = useState<boolean>(true);
  const [saveAsNewTemplate, setSaveAsNewTemplate] = useState<boolean>(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState<string>('');
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState<boolean>(false);

  const syncFromStore = () => {
    const list = XeniosStore.getHotels();
    const id = XeniosStore.getActiveHotelId();
    const active = list.find((h) => h.id === id) || list[0];
    setHotels(list);
    setActiveHotelId(active?.id || id);
    if (active?.id) {
      setRoomStates(XeniosStore.getRoomStates(active.id));
      setTemplates(XeniosStore.getHotelWhatsAppTemplates(active.id));
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

  /**
   * Resolves dynamic placeholders ({misafir_adi}, {wifi_sifre}, {purely_link}, etc.) for a specific unit & guest
   */
  const compileTemplateBody = (
    rawTemplate: string,
    roomNum: string,
    guestName: string,
    checkinOutNote: string
  ): string => {
    if (!currentHotel) return rawTemplate;
    const roomObj: Room | undefined = (currentHotel.rooms || []).find((r) => r.number === roomNum);
    const wifiSsid = roomObj?.wifiSsid || `${currentHotel.name.split(' ')[0]}_Guest`;
    const wifiPass = roomObj?.wifiPass || 'purely2026!';
    const roomType = roomObj?.type || 'Konaklama Birimi';
    const address =
      roomObj?.locationAddress ||
      currentHotel.address ||
      `${currentHotel.district || 'Sultanahmet'}, İstanbul`;
    const lat = roomObj?.coords?.lat || currentHotel.coords?.lat || 41.0054;
    const lng = roomObj?.coords?.lng || currentHotel.coords?.lng || 28.9768;
    const mapsLink = roomObj?.mapsUrl || `https://maps.google.com/?q=${lat},${lng}`;
    const purelyLink = `https://purelyistanbul.com/stay/${encodeURIComponent(currentHotel.id)}/${encodeURIComponent(roomNum)}`;
    const stayTimeInfo =
      checkinOutNote ||
      `Giriş: 14:00 · Çıkış: ${currentHotel.checkoutTime || '12:00'}${roomObj?.doorCode ? ` | Giriş Şifresi: ${roomObj.doorCode}` : ''}`;

    return rawTemplate
      .replace(/\{misafir_adi\}/g, guestName || 'Değerli Misafirimiz')
      .replace(/\{tesis_adi\}/g, currentHotel.name || 'Purely Istanbul Partner')
      .replace(/\{birim_no\}/g, roomNum)
      .replace(/\{birim_tipi\}/g, roomType)
      .replace(/\{giris_cikis\}/g, stayTimeInfo)
      .replace(/\{wifi_adi\}/g, wifiSsid)
      .replace(/\{wifi_sifre\}/g, wifiPass)
      .replace(/\{konum_adresi\}/g, address)
      .replace(/\{harita_linki\}/g, mapsLink)
      .replace(/\{purely_link\}/g, purelyLink)
      .replace(/\{tesis_telefon\}/g, currentHotel.whatsappPhone || currentHotel.phone || '+90 850 308 59 06');
  };

  const openGuestModal = (roomNum: string, targetStatus: RoomStatus, currentInfo?: RoomStateInfo) => {
    const existingGuest =
      currentInfo?.status === 'occupied' || currentInfo?.status === 'reserved'
        ? currentInfo?.guest || ''
        : '';
    const existingPhone =
      currentInfo?.status === 'occupied' || currentInfo?.status === 'reserved'
        ? currentInfo?.guestPhone || ''
        : '';
    const existingNote =
      currentInfo?.status === 'occupied' || currentInfo?.status === 'reserved'
        ? currentInfo?.checkout || ''
        : '';

    const defaultNote =
      targetStatus === 'reserved'
        ? existingNote && !existingNote.startsWith('Çıkış:')
          ? existingNote
          : `Giriş: 14:00 · Çıkış: ${currentHotel?.checkoutTime || '12:00'}`
        : existingNote && !existingNote.startsWith('Giriş:')
        ? existingNote
        : `Çıkış: ${currentHotel?.checkoutTime || '12:00'}`;

    setEditingRoomNumber(roomNum);
    setEditingStatus(targetStatus);
    setGuestNameInput(existingGuest);
    setGuestPhoneInput(existingPhone);
    setCheckoutInput(defaultNote);
    setOpenWhatsappAfterSave(targetStatus === 'reserved' || Boolean(existingPhone));
  };

  const openWhatsappWindowForRoom = (
    roomNum: string,
    guestName: string,
    guestPhone: string,
    checkinOutNote: string
  ) => {
    if (!currentHotel) return;
    const loadedTemplates = XeniosStore.getHotelWhatsAppTemplates(currentHotel.id);
    setTemplates(loadedTemplates);
    const firstTpl = loadedTemplates[0];
    const tplId = firstTpl?.id || 'tpl-standard-full';

    setWhatsappModalRoom(roomNum);
    setWhatsappRecipientName(guestName || 'Değerli Misafirimiz');
    setWhatsappPhoneInput(guestPhone || '');
    setSelectedTemplateId(tplId);
    setIsCustomNewMessage(false);
    setSaveAsNewTemplate(false);
    setNewTemplateTitle('');
    setSendLocationPin(true);
    setWhatsappMessageBody(
      compileTemplateBody(
        firstTpl?.body || '',
        roomNum,
        guestName || 'Değerli Misafirimiz',
        checkinOutNote
      )
    );
  };

  const handleSelectTemplate = (tpl: HotelWhatsAppTemplate) => {
    if (!whatsappModalRoom) return;
    const currentInfo = roomStates[whatsappModalRoom];
    setSelectedTemplateId(tpl.id);
    setIsCustomNewMessage(false);
    setWhatsappMessageBody(
      compileTemplateBody(
        tpl.body,
        whatsappModalRoom,
        whatsappRecipientName || currentInfo?.guest || 'Değerli Misafirimiz',
        currentInfo?.checkout || `Giriş: 14:00 · Çıkış: ${currentHotel?.checkoutTime || '12:00'}`
      )
    );
  };

  const handleStartNewCustomMessage = () => {
    if (!whatsappModalRoom || !currentHotel) return;
    const roomObj = (currentHotel.rooms || []).find((r) => r.number === whatsappModalRoom);
    const wifiSsid = roomObj?.wifiSsid || `${currentHotel.name.split(' ')[0]}_Guest`;
    const wifiPass = roomObj?.wifiPass || 'purely2026!';
    const unitAddress = roomObj?.locationAddress || currentHotel.address || 'İstanbul';
    const lat = roomObj?.coords?.lat || currentHotel.coords?.lat || 41.0054;
    const lng = roomObj?.coords?.lng || currentHotel.coords?.lng || 28.9768;
    const mapsLink = roomObj?.mapsUrl || `https://maps.google.com/?q=${lat},${lng}`;
    const purelyLink = `https://purelyistanbul.com/stay/${encodeURIComponent(currentHotel.id)}/${encodeURIComponent(whatsappModalRoom)}`;
    const currentInfo = roomStates[whatsappModalRoom];
    const stayTimeInfo =
      currentInfo?.checkout || `Giriş: 14:00 · Çıkış: ${currentHotel.checkoutTime || '12:00'}`;

    setIsCustomNewMessage(true);
    setSelectedTemplateId('custom-new');
    setWhatsappMessageBody(
      [
        `Sayın *${whatsappRecipientName || 'Misafirimiz'}*,`,
        `*${currentHotel.name}* — *Birim ${whatsappModalRoom}* rezervasyonunuz onaylanmıştır.`,
        '',
        `⏰ *Giriş / Çıkış:* ${stayTimeInfo}`,
        ...(roomObj?.doorCode ? [`🔑 *Kapı / Giriş Şifresi:* ${roomObj.doorCode}`] : []),
        `📶 *Wi-Fi:* ${wifiSsid} | *Şifre:* ${wifiPass}`,
        `📍 *Birim Konumu:* ${unitAddress} (${mapsLink})`,
        '',
        `🌟 *Purely Istanbul Dijital Asistanınız:*`,
        `Birim içi siparişleriniz, Comus AI ev rehberi ve İstanbul deneyimleri için size özel bağlantınız:`,
        `👉 ${purelyLink}`,
      ].join('\n')
    );
  };

  const insertSnippetIntoMessage = (snippetType: 'wifi' | 'location' | 'checkin' | 'purely') => {
    if (!whatsappModalRoom || !currentHotel) return;
    const roomObj = (currentHotel.rooms || []).find((r) => r.number === whatsappModalRoom);
    const wifiSsid = roomObj?.wifiSsid || `${currentHotel.name.split(' ')[0]}_Guest`;
    const wifiPass = roomObj?.wifiPass || 'purely2026!';
    const unitAddress = roomObj?.locationAddress || currentHotel.address || 'İstanbul';
    const lat = roomObj?.coords?.lat || currentHotel.coords?.lat || 41.0054;
    const lng = roomObj?.coords?.lng || currentHotel.coords?.lng || 28.9768;
    const mapsLink = roomObj?.mapsUrl || `https://maps.google.com/?q=${lat},${lng}`;
    const purelyLink = `https://purelyistanbul.com/stay/${encodeURIComponent(currentHotel.id)}/${encodeURIComponent(whatsappModalRoom)}`;
    const currentInfo = roomStates[whatsappModalRoom];
    const stayTimeInfo =
      currentInfo?.checkout || `Giriş: 14:00 · Çıkış: ${currentHotel.checkoutTime || '12:00'}`;

    let snippet = '';
    if (snippetType === 'wifi') {
      snippet = `\n📶 *Wi-Fi Ağı:* ${wifiSsid} | *Şifre:* ${wifiPass}`;
    } else if (snippetType === 'location') {
      snippet = `\n📍 *Birim Adresi & Konum:* ${unitAddress}\n🗺️ *Harita:* ${mapsLink}`;
    } else if (snippetType === 'checkin') {
      snippet = `\n⏰ *Giriş / Çıkış Bilgisi:* ${stayTimeInfo}${roomObj?.doorCode ? `\n🔑 *Giriş Şifresi:* ${roomObj.doorCode}` : ''}`;
    } else if (snippetType === 'purely') {
      snippet = `\n🌟 *Purely Istanbul Dijital Concierge & Comus AI Ev Rehberi:*\nKonaklamanız boyunca birim içi siparişlerinizi tek tıkla iletmek ve İstanbul deneyimlerini keşfetmek için:\n👉 ${purelyLink}`;
    }

    setWhatsappMessageBody((prev) => `${prev.trim()}\n${snippet.trim()}`);
  };

  const handleDeleteTemplate = (tplId: string) => {
    if (!currentHotel) return;
    const updated = templates.filter((t) => t.id !== tplId);
    setTemplates(updated);
    XeniosStore.saveHotelWhatsAppTemplates(currentHotel.id, updated);
    if (selectedTemplateId === tplId && updated[0]) {
      handleSelectTemplate(updated[0]);
    }
    toast.success('Mesaj taslağı silindi.');
  };

  const updateStatus = (roomNum: string, nextStatus: RoomStatus) => {
    if (!currentHotel) return;
    const prevInfo = roomStates[roomNum] || { status: 'clean' };

    if (nextStatus === 'clean' || nextStatus === 'cleaning') {
      const clearedState: RoomStateInfo = {
        status: nextStatus,
        guest: '',
        guestPhone: '',
        checkout: '',
        whatsappConfirmedAt: '',
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

    const existingGuest =
      prevInfo.status === 'occupied' || prevInfo.status === 'reserved'
        ? prevInfo.guest || ''
        : '';
    const existingPhone =
      prevInfo.status === 'occupied' || prevInfo.status === 'reserved'
        ? prevInfo.guestPhone || ''
        : '';
    const defaultNote =
      nextStatus === 'reserved'
        ? `Giriş: 14:00 · Çıkış: ${currentHotel.checkoutTime || '12:00'}`
        : `Çıkış: ${currentHotel.checkoutTime || '12:00'}`;

    const nextInfo: RoomStateInfo = {
      status: nextStatus,
      guest: existingGuest,
      guestPhone: existingPhone,
      checkout: prevInfo.checkout || defaultNote,
      whatsappConfirmedAt: prevInfo.whatsappConfirmedAt || '',
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
    const cleanPhone = guestPhoneInput.trim();
    const cleanNote =
      checkoutInput.trim() ||
      (editingStatus === 'reserved'
        ? `Giriş: 14:00 · Çıkış: ${currentHotel.checkoutTime || '12:00'}`
        : `Çıkış: ${currentHotel.checkoutTime || '12:00'}`);

    const prevInfo = roomStates[editingRoomNumber];
    const updatedInfo: RoomStateInfo = {
      status: editingStatus,
      guest: cleanGuest,
      guestPhone: cleanPhone,
      checkout: cleanNote,
      whatsappConfirmedAt: prevInfo?.whatsappConfirmedAt || '',
    };

    setRoomStates((prev) => ({
      ...prev,
      [editingRoomNumber]: updatedInfo,
    }));
    XeniosStore.updateRoomState(currentHotel.id, editingRoomNumber, updatedInfo);

    const targetRoom = editingRoomNumber;
    setEditingRoomNumber(null);

    if (openWhatsappAfterSave) {
      openWhatsappWindowForRoom(targetRoom, cleanGuest, cleanPhone, cleanNote);
    } else {
      toast.success(
        cleanGuest
          ? `Birim ${targetRoom} (${editingStatus === 'reserved' ? 'Rezerve' : 'Dolu'}) — ${cleanGuest} adına kaydedildi.`
          : `Birim ${targetRoom} durumu kaydedildi.`
      );
    }
  };

  const handleSendWhatsappConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotel || !whatsappModalRoom) return;

    const cleanPhone = whatsappPhoneInput.trim();
    const cleanBody = whatsappMessageBody.trim();

    if (!cleanPhone) {
      toast.error('Lütfen mesajın gönderileceği misafir WhatsApp telefon numarasını girin.');
      return;
    }
    if (!cleanBody) {
      toast.error('Lütfen gönderilecek mesaj metnini girin.');
      return;
    }

    // Save custom template if requested
    if (saveAsNewTemplate && newTemplateTitle.trim()) {
      const newTpl: HotelWhatsAppTemplate = {
        id: `tpl-custom-${Date.now()}`,
        title: newTemplateTitle.trim(),
        body: cleanBody,
        isDefault: false,
        updatedAt: new Date().toISOString(),
      };
      const nextList = [...templates, newTpl];
      setTemplates(nextList);
      XeniosStore.saveHotelWhatsAppTemplates(currentHotel.id, nextList);
    }

    setIsSendingWhatsapp(true);
    try {
      const roomObj = (currentHotel.rooms || []).find((r) => r.number === whatsappModalRoom);
      let unitLat = roomObj?.coords?.lat;
      let unitLng = roomObj?.coords?.lng;
      if ((!unitLat || !unitLng) && roomObj?.mapsUrl) {
        const m = roomObj.mapsUrl.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
        if (m) {
          unitLat = parseFloat(m[1]);
          unitLng = parseFloat(m[2]);
        }
      }
      const resolvedLat = unitLat || currentHotel.coords?.lat || 41.0054;
      const resolvedLng = unitLng || currentHotel.coords?.lng || 28.9768;
      const resolvedAddress =
        roomObj?.locationAddress ||
        currentHotel.address ||
        `${currentHotel.district}, İstanbul`;

      const res = await authFetch('/api/whatsapp/send-reservation-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message: cleanBody,
          sendLocationPin,
          latitude: resolvedLat,
          longitude: resolvedLng,
          locationName: `${currentHotel.name} — Birim ${whatsappModalRoom}`,
          locationAddress: resolvedAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const nowIso = new Date().toISOString();
        const existingState = roomStates[whatsappModalRoom] || { status: 'reserved' };
        const nextState: RoomStateInfo = {
          ...existingState,
          guest: whatsappRecipientName || existingState.guest || '',
          guestPhone: cleanPhone,
          whatsappConfirmedAt: nowIso,
        };
        setRoomStates((prev) => ({
          ...prev,
          [whatsappModalRoom]: nextState,
        }));
        XeniosStore.updateRoomState(currentHotel.id, whatsappModalRoom, nextState);

        toast.success(
          `Rezervasyon teyit mesajı 0850 Comus WhatsApp hattından (${cleanPhone}) numarasına başarıyla gönderildi!`
        );
        setWhatsappModalRoom(null);
      } else {
        toast.error(
          data?.error ||
            'WhatsApp mesajı gönderilemedi. Lütfen telefon numarasını kontrol edin.'
        );
      }
    } catch {
      toast.error('WhatsApp gönderimi sırasında bağlantı hatası oluştu.');
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  if (!currentHotel) return null;

  const filteredRooms = (currentHotel.rooms || []).filter((r) => {
    const state = roomStates[r.number]?.status || 'clean';
    const guestStr =
      state === 'occupied' || state === 'reserved' ? roomStates[r.number]?.guest || '' : '';
    const phoneStr =
      state === 'occupied' || state === 'reserved' ? roomStates[r.number]?.guestPhone || '' : '';
    const matchesStatus = selectedStatus === 'all' || state === selectedStatus;
    const matchesSearch =
      !search ||
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      guestStr.toLowerCase().includes(search.toLowerCase()) ||
      phoneStr.toLowerCase().includes(search.toLowerCase());
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
            Birimleri rezerve edin, misafir iletişim bilgilerini kaydedin ve 0850 Comus WhatsApp hattından tek tıkla rezervasyon teyit & karşılama mesajı gönderin.
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
            placeholder="Birim no, misafir adı veya telefon ara..."
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
                <div className="space-y-1.5">
                  {hasGuestName ? (
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
                      {state.guestPhone && (
                        <div className="text-zinc-700 text-[9px] truncate mt-0.5 font-mono">
                          📞 {state.guestPhone}
                        </div>
                      )}
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
                      <span>{state.status === 'reserved' ? 'Rezerve Bilgisi Gir' : 'Misafir Bilgisi Gir'}</span>
                    </button>
                  )}

                  {/* Quick WhatsApp Confirmation Trigger Button on Card */}
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsappWindowForRoom(
                        room.number,
                        state.guest || '',
                        state.guestPhone || '',
                        state.checkout || ''
                      )
                    }
                    className={`w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[9.5px] font-bold transition cursor-pointer border ${
                      state.whatsappConfirmedAt
                        ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    }`}
                    title="0850 Comus WhatsApp Rezervasyon Teyit & Karşılama Mesajı Gönder"
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {state.whatsappConfirmedAt ? 'Teyit Gönderildi (Tekrar)' : 'WhatsApp Teyit Mesajı'}
                    </span>
                  </button>
                </div>
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

      {/* STEP 1 MODAL: Rezervasyon & Misafir İletişim Bilgisi Modalı */}
      {editingRoomNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="luxury-service-card w-full max-w-md rounded-2xl p-5 shadow-2xl border border-amber-300 bg-[#FAF6EC] text-zinc-900 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-900">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Birim {editingRoomNumber} —{' '}
                    {editingStatus === 'reserved' ? 'Rezervasyon & İletişim Bilgisi' : 'Konaklayan Misafir Bilgisi'}
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    Misafir adını ve iletişim numarasını girerek rezervasyonu kaydedin.
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
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Misafir İletişim / WhatsApp Telefon Numarası</span>
                </label>
                <input
                  type="tel"
                  value={guestPhoneInput}
                  onChange={(e) => setGuestPhoneInput(e.target.value)}
                  placeholder="Örn: 0532 580 96 76"
                  className="w-full px-3.5 py-2.5 text-[16px] bg-white/90 border border-amber-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Giriş - Çıkış Saatleri / Rezervasyon Notu</span>
                </label>
                <input
                  type="text"
                  value={checkoutInput}
                  onChange={(e) => setCheckoutInput(e.target.value)}
                  placeholder="Örn: Giriş: 14:00 · Çıkış: 12:00"
                  className="w-full px-3.5 py-2.5 text-[16px] bg-white/90 border border-amber-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* WhatsApp Rezervasyon Teyit Mesajı Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-300 bg-emerald-50/75 hover:bg-emerald-50 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={openWhatsappAfterSave}
                  onChange={(e) => setOpenWhatsappAfterSave(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>WhatsApp Rezervasyon Teyit Mesajı Gönder</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-snug">
                    Kaydettiğinizde otomatik mesaj penceresi açılır; 0850 Comus hattından konum, Wi-Fi şifresi, giriş-çıkış bilgileri ve Purely Istanbul tanıtım linkini içeren mesaj gönderebilirsiniz.
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={() => setEditingRoomNumber(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-600 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {openWhatsappAfterSave
                      ? 'Rezervasyonu Kaydet & Mesaj Penceresini Aç'
                      : 'Rezervasyonu Kaydet'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2 MODAL: Otomatik WhatsApp Rezervasyon Teyit & Bilgi Mesajı Penceresi */}
      {whatsappModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="luxury-service-card w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-amber-300 bg-[#FAF6EC] text-zinc-900 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-amber-200/80 pb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                      WhatsApp Rezervasyon Teyit & Karşılama Mesajı
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                      0850 308 59 06 · Comus Hattı
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Birim {whatsappModalRoom} misafirine hazır taslaklardan seçerek veya yeni mesaj oluşturarak rezervasyon onayı, konum, Wi-Fi ve Purely Istanbul bağlantısını iletin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalRoom(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-amber-100/60 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsappConfirmation} className="space-y-4">
              {/* Recipient Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/70 p-3 rounded-xl border border-amber-200/90">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Misafir Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={whatsappRecipientName}
                    onChange={(e) => setWhatsappRecipientName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-3 py-2 text-[16px] sm:text-xs bg-white border border-amber-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Misafir WhatsApp Telefon Numarası *
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsappPhoneInput}
                    onChange={(e) => setWhatsappPhoneInput(e.target.value)}
                    placeholder="Örn: 0532 580 96 76"
                    className="w-full px-3 py-2 text-[16px] sm:text-xs bg-white border border-emerald-400 rounded-lg text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Ready-Made Templates Selector + New Message Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-800">
                    Hazır Mesaj Taslakları
                  </label>
                  <button
                    type="button"
                    onClick={handleStartNewCustomMessage}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border ${
                      isCustomNewMessage
                        ? 'bg-amber-500 text-zinc-950 border-amber-600 shadow-2xs'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Mesaj Oluştur</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {templates.map((tpl) => {
                    const isSelected = !isCustomNewMessage && selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-emerald-50/95 border-emerald-500 text-emerald-950 shadow-2xs'
                            : 'bg-white/80 hover:bg-amber-50/70 border-amber-200/90 text-zinc-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-emerald-600' : 'text-zinc-400'
                            }`}
                          />
                          <span className="text-xs font-semibold truncate">{tpl.title}</span>
                        </button>
                        {!tpl.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition cursor-pointer shrink-0"
                            title="Taslağı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info Insertion Pills & Editable Message Area */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-zinc-800">
                    Gönderilecek Mesaj İçeriği (Düzenlenebilir)
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertSnippetIntoMessage('wifi')}
                      className="px-2 py-0.5 rounded-md bg-amber-100/80 hover:bg-amber-200/80 text-[10px] font-bold text-amber-950 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Wifi className="w-3 h-3" />
                      <span>+ Wi-Fi Şifresi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippetIntoMessage('location')}
                      className="px-2 py-0.5 rounded-md bg-amber-100/80 hover:bg-amber-200/80 text-[10px] font-bold text-amber-950 flex items-center gap-1 cursor-pointer transition"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>+ Konum</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippetIntoMessage('checkin')}
                      className="px-2 py-0.5 rounded-md bg-amber-100/80 hover:bg-amber-200/80 text-[10px] font-bold text-amber-950 flex items-center gap-1 cursor-pointer transition"
                    >
                      <CalendarClock className="w-3 h-3" />
                      <span>+ Giriş/Çıkış</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippetIntoMessage('purely')}
                      className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-[10px] font-bold text-emerald-950 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>+ Purely Istanbul Linki</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={whatsappMessageBody}
                  onChange={(e) => setWhatsappMessageBody(e.target.value)}
                  className="w-full p-3 text-[16px] sm:text-xs leading-relaxed bg-white border border-amber-300 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              {/* Options: Save as Template & Send Location Pin */}
              <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-amber-200/80">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendLocationPin}
                    onChange={(e) => setSendLocationPin(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    Mesajla birlikte etkileşimli WhatsApp Harita Konum Pinini de gönder
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsNewTemplate}
                    onChange={(e) => setSaveAsNewTemplate(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <BookmarkPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Bu mesajı hazır mesaj taslaklarıma kaydet</span>
                </label>

                {saveAsNewTemplate && (
                  <div className="pt-1 pl-6">
                    <input
                      type="text"
                      value={newTemplateTitle}
                      onChange={(e) => setNewTemplateTitle(e.target.value)}
                      placeholder="Yeni Taslak Başlığı (Örn: VIP Misafir Karşılama Mesajım)"
                      className="w-full px-3 py-1.5 text-[16px] sm:text-xs bg-white border border-amber-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Submit / Cancel Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={() => setWhatsappModalRoom(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-700 bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSendingWhatsapp}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSendingWhatsapp
                      ? 'Comus WhatsApp’tan Gönderiliyor...'
                      : 'Tamam — WhatsApp’tan Gönder'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
