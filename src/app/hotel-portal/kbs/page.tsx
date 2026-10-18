"use client";

import { useState, useEffect, useCallback } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest } from '@/lib/types';
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
  Sparkles,
  X,
  Copy,
  Check,
  Share2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

function parseKbsRecordFromServiceRequest(req: ServiceRequest): KbsGuestRecord | null {
  if (req.serviceKey !== 'kbs_checkin') return null;

  let detailRec: Partial<KbsGuestRecord> | undefined;
  if (typeof req.details?.kbsRecordJson === 'string') {
    try {
      detailRec = JSON.parse(req.details.kbsRecordJson) as Partial<KbsGuestRecord>;
    } catch {}
  } else if (req.details?.kbsRecord && typeof req.details.kbsRecord === 'object') {
    detailRec = req.details.kbsRecord as unknown as Partial<KbsGuestRecord>;
  }
  if (detailRec && (detailRec.first_name || detailRec.last_name || detailRec.document_number)) {
    return {
      id: detailRec.id || `kbs_${req.id}`,
      hotel_id: detailRec.hotel_id || req.hotelId || 'hotel-1',
      hotel_name: detailRec.hotel_name || req.hotelName || 'Purely Hotel',
      room_number: detailRec.room_number || req.roomNumber || '101',
      first_name: (detailRec.first_name || 'MİSAFİR').toUpperCase(),
      last_name: (detailRec.last_name || '').toUpperCase(),
      document_type: detailRec.document_type || 'TCKN',
      document_number: (detailRec.document_number || '-').toUpperCase(),
      nationality: (detailRec.nationality || 'TUR').toUpperCase(),
      birth_date: detailRec.birth_date || '1990-01-01',
      gender: detailRec.gender || 'UNKNOWN',
      check_in_date: detailRec.check_in_date || (req.createdAt ? req.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      check_out_date: detailRec.check_out_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      created_source: 'GUEST_PWA',
      status: 'VERIFIED',
      created_at: detailRec.created_at || req.createdAt || new Date().toISOString(),
    };
  }

  // Fallback parser for notes format: "FIRST LAST · PASSPORT: DOCNUM (TUR)"
  if (req.notes) {
    const parts = req.notes.split('·').map(s => s.trim());
    const fullName = parts[0] || '';
    const nameTokens = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameTokens.slice(0, -1).join(' ') || nameTokens[0] || 'MİSAFİR';
    const lastName = nameTokens.length > 1 ? nameTokens[nameTokens.length - 1] : '';

    const docPart = parts[1] || '';
    const docMatch = docPart.match(/^(PASSPORT|TCKN|NATIONAL_ID)\s*:\s*([^\s(]+)\s*(?:\(([^)]+)\))?/i);
    const docType = (docMatch?.[1]?.toUpperCase() as 'PASSPORT' | 'TCKN' | 'NATIONAL_ID') || 'TCKN';
    const docNumber = (docMatch?.[2] || docPart || '-').toUpperCase();
    const nationality = (docMatch?.[3] || 'TUR').toUpperCase();
    const createdDate = req.createdAt ? req.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      id: `kbs_${req.id}`,
      hotel_id: req.hotelId || 'hotel-1',
      hotel_name: req.hotelName || 'Purely Hotel',
      room_number: req.roomNumber || '101',
      first_name: firstName.toUpperCase(),
      last_name: lastName.toUpperCase(),
      document_type: docType,
      document_number: docNumber,
      nationality,
      birth_date: '1990-01-01',
      gender: 'UNKNOWN',
      check_in_date: createdDate,
      check_out_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      created_source: 'GUEST_PWA',
      status: 'VERIFIED',
      created_at: req.createdAt || new Date().toISOString(),
    };
  }

  return null;
}

