"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { PropertyListing, InvestmentLead, InvestorPersona } from '@/lib/types';
import { toast } from 'sonner';
import {
  Plus, Search, Edit3, Trash2, Save, X, Power, EyeOff, Building2, Phone, Mail,
  ShieldCheck, TrendingUp, MapPin
} from 'lucide-react';

type PropertyDraft = {
  title: string; district: string; propertyType: string; personas: InvestorPersona[];
  priceUSD: number; bedrooms: number; areaM2: number; description: string;
  highlights: string; developer: string; contactPhone: string; contactWebsite: string;
  image: string; lat: number; lng: number; citizenshipEligible: boolean; roiEstimate: string;
};

const EMPTY_DRAFT: PropertyDraft = {
  title: '', district: 'Beşiktaş / Boğaz Hattı', propertyType: 'Rezidans Dairesi', personas: ['citizenship'],
  priceUSD: 400000, bedrooms: 2, areaM2: 100, description: '', highlights: '',
  developer: '', contactPhone: '+90 212 000 00 00', contactWebsite: 'https://',
  image: '', lat: 41.0082, lng: 28.9784, citizenshipEligible: false, roiEstimate: ''
};

const PERSONA_LABELS: Record<InvestorPersona, string> = {
  citizenship: 'Vatandaşlık Hedefli',
  short_term_rental: 'Kısa Dönem Kiralama',
  luxury_lifestyle: 'Lüks Yaşam'
};

function propertyToDraft(p: PropertyListing): PropertyDraft {
  return {
    title: p.title, district: p.district, propertyType: p.propertyType, personas: p.personas,
    priceUSD: p.priceUSD, bedrooms: p.bedrooms, areaM2: p.areaM2, description: p.description,
    highlights: p.highlights.join(', '), developer: p.developer, contactPhone: p.contactPhone,
    contactWebsite: p.contactWebsite, image: p.image, lat: p.coords?.lat ?? 41.0082, lng: p.coords?.lng ?? 28.9784,
    citizenshipEligible: p.citizenshipEligible, roiEstimate: p.roiEstimate ?? ''
  };
}

function draftToPropertyPatch(draft: PropertyDraft): Partial<PropertyListing> {
  return {
    title: draft.title.trim(),
    district: draft.district,
    propertyType: draft.propertyType,
    personas: draft.personas.length ? draft.personas : ['citizenship'],
    priceUSD: Number(draft.priceUSD) || 0,
    bedrooms: Number(draft.bedrooms) || 0,
    areaM2: Number(draft.areaM2) || 0,
    description: draft.description,
    highlights: draft.highlights.split(',').map((h) => h.trim()).filter(Boolean),
    developer: draft.developer.trim(),
    contactPhone: draft.contactPhone,
    contactWebsite: draft.contactWebsite,
    image: draft.image,
    coords: { lat: Number(draft.lat) || 41.0082, lng: Number(draft.lng) || 28.9784 },
    citizenshipEligible: draft.citizenshipEligible,
    roiEstimate: draft.roiEstimate.trim() || undefined
  };
}

