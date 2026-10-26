"use client";

import { useState, useMemo } from 'react';
import { Booking, Experience, Hotel } from '@/lib/types';
import {
  TrendingUp,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock,
  DoorOpen,
  Search,
  ShoppingBag,
  Percent,
  ArrowUpRight,
  Building2,
} from 'lucide-react';

interface PartnerCommissionTrackerProps {
  hotel: Hotel;
  bookings: Booking[];
  experiences: Experience[];
}

const PARTNER_SHARE_RATE = 0.04; // %4 Konaklama Partneri Payı

function formatCurr(amount: number, currency: string = 'EUR'): string {
  const c = (currency || 'EUR').toUpperCase();
  const formatted = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (c === 'EUR' || c === '€') return `${formatted} €`;
  if (c === 'USD' || c === '$') return `${formatted} $`;
  return `${formatted} ₺`;
}

export function PartnerCommissionTracker({
  hotel,
  bookings,
  experiences,
}: PartnerCommissionTrackerProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  // Filter Istanbul page marketplace purchases (exclude in-room service requests and cancelled bookings)
  const marketplaceBookings = useMemo(() => {
    const valid = bookings.filter(
      (b) =>
        b &&
        b.status !== 'cancelled' &&
        !String(b.experienceId || '').startsWith('inroom_') &&
        Number(b.amount) > 0
    );

    const hotelMatched = valid.filter(
      (b) =>
        !b.hotelId ||
        b.hotelId === hotel.id ||
        (b.hotelName &&
          hotel.name &&
          b.hotelName.toLowerCase().includes(hotel.name.split(' ')[0].toLowerCase()))
    );

    const list = hotelMatched.length > 0 ? hotelMatched : valid;
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings, hotel.id, hotel.name]);

  // Enrich with category and 4% commission calculation
  const enrichedRows = useMemo(() => {
    return marketplaceBookings.map((bk) => {
      const exp = experiences.find((e) => e.id === bk.experienceId);
      const grossAmount = Number(bk.amount) || 0;
      const partnerShareAmount = Number((grossAmount * PARTNER_SHARE_RATE).toFixed(2));
      const isConfirmed =
        bk.status === 'confirmed' || bk.status === 'payment_success';

      return {
        ...bk,
        categoryLabel: exp?.category || 'İstanbul Deneyim & İlan',
        grossAmount,
        partnerShareAmount,
        isConfirmed,
      };
    });
  }, [marketplaceBookings, experiences]);

  // Unit-by-unit summary of 4% partner share
  const unitShareSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        roomNumber: string;
        purchaseCount: number;
        grossEUR: number;
        grossTRY: number;
        shareEUR: number;
        shareTRY: number;
      }
    >();

    for (const row of enrichedRows) {
      const rm = String(row.roomNumber || '101');
      const existing = map.get(rm) || {
        roomNumber: rm,
        purchaseCount: 0,
        grossEUR: 0,
        grossTRY: 0,
        shareEUR: 0,
        shareTRY: 0,
      };
      existing.purchaseCount += 1;
      const isTry =
        row.currency === '₺' ||
        row.currency?.toUpperCase() === 'TRY' ||
        row.currency?.toUpperCase() === 'TL';

      if (isTry) {
        existing.grossTRY += row.grossAmount;
        existing.shareTRY = Number((existing.shareTRY + row.partnerShareAmount).toFixed(2));
      } else {
        existing.grossEUR += row.grossAmount;
        existing.shareEUR = Number((existing.shareEUR + row.partnerShareAmount).toFixed(2));
      }
      map.set(rm, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, 'tr', { numeric: true })
    );
  }, [enrichedRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return enrichedRows.filter((r) => {
      if (selectedUnit !== 'all' && String(r.roomNumber) !== selectedUnit) return false;
      if (statusFilter === 'confirmed' && !r.isConfirmed) return false;
      if (statusFilter === 'pending' && r.isConfirmed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${r.roomNumber} ${r.guestName} ${r.experienceTitle} ${r.providerName} ${r.confirmationCode} ${r.categoryLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedRows, selectedUnit, statusFilter, searchQuery]);

  // Aggregate totals
  const totals = useMemo(() => {
    let grossEUR = 0;
    let grossTRY = 0;
    let totalShareEUR = 0;
    let totalShareTRY = 0;
    let confirmedShareEUR = 0;
    let confirmedShareTRY = 0;
    let pendingShareEUR = 0;
    let pendingShareTRY = 0;

    for (const r of enrichedRows) {
      const isTry =
        r.currency === '₺' ||
        r.currency?.toUpperCase() === 'TRY' ||
        r.currency?.toUpperCase() === 'TL';

      if (isTry) {
        grossTRY += r.grossAmount;
        totalShareTRY = Number((totalShareTRY + r.partnerShareAmount).toFixed(2));
        if (r.isConfirmed) {
          confirmedShareTRY = Number((confirmedShareTRY + r.partnerShareAmount).toFixed(2));
        } else {
          pendingShareTRY = Number((pendingShareTRY + r.partnerShareAmount).toFixed(2));
        }
      } else {
        grossEUR += r.grossAmount;
        totalShareEUR = Number((totalShareEUR + r.partnerShareAmount).toFixed(2));
        if (r.isConfirmed) {
          confirmedShareEUR = Number((confirmedShareEUR + r.partnerShareAmount).toFixed(2));
        } else {
          pendingShareEUR = Number((pendingShareEUR + r.partnerShareAmount).toFixed(2));
        }
      }
    }

    return {
      grossEUR,
      grossTRY,
      totalShareEUR,
      totalShareTRY,
      confirmedShareEUR,
      confirmedShareTRY,
      pendingShareEUR,
      pendingShareTRY,
      totalCount: enrichedRows.length,
    };
  }, [enrichedRows]);

  return (
    <div className="luxury-service-card w-full max-w-full box-border overflow-hidden p-4 sm:p-6 rounded-3xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(230,185,75,0.45)] pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="golden-pill-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[#2C1E0F] text-[10px] font-bold uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>%4 Konaklama Partneri Gelir Payı</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
              Otomatik Hakediş Hesaplama Aktif
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-slate-100">
            İstanbul Sayfası İlan Satın Almalarından %4 Konaklama Partneri Payı Takip Modülü
          </h2>
          <p className="text-xs text-zinc-600">
            QR okutarak Purely İstanbul PWA menüsüne giriş yapan misafirlerinizin, <strong>İstanbul</strong> sayfasında yayınlanan ilanlardan (yat turları, hamam &amp; spa, gurme restoranlar, VIP transfer, estetik &amp; wellness vb.) yaptığı her satın almadan işletmenize aktarılan <strong>net %4 gelir payını</strong> birim bazında canlı takip edin.
          </p>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full max-w-full box-border">
        {/* 1. Misafirlerin Toplam İstanbul İlan Harcaması */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] border-[1.5px] border-[rgba(230,185,75,0.55)] space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-zinc-700 gap-1">
            <span className="font-bold truncate">Misafir İlan Harcaması</span>
            <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
            {totals.grossEUR > 0 ? formatCurr(totals.grossEUR, 'EUR') : '0 €'}
            {totals.grossTRY > 0 ? ` + ${formatCurr(totals.grossTRY, 'TRY')}` : ''}
          </div>
          <span className="text-[10px] text-zinc-600 block">
            İstanbul sayfasından {totals.totalCount} satın alma işlemi
          </span>
        </div>

        {/* 2. Toplam %4 Konaklama Partneri Payı */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/85 border-[1.5px] border-emerald-300 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-emerald-950 gap-1">
            <span className="font-bold truncate">%4 Partner Hakedişiniz</span>
            <Percent className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-900">
            +{totals.totalShareEUR > 0 ? formatCurr(totals.totalShareEUR, 'EUR') : '0 €'}
            {totals.totalShareTRY > 0 ? ` + ${formatCurr(totals.totalShareTRY, 'TRY')}` : ''}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold block">
            Misafir harcamalarından net %4 pay
          </span>
        </div>

        {/* 3. Kesinleşen / Ödenmeye Hazır %4 Pay */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-sky-950 gap-1">
            <span className="font-bold truncate">Kesinleşen %4 Hakediş</span>
            <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-sky-900">
            {totals.confirmedShareEUR > 0 ? formatCurr(totals.confirmedShareEUR, 'EUR') : '0 €'}
            {totals.confirmedShareTRY > 0 ? ` + ${formatCurr(totals.confirmedShareTRY, 'TRY')}` : ''}
          </div>
          <span className="text-[10px] text-sky-800 block">
            Ödemesi tamamlanmış kesin hakediş
          </span>
        </div>

        {/* 4. Aktif Katkı Sağlayan Birimler */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[rgba(245,215,130,0.22)] border-[1.5px] border-[rgba(230,185,75,0.55)] space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-amber-950 gap-1">
            <span className="font-bold truncate">Pay Üreten Birimler</span>
            <DoorOpen className="w-4 h-4 text-amber-800 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-950">
            {unitShareSummaries.length} Birim
          </div>
          <span className="text-[10px] text-amber-800 block">
            QR okutarak ilan satın alan birimler
          </span>
        </div>
      </div>

      {/* Unit-by-Unit %4 Share Breakdown Pills */}
      {unitShareSummaries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-amber-700" />
              <span>Birim Bazlı %4 Hakediş Dağılımı (Filtrelemek için birime tıklayın)</span>
            </span>
            {selectedUnit !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedUnit('all')}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Tüm Birimleri Göster
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {unitShareSummaries.map((u) => {
              const active = selectedUnit === u.roomNumber;
              return (
                <button
                  key={u.roomNumber}
                  type="button"
                  onClick={() =>
                    setSelectedUnit(active ? 'all' : u.roomNumber)
                  }
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'bg-white/80 hover:bg-white border-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="golden-pill-badge px-2 py-0.5 rounded-full text-[11px] font-mono font-bold text-[#2C1E0F]">
                        Birim {u.roomNumber}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold">
                        {u.purchaseCount} Satın Alma
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">
                      Harcama:{' '}
                      {u.grossEUR > 0 ? formatCurr(u.grossEUR, 'EUR') : ''}
                      {u.grossEUR > 0 && u.grossTRY > 0 ? ' + ' : ''}
                      {u.grossTRY > 0 ? formatCurr(u.grossTRY, 'TRY') : ''}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-emerald-700 block">
                      %4 Partner Payı
                    </span>
                    <strong className="text-sm font-mono font-bold text-emerald-800">
                      +{u.shareEUR > 0 ? formatCurr(u.shareEUR, 'EUR') : ''}
                      {u.shareEUR > 0 && u.shareTRY > 0 ? ' + ' : ''}
                      {u.shareTRY > 0 ? formatCurr(u.shareTRY, 'TRY') : ''}
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-amber-200/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-[#FAF8F4] text-zinc-700 border-[#D8CBB8]'
            }`}
          >
            Tüm Satın Almalar ({enrichedRows.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            Kesinleşen Hakedişler
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            Provizyonda Bekleyenler
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Birim no, misafir veya ilan adı ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8CBB8] bg-[#FAF8F4] text-xs text-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Detailed Transaction Ledger with 4% Partner Share */}
      {filteredRows.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#FAF8F4] border border-dashed border-[#D8CBB8] text-zinc-500 space-y-1.5">
          <Percent className="w-7 h-7 mx-auto text-emerald-700/60" />
          <p className="text-xs font-semibold text-zinc-700">
            Seçili filtreye uygun İstanbul ilanı satın alma kaydı bulunamadı.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredRows.map((row) => (
            <div
              key={row.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white/85 border border-amber-200/90 hover:border-emerald-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="golden-pill-badge px-2.5 py-0.5 rounded-full text-[#2C1E0F] font-mono font-bold text-xs">
                    Birim {row.roomNumber || '101'}
                  </span>
                  <strong className="text-xs sm:text-sm font-bold text-zinc-900">
                    {row.experienceTitle}
                  </strong>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                    {row.categoryLabel}
                  </span>
                  {row.isConfirmed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>HAKEDİŞ KESİNLEŞTİ</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      <span>PROVİZYONDA</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-700">
                  Misafir: <strong>{row.guestName}</strong> ({row.guestCount} Kişi) · Tedarikçi:{' '}
                  <span className="font-medium">{row.providerName}</span> · Kod:{' '}
                  <span className="font-mono text-[11px]">{row.confirmationCode}</span>
                </p>

                <div className="text-[10.5px] font-mono text-zinc-500">
                  Satın Alma Tarihi: {row.bookingDate} {row.bookingTime}
                </div>
              </div>

              {/* Right Side: Gross Spend + 4% Partner Share */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/70">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-zinc-500 block">
                    Misafir Harcaması:{' '}
                    <strong className="font-mono text-zinc-800">
                      {formatCurr(row.grossAmount, row.currency)}
                    </strong>
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-right">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 block">
                    %4 Konaklama Partneri Payı
                  </span>
                  <strong className="text-sm sm:text-base font-mono font-bold text-emerald-900">
                    +{formatCurr(row.partnerShareAmount, row.currency)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