function buildBatchXmlFromRecords(records: KbsGuestRecord[], facilityCode: string = 'EGM_34_PERA'): string {
  const activeRecords = records.filter(r => r.status !== 'EXPIRED');
  const targetDate = new Date().toISOString().split('T')[0];
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<KBS_BILDIRIM TESIS_KODU="${facilityCode}" TARIH="${targetDate}">`
  ];

  activeRecords.forEach(r => {
    xmlLines.push('  <MISAFIR>');
    xmlLines.push(`    <TCKN_PASAPORT>${r.document_number}</TCKN_PASAPORT>`);
    xmlLines.push(`    <BELGE_TURU>${r.document_type}</BELGE_TURU>`);
    xmlLines.push(`    <ADI>${r.first_name}</ADI>`);
    xmlLines.push(`    <SOYADI>${r.last_name}</SOYADI>`);
    xmlLines.push(`    <UYRUK>${r.nationality}</UYRUK>`);
    xmlLines.push(`    <CINSIYET>${r.gender}</CINSIYET>`);
    xmlLines.push(`    <DOGUM_TARIHI>${r.birth_date}</DOGUM_TARIHI>`);
    xmlLines.push(`    <ODA_NO>${r.room_number}</ODA_NO>`);
    xmlLines.push(`    <GIRIS_TARIHI>${r.check_in_date}</GIRIS_TARIHI>`);
    xmlLines.push(`    <CIKIS_TARIHI>${r.check_out_date}</CIKIS_TARIHI>`);
    xmlLines.push('  </MISAFIR>');
  });

  xmlLines.push('</KBS_BILDIRIM>');
  return xmlLines.join('\r\n');
}

function buildBatchCsvFromRecords(records: KbsGuestRecord[]): string {
  const activeRecords = records.filter(r => r.status !== 'EXPIRED');
  const headers = [
    'TCKN_PASAPORT',
    'BELGE_TURU',
    'ADI',
    'SOYADI',
    'UYRUK',
    'CINSIYET',
    'DOGUM_TARIHI',
    'ODA_NO',
    'GIRIS_TARIHI',
    'CIKIS_TARIHI'
  ];

  const rows = activeRecords.map(r => [
    r.document_number,
    r.document_type,
    r.first_name,
    r.last_name,
    r.nationality,
    r.gender,
    r.birth_date,
    r.room_number,
    r.check_in_date,
    r.check_out_date
  ]);

  const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
  return '\uFEFF' + csvContent;
}

export default function HotelKbsPage() {
  const [hotels, setHotels] = useState(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [records, setRecords] = useState<KbsGuestRecord[]>([]);
  const [settings, setSettings] = useState<KbsModuleSettings>(() => ({
    enable_guest_self_kbs: XeniosStore.getGuestSelfKbsEnabled(currentHotel?.id),
    facility_code: 'EGM_34_PERA',
    retention_days: 30
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states for readable KBS Batch Export & Guest Identity Card inspection
  const [exportModalFormat, setExportModalFormat] = useState<'xml' | 'csv' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<KbsGuestRecord | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  const mergeAndSetRecords = useCallback((apiRecords: KbsGuestRecord[], liveRequests?: ServiceRequest[]) => {
    const mergedMap = new Map<string, KbsGuestRecord>();

    const addRec = (r: KbsGuestRecord) => {
      if (!r || (!r.first_name && !r.document_number)) return;
      const dedupKey = `${(r.document_number || '').toUpperCase()}_${(r.room_number || '').toUpperCase()}_${(r.first_name || '').toUpperCase()}`;
      if (!mergedMap.has(dedupKey)) {
        mergedMap.set(dedupKey, r);
      }
    };

    // 1. Local storage KBS records
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('xenios_kbs_records_v1');
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) {
            parsedLocal.forEach(addRec);
          }
        }
      } catch {}
    }

    // 2. Live Firestore / Store kbs_checkin service requests
    const reqList = liveRequests || XeniosStore.getRequests();
    reqList.forEach(req => {
      const parsed = parseKbsRecordFromServiceRequest(req);
      if (parsed) addRec(parsed);
    });

    // 3. Server API records
    apiRecords.forEach(addRec);

    const finalSorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecords(finalSorted);
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/kbs/submit?hotelId=${currentHotel.id}`);
      if (res.ok) {
        const data = await res.json();
        mergeAndSetRecords(data.records || []);
      } else {
        mergeAndSetRecords([]);
      }
    } catch (err) {
      console.warn('Failed to fetch KBS records:', err);
      mergeAndSetRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentHotel.id, mergeAndSetRecords]);

  useEffect(() => {
    const syncState = () => {
      const latestHotels = XeniosStore.getHotels();
      const latestActiveId = XeniosStore.getActiveHotelId();
      setHotels(latestHotels);
      setActiveHotelId(latestActiveId);
      const target = latestHotels.find(h => h.id === latestActiveId) || latestHotels[0];
      setSettings(prev => ({
        ...prev,
        enable_guest_self_kbs: XeniosStore.getGuestSelfKbsEnabled(target?.id),
      }));
    };

    syncState();
    fetchRecords();

    let unsubCatalog: (() => void) | undefined;
    let unsubLiveReqs: (() => void) | undefined;
    import('@/lib/firestore-service')
      .then(({ FirestoreService }) => {
        unsubCatalog = FirestoreService.subscribeToCatalogSync();
        unsubLiveReqs = FirestoreService.subscribeToLiveRequests(null, (liveReqs) => {
          setRecords(prev => {
            const apiSnapshot = [...prev];
            setTimeout(() => mergeAndSetRecords(apiSnapshot, liveReqs), 0);
            return prev;
          });
        });
      })
      .catch(() => {});

    window.addEventListener('xenios_hotels_updated', syncState);
    window.addEventListener('xenios_module_settings_updated', syncState);
    window.addEventListener('storage', syncState);

    return () => {
      if (unsubCatalog) unsubCatalog();
      if (unsubLiveReqs) unsubLiveReqs();
      window.removeEventListener('xenios_hotels_updated', syncState);
      window.removeEventListener('xenios_module_settings_updated', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, [currentHotel?.id, fetchRecords, mergeAndSetRecords]);

  const handleToggleGuestSelfKbs = () => {
    const nextState = !settings.enable_guest_self_kbs;
    setSettings(prev => ({ ...prev, enable_guest_self_kbs: nextState }));

    // Persist locally and sync to Firestore so Guest PWA reflects it immediately
    XeniosStore.setGuestSelfKbsEnabled(currentHotel.id, nextState);

    toast.success(
      nextState 
        ? 'Misafir PWA Ön Kayıt & OCR Modülü AKTİFLEŞTİRİLDİ.' 
        : 'Misafir PWA Ön Kayıt & OCR Modülü KAPATILDI (Misafir ekranından gizlendi).'
    );
  };

  const triggerClientFileDownload = async (format: 'xml' | 'csv', useNativeShareIfAvailable = false) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `kbs-egm-bildirim-${dateStr}.${format}`;
    const content =
      format === 'xml'
        ? buildBatchXmlFromRecords(records, settings.facility_code)
        : buildBatchCsvFromRecords(records);
    const mimeType = format === 'xml' ? 'application/xml;charset=utf-8' : 'text/csv;charset=utf-8';

    if (useNativeShareIfAvailable && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const file = new File([content], fileName, { type: format === 'xml' ? 'text/xml' : 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `EGM KBS Bildirim Dosyası (${fileName})`,
            text: `${currentHotel.name} EGM KBS ${format.toUpperCase()} Bildirim Dökümü`,
            files: [file],
          });
          toast.success(`${format.toUpperCase()} dosyası paylaşıldı / kaydedildi.`);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      toast.success(`${fileName} cihazınıza indirildi.`);
    } catch {
      toast.info('Dosya önizleme penceresinden kopyalayabilir veya paylaşabilirsiniz.');
    }
  };

  const handleOpenExportModal = (format: 'xml' | 'csv') => {
    setExportModalFormat(format);
    setCopiedExport(false);
    triggerClientFileDownload(format, false);
  };

  const handleCopyExportContent = () => {
    if (!exportModalFormat) return;
    const content =
      exportModalFormat === 'xml'
        ? buildBatchXmlFromRecords(records, settings.facility_code)
        : buildBatchCsvFromRecords(records);
    navigator.clipboard.writeText(content);
    setCopiedExport(true);
    toast.success(`${exportModalFormat.toUpperCase()} içeriği panoya kopyalandı.`);
    setTimeout(() => setCopiedExport(false), 2500);
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

  const formatDocTypeLabel = (type: string) => {
    if (type === 'TCKN') return 'T.C. Kimlik Kartı';
    if (type === 'PASSPORT') return 'Pasaport';
    return 'Ulusal Kimlik';
  };

  const formatGenderLabel = (gender?: string) => {
    if (gender === 'FEMALE') return 'Kadın (F)';
    if (gender === 'MALE') return 'Erkek (M)';
    return 'Belirtilmedi';
  };

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
        <div className="luxury-service-card p-5 rounded-3xl space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="golden-pill-badge text-[10px] uppercase font-bold text-[#2C1E0F] px-2.5 py-0.5 rounded-full tracking-wider">Misafir Ön Kayıt Anahtarı</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                settings.enable_guest_self_kbs ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {settings.enable_guest_self_kbs ? 'PWA’da Aktif' : 'PWA’da Gizli'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">Misafir PWA Ön Kayıt & OCR</h3>
            <p className="text-[11px] text-zinc-600">
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
        <div className="luxury-service-card p-5 rounded-3xl space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="golden-pill-badge inline-block text-[10px] uppercase font-bold text-[#2C1E0F] px-2.5 py-0.5 rounded-full tracking-wider">EGM Toplu Bildirim</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">KBS Batch XML & CSV İndir</h3>
            <p className="text-[11px] text-zinc-600">
              Emniyet Genel Müdürlüğü KBS web portalına tek tıkla yüklenebilir resmi XML veya CSV çıktısı.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenExportModal('xml')}
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>XML İndir</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenExportModal('csv')}
              className="golden-pill-badge py-2.5 px-3 hover:bg-[rgba(240,195,70,0.48)] text-[#2C1E0F] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </button>
          </div>
        </div>

        {/* KVKK 30-Day Retention Policy Card */}
        <div className="luxury-service-card p-5 rounded-3xl space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="golden-pill-badge inline-block text-[10px] uppercase font-bold text-[#2C1E0F] px-2.5 py-0.5 rounded-full tracking-wider">KVKK & Veri Güvenliği</span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100">30 Günlük Otomatik İmha</h3>
            <p className="text-[11px] text-zinc-600">
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
              Kimlik bilgilerini büyük ekranda incelemek için misafir satırına tıklayabilirsiniz.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Misafir adı, birim veya belge no..."
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
                <th className="py-3 px-3">Birim</th>
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
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-amber-50/50 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3">
                      <strong className="font-mono text-sm bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                        {r.room_number}
                      </strong>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-sm text-zinc-900 dark:text-slate-100">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-sm text-zinc-800">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:text-slate-300 mr-2 font-sans font-bold">
                        {formatDocTypeLabel(r.document_type)}
                      </span>
                      <span className="font-bold">{r.document_number}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-sm text-zinc-800">{r.nationality}</span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-600 dark:text-slate-400 text-xs">
                      {r.check_in_date} ➔ {r.check_out_date}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {r.created_source === 'GUEST_PWA' ? '📱 PWA OCR' : '🖥️ Resepsiyon'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                          r.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          r.status === 'EXPIRED' ? 'bg-zinc-100 text-zinc-500 dark:text-slate-400 line-through' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === 'VERIFIED' ? '✓ KBS Hazır' : r.status === 'EXPIRED' ? 'İmha Edildi' : r.status}
                        </span>
                        <Eye className="w-4 h-4 text-amber-700" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. MİSAFİR KİMLİK DETAY KARTI MODALI (Ortalanmış, Büyük ve Okunaklı) */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 pb-10 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
          }}
        >
          <div
            className="bg-[#FAF8F4] border-2 border-[#C4B8A4] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#C4B8A4] bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#7D5E2A] block">
                  EGM KBS Doğrulanmış Kimlik Kaydı
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#141414] mt-0.5">
                  {selectedRecord.first_name} {selectedRecord.last_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center justify-center text-[#141414] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Adı (First Name)</span>
                  <strong className="text-base sm:text-lg font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.first_name}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Soyadı (Last Name)</span>
                  <strong className="text-base sm:text-lg font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.last_name}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Belge Türü</span>
                  <strong className="text-sm sm:text-base font-bold text-[#7D5E2A] mt-0.5 block">
                    {formatDocTypeLabel(selectedRecord.document_type)}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Kimlik / Pasaport No</span>
                  <strong className="text-base sm:text-lg font-mono font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.document_number}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Uyruk & Cinsiyet</span>
                  <strong className="text-sm sm:text-base font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.nationality} • {formatGenderLabel(selectedRecord.gender)}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Doğum Tarihi</span>
                  <strong className="text-sm sm:text-base font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.birth_date || '-'}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[11px] uppercase font-bold text-amber-900 block">Birim / Oda No</span>
                  <strong className="text-base sm:text-lg font-mono font-bold text-amber-950 mt-0.5 block">
                    Oda {selectedRecord.room_number}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB8]">
                  <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Giriş / Çıkış</span>
                  <strong className="text-xs sm:text-sm font-bold text-[#141414] mt-0.5 block">
                    {selectedRecord.check_in_date} ➔ {selectedRecord.check_out_date}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. KBS BATCH XML & CSV OKUNAKLI DÖKÜM VE İNDİRME MODALI */}
      {exportModalFormat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pt-16 pb-10 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExportModalFormat(null);
          }}
        >
          <div
            className="bg-[#FAF8F4] border-2 border-[#C4B8A4] rounded-3xl w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl text-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#C4B8A4] bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#7D5E2A] block">
                  EGM Kimlik Bildirim Sistemi ({exportModalFormat.toUpperCase()})
                </span>
                <h3 className="text-base sm:text-xl font-bold font-serif text-[#141414]">
                  Kişi Kimlik Bilgileri & {exportModalFormat.toUpperCase()} Dosya Çıktısı ({records.length} Misafir)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportModalFormat(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center justify-center text-[#141414] shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Hızlı İndirme / Paylaşma / Kopyalama Butonları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => triggerClientFileDownload(exportModalFormat, true)}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Dosyayı Cihaza Kaydet / Paylaş (.{exportModalFormat.toUpperCase()})</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyExportContent}
                  className="py-3 px-4 rounded-2xl bg-white hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {copiedExport ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-[#7D5E2A]" />}
                  <span>{copiedExport ? 'Panoya Kopyalandı!' : `${exportModalFormat.toUpperCase()} Metnini Kopyala`}</span>
                </button>
              </div>

              {/* Büyük ve Net Kişi Kimlik Bilgileri Kartları */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#5C4938]">
                  Bildirimdeki Misafir Kimlik Bilgileri ({records.length} Kişi)
                </h4>

                <div className="space-y-3">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-white border border-[#C4B8A4] shadow-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-mono font-bold text-sm">
                            Oda {r.room_number}
                          </span>
                          <strong className="text-base sm:text-lg font-bold text-[#141414]">
                            {r.first_name} {r.last_name}
                          </strong>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          {formatDocTypeLabel(r.document_type)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-0.5">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">TCKN / Pasaport No</span>
                          <strong className="font-mono text-sm sm:text-base font-bold text-[#141414]">
                            {r.document_number}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Uyruk & Cinsiyet</span>
                          <strong className="text-sm font-bold text-[#141414]">
                            {r.nationality} • {formatGenderLabel(r.gender)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Doğum Tarihi</span>
                          <strong className="text-sm font-bold text-[#141414]">
                            {r.birth_date || '-'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold text-[#6B5A48] block">Giriş / Çıkış</span>
                          <strong className="text-xs sm:text-sm font-bold text-[#141414]">
                            {r.check_in_date} ➔ {r.check_out_date}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resmi EGM KBS XML / CSV Kod Önizlemesi */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#5C4938]">
                  Resmi EGM {exportModalFormat.toUpperCase()} Dosya İçeriği
                </h4>
                <pre className="p-4 rounded-2xl bg-zinc-900 text-amber-100 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre">
                  {exportModalFormat === 'xml'
                    ? buildBatchXmlFromRecords(records, settings.facility_code)
                    : buildBatchCsvFromRecords(records)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#C4B8A4] bg-[#FAF8F4] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setExportModalFormat(null)}
                className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

