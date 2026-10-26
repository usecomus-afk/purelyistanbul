"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest } from '@/lib/types';
import { getModuleConfig, formatFieldValue, resolvePricing } from '@/lib/service-modules';
import {
  BellRing,
  CheckCircle2,
  Check,
  Search,
  AlertTriangle,
  Trash2,
  Clock,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { FirestoreService } from '@/lib/firestore-service';
import { StaffWhatsappRoutingPanel } from '@/components/hotel/staff-whatsapp-routing-panel';
import { authFetch } from '@/lib/auth-fetch';
import { UserCheck, Phone } from 'lucide-react';

interface ParsedRequestView {
  deptBadge: string;
  timeLabel: string;
  mainTitle: string;
  categoryDeptLine: string;
  urgencyLine: string;
  isUrgent: boolean;
  noteLine: string;
  extraDetails: Array<{ label: string; value: string }>;
  folioLine: string | null;
  isPaidOnline: boolean;
}

function shortenDepartment(dept?: string): string {
  if (!dept) return 'Genel';
  const d = dept.trim();
  if (d.toLowerCase().includes('teknik')) return 'Teknik';
  if (d.toLowerCase().includes('mutfak') || d.toLowerCase().includes('room service')) return 'Mutfak';
  if (d.toLowerCase().includes('housekeeping')) return 'Housekeeping';
  if (d.toLowerCase().includes('concierge') || d.toLowerCase().includes('ulaşım')) return 'Concierge';
  if (d.toLowerCase().includes('ön büro') || d.toLowerCase().includes('resepsiyon')) return 'Ön Büro';
  if (d.toLowerCase().includes('çamaşırhane')) return 'Çamaşırhane';
  return d;
}

const PRIMARY_SUBJECT_KEYS = [
  'vehicleType',
  'category',
  'issueType',
  'breakfastType',
  'menuItems',
  'towelType',
  'pillowType',
  'setType',
  'drinkSelection',
  'changeType',
  'serviceType',
  'reason',
  'extensionUnit',
  'requestedTime',
];

const PRIMARY_SUBJECT_LABELS = [
  'Araç Tipi',
  'Sorun Kategorisi',
  'Sorun Türü',
  'Kahvaltı Türü',
  'Menü Seçimi',
  'Havlu Türü',
  'Yastık Türü',
  'Set Türü',
  'İçecek Seçimi',
  'Değişim Türü',
  'Hizmet Türü',
  'Temizlik Nedeni',
  'Uzatma Süresi (Gece/Gün)',
  'İstenen Çıkış Saati',
  'Seçenek',
];

const NOTE_LABELS = [
  'Sorun Açıklaması',
  'Detay Açıklaması',
  'Özel Not',
  'Özel Notlar',
  'Özel İstekler',
  'Not (Opsiyonel)',
  'Not',
  'Allerji Uyarıları',
];

function parseRequestForCard(req: ServiceRequest): ParsedRequestView {
  const config = getModuleConfig(req.serviceKey);
  const deptBadge = shortenDepartment(req.department || config?.department);

  // Format created time (e.g., "09:06")
  let createdClock = '';
  try {
    createdClock = new Date(req.createdAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    createdClock = '';
  }

  // Parse dot-separated req.notes if present
  const rawNotes = (req.notes || '').trim();
  let bracketPayment: string | null = null;
  const parsedPairs: Array<{ label: string; value: string }> = [];
  const plainChunks: string[] = [];

  if (rawNotes) {
    const parts = rawNotes.split(/\s*·\s*/);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      if (part.startsWith('[')) {
        // Reconstruct bracketed payment token if it was split on ' · '
        const remaining = parts.slice(i).join(' · ');
        const match = remaining.match(/^\[(.*?)\]/);
        if (match) {
          bracketPayment = match[1].trim();
          break;
        }
      }
      const colonIdx = part.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        const label = part.slice(0, colonIdx).trim();
        const value = part.slice(colonIdx + 1).trim();
        if (value && value !== '—') {
          parsedPairs.push({ label, value });
        }
      } else {
        plainChunks.push(part);
      }
    }
  }

  // If structured details exist and parsedPairs is empty, populate from config
  if (parsedPairs.length === 0 && config && req.details) {
    for (const f of config.fields) {
      if (f.type === 'display') continue;
      const val = formatFieldValue(f, req.details[f.key]);
      if (val && val !== '—') {
        parsedPairs.push({ label: f.label, value: val });
      }
    }
  }

  // Determine Primary Subject (Ana Başlık)
  let primarySubject = '';
  if (req.details && config) {
    for (const key of PRIMARY_SUBJECT_KEYS) {
      const val = req.details[key];
      if (Array.isArray(val) && val.length > 0) {
        primarySubject = val.join(', ');
        break;
      } else if (typeof val === 'string' && val.trim()) {
        primarySubject = val.trim();
        break;
      }
    }
  }
  if (!primarySubject) {
    const found = parsedPairs.find((p) =>
      PRIMARY_SUBJECT_LABELS.some((lbl) => lbl.toLowerCase() === p.label.toLowerCase())
    );
    if (found) primarySubject = found.value;
  }

  const mainTitle = primarySubject || req.serviceTitle || 'Misafir Talebi';
  const categoryDeptLine =
    primarySubject && req.serviceTitle && primarySubject !== req.serviceTitle
      ? `${req.serviceTitle} · ${deptBadge}`
      : req.department || deptBadge;

  // Determine Urgency & Delivery Time
  const urgencyPair = parsedPairs.find(
    (p) =>
      p.label.toLowerCase().includes('aciliyet') ||
      p.label.toLowerCase().includes('acil yardım')
  );
  const timePair = parsedPairs.find(
    (p) =>
      p.label.toLowerCase() === 'zaman' ||
      p.label.toLowerCase() === 'saat' ||
      p.label.toLowerCase() === 'teslimat zamanı'
  );

  const isUrgent =
    req.priority === 'acil' ||
    (urgencyPair?.value.toLowerCase().includes('acil') ?? false);
  const urgencyLine = urgencyPair?.value || (isUrgent ? 'Acil' : 'Standart');

  const timeLabel =
    timePair?.value && timePair.value.length <= 18
      ? `${createdClock} · ${timePair.value}`
      : createdClock;

  // Determine Note / Issue Description
  const notePair = parsedPairs.find((p) =>
    NOTE_LABELS.some((lbl) => lbl.toLowerCase() === p.label.toLowerCase())
  );
  const noteLine =
    notePair?.value ||
    (plainChunks.length > 0 ? plainChunks.join(', ') : '');

  // Remaining extra details (excluding what we already promoted to mainTitle, urgency, note, or time)
  const usedLabels = new Set<string>();
  if (primarySubject) {
    const pMatch = parsedPairs.find((p) => p.value === primarySubject);
    if (pMatch) usedLabels.add(pMatch.label.toLowerCase());
  }
  if (urgencyPair) usedLabels.add(urgencyPair.label.toLowerCase());
  if (notePair) usedLabels.add(notePair.label.toLowerCase());
  if (timePair && timePair.value.length <= 18) usedLabels.add(timePair.label.toLowerCase());

  const extraDetails = parsedPairs.filter(
    (p) => !usedLabels.has(p.label.toLowerCase())
  );

  // Determine Folio / Payment Line (e.g., "180 ₺ · Birim Folyosu")
  const currencySymbol =
    req.paymentCurrency === 'EUR'
      ? '€'
      : req.paymentCurrency === 'USD'
      ? '$'
      : '₺';

  let folioLine: string | null = null;
  const isPaidOnline = req.paymentStatus === 'paid_online';

  if (req.paymentAmount && req.paymentAmount > 0) {
    const amt = `${req.paymentAmount.toLocaleString('tr-TR')} ${currencySymbol}`;
    if (isPaidOnline) {
      folioLine = `${amt} · Online Ödendi${req.paymentReference ? ` (#${req.paymentReference})` : ''}`;
    } else {
      folioLine = `${amt} · Birim Folyosu`;
    }
  } else if (bracketPayment) {
    // Convert "[BİRİM FOLYOSU · 180 ₺]" -> "180 ₺ · Birim Folyosu"
    const subParts = bracketPayment.split(/\s*·\s*/);
    if (subParts.length >= 2) {
      const statusPart = subParts[0]
        .replace(/BİRİM FOLYOSU/i, 'Birim Folyosu')
        .replace(/ODA FOLYOSU/i, 'Birim Folyosu')
        .replace(/ONLİNE ÖDENDİ/i, 'Online Ödendi');
      const pricePart = subParts[1];
      const refPart = subParts[2] ? ` (${subParts[2]})` : '';
      folioLine = `${pricePart} · ${statusPart}${refPart}`;
    } else {
      folioLine = bracketPayment;
    }
  } else if (config && req.details) {
    // Check if module has a computed fee display field
    const feeField = config.fields.find(
      (f) => f.type === 'display' && (f.key === 'totalPrice' || f.key === 'fee' || f.key === 'priceEstimate' || f.key === 'feeEstimate')
    );
    if (feeField?.compute) {
      const computedFee = feeField.compute(req.details, resolvePricing(config));
      if (computedFee && !computedFee.toLowerCase().includes('ücretsiz')) {
        folioLine = `${computedFee} · Birim Folyosu`;
      }
    }
  }

  return {
    deptBadge,
    timeLabel,
    mainTitle,
    categoryDeptLine,
    urgencyLine,
    isUrgent,
    noteLine,
    extraDetails,
    folioLine,
    isPaidOnline,
  };
}

export default function HotelLiveRequestsPage() {
  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [hotelVersion, setHotelVersion] = useState(0);
  const [manualStaffAssign, setManualStaffAssign] = useState<Record<string, string>>({});
  const [forwardingReqId, setForwardingReqId] = useState<string | null>(null);

  const liveHotel = XeniosStore.getHotelById(currentHotel.id) || currentHotel;
  const staffList = Array.isArray(liveHotel.staffMembers)
    ? liveHotel.staffMembers.filter((s) => s.active)
    : [];
  const routingMap =
    liveHotel.departmentStaffRouting && typeof liveHotel.departmentStaffRouting === 'object'
      ? liveHotel.departmentStaffRouting
      : {};

  const handleForwardRequestToStaff = async (req: ServiceRequest, staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    const targetPhone =
      staff?.whatsappPhone || liveHotel.whatsappPhone || liveHotel.managerPhone || '';
    const targetName = staff?.name || liveHotel.managerName || 'Sorumlu Personel';
    if (!targetPhone) {
      toast.error('Sorumlu personelin WhatsApp numarası tanımlı değil.');
      return;
    }

    setForwardingReqId(req.id);
    try {
      const res = await authFetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_ALERT',
          phone: targetPhone,
          requestAlert: {
            requestId: req.id,
            hotelId: liveHotel.id,
            hotelName: liveHotel.name,
            roomNumber: req.roomNumber,
            serviceKey: req.serviceKey,
            serviceTitle: req.serviceTitle,
            notes: req.notes || '',
            department: req.department || 'Operasyon',
            priority: req.priority || 'standart',
          },
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(
          `📲 Birim ${req.roomNumber} talebi ${targetName} (${targetPhone}) WhatsApp hattına iletildi!`
        );
      } else {
        toast.error('WhatsApp mesajı gönderilemedi.');
      }
    } catch {
      toast.error('WhatsApp gönderimi sırasında bağlantı hatası oluştu.');
    } finally {
      setForwardingReqId(null);
    }
  };

  useEffect(() => {
    // Subscribe to Cloud Firestore in real-time across all devices and units!
    const unsubscribe = FirestoreService.subscribeToLiveRequests(null, (liveList) => {
      setRequests(liveList);
    });

    const handleLocalSync = () => {
      setRequests(XeniosStore.getRequests());
    };
    window.addEventListener('xenios_requests_updated', handleLocalSync);

    return () => {
      unsubscribe();
      window.removeEventListener('xenios_requests_updated', handleLocalSync);
    };
  }, [currentHotel.id]);

  const handleUpdateStatus = async (id: string, status: ServiceRequest['status']) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await FirestoreService.updateRequestStatus(id, status);
    toast.success('Talep durumu güncellendi.');
  };

  const handleDeleteRequest = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    await FirestoreService.deleteRequest(id);
    toast.success('Talep kalıcı olarak silindi.');
  };

  const handleClearCompleted = async () => {
    const completedIds = requests.filter((r) => r.status === 'completed').map((r) => r.id);
    if (completedIds.length === 0) return;
    setRequests((prev) => prev.filter((r) => r.status !== 'completed'));
    await Promise.all(completedIds.map((id) => FirestoreService.deleteRequest(id)));
    toast.success('Tamamlanan eski talepler temizlendi.');
  };

  const filtered = requests.filter((r) => {
    const matchesDept = filterDept === 'all' || (r.department && r.department.toLowerCase().includes(filterDept.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = !search ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(search.toLowerCase())) ||
      (r.serviceTitle && r.serviceTitle.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesDept && matchesStatus && matchesSearch;
  });

  const completedCount = requests.filter((r) => r.status === 'completed').length;

  return (
    <div className="w-full max-w-full min-w-0 box-border overflow-x-hidden space-y-5 text-zinc-900 dark:text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4 w-full box-border">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
            <span className="golden-pill-badge text-[10px] text-[#2C1E0F] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider whitespace-normal break-words">
              {currentHotel.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1 whitespace-normal break-words">
            Canlı Misafir Talepleri
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5 whitespace-normal break-words">
            Konaklama birimlerinden gelen QR taleplerini sesli uyarı ve canlı ekran bildirimleriyle takip edin.
          </p>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={handleClearCompleted}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Tamamlananları Temizle ({completedCount})</span>
          </button>
        )}
      </div>

      {/* Sorumlu Personel Kaydı & Otomatik WhatsApp Yönlendirme Masası */}
      <StaffWhatsappRoutingPanel
        hotel={liveHotel}
        defaultExpanded={false}
        onUpdated={() => setHotelVersion((v) => v + 1)}
      />

      {/* Filters Bar — 100% width, zero horizontal scroll */}
      <div
        className="w-full box-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5"
        style={{
          background: 'rgba(245, 215, 130, 0.22)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(230, 185, 75, 0.5)',
          borderRadius: '16px',
        }}
      >
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Birim no, hizmet adı veya not ara..."
            className="w-full flex-1 min-w-0 box-border pl-9 pr-3 py-2 text-[16px] md:text-sm bg-white/75 border border-amber-300/80 rounded-xl text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto box-border">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full sm:w-auto min-w-0 text-[16px] md:text-sm bg-white/75 border border-amber-300/80 text-zinc-800 font-medium rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer box-border"
          >
            <option value="all">Tüm Departmanlar</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Mutfak">Kahvaltı & Yeme-İçme</option>
            <option value="Resepsiyon">Danışma / Ön Büro</option>
            <option value="Teknik">Teknik Servis</option>
            <option value="Concierge">Concierge & Taksi</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto min-w-0 text-[16px] md:text-sm bg-white/75 border border-amber-300/80 text-zinc-800 font-medium rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer box-border"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekleyenler</option>
            <option value="in_progress">İşlemdekiler</option>
            <option value="completed">Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* Requests List — Vertical Sectioned Mobile Cards */}
      <div className="space-y-3.5 w-full box-border">
        {filtered.length === 0 ? (
          <div
            className="w-full box-border p-10 text-center text-zinc-700 space-y-2"
            style={{
              background: 'rgba(245, 215, 130, 0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(230, 185, 75, 0.5)',
              borderRadius: '16px',
            }}
          >
            <BellRing className="w-8 h-8 mx-auto text-amber-800/70" />
            <p className="text-xs font-semibold whitespace-normal break-words">
              Şu anda bekleyen veya filtrelere uyan talep bulunmuyor.
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const isCompleted = req.status === 'completed';
            const parsed = parseRequestForCard(req);

            return (
              <article
                key={req.id}
                className={`w-full box-border flex flex-col gap-3 transition whitespace-normal break-words ${
                  isCompleted ? 'opacity-85' : ''
                }`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(245, 215, 130, 0.22)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: parsed.isUrgent && !isCompleted
                    ? '1.5px solid rgba(220, 38, 38, 0.65)'
                    : '1.5px solid rgba(230, 185, 75, 0.5)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.08)',
                }}
              >
                {/* =========================================================
                    A) ÜST BİLGİ SATIRI (HEADER)
                    Sol: Oda/Birim Rozeti & Departman Rozeti
                    Sağ: Talep Saati & Çöp Kutusu İkonu
                ========================================================= */}
                <div className="flex items-center justify-between w-full gap-2 pb-2.5 border-b border-amber-700/20">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="golden-pill-badge px-2.5 py-1 rounded-lg text-[#2C1E0F] font-mono font-bold text-xs leading-none">
                      Birim {req.roomNumber}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/70 border border-amber-600/35 text-[#2C1E0F] font-semibold text-[11px] leading-none">
                      {parsed.deptBadge}
                    </span>
                    {parsed.isUrgent && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold text-[10px] border border-red-300 inline-flex items-center gap-1 leading-none">
                        <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                        <span>ACİL</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#3A2A18] bg-white/60 px-2 py-1 rounded-lg border border-amber-600/25">
                      <Clock className="w-3 h-3 text-amber-800 shrink-0" />
                      <span>{parsed.timeLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req.id)}
                      title="Talebi Sil"
                      aria-label="Talebi Sil"
                      className="p-1.5 rounded-lg bg-red-50/90 hover:bg-red-100 text-red-700 border border-red-200/90 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* =========================================================
                    B) TALEP VE DETAY ALANI (BODY)
                    - Ana Başlık: Tek başına kalın (bold) satırda
                    - Detaylar: 2 sütunlu kompakt grid / alt alta
                ========================================================= */}
                <div className="flex flex-col gap-2.5 w-full min-w-0">
                  {/* Ana Başlık */}
                  <h2 className="text-[15px] sm:text-base font-bold text-[#1A1A1A] leading-snug whitespace-normal break-words">
                    {parsed.mainTitle}
                  </h2>

                  {/* Detaylar Grid (2 Sütunlu Kompakt Mimari) */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {/* Kategori / Departman */}
                    <div className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                        Kategori / Departman
                      </span>
                      <span className="block text-xs font-bold text-[#1F1912] mt-0.5 whitespace-normal break-words">
                        {parsed.categoryDeptLine}
                      </span>
                    </div>

                    {/* Aciliyet Derecesi */}
                    <div className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                        Aciliyet Derecesi
                      </span>
                      <span
                        className={`block text-xs font-bold mt-0.5 whitespace-normal break-words ${
                          parsed.isUrgent ? 'text-red-700' : 'text-[#1F1912]'
                        }`}
                      >
                        {parsed.urgencyLine}
                      </span>
                    </div>

                    {/* Ek Modül Detayları (Varsa: Başlangıç/Varış, Yolcu, Adet, Durum vb.) */}
                    {parsed.extraDetails.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx}`}
                        className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0"
                      >
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638] whitespace-normal break-words">
                          {item.label}
                        </span>
                        <span className="block text-xs font-bold text-[#1F1912] mt-0.5 whitespace-normal break-words">
                          {item.value}
                        </span>
                      </div>
                    ))}

                    {/* Sorun Açıklaması / Misafir Notu (Tam Genişlik) */}
                    {parsed.noteLine && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-white/65 border border-amber-600/30 min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                          Sorun Açıklaması / Misafir Notu
                        </span>
                        <p className="text-xs font-medium text-[#1F1912] mt-0.5 leading-relaxed whitespace-normal break-words">
                          {parsed.noteLine}
                        </p>
                      </div>
                    )}

                    {/* Tutar / Folyo Bilgisi (Tam Genişlik) */}
                    {parsed.folioLine && (
                      <div
                        className={`col-span-2 p-2.5 rounded-xl border flex items-center justify-between gap-2 min-w-0 ${
                          parsed.isPaidOnline
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                            : 'bg-amber-100/75 border-amber-400/70 text-[#2C1E0F]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span>Tutar / Folyo Bilgisi</span>
                        </span>
                        <span className="text-xs font-bold font-mono whitespace-normal break-words text-right">
                          {parsed.folioLine}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* =========================================================
                    C) EYLEM BUTONLARI SATIRI (FOOTER)
                    Esnek (flex-wrap: wrap; gap: 8px;), sağa/tam genişliğe hizalı
                ========================================================= */}
                {/* Sorumlu Personel Seçimi & Tek Tıkla WhatsApp Yönlendirme Satırı */}
                <div className="p-2.5 rounded-xl bg-white/70 border border-amber-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-bold text-[#2C1E0F] shrink-0">
                      Sorumlu Personel:
                    </span>
                    <select
                      value={
                        manualStaffAssign[req.id] ||
                        routingMap[parsed.deptBadge] ||
                        'default_manager'
                      }
                      onChange={(e) =>
                        setManualStaffAssign((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-0 p-1.5 rounded-lg bg-amber-50/70 border border-amber-300 text-[11px] font-bold text-zinc-900 cursor-pointer"
                    >
                      <option value="default_manager">
                        Genel Sorumlu ({liveHotel.managerName || 'Yönetici'} ·{' '}
                        {!liveHotel.modules?.hideDefaultManager ? (liveHotel.whatsappPhone || liveHotel.managerPhone || 'Ana Hat') : 'Seçiniz'})
                      </option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} — {st.roleTitle} ({st.whatsappPhone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleForwardRequestToStaff(
                        req,
                        manualStaffAssign[req.id] ||
                          routingMap[parsed.deptBadge] ||
                          'default_manager'
                      )
                    }
                    disabled={forwardingReqId === req.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                  >
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>
                      {forwardingReqId === req.id
                        ? 'İletiliyor...'
                        : 'WhatsApp ile Personele İlet'}
                    </span>
                  </button>
                </div>

                <div className="pt-2.5 border-t border-amber-700/20 flex flex-wrap items-center justify-end gap-2 w-full">
                  {req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                      className="flex-1 sm:flex-initial px-3.5 py-2 bg-white/85 hover:bg-white text-[#2C1E0F] border border-amber-600/40 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                    >
                      İşleme Al
                    </button>
                  )}

                  {req.status !== 'completed' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'completed')}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Tamamlandı</span>
                    </button>
                  ) : (
                    <span className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50/95 text-emerald-800 font-bold text-xs border border-emerald-300 inline-flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tamamlandı</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(req.id)}
                    className="px-3.5 py-2 rounded-xl bg-red-50/95 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Sil</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

