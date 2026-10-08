"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { KbsGuestRecord, KbsModuleSettings } from '@/types/kbs';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  FileText, 
  UserCheck, 
  Search, 
  Building2,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function HotelKbsPage() {
  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [records, setRecords] = useState<KbsGuestRecord[]>([]);
  const [settings, setSettings] = useState<KbsModuleSettings>({
    enable_guest_self_kbs: true,
    facility_code: 'EGM_34_PERA',
    retention_days: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/kbs/submit?hotelId=${currentHotel.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.warn('Failed to fetch KBS records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentHotel.id]);

  const handleToggleGuestSelfKbs = () => {
    const nextState = !settings.enable_guest_self_kbs;
    setSettings(prev => ({ ...prev, enable_guest_self_kbs: nextState }));

    // Update hotel module settings in XeniosStore
    if (currentHotel.modules) {
      currentHotel.modules.enable_guest_self_kbs = nextState;
    } else {
      currentHotel.modules = {
        enable_guest_self_kbs: nextState
      };
    }

    toast.success(
      nextState 
        ? 'Misafir PWA Ön Kayıt & OCR Modülü AKTİFLEŞTİRİLDİ.' 
        : 'Misafir PWA Ön Kayıt & OCR Modülü KAPATILDI (Misafir ekranından gizlendi).'
    );
  };

  const handleTriggerKvkkPurge = async () => {
    try {
      const res = await fetch('/api/kbs/cleanup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`KVKK 30-Günlük Veri İmhası Tamamlandı (${data.purgedCount || 0} kayıt maskelendi).`);
        fetchRecords();
      }
    } catch (err: any) {
      toast.error('Veri imha işlemi sırasında hata oluştu.');
    }
  };

  const filteredRecords = records.filter(r => 
    r.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.room_number.includes(searchQuery) ||
    r.document_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center justify-center p-1">
              <Image 
                src="/icons/kbs-online-checkin.png" 
                alt="KBS" 
                width={28} 
                height={28} 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100">
              Online Check-in, Document AI OCR & EGM KBS Masası
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
            Misafir pasaport/kimlik OCR taramalarını denetleyin, EGM Kimlik Bildirim Sistemi XML/CSV toplu yükleme dosyalarını indirin.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchRecords}
            disabled={isLoading}
            className="p-2.5 bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-zinc-50 text-zinc-700 font-bold rounded-2xl text-xs border border-zinc-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Toggle Switch Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Misafir Ön Kayıt Anahtarı</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                settings.enable_guest_self_kbs ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600 dark:text-slate-400'
              }`}>
                {settings.enable_guest_self_kbs ? 'PWA’da Aktif' : 'PWA’da Gizli'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Misafir PWA Ön Kayıt & OCR</h3>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400">
              Bu ayar kapatıldığında misafir PWA arayüzündeki pasaport tarama ve check-in butonu tamamen gizlenir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleGuestSelfKbs}
            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
              settings.enable_guest_self_kbs
                ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 hover:bg-zinc-900 text-white'
            }`}
          >
            {settings.enable_guest_self_kbs ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Modül Açık (Kapatmak için Tıklayın)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Modül Kapalı (Açmak için Tıklayın)</span>
              </>
            )}
          </button>
        </div>

        {/* EGM Batch XML & CSV Export Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">EGM Toplu Bildirim</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">KBS Batch XML & CSV İndir</h3>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400">
              Emniyet Genel Müdürlüğü KBS web portalına tek tıkla yüklenebilir resmi XML veya CSV çıktısı.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`/api/kbs/export?format=xml&hotelId=${currentHotel.id}`}
              download
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>XML İndir</span>
            </a>
            <a
              href={`/api/kbs/export?format=csv&hotelId=${currentHotel.id}`}
              download
              className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition text-center border border-zinc-200 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </a>
          </div>
        </div>

        {/* KVKK 30-Day Retention Policy Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">KVKK & Veri Güvenliği</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">30 Günlük Otomatik İmha</h3>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400">
              Çıkış yapmış misafirlerin pasaport görselleri ve hassas kimlik verileri 30 gün sonra otomatik maskelenir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerKvkkPurge}
            className="w-full py-2.5 px-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-red-700 font-bold text-xs border border-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>KVKK Temizlik Görevini Çalıştır</span>
          </button>
        </div>
      </div>

      {/* KBS Records Table */}
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">
              Onaylanan & Kayıtlı Misafir Listesi ({filteredRecords.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Document AI Identity Processor ile doğrulanmış misafir kimlik dökümü.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Misafir adı, oda veya belge no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Oda</th>
                <th className="py-3 px-3">Misafir Adı Soyadı</th>
                <th className="py-3 px-3">Belge Türü & No</th>
                <th className="py-3 px-3">Uyruk</th>
                <th className="py-3 px-3">Giriş / Çıkış</th>
                <th className="py-3 px-3">Kaynak</th>
                <th className="py-3 px-3 text-right">KBS Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-400 text-xs">
                    Henüz kayıtlı check-in kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition">
                    <td className="py-3 px-3">
                      <strong className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                        {r.room_number}
                      </strong>
                    </td>
                    <td className="py-3 px-3 font-bold text-zinc-900 dark:text-slate-100">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-700">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:text-slate-400 mr-1.5 font-sans font-bold">
                        {r.document_type}
                      </span>
                      {r.document_number}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-700">{r.nationality}</span>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 dark:text-slate-400 text-[11px]">
                      {r.check_in_date} ➔ {r.check_out_date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {r.created_source === 'GUEST_PWA' ? '📱 PWA OCR' : '🖥️ Resepsiyon'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        r.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        r.status === 'EXPIRED' ? 'bg-zinc-100 text-zinc-500 dark:text-slate-400 line-through' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status === 'VERIFIED' ? '✓ KBS Hazır' : r.status === 'EXPIRED' ? 'İmha Edildi' : r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