export function PropertyAdminPanel() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [leads, setLeads] = useState<InvestmentLead[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PropertyDraft>(EMPTY_DRAFT);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [draft, setDraft] = useState<PropertyDraft>(EMPTY_DRAFT);

  const refresh = () => {
    setProperties(XeniosStore.getPropertyListings());
    setLeads(XeniosStore.getInvestmentLeads());
  };

  useEffect(() => {
    refresh();
    const onProp = () => setProperties(XeniosStore.getPropertyListings());
    const onLead = () => setLeads(XeniosStore.getInvestmentLeads());
    window.addEventListener('xenios_properties_updated', onProp);
    window.addEventListener('xenios_investment_leads_updated', onLead);
    return () => {
      window.removeEventListener('xenios_properties_updated', onProp);
      window.removeEventListener('xenios_investment_leads_updated', onLead);
    };
  }, []);

  const stats = useMemo(() => {
    const active = properties.filter((p) => p.status !== 'suspended').length;
    return { total: properties.length, active, suspended: properties.length - active, leadsTotal: leads.length };
  }, [properties, leads]);

  const filtered = properties.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.district.toLowerCase().includes(search.toLowerCase()) ||
    p.propertyType.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (p: PropertyListing) => {
    setEditingId(p.id);
    setEditDraft(propertyToDraft(p));
  };

  const toggleStatus = (p: PropertyListing) => {
    const nextStatus = p.status === 'suspended' ? 'active' : 'suspended';
    XeniosStore.updatePropertyListing(p.id, { status: nextStatus });
    toast.success(nextStatus === 'suspended' ? `"${p.title}" askıya alındı — vitrinde gösterilmeyecek.` : `"${p.title}" yeniden yayında.`);
    refresh();
  };

  const handleDelete = (p: PropertyListing) => {
    if (!confirm(`"${p.title}" ilanını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    XeniosStore.deletePropertyListing(p.id);
    toast.info(`"${p.title}" kalıcı olarak silindi.`);
    refresh();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editDraft.title.trim()) {
      toast.error('Lütfen ilan başlığını girin.');
      return;
    }
    XeniosStore.updatePropertyListing(editingId, draftToPropertyPatch(editDraft));
    toast.success(`"${editDraft.title}" güncellendi ve canlıya alındı.`);
    setEditingId(null);
    refresh();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      toast.error('Lütfen ilan başlığını girin.');
      return;
    }
    const created: PropertyListing = {
      id: 'prop-admin-' + Date.now(),
      ...draftToPropertyPatch(draft),
      status: 'active'
    } as PropertyListing;
    XeniosStore.addPropertyListing(created);
    toast.success(`"${created.title}" emlak vitrinine eklendi ve anında canlıya alındı.`);
    setIsNewOpen(false);
    setDraft(EMPTY_DRAFT);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Toplam İlan</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Aktif İlan</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.active}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Askıda</span>
          <div className="text-xl font-bold text-red-400 mt-1 font-mono">{stats.suspended}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Yatırım Talebi</span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.leadsTotal}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İlan, bölge veya mülk tipi ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
        <button
          onClick={() => setIsNewOpen(true)}
          className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Yeni İlan Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const suspended = p.status === 'suspended';
          return (
            <div
              key={p.id}
              className={`rounded-3xl p-4 border space-y-3 flex flex-col justify-between transition ${
                suspended ? 'bg-white/50 border-red-500/30' : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200/80 hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                    {p.propertyType}
                  </span>
                  {suspended ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> ASKIDA
                    </span>
                  ) : (
                    <strong className="text-sm font-mono text-emerald-400 font-bold">${p.priceUSD.toLocaleString('en-US')}</strong>
                  )}
                </div>

                <h3 className={`text-sm font-bold font-serif line-clamp-2 ${suspended ? 'text-zinc-500 dark:text-slate-400' : 'text-zinc-900 dark:text-slate-100'}`}>{p.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {p.district}</p>

                <div className="flex flex-wrap gap-1">
                  {p.personas.map((persona) => (
                    <span key={persona} className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-700/40 text-zinc-700">{PERSONA_LABELS[persona]}</span>
                  ))}
                  {p.citizenshipEligible && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" /> Vatandaşlık</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-200/80 flex items-center gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Düzenle
                </button>
                <button
                  onClick={() => toggleStatus(p)}
                  title={suspended ? 'Yeniden yayınla' : 'Askıya al'}
                  className={`p-2 rounded-xl border transition ${
                    suspended ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-700/20 hover:bg-zinc-700/30 text-zinc-700 border-zinc-600'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  title="Kalıcı sil"
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-zinc-500 dark:text-slate-400 text-xs py-12">Aramanızla eşleşen ilan bulunamadı.</div>
        )}
      </div>

      {/* Investment Leads */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-amber-400" /> Yatırım Talepleri</h3>
        {leads.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-8 text-center text-zinc-500 dark:text-slate-400 border border-amber-200/80 text-xs">
            Henüz bir yatırım talebi gelmedi.
          </div>
        ) : (
          <div className="space-y-2.5">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm text-zinc-900 dark:text-slate-100">{lead.guestName}</strong>
                    {lead.personaGuess && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400">{PERSONA_LABELS[lead.personaGuess]}</span>
                    )}
                  </div>
                  <p className="text-zinc-500 dark:text-slate-400">İlgilendiği İlan: <strong className="text-zinc-800 dark:text-slate-200">{lead.propertyTitle}</strong></p>
                  <p className="text-zinc-500 dark:text-slate-400">{lead.hotelName} • Oda {lead.roomNumber} • {new Date(lead.createdAt).toLocaleString('tr-TR')}</p>
                  {lead.note && <p className="text-zinc-500 dark:text-slate-400 italic">"{lead.note}"</p>}
                </div>
                <a
                  href={lead.guestContact.includes('@') ? `mailto:${lead.guestContact}` : `tel:${lead.guestContact}`}
                  className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-bold flex items-center gap-1.5 shrink-0"
                >
                  {lead.guestContact.includes('@') ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                  {lead.guestContact}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODALS */}
      {isNewOpen && (
        <PropertyFormModal
          title="Yeni Emlak İlanı Ekle"
          submitLabel="İlanı Yayınla"
          values={draft}
          onChange={setDraft}
          onCancel={() => setIsNewOpen(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingId && (
        <PropertyFormModal
          title="İlan Düzenleme"
          submitLabel="Değişiklikleri Canlıya Al"
          values={editDraft}
          onChange={setEditDraft}
          onCancel={() => setEditingId(null)}
          onSubmit={handleSaveEdit}
        />
      )}
    </div>
  );
}

interface PropertyFormModalProps {
  title: string;
  submitLabel: string;
  values: PropertyDraft;
  onChange: (next: PropertyDraft) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function PropertyFormModal({ title, submitLabel, values, onChange, onCancel, onSubmit }: PropertyFormModalProps) {
  const set = (patch: Partial<PropertyDraft>) => onChange({ ...values, ...patch });
  const [imageError, setImageError] = useState(false);

  const togglePersona = (persona: InvestorPersona) => {
    const has = values.personas.includes(persona);
    set({ personas: has ? values.personas.filter((p) => p !== persona) : [...values.personas, persona] });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 border border-amber-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">{title}</h2>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-amber-50/40 hover:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İlan Başlığı</label>
              <input
                type="text" required value={values.title}
                onChange={(e) => set({ title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Bölge / Semt</label>
              <input
                type="text" value={values.district}
                onChange={(e) => set({ district: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Mülk Tipi</label>
              <input
                type="text" value={values.propertyType}
                onChange={(e) => set({ propertyType: e.target.value })}
                placeholder="Örn: Rezidans, Yalı, Penthouse, Villa"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Fiyat (USD)</label>
              <input
                type="number" required value={values.priceUSD}
                onChange={(e) => set({ priceUSD: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-emerald-400 font-bold font-mono"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Oda Sayısı</label>
                <input
                  type="number" value={values.bedrooms}
                  onChange={(e) => set({ bedrooms: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Alan (m²)</label>
                <input
                  type="number" value={values.areaM2}
                  onChange={(e) => set({ areaM2: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 block">Yatırımcı Profili (Birden Fazla Seçilebilir)</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(PERSONA_LABELS) as [InvestorPersona, string][]).map(([key, label]) => (
                  <button
                    key={key} type="button" onClick={() => togglePersona(key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                      values.personas.includes(key) ? 'bg-amber-500 border-amber-500 text-black' : 'bg-amber-50/40 border-amber-200/80 text-zinc-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox" id="citizenshipEligible" checked={values.citizenshipEligible}
                onChange={(e) => set({ citizenshipEligible: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
              <label htmlFor="citizenshipEligible" className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Vatandaşlık Başvurusuna Uygun ($400K+)
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Kira Getirisi Tahmini (Opsiyonel)</label>
              <input
                type="text" value={values.roiEstimate}
                onChange={(e) => set({ roiEstimate: e.target.value })}
                placeholder="Örn: %8-10 Yıllık Kira Getirisi"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Geliştirici / Danışmanlık Firması</label>
              <input
                type="text" value={values.developer}
                onChange={(e) => set({ developer: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İletişim Telefonu</label>
              <input
                type="text" value={values.contactPhone}
                onChange={(e) => set({ contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Web Sitesi</label>
              <input
                type="text" value={values.contactWebsite}
                onChange={(e) => set({ contactWebsite: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 block">Görsel URL</label>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl border border-amber-200/80 bg-amber-50/40 shrink-0 overflow-hidden flex items-center justify-center">
                  {values.image && !imageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values.image} alt="Önizleme" className="w-full h-full object-cover" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
                  ) : (
                    <Building2 className="w-5 h-5 text-zinc-600 dark:text-slate-400" />
                  )}
                </div>
                <input
                  type="text" value={values.image}
                  onChange={(e) => { setImageError(false); set({ image: e.target.value }); }}
                  placeholder="https://... (boş bırakılırsa yer tutucu görsel kullanılır)"
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" /> Harita Koordinatları</label>
              <div className="flex gap-2">
                <input
                  type="number" step="0.0001" value={values.lat}
                  onChange={(e) => set({ lat: Number(e.target.value) })}
                  placeholder="Enlem (lat)"
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
                />
                <input
                  type="number" step="0.0001" value={values.lng}
                  onChange={(e) => set({ lng: Number(e.target.value) })}
                  placeholder="Boylam (lng)"
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Açıklama</label>
              <textarea
                rows={3} value={values.description}
                onChange={(e) => set({ description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Öne Çıkan Özellikler (Virgülle Ayırın)</label>
              <input
                type="text" value={values.highlights}
                onChange={(e) => set({ highlights: e.target.value })}
                placeholder="Örn: Boğaz Manzarası, 7/24 Güvenlik, Kapalı Otopark"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200/80 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-amber-50/40 hover:bg-white/5 text-zinc-700 font-bold">
              İptal
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20">
              <Save className="w-4 h-4" /> {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
