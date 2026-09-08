"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest } from '@/lib/types';
import {
  BellRing,
  CheckCircle2,
  Check,
  Search,
  AlertTriangle
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
    // Subscribe to Cloud Firestore in real-time across all devices!
    const unsubscribe = FirestoreService.subscribeToLiveRequests(currentHotel.id, (liveList) => {
      setRequests(liveList);
    });

    return () => {
      unsubscribe();
    };
  }, [currentHotel.id]);

  const handleUpdateStatus = async (id: string, status: ServiceRequest['status']) => {
    await FirestoreService.updateRequestStatus(id, status);
    toast.success('Talep durumu güncellendi.');
  };

  const filtered = requests.filter((r) => {
    const matchesDept = filterDept === 'all' || (r.department && r.department.toLowerCase().includes(filterDept.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = !search ||
      r.roomNumber.includes(search) ||
      r.serviceTitle.toLowerCase().includes(search.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-zinc-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 mt-1">
            Canlı Oda Talepleri & Kat Hizmetleri Masası
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Misafir odalarından gelen QR taleplerini sesli uyarı ve canlı ekran bildirimleriyle takip edin.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Oda no, hizmet adı veya not ara..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-amber-50/40 border border-amber-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs bg-white border border-amber-200 text-zinc-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Departmanlar</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Mutfak">Room Service / Mutfak</option>
            <option value="Resepsiyon">Resepsiyon</option>
            <option value="Teknik">Teknik Servis</option>
            <option value="Concierge">Concierge & Taksi</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-amber-200 text-zinc-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
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
          <div className="p-12 text-center bg-white rounded-3xl border border-amber-200 text-zinc-500 space-y-2 shadow-xs">
            <BellRing className="w-8 h-8 mx-auto text-amber-600/60" />
            <p className="text-xs font-semibold">Şu anda bekleyen veya filtrelere uyan talep bulunmuyor.</p>
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                req.status === 'completed'
                  ? 'bg-white/70 border-zinc-200 opacity-75'
                  : req.priority === 'acil'
                  ? 'bg-red-50/50 border-red-300 shadow-xs'
                  : 'bg-white border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-mono font-bold text-xs border border-amber-300">
                    Oda {req.roomNumber}
                  </span>
                  <strong className="text-sm font-bold text-zinc-900">{req.serviceTitle}</strong>
                  
                  {req.priority === 'acil' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" /> ACİL
                    </span>
                  )}
                  {req.department && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 font-semibold">
                      {req.department}
                    </span>
                  )}
                </div>

                {req.notes && (
                  <p className="text-xs text-zinc-700 leading-relaxed pl-1">
                    {req.notes}
                  </p>
                )}

                <div className="text-[10px] text-zinc-500 flex items-center gap-2 pl-1 font-mono">
                  <span>Talep Zamanı: {new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {req.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    İşleme Al
                  </button>
                )}

                {req.status !== 'completed' && (
                  <button
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
