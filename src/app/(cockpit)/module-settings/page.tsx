"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest, InRoomServiceItem, ModuleAdminSettings } from '@/lib/types';
import {
  SERVICE_MODULES,
  ServiceField,
  getModuleConfig,
  resolvePricing,
  resolveFieldOptions,
  deriveRequestStatus,
  isToday
} from '@/lib/service-modules';
import {
  Plus,
  X,
  RotateCcw,
  Save,
  ArrowUpRight,
  Power,
  EyeOff,
  Eye,
  LayoutGrid,
  Search,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  ChevronDown,
  Layers,
  Clock,
  DollarSign,
  Tag,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const PRESET_ICONS = [
  { name: 'Kahvaltı', path: '/icons/menu/breakfast.png' },
  { name: 'Temizlik', path: '/icons/menu/cleaning.png' },
  { name: 'Havlu', path: '/icons/menu/towels.png' },
  { name: 'Çarşaf', path: '/icons/menu/linens.png' },
  { name: 'Yastık', path: '/icons/menu/pillows.png' },
  { name: 'Banyo Bukleti', path: '/icons/menu/toiletries.png' },
  { name: 'Hijyen Seti', path: '/icons/menu/hygiene.png' },
  { name: 'Oda Servisi', path: '/icons/menu/roomservice.png' },
  { name: 'Mini Bar', path: '/icons/menu/minibar.png' },
  { name: 'Kasa & Güvenlik', path: '/icons/menu/safe.png' },
  { name: 'Teknik Servis', path: '/icons/menu/technical.png' },
  { name: 'Çamaşırhane', path: '/icons/menu/laundry.png' },
  { name: 'Geç Çıkış', path: '/icons/menu/lateCheckout.png' },
  { name: 'Konaklama Uzatma', path: '/icons/menu/extendStay.png' },
  { name: 'Taksi', path: '/icons/menu/taksi.png' },
  { name: 'Rahatsız Etmeyin', path: '/icons/menu/dnd.png' },
  { name: 'comusAI', path: '/icons/menu/aiGuide.png' },
  { name: 'Rehber', path: '/icons/menu/practical.png' }
];

const DEPARTMENTS = [
  'Housekeeping',
  'Room Service (Mutfak KDS)',
  'Resepsiyon / Ön Büro',
  'Teknik Servis',
  'Concierge / Bellboy',
  'SPA & Masaj',
  'Misafir İlişkileri (Guest Relations)'
];

export default function ModuleSettingsPage() {
  const [services, setServices] = useState<InRoomServiceItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // New Service Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<InRoomServiceItem | null>(null);

  // Form State
  const [formLabel, setFormLabel] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDept, setFormDept] = useState(DEPARTMENTS[0]);
  const [formIcon, setFormIcon] = useState(PRESET_ICONS[0].path);
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formOptionsStr, setFormOptionsStr] = useState('');

  // Expanded card options
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const refresh = () => {
    setServices(XeniosStore.getInRoomServices());
    setRequests(XeniosStore.getRequests());
  };

  useEffect(() => {
    refresh();
    window.addEventListener('xenios_in_room_services_updated', refresh);
    window.addEventListener('xenios_module_settings_updated', refresh);
    window.addEventListener('xenios_requests_updated', refresh);
    return () => {
      window.removeEventListener('xenios_in_room_services_updated', refresh);
      window.removeEventListener('xenios_module_settings_updated', refresh);
      window.removeEventListener('xenios_requests_updated', refresh);
    };
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormLabel('');
    setFormDesc('');
    setFormDept(DEPARTMENTS[0]);
    setFormIcon(PRESET_ICONS[0].path);
    setFormPrice('');
    setFormOptionsStr('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: InRoomServiceItem) => {
    setEditingService(item);
    setFormLabel(item.label);
    setFormDesc(item.desc);
    setFormDept(item.department || DEPARTMENTS[0]);
    setFormIcon(item.icon);
    setFormPrice(item.price || '');
    setFormOptionsStr(item.options ? item.options.join(', ') : '');
    setIsAddModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error('Lütfen hizmet başlığını giriniz.');
      return;
    }

    const options = formOptionsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingService) {
      // Update existing
      const updated: InRoomServiceItem = {
        ...editingService,
        label: formLabel.trim(),
        desc: formDesc.trim(),
        department: formDept,
        icon: formIcon,
        price: formPrice ? Number(formPrice) : undefined,
        options: options.length > 0 ? options : undefined
      };
      XeniosStore.saveInRoomService(updated);
      toast.success(`"${updated.label}" hizmeti güncellendi.`);
    } else {
      // Create new custom service
      const key = 'custom-' + Date.now();
      const newService: InRoomServiceItem = {
        id: key,
        key: key,
        label: formLabel.trim(),
        desc: formDesc.trim() || 'Otel içi özel misafir hizmeti',
        department: formDept,
        icon: formIcon,
        enabled: true,
        hidden: false,
        isCustom: true,
        price: formPrice ? Number(formPrice) : undefined,
        currency: 'TRY',
        options: options.length > 0 ? options : undefined,
        order: services.length + 1
      };
      XeniosStore.saveInRoomService(newService);
      toast.success(`"${newService.label}" yeni hizmet olarak eklendi ve misafir menüsünde aktif edildi.`);
    }

    setIsAddModalOpen(false);
    refresh();
  };

  const handleDeleteService = (item: InRoomServiceItem) => {
    if (confirm(`"${item.label}" hizmetini silmek/kaldırmak istediğinize emin misiniz?`)) {
      XeniosStore.deleteInRoomService(item.id || item.key);
      toast.info(`"${item.label}" kaldırıldı.`);
      refresh();
    }
  };

  const handleToggleEnabled = (item: InRoomServiceItem) => {
    const nextState = !item.enabled;
    XeniosStore.saveInRoomService({ ...item, enabled: nextState });
    toast.success(`"${item.label}" ${nextState ? 'aktif edildi' : 'kullanım dışı bırakıldı'}.`);
    refresh();
  };

  const handleToggleHidden = (item: InRoomServiceItem) => {
    const nextState = !item.hidden;
    XeniosStore.saveInRoomService({ ...item, hidden: nextState });
    toast.success(`"${item.label}" ${nextState ? 'misafirden gizlendi' : 'misafirde görünür yapıldı'}.`);
    refresh();
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'all' || s.department.toLowerCase().includes(selectedDept.toLowerCase());
      return matchesSearch && matchesDept;
    });
  }, [services, searchQuery, selectedDept]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.enabled && !s.hidden).length;
    const disabled = services.filter((s) => !s.enabled).length;
    const hidden = services.filter((s) => s.hidden).length;
    const custom = services.filter((s) => s.isCustom).length;
    const pendingReqs = requests.filter((r) => r.status === 'pending').length;
    return { total, active, disabled, hidden, custom, pendingReqs };
  }, [services, requests]);

  return (
    <div className="space-y-6 pb-16 text-zinc-900 dark:text-slate-100">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              Otel Yönetim Masası
            </span>
            <span className="text-xs text-zinc-500 dark:text-slate-400">Canlı Senkronizasyon</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-slate-100 mt-1">
            Otel İçi Hizmetler & Menü Yönetimi
          </h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Misafir odasındaki QR menüde görünen tüm hizmetleri buradan ekleyebilir, fiyatlandırabilir, aktif/pasif edebilir veya anında gizleyebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (confirm('Tüm otel içi hizmetleri orijinal varsayılan 16 hizmete döndürmek istiyor musunuz?')) {
                XeniosStore.resetInRoomServicesToDefault();
                toast.success('Hizmetler varsayılan ayarlara sıfırlandı.');
                refresh();
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-[#1f232e] text-zinc-700 text-xs font-semibold border border-amber-200/80 flex items-center gap-1.5 transition cursor-pointer"
            title="Varsayılanlara Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Varsayılana Sıfırla</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hizmet Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 uppercase font-semibold block flex items-center gap-1">
            <LayoutGrid className="w-3 h-3 text-amber-400" /> Toplam Hizmet
          </span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{stats.total}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-emerald-500/20">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aktif Hizmet
          </span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.active}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 uppercase font-semibold block">Pasif / Kapalı</span>
          <div className="text-xl font-bold text-zinc-700 mt-1 font-mono">{stats.disabled}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-red-500/20">
          <span className="text-[10px] text-red-400 uppercase font-semibold block flex items-center gap-1">
            <EyeOff className="w-3 h-3 text-red-400" /> Gizli Hizmet
          </span>
          <div className="text-xl font-bold text-red-400 mt-1 font-mono">{stats.hidden}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-500/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-amber-400 uppercase font-semibold block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Bekleyen Talep
          </span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.pendingReqs}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 dark:border-slate-800 p-3 rounded-2xl border border-amber-200/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hizmet adı, departman veya açıklama ara..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              selectedDept === 'all'
                ? 'bg-amber-500 border-amber-500 text-black shadow-xs'
                : 'bg-amber-50/40 border-amber-200/80 text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'
            }`}
          >
            Tüm Departmanlar
          </button>
          {DEPARTMENTS.slice(0, 4).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d.split(' ')[0])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                selectedDept === d.split(' ')[0]
                  ? 'bg-amber-500 border-amber-500 text-black shadow-xs'
                  : 'bg-amber-50/40 border-amber-200/80 text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'
              }`}
            >
              {d.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-amber-200/80 text-zinc-500 dark:text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-500/60" />
            <p className="text-xs">Aramanıza uygun otel içi hizmet bulunamadı.</p>
          </div>
        ) : (
          filteredServices.map((item) => {
            const config = getModuleConfig(item.key);
            const reqs = requests.filter((r) => r.serviceKey === item.key || r.serviceKey === item.id);
            const pendingCount = reqs.filter((r) => r.status === 'pending').length;
            const isExpanded = !!expandedKeys[item.key || item.id];

            return (
              <div
                key={item.id || item.key}
                className={`rounded-2xl border transition duration-200 ${
                  item.hidden
                    ? 'border-red-500/30 bg-red-500/[0.02]'
                    : !item.enabled
                    ? 'border-zinc-700/60 bg-white/60 opacity-80'
                    : 'border-amber-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                {/* Main Row Bar */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50/40 border border-amber-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <img
                        src={item.icon}
                        alt={item.label}
                        className={`object-contain w-full h-full ${!item.enabled || item.hidden ? 'grayscale opacity-50' : ''}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-zinc-900 dark:text-slate-100 truncate">{item.label}</strong>
                        {item.isCustom && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                            Özel Hizmet
                          </span>
                        )}
                        {item.hidden && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                            GİZLİ (Misafire Kapalı)
                          </span>
                        )}
                        {!item.enabled && !item.hidden && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-700 font-bold">
                            PASİF
                          </span>
                        )}
                        {item.price ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                            {item.price} ₺
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-slate-400 truncate mt-0.5">{item.desc}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-zinc-500 dark:text-slate-400">
                          <Building2 className="w-3 h-3 text-amber-500" /> {item.department}
                        </span>
                        <span>·</span>
                        <span>Toplam Talep: <strong className="text-zinc-700 font-mono">{reqs.length}</strong></span>
                        {pendingCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400 font-bold">Bekleyen: {pendingCount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Deck */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/80">
                    {/* Live Request Direct Link */}
                    <Link
                      href={`/live-requests?module=${item.key || item.id}`}
                      className="p-2 rounded-xl bg-amber-50/40 hover:bg-[#1a1e27] text-zinc-500 dark:text-slate-400 hover:text-amber-400 border border-amber-200/80 text-xs font-semibold flex items-center gap-1 transition"
                      title="Bu hizmetin canlı taleplerini gör"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-amber-50/40 hover:bg-[#1a1e27] text-zinc-700 hover:text-amber-400 border border-amber-200/80 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Hizmeti Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Enabled / Disabled Toggle */}
                    <button
                      onClick={() => handleToggleEnabled(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                        item.enabled
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-zinc-700/40 border-zinc-600 text-zinc-500 dark:text-slate-400 hover:bg-zinc-700/60'
                      }`}
                      title={item.enabled ? 'Hizmeti durdur / pasife al' : 'Hizmeti aktifleştir'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{item.enabled ? 'Aktif' : 'Pasif'}</span>
                    </button>

                    {/* Hidden / Visible Toggle */}
                    <button
                      onClick={() => handleToggleHidden(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                        item.hidden
                          ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                          : 'bg-amber-50/40 border-amber-200/80 text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'
                      }`}
                      title={item.hidden ? 'Misafir ekranında göster' : 'Misafir ekranından gizle'}
                    >
                      {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{item.hidden ? 'Gizli' : 'Görünür'}</span>
                    </button>

                    {/* Delete button (for custom or defaults) */}
                    <button
                      onClick={() => handleDeleteService(item)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
                      title="Hizmeti Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand Details Arrow */}
                    <button
                      onClick={() => toggleExpand(item.key || item.id)}
                      className="p-2 rounded-xl bg-amber-50/40 hover:bg-[#1a1e27] text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:text-slate-100 border border-amber-200/80 transition cursor-pointer"
                      title="Fiyat & Seçenek Detayları"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Inline Expanded Panel (Options & Pricing Knobs) */}
                {isExpanded && (
                  <div className="border-t border-amber-200/80 p-4 bg-amber-50/40/80 rounded-b-2xl space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Options List */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-amber-400" /> Hizmet Seçenekleri & Çeşitleri
                        </span>
                        {item.options && item.options.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.options.map((opt, oIdx) => (
                              <span key={oIdx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 text-zinc-700 text-xs">
                                {opt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 dark:text-slate-400">Özel alt seçenek tanımlanmamış (Standart form kullanılır).</p>
                        )}
                      </div>

                      {/* Pricing Info */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Fiyatlandırma
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-slate-400">
                          {item.price ? (
                            <strong className="text-emerald-400 font-mono text-sm">{item.price} {item.currency || 'TRY'}</strong>
                          ) : (
                            'Ücretsiz / Oda Fiyatına Dahil'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Yeni Hizmet Ekle / Hizmeti Düzenle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-500/30 max-h-[92vh] overflow-y-auto space-y-4 animate-in zoom-in-95 text-zinc-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100">
                    {editingService ? 'Otel İçi Hizmeti Düzenle' : 'Yeni Otel İçi Hizmet Ekle'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400">Misafir QR menüsünde anında aktif olur.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-amber-50/40 hover:bg-[#2c313d] text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:text-slate-100 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              {/* Hizmet Adı */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Hizmet Başlığı *</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Örn: Bebek Yatağı Talebi / Balayı Oda Süsleme / Ütü Masası"
                  className="w-full text-xs p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 dark:text-slate-100 font-medium"
                />
              </div>

              {/* Departman */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Sorumlu Departman *</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 dark:text-slate-100 font-medium"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Açıklama */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Açıklama / Alt Metin</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Örn: Odanıza 15 dk içinde teslim edilir"
                  className="w-full text-xs p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 dark:text-slate-100"
                />
              </div>

              {/* İkon Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Hizmet İkonu Seçin</label>
                <div className="grid grid-cols-6 gap-2 p-2.5 bg-amber-50/40 rounded-2xl border border-amber-200/80 max-h-36 overflow-y-auto">
                  {PRESET_ICONS.map((ico, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormIcon(ico.path)}
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        formIcon === ico.path
                          ? 'border-amber-500 bg-amber-500/20 shadow-xs'
                          : 'border-amber-200/80 hover:border-zinc-500 bg-white dark:bg-slate-900 dark:border-slate-800'
                      }`}
                      title={ico.name}
                    >
                      <img src={ico.path} alt={ico.name} className="w-8 h-8 object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fiyatlandırma */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Hizmet Bedeli (₺)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Boş bırakılırsa Ücretsiz"
                    className="w-full text-xs p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Para Birimi</label>
                  <input
                    type="text"
                    disabled
                    value="TRY (₺)"
                    className="w-full text-xs p-3 rounded-xl bg-amber-50/40/50 border border-amber-200/80 text-zinc-500 dark:text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Hızlı Seçenekler / Çeşitler */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Alt Seçenekler (Virgülle ayırın)</label>
                <input
                  type="text"
                  value={formOptionsStr}
                  onChange={(e) => setFormOptionsStr(e.target.value)}
                  placeholder="Örn: Ahşap Beşik, Katlanır Park Yatak, Bebek Nevresimi"
                  className="w-full text-xs p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 dark:text-slate-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-amber-50/40 hover:bg-[#2c313d] border border-amber-200/80 text-zinc-700 font-bold text-xs transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingService ? 'Değişiklikleri Kaydet' : 'Hizmeti Yayınla'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
