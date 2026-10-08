"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Complaint, ComplaintStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Clock, 
  Send, 
  Building2, 
  User, 
  CreditCard,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';


export default function CockpitComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | ComplaintStatus>('all');
  const [selectedComp, setSelectedComp] = useState<Complaint | null>(null);

  const refreshData = () => {
    setComplaints(XeniosStore.getComplaints());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xenios_complaints_updated', refreshData);
    window.addEventListener('xenios_demo_updated', refreshData);
    return () => {
      window.removeEventListener('xenios_complaints_updated', refreshData);
      window.removeEventListener('xenios_demo_updated', refreshData);
    };
  }, []);

  const handleSendEmail = (comp: Complaint) => {
    XeniosStore.updateComplaintStatus(
      comp.id, 
      'contacted_business', 
      'İşletmeye 30 günlük resmi uzlaşma ve fark iadesi talep yazısı e-posta ile iletildi.'
    );
    toast.success(`${comp.businessName} işletmesine resmi hakem inceleme yazısı gönderildi.`);
    refreshData();
  };

  const handleResolveRefund = (comp: Complaint) => {
    XeniosStore.updateComplaintStatus(
      comp.id, 
      'resolved_refunded', 
      'İşletme hatayı kabul etti ve fark tutarını misafirin hesabına iade etti. Dosya uzlaşmayla kapatıldı.',
      false
    );
    toast.success("Mağduriyet telafi edildi ve dosya başarıyla kapatıldı.");
    refreshData();
  };

  const handlePublishBlacklist = (comp: Complaint) => {
    XeniosStore.updateComplaintStatus(
      comp.id, 
      'published_blacklisted', 
      '30 gün boyunca iyi niyet gösterilmedi veya telafi reddedildi. İşletme Xenios Uyarı Panosu\'nda yayınlandı.',
      true
    );
    toast.error("İşletme kamuya açık Uyarı Panosu'na eklendi.");
    refreshData();
  };

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-700" />
            <span>Misafir Hakları & Hakem Masası</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">İstanbul Misafirlerinin Fahiş Fiyat, Aldatma ve Mağduriyet Dosyaları</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase">Toplam Dosya</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{complaints.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase">İncelemede</span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">
            {complaints.filter(c => c.status === 'under_review').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-emerald-200/80 shadow-xs">
          <span className="text-[10px] text-emerald-700 font-bold uppercase">İade Edilenler</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {complaints.filter(c => c.status === 'resolved_refunded').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-red-200/80 shadow-xs">
          <span className="text-[10px] text-red-700 font-bold uppercase">Kara Liste</span>
          <div className="text-xl font-bold text-red-700 mt-1 font-mono">
            {complaints.filter(c => c.status === 'published_blacklisted').length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'under_review', label: 'İncelemede' },
          { id: 'contacted_business', label: 'İşletmeyle Temasta' },
          { id: 'resolved_refunded', label: 'İade Edildi / Çözüldü' },
          { id: 'published_blacklisted', label: 'Uyarı Panosu / Kara Liste' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              filter === tab.id
                ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-600 dark:text-slate-400 hover:bg-amber-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200 text-zinc-500 dark:text-slate-400">
            Filtreye uygun şikayet veya mağduriyet kaydı bulunmuyor.
          </div>
        ) : (
          filtered.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 hover:border-amber-400 shadow-xs transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {comp.trackingCode}
                    </span>
                    <strong className="text-base text-zinc-900 dark:text-slate-100 font-bold">{comp.businessName}</strong>
                    <span className="text-[10px] text-zinc-500 dark:text-slate-400 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                      {comp.businessCategory}
                    </span>
                    
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-slate-400 flex items-center gap-2">
                    <span>{comp.location}</span>
                    <span>•</span>
                    <span>Olay Tarihi: {comp.incidentDate}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-zinc-500 dark:text-slate-400">Talep Edilen Fark:</div>
                  <strong className="text-base font-mono font-bold text-red-600">
                    {comp.discrepancyAmount} {comp.currency}
                  </strong>
                  <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">
                    (Ödenen: {comp.amountPaid} {comp.currency} / Normal: {comp.amountExpected} {comp.currency})
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs text-zinc-700 leading-relaxed">
                <strong className="text-zinc-900 dark:text-slate-100 block font-bold mb-0.5">Misafir Beyanı:</strong>
                {comp.description}
              </div>

              {/* Guest & Hotel Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                <div className="space-y-0.5">
                  <span className="text-zinc-500 dark:text-slate-400 text-[10px]">Misafir İletişim:</span>
                  <div className="font-bold text-zinc-900 dark:text-slate-100">{comp.guestName}</div>
                  <div className="text-zinc-500 dark:text-slate-400 font-mono text-[11px]">{comp.guestEmail} • {comp.guestPhone}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-zinc-500 dark:text-slate-400 text-[10px]">Konaklanan Tesis:</span>
                  <div className="font-bold text-zinc-900 dark:text-slate-100">{comp.hotelName}</div>
                  <div className="text-zinc-500 dark:text-slate-400 font-mono text-[11px]">Oda {comp.roomNumber}</div>
                </div>
              </div>

              {/* Official Response if any */}
              {comp.businessResponse && (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs text-blue-950">
                  <strong className="text-blue-900 block font-bold mb-0.5">Hakem Masası Süreci:</strong>
                  {comp.businessResponse}
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    comp.status === 'resolved_refunded'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : comp.status === 'published_blacklisted'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : comp.status === 'contacted_business'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {comp.status === 'resolved_refunded' ? '✓ İade Edildi / Çözüldü' :
                     comp.status === 'published_blacklisted' ? '⚠️ Kara Liste / Yayınlandı' :
                     comp.status === 'contacted_business' ? 'İşletmeyle Temasta' : 'İncelemede'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendEmail(comp)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-zinc-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-zinc-600 dark:text-slate-400" />
                    <span>Resmi Yazı Gönder</span>
                  </button>

                  <button
                    onClick={() => handleResolveRefund(comp)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>İadeyi Onayla & Kapat</span>
                  </button>

                  <button
                    onClick={() => handlePublishBlacklist(comp)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Kara Listeye Al</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
