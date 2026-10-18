"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { SupplierPartner, SupplierType, SupplierContractStatus, Experience, PropertyListing } from '@/lib/types';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Power,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Percent,
  FileCheck,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  tour_operator: 'Tur & Deneyim Acentesi',
  yacht_charter: 'Boğaz & Yat İşletmesi',
  restaurant: 'Restoran & Gastronomi',
  property_management: 'Mülk & Gayrimenkul Yönetimi',
  hotel: 'Anlaşmalı Otel & Konaklama',
  transfer_vip: 'VIP Transfer & Ulaşım',
  clinic_wellness: 'Estetik & Sağlık Kliniği',
  hammam_spa: 'Tarihi Hamam & Spa',
  other: 'Diğer Hizmet Tedarikçisi'
};

export const CONTRACT_STATUS_LABELS: Record<SupplierContractStatus, { label: string; badgeClass: string }> = {
  active: { label: 'Anlaşma Aktif', badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  pending: { label: 'Sözleşme Onayında', badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-500/30' },
  suspended: { label: 'Askıda / Pasif', badgeClass: 'bg-red-500/15 text-red-700 border-red-500/30' }
};

type SupplierDraft = {
  name: string;
  legalName: string;
  type: SupplierType;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  district: string;
  address: string;
  taxId: string;
  tursabNo: string;
  iban: string;
  commissionRate: number;
  contractStatus: SupplierContractStatus;
  contractStartDate: string;
  contractNotes: string;
  publishToWeb: boolean;
  publishToMobile: boolean;
};

const EMPTY_SUPPLIER_DRAFT: SupplierDraft = {
  name: '',
  legalName: '',
  type: 'tour_operator',
  category: 'Boğaz Turları & Yat',
  contactPerson: '',
  phone: '+90 532 000 00 00',
  email: '',
  website: 'https://',
  district: 'Sultanahmet, Fatih',
  address: '',
  taxId: '',
  tursabNo: '',
  iban: 'TR',
  commissionRate: 15,
  contractStatus: 'active',
  contractStartDate: new Date().toISOString().slice(0, 10),
  contractNotes: 'Purelyİstanbul anlaşmalı tedarikçi sözleşmesi.',
  publishToWeb: true,
  publishToMobile: true
};

function supplierToDraft(s: SupplierPartner): SupplierDraft {
  return {
    name: s.name,
    legalName: s.legalName || '',
    type: s.type || 'tour_operator',
    category: s.category || 'Özel Deneyim',
    contactPerson: s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    website: s.website || 'https://',
    district: s.district || 'İstanbul',
    address: s.address || '',
    taxId: s.taxId || '',
    tursabNo: s.tursabNo || '',
    iban: s.iban || '',
    commissionRate: s.commissionRate ?? 15,
    contractStatus: s.contractStatus || 'active',
    contractStartDate: s.contractStartDate || '2026-01-01',
    contractNotes: s.contractNotes || '',
    publishToWeb: s.publishToWeb !== false,
    publishToMobile: s.publishToMobile !== false
  };
}

interface SupplierAdminPanelProps {
  onCreateListingForSupplier?: (supplier: SupplierPartner) => void;
}

export function SupplierAdminPanel({ onCreateListingForSupplier }: SupplierAdminPanelProps) {
  const [suppliers, setSuppliers] = useState<SupplierPartner[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SupplierType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SupplierContractStatus>('all');

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [draft, setDraft] = useState<SupplierDraft>(EMPTY_SUPPLIER_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SupplierDraft>(EMPTY_SUPPLIER_DRAFT);

  const refresh = () => {
    setSuppliers(XeniosStore.getSuppliers());
    setExperiences(XeniosStore.getExperiences());
    setProperties(XeniosStore.getPropertyListings());
  };

  useEffect(() => {
    refresh();
    window.addEventListener('xenios_suppliers_updated', refresh);
    window.addEventListener('xenios_experiences_updated', refresh);
    window.addEventListener('xenios_properties_updated', refresh);
    return () => {
      window.removeEventListener('xenios_suppliers_updated', refresh);
      window.removeEventListener('xenios_experiences_updated', refresh);
      window.removeEventListener('xenios_properties_updated', refresh);
    };
  }, []);

  const stats = useMemo(() => {
    const active = suppliers.filter((s) => s.contractStatus === 'active').length;
    const pending = suppliers.filter((s) => s.contractStatus === 'pending').length;
    const suspended = suppliers.filter((s) => s.contractStatus === 'suspended').length;
    const avgCommission =
      suppliers.length > 0
        ? (suppliers.reduce((sum, s) => sum + (Number(s.commissionRate) || 0), 0) / suppliers.length).toFixed(1)
        : '15.0';
    return { total: suppliers.length, active, pending, suspended, avgCommission };
  }, [suppliers]);

  const getLinkedCount = (sup: SupplierPartner) => {
    const nameKey = sup.name.trim().toLowerCase();
    const expCount = experiences.filter(
      (e) => e.supplierId === sup.id || (e.provider || '').trim().toLowerCase() === nameKey
    ).length;
    const propCount = properties.filter(
      (p) =>
        p.supplierId === sup.id ||
        (p.developer || '').trim().toLowerCase() === nameKey ||
        (p.agency || '').trim().toLowerCase() === nameKey
    ).length;
    return expCount + propCount;
  };

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || s.contractStatus === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.legalName || '').toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [suppliers, typeFilter, statusFilter, search]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error('Lütfen işletme / tedarikçi adını girin.');
      return;
    }
    const now = new Date().toISOString();
    const created: SupplierPartner = {
      id: 'sup-' + Date.now(),
      name: draft.name.trim(),
      legalName: draft.legalName.trim() || `${draft.name.trim()} Turizm & Hizmet Ltd. Şti.`,
      type: draft.type,
      category: draft.category.trim() || SUPPLIER_TYPE_LABELS[draft.type],
      contactPerson: draft.contactPerson.trim() || 'Operasyon Yetkilisi',
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      website: draft.website.trim(),
      district: draft.district.trim() || 'İstanbul',
      address: draft.address.trim(),
      taxId: draft.taxId.trim(),
      tursabNo: draft.tursabNo.trim() || undefined,
      iban: draft.iban.trim() || undefined,
      commissionRate: Number(draft.commissionRate) || 15,
      contractStatus: draft.contractStatus,
      contractStartDate: draft.contractStartDate,
      contractNotes: draft.contractNotes.trim(),
      publishToWeb: draft.publishToWeb,
      publishToMobile: draft.publishToMobile,
      createdAt: now,
      updatedAt: now
    };
    XeniosStore.addSupplier(created);
    toast.success(`"${created.name}" anlaşmalı işletme olarak kaydedildi ve buluta senkronize edildi.`);
    setIsNewOpen(false);
    setDraft(EMPTY_SUPPLIER_DRAFT);
    refresh();
  };

  const openEdit = (sup: SupplierPartner) => {
    setEditingId(sup.id);
    setEditDraft(supplierToDraft(sup));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editDraft.name.trim()) {
      toast.error('Lütfen işletme / tedarikçi adını girin.');
      return;
    }
    XeniosStore.updateSupplier(editingId, {
      name: editDraft.name.trim(),
      legalName: editDraft.legalName.trim(),
      type: editDraft.type,
      category: editDraft.category.trim(),
      contactPerson: editDraft.contactPerson.trim(),
      phone: editDraft.phone.trim(),
      email: editDraft.email.trim(),
      website: editDraft.website.trim(),
      district: editDraft.district.trim(),
      address: editDraft.address.trim(),
      taxId: editDraft.taxId.trim(),
      tursabNo: editDraft.tursabNo.trim() || undefined,
      iban: editDraft.iban.trim() || undefined,
      commissionRate: Number(editDraft.commissionRate) || 0,
      contractStatus: editDraft.contractStatus,
      contractStartDate: editDraft.contractStartDate,
      contractNotes: editDraft.contractNotes.trim(),
      publishToWeb: editDraft.publishToWeb,
      publishToMobile: editDraft.publishToMobile
    });
    toast.success(`"${editDraft.name}" işletme bilgileri güncellendi.`);
    setEditingId(null);
    refresh();
  };

  const toggleContractStatus = (sup: SupplierPartner) => {
    const next: SupplierContractStatus = sup.contractStatus === 'suspended' ? 'active' : 'suspended';
    XeniosStore.updateSupplier(sup.id, { contractStatus: next });
    toast.success(
      next === 'suspended'
        ? `"${sup.name}" anlaşması askıya alındı.`
        : `"${sup.name}" anlaşması yeniden aktif edildi.`
    );
    refresh();
  };

  const handleDelete = (sup: SupplierPartner) => {
    XeniosStore.deleteSupplier(sup.id);
    refresh();
    toast.success(`"${sup.name}" silindi.`, {
      action: {
        label: 'Geri Al',
        onClick: () => {
          XeniosStore.addSupplier(sup);
          refresh();
          toast.info(`"${sup.name}" geri yüklendi.`);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Anlaşmalı İşletme</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Aktif Sözleşme</span>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{stats.active}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Onay Bekleyen / Askıda</span>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {stats.pending} / <span className="text-red-500">{stats.suspended}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Ort. Komisyon Oranı</span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">%{stats.avgCommission}</div>
        </div>
      </div>

      {/* Search & Filters + Add New Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İşletme adı, kategori, yetkili, telefon veya semt ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">Tüm İşletme Tipleri</option>
            {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">Tüm Sözleşmeler</option>
            <option value="active">Aktif</option>
            <option value="pending">Onay Bekleyen</option>
            <option value="suspended">Askıda</option>
          </select>

          <button
            onClick={() => setIsNewOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Yeni İşletme / Tedarikçi Ekle
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => {
          const statusMeta = CONTRACT_STATUS_LABELS[sup.contractStatus || 'active'];
          const linkedCount = getLinkedCount(sup);
          const isSuspended = sup.contractStatus === 'suspended';

          return (
            <div
              key={sup.id}
              className={`rounded-3xl p-5 border space-y-3 flex flex-col justify-between transition shadow-xs ${
                isSuspended
                  ? 'bg-white/60 border-red-400/40'
                  : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                        {SUPPLIER_TYPE_LABELS[sup.type] || sup.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mt-1.5 leading-snug">
                      {sup.name}
                    </h3>
                    {sup.legalName && (
                      <p className="text-[11px] text-zinc-500 dark:text-slate-400 truncate">{sup.legalName}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-900 font-mono text-xs font-bold">
                      %{sup.commissionRate}
                    </span>
                    <span className="block text-[9px] text-zinc-500 mt-0.5">Komisyon</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-600 dark:text-slate-400 space-y-1 bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700">Yetkili:</span>
                    <span>{sup.contactPerson || 'Operasyon Yetkilisi'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-700" /> Telefon:
                    </span>
                    <a href={`tel:${sup.phone}`} className="font-mono text-amber-800 hover:underline">
                      {sup.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-700" /> E-Posta:
                    </span>
                    <span className="truncate max-w-[160px]">{sup.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-700" /> Bölge:
                    </span>
                    <span className="truncate max-w-[160px]">{sup.district}</span>
                  </div>
                  {(sup.tursabNo || sup.taxId) && (
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 text-[10px]">
                      <span className="text-zinc-500">Vergi / TÜRSAB:</span>
                      <span className="font-mono font-semibold text-zinc-700">
                        {sup.tursabNo ? `TÜRSAB ${sup.tursabNo}` : ''} {sup.taxId ? `• VKN ${sup.taxId}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {sup.contractNotes && (
                  <p className="text-[11px] text-zinc-600 dark:text-slate-400 line-clamp-2 italic">
                    “{sup.contractNotes}”
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 font-semibold">
                    Bağlı İlan / Mülk: <strong className="font-mono">{linkedCount}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        sup.publishToWeb !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      Web
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        sup.publishToMobile !== false
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      Mobil App
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center gap-1.5">
                {onCreateListingForSupplier && (
                  <button
                    onClick={() => onCreateListingForSupplier(sup)}
                    className="w-full mb-1 py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 text-amber-950 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" /> Bu İşletmeye Yeni İlan Ekle
                  </button>
                )}
                <button
                  onClick={() => openEdit(sup)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-zinc-900 text-[11px] font-semibold flex items-center justify-center gap-1 border border-amber-200/80 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Düzenle
                </button>
                <button
                  onClick={() => toggleContractStatus(sup)}
                  className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition cursor-pointer ${
                    isSuspended
                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-800 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  <Power className="w-3 h-3" /> {isSuspended ? 'Aktif Et' : 'Askıya Al'}
                </button>
                <button
                  onClick={() => handleDelete(sup)}
                  className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 transition cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {(isNewOpen || editingId) && (
        <SupplierFormModal
          title={editingId ? 'Anlaşmalı İşletme / Tedarikçi Düzenle' : 'Yeni Anlaşmalı İşletme / Tedarikçi Girişi'}
          draft={editingId ? editDraft : draft}
          setDraft={editingId ? setEditDraft : setDraft}
          onSubmit={editingId ? handleSaveEdit : handleCreate}
          onClose={() => {
            setIsNewOpen(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({
  title,
  draft,
  setDraft,
  onSubmit,
  onClose
}: {
  title: string;
  draft: SupplierDraft;
  setDraft: React.Dispatch<React.SetStateAction<SupplierDraft>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-amber-200/80 rounded-3xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <div>
            <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">{title}</h3>
            <p className="text-[11px] text-zinc-500">
              Purelyİstanbul sözleşmeli tedarikçi, mülk yönetim firması veya işletme kaydı
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-amber-50 text-zinc-500 hover:text-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">İşletme / Marka Adı *</label>
              <input
                type="text"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Örn: Bosphorus VIP Yachts"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Resmi Şirket Ünvanı</label>
              <input
                type="text"
                value={draft.legalName}
                onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
                placeholder="Örn: Boğaziçi Denizcilik Turizm A.Ş."
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">İşletme Tipi</label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    type: e.target.value as SupplierType,
                    category: SUPPLIER_TYPE_LABELS[e.target.value as SupplierType]
                  })
                }
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              >
                {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Hizmet Kategorisi</label>
              <input
                type="text"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Boğaz Turları & Yat"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">İletişim Yetkilisi</label>
              <input
                type="text"
                value={draft.contactPerson}
                onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
                placeholder="Ad Soyad / Ünvan"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Telefon (WhatsApp / Operasyon)</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+90 532 000 00 00"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">E-Posta</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="operasyon@isletme.com"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Web Sitesi</label>
              <input
                type="text"
                value={draft.website}
                onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                placeholder="https://"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">İlçe / Bölge</label>
              <input
                type="text"
                value={draft.district}
                onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                placeholder="Bebek, Beşiktaş / Sultanahmet"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Purelyİstanbul Komisyon Oranı (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={draft.commissionRate}
                onChange={(e) => setDraft({ ...draft, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Vergi No (VKN / TCKN)</label>
              <input
                type="text"
                value={draft.taxId}
                onChange={(e) => setDraft({ ...draft, taxId: e.target.value })}
                placeholder="3400..."
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">TÜRSAB / Belge No (Varsa)</label>
              <input
                type="text"
                value={draft.tursabNo}
                onChange={(e) => setDraft({ ...draft, tursabNo: e.target.value })}
                placeholder="A-12400"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Sözleşme Durumu</label>
              <select
                value={draft.contractStatus}
                onChange={(e) => setDraft({ ...draft, contractStatus: e.target.value as SupplierContractStatus })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              >
                <option value="active">Anlaşma Aktif</option>
                <option value="pending">Sözleşme Onayında</option>
                <option value="suspended">Askıda / Pasif</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Anlaşma Başlangıç Tarihi</label>
              <input
                type="date"
                value={draft.contractStartDate}
                onChange={(e) => setDraft({ ...draft, contractStartDate: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">IBAN (Hakediş & Split Ödeme İçin)</label>
              <input
                type="text"
                value={draft.iban}
                onChange={(e) => setDraft({ ...draft, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-600 block mb-1">Anlaşma & Operasyon Notları</label>
              <textarea
                rows={2}
                value={draft.contractNotes}
                onChange={(e) => setDraft({ ...draft, contractNotes: e.target.value })}
                placeholder="Özel kontenjan şartları, VIP karşılama detayı, iptal politikası..."
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.publishToWeb}
                  onChange={(e) => setDraft({ ...draft, publishToWeb: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Web Sitesinde (Marketplace) Göster
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.publishToMobile}
                  onChange={(e) => setDraft({ ...draft, publishToMobile: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Mobil App & Otel Concierge'da Göster
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-amber-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-50 text-zinc-700 font-semibold"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet & Senkronize Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
