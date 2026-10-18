"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest } from '@/lib/types';
import {
  BellRing,
  CheckCircle2,
  Check,
  Search,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { FirestoreService } from '@/lib/firestore-service';

export default function HotelLiveRequestsPage() {
  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

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
      (r.roomNumber && r.roomNumber.includes(search)) ||
      (r.serviceTitle && r.serviceTitle.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesDept && matchesStatus && matchesSearch;
  });

  const completedCount = requests.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1">
            Canlı Misafir Talepleri
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            Konaklama birimlerinden gelen QR taleplerini sesli uyarı ve canlı ekran bildirimleriyle takip edin.
          </p>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={handleClearCompleted}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tamamlananları Temizle ({completedCount})</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 dark:border-slate-800 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Birim no, hizmet adı veya not ara..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 text-zinc-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Departmanlar</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Mutfak">Kahvaltı & Yeme-İçme / Mutfak</option>
            <option value="Resepsiyon">Danışma / Resepsiyon</option>
            <option value="Teknik">Teknik Servis</option>
            <option value="Concierge">Concierge & Taksi</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 text-zinc-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekleyenler</option>
            <option value="in_progress">İşlemdekiler</option>
            <option value="completed">Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200 text-zinc-500 dark:text-slate-400 space-y-2 shadow-xs">
            <BellRing className="w-8 h-8 mx-auto text-amber-600/60" />
            <p className="text-xs font-semibold">Şu anda bekleyen veya filtrelere uyan talep bulunmuyor.</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isCompleted = req.status === 'completed';
            const cardContent = (
              <div
                className={`p-4 rounded-2xl transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs min-w-full shrink-0 snap-start ${
                  isCompleted
                    ? 'bg-white/70 opacity-80 border-none'
                    : req.priority === 'acil'
                    ? 'bg-red-50/50 border border-red-300 shadow-xs'
                    : 'bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 hover:border-amber-400'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1 relative">
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(req.id);
                      }}
                      className="absolute top-0 right-0 sm:hidden flex items-center gap-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-full shadow-2xs cursor-pointer z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[10px] font-bold">Sil</span>
                    </button>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pr-14 sm:pr-0">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-mono font-bold text-xs border border-amber-300">
                      Birim {req.roomNumber}
                    </span>
                    {req.hotelName && (
                      <span className="px-2.5 py-0.5 rounded-xl bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200">
                        {req.hotelName}
                      </span>
                    )}
                    <strong className="text-sm font-bold text-zinc-900 dark:text-slate-100">{req.serviceTitle}</strong>
                    
                    {req.priority === 'acil' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" /> ACİL
                      </span>
                    )}
                    {req.department && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 dark:text-slate-400 font-semibold">
                        {req.department}
                      </span>
                    )}
                    {req.paymentStatus === 'paid_online' && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold flex items-center gap-1 shadow-2xs">
                        <CreditCard className="w-3 h-3 text-emerald-700" />
                        ONLİNE ÖDENDİ
                        {req.paymentAmount ? ` · ${req.paymentAmount.toLocaleString('tr-TR')} ${req.paymentCurrency === 'EUR' ? '€' : req.paymentCurrency === 'USD' ? '$' : '₺'}` : ''}
                        {req.paymentReference ? ` (#${req.paymentReference})` : ''}
                      </span>
                    )}
                    {req.paymentStatus !== 'paid_online' && req.paymentAmount && req.paymentAmount > 0 && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                        BİRİM FOLYOSU · {req.paymentAmount.toLocaleString('tr-TR')} {req.paymentCurrency === 'EUR' ? '€' : req.paymentCurrency === 'USD' ? '$' : '₺'}
                      </span>
                    )}
                  </div>

                  {req.notes && (
                    <p className="text-xs text-zinc-700 leading-relaxed pl-1">
                      {req.notes}
                    </p>
                  )}

                  <div className="text-[10px] text-zinc-500 dark:text-slate-400 flex items-center gap-2 pl-1 font-mono">
                    <span>Talep Zamanı: {new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      İşleme Al
                    </button>
                  )}

                  {req.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.id, 'completed')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Çözüldü</span>
                    </button>
                  )}

                  {req.status === 'completed' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tamamlandı</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            );

            if (isCompleted) {
              return (
                <div key={req.id} className="relative rounded-2xl overflow-hidden group border border-zinc-200">
                  <div className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cardContent}
                    
                    {/* Delete Button Area (snap-end) */}
                    <button
                      type="button"
                      className="w-24 shrink-0 snap-end flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                      onClick={() => handleDeleteRequest(req.id)}
                    >
                      <div className="flex flex-col items-center justify-center text-white gap-1">
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold tracking-wider">SİL</span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            }

            return <div key={req.id}>{cardContent}</div>;
          })
        )}
      </div>
    </div>
  );
}
