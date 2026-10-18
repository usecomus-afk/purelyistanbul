"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { FirestoreService } from '@/lib/firestore-service';
import { adminLogin, establishAdminFirebaseSession } from '@/lib/admin-auth';
import { PropertyAdminPanel } from '@/components/cockpit/property-admin-panel';
import { SupplierAdminPanel } from '@/components/cockpit/supplier-admin-panel';
import { HotelAdminPanel } from '@/components/cockpit/hotel-admin-panel';
import { Experience, Booking, XeniosUser, BookingStatus, SupplierPartner } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Lock, LogOut, ShieldCheck, Mail, KeyRound, Plus, Search, Edit3, Trash2, Save, X,
  Power, EyeOff, CreditCard, CheckCircle2, ExternalLink, Package, Ticket, MapPin, Star, ImageOff,
  Building2, Briefcase, Hotel as HotelIcon, RefreshCw, Globe, Smartphone
} from 'lucide-react';

type NewExpDraft = {
  title: string;
  category: string;
  categoryTag: string;
  provider: string;
  supplierId: string;
  commissionRate: number;
  listingType: 'experience' | 'stay';
  availableSlots: number;
  publishToWeb: boolean;
  publishToMobile: boolean;
  location: string;
  phone: string;
  website: string;
  agentNote: string;
  price: number;
  currency: string;
  duration: string;
  image?: string;
  lat: number;
  lng: number;
  scoreStr: string;
};

const EMPTY_DRAFT: NewExpDraft = {
  title: '',
  category: 'Boğaz Turları & Yat',
  categoryTag: 'Boğaz & Deniz',
  provider: '',
  supplierId: '',
  commissionRate: 15,
  listingType: 'experience',
  availableSlots: 15,
  publishToWeb: true,
  publishToMobile: true,
  location: 'Sultanahmet, Fatih',
  phone: '+90 532 000 00 00',
  website: 'https://',
  agentNote: '',
  price: 1500,
  currency: '₺',
  duration: '2.5 Saat',
  image: '/images/istanbul/il_1588xN.6201904451_eqr3.webp',
  lat: 41.0082,
  lng: 28.9784,
  scoreStr: '5.0'
};

function experienceToDraft(exp: Experience): NewExpDraft {
  return {
    title: exp.title,
    category: exp.category,
    categoryTag: exp.categoryTag || exp.category,
    provider: exp.provider,
    supplierId: exp.supplierId || '',
    commissionRate: exp.commissionRate ?? 15,
    listingType: exp.listingType || 'experience',
    availableSlots: exp.availableSlots ?? 15,
    publishToWeb: exp.publishToWeb !== false,
    publishToMobile: exp.publishToMobile !== false,
    location: exp.location,
    phone: exp.phone,
    website: exp.website,
    agentNote: exp.agentNote || exp.desc || '',
    price: exp.price,
    currency: exp.currency,
    duration: exp.duration,
    image: exp.image,
    lat: exp.coords?.lat ?? 41.0082,
    lng: exp.coords?.lng ?? 28.9784,
    scoreStr: exp.scoreStr || '5.0'
  };
}

function draftToExperiencePatch(draft: NewExpDraft): Partial<Experience> {
  const ratingNum = parseFloat(draft.scoreStr) || 5;
  return {
    title: draft.title.trim(),
    category: draft.category,
    categoryTag: draft.categoryTag || draft.category,
    provider: draft.provider.trim(),
    supplierId: draft.supplierId || undefined,
    commissionRate: Number(draft.commissionRate) || 15,
    listingType: draft.listingType,
    availableSlots: Math.max(0, Number(draft.availableSlots) || 15),
    publishToWeb: draft.publishToWeb,
    publishToMobile: draft.publishToMobile,
    location: draft.location,
    phone: draft.phone,
    website: draft.website,
    agentNote: draft.agentNote,
    desc: draft.agentNote,
    price: Number(draft.price) || 0,
    currency: draft.currency,
    duration: draft.duration,
    image: draft.image,
    coords: { lat: Number(draft.lat) || 41.0082, lng: Number(draft.lng) || 28.9784 },
    scoreStr: draft.scoreStr || '5.0',
    rating: ratingNum
  };
}

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  payment_success: 'Ödeme Alındı',
  provider_pending: 'Sağlayıcı Onayı Bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal Edildi'
};

function AdminLoginGate({ onLogin }: { onLogin: (user: XeniosUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await adminLogin(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error || 'Giriş başarısız.');
      return;
    }

    const user: XeniosUser = {
      id: 'usr_admin_' + Date.now(),
      name: 'purelyİstanbul Yöneticisi',
      email: result.email || email.trim().toLowerCase(),
      role: 'admin',
      provider: 'email',
      createdAt: new Date().toISOString()
    };
    await establishAdminFirebaseSession({
      email: result.email || email,
      password,
      customToken: result.customToken,
    });
    XeniosStore.setMasterAdminLoggedIn(true);
    XeniosStore.setUser(user);
    toast.success('Admin girişi başarılı.');
    onLogin(user);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">İlan & Operasyon Yönetimi</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            Bu bölüm sadece yetkili yöneticiler içindir. Devam etmek için e-posta ve şifrenizi girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> E-Posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anilaslan@usecomus.com"
              className="w-full px-3 py-2.5 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full px-3 py-2.5 text-xs bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> {isSubmitting ? 'Kontrol Ediliyor...' : 'Yönetici Girişi Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<XeniosUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [tab, setTab] = useState<'listings' | 'suppliers' | 'properties' | 'hotels' | 'bookings'>('listings');
  const [isSyncing, setIsSyncing] = useState(false);

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [hotelsCount, setHotelsCount] = useState(0);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | BookingStatus>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NewExpDraft>(EMPTY_DRAFT);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [draft, setDraft] = useState<NewExpDraft>(EMPTY_DRAFT);

  const refresh = () => {
    setExperiences(XeniosStore.getExperiences());
    setBookings(XeniosStore.getBookings());
    setSuppliersCount(XeniosStore.getSuppliers().length);
    setHotelsCount(XeniosStore.getHotels().length);
    setPropertiesCount(XeniosStore.getPropertyListings().length);
  };

  useEffect(() => {
    setUser(XeniosStore.getUser());
    setCheckedAuth(true);
    refresh();

    const unsubCatalog = FirestoreService.subscribeToCatalogSync();
    window.addEventListener('xenios_experiences_updated', refresh);
    window.addEventListener('xenios_bookings_updated', refresh);
    window.addEventListener('xenios_suppliers_updated', refresh);
    window.addEventListener('xenios_hotels_updated', refresh);
    window.addEventListener('xenios_properties_updated', refresh);
    return () => {
      unsubCatalog();
      window.removeEventListener('xenios_experiences_updated', refresh);
      window.removeEventListener('xenios_bookings_updated', refresh);
      window.removeEventListener('xenios_suppliers_updated', refresh);
      window.removeEventListener('xenios_hotels_updated', refresh);
      window.removeEventListener('xenios_properties_updated', refresh);
    };
  }, []);

  const isAdmin =
    XeniosStore.isMasterAdminLoggedIn() ||
    user?.role === 'admin' ||
    user?.role === 'pilot';

  const stats = useMemo(() => {
    const active = experiences.filter((e) => e.status !== 'suspended').length;
    const suspended = experiences.length - active;
    const pendingBookings = bookings.filter((b) => b.status !== 'confirmed' && b.status !== 'cancelled').length;
    const totalVolume = bookings.filter((b) => b.status !== 'cancelled').reduce((sum, b) => sum + b.amount, 0);
    return {
      total: experiences.length,
      active,
      suspended,
      bookingsTotal: bookings.length,
      pendingBookings,
      totalVolume
    };
  }, [experiences, bookings]);

  const filteredExperiences = experiences.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.provider.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBookings = bookings.filter((b) => bookingFilter === 'all' || b.status === bookingFilter);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    const res = await FirestoreService.syncAllLocalDataToFirestore();
    setIsSyncing(false);
    if (res.success) {
      toast.success('Web Sitesi & Mobil App Bulut Senkronizasyonu Tamamlandı!', {
        description: res.message
      });
    } else {
      toast.error(res.message);
    }
  };

  const handleCreateListingForSupplier = (sup: SupplierPartner) => {
    setDraft({
      ...EMPTY_DRAFT,
      provider: sup.name,
      supplierId: sup.id,
      commissionRate: sup.commissionRate ?? 15,
      category: sup.category || 'Boğaz Turları & Yat',
      categoryTag: sup.category || 'Özel Deneyim',
      location: sup.district || 'İstanbul',
      phone: sup.phone || '+90 532 000 00 00',
      website: sup.website || 'https://',
      listingType: sup.type === 'hotel' || sup.type === 'property_management' ? 'stay' : 'experience',
      publishToWeb: sup.publishToWeb !== false,
      publishToMobile: sup.publishToMobile !== false
    });
    setTab('listings');
    setIsNewOpen(true);
  };

  const toggleStatus = (exp: Experience) => {
    const nextStatus = exp.status === 'suspended' ? 'active' : 'suspended';
    XeniosStore.updateExperience(exp.id, { status: nextStatus });
    toast.success(
      nextStatus === 'suspended'
        ? `"${exp.title}" askıya alındı — Web ve Mobil App'te gizlendi.`
        : `"${exp.title}" yeniden yayında (Web + Mobil App).`
    );
    refresh();
  };

  const handleDelete = (exp: Experience) => {
    XeniosStore.deleteExperience(exp.id);
    refresh();
    toast.success(`"${exp.title}" silindi.`, {
      action: {
        label: 'Geri Al',
        onClick: () => {
          XeniosStore.addExperience(exp);
          refresh();
          toast.info(`"${exp.title}" geri yüklendi.`);
        }
      }
    });
  };

  const openEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setEditDraft(experienceToDraft(exp));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editDraft.title.trim() || !editDraft.provider.trim()) {
      toast.error('Lütfen ilan başlığı ve işletme adını girin.');
      return;
    }
    XeniosStore.updateExperience(editingId, draftToExperiencePatch(editDraft));
    toast.success(`"${editDraft.title}" güncellendi ve Web + Mobil App'te canlıya alındı.`);
    setEditingId(null);
    refresh();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.provider.trim()) {
      toast.error('Lütfen ilan başlığı ve işletme adını girin.');
      return;
    }
    const created: Experience = {
      id: 'exp-admin-' + Date.now(),
      ...draftToExperiencePatch(draft),
      agentNote: draft.agentNote || 'Purelyİstanbul anlaşmalı işletme ilanı.',
      iconName: 'sparkles',
      status: 'active'
    } as Experience;
    XeniosStore.addExperience(created);
    toast.success(`"${created.title}" kataloğa eklendi, Web ve Mobil App'te anında canlıya alındı.`);
    setIsNewOpen(false);
    setDraft(EMPTY_DRAFT);
    refresh();
  };

  const handleApproveBooking = (id: string) => {
    XeniosStore.updateBookingStatus(id, 'confirmed');
    toast.success('Rezervasyon onaylandı.');
    refresh();
  };

  if (!checkedAuth) return null;

  if (!isAdmin) {
    return <AdminLoginGate onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/15 via-amber-100/40 to-white p-5 rounded-3xl border border-amber-300 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 font-mono font-bold uppercase border border-amber-300">
              WEB + MOBİL APP MERKEZİ YÖNETİM
            </span>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Firestore Canlı Senkron Aktif
            </span>
          </div>
          <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100">
            İlan, Tedarikçi/İşletme, Mülk & Otel Yönetim Merkezi
          </h1>
          <p className="text-xs text-zinc-600 dark:text-slate-400">
            Yeni ilan girişi, ilan düzenleme, anlaşmalı tedarikçi/işletme kaydı, mülk yönetimi ve partner oteller — Web sitesi ve Mobil App ortak kontrol ekranı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncCloud}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Senkronize Ediliyor...' : 'Web & Mobil App Tümünü Senkronize Et'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Aktif / Toplam İlan</span>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {stats.active} <span className="text-xs text-zinc-400">/ {stats.total}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Anlaşmalı İşletme</span>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">{suppliersCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Mülk Portföyü</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{propertiesCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Partner Otel</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{hotelsCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Rezervasyonlar</span>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">{stats.bookingsTotal}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase">Toplam Hacim</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {stats.totalVolume.toLocaleString('tr-TR')} ₺
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800 p-1.5 rounded-2xl border border-amber-200/80 w-full sm:w-fit">
        <button
          onClick={() => setTab('listings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'listings'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'text-zinc-600 hover:bg-amber-50'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" /> İlan Yönetimi ({experiences.length})
        </button>
        <button
          onClick={() => setTab('suppliers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'suppliers'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'text-zinc-600 hover:bg-amber-50'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Anlaşmalı İşletmeler & Tedarikçiler ({suppliersCount})
        </button>
        <button
          onClick={() => setTab('properties')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'properties'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'text-zinc-600 hover:bg-amber-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Mülk & Gayrimenkul Yönetimi ({propertiesCount})
        </button>
        <button
          onClick={() => setTab('hotels')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'hotels'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'text-zinc-600 hover:bg-amber-50'
          }`}
        >
          <HotelIcon className="w-3.5 h-3.5" /> Partner Oteller & Odalar ({hotelsCount})
        </button>
        <button
          onClick={() => setTab('bookings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'bookings'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'text-zinc-600 hover:bg-amber-50'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Satın Almalar & Rezervasyonlar ({bookings.length})
        </button>
      </div>

      {tab === 'suppliers' && (
        <SupplierAdminPanel onCreateListingForSupplier={handleCreateListingForSupplier} />
      )}

      {tab === 'properties' && <PropertyAdminPanel />}

      {tab === 'hotels' && <HotelAdminPanel />}

      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İlan başlığı, anlaşmalı işletme, kategori veya konum ara..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <button
              onClick={() => {
                setDraft(EMPTY_DRAFT);
                setIsNewOpen(true);
              }}
              className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Yeni İlan Girişi Yap
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExperiences.map((exp) => {
              const suspended = exp.status === 'suspended';
              return (
                <div
                  key={exp.id}
                  className={`rounded-3xl p-4 border space-y-3 flex flex-col justify-between transition ${
                    suspended
                      ? 'bg-white/50 border-red-500/30'
                      : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200/80 hover:border-amber-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold border border-amber-500/30">
                        {exp.category}
                      </span>
                      {suspended ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> ASKIDA
                        </span>
                      ) : (
                        <strong className="text-sm font-mono text-emerald-600 font-bold">
                          {formatPrice(exp.price, exp.currency)}
                        </strong>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-bold font-serif line-clamp-2 ${
                        suspended ? 'text-zinc-500 dark:text-slate-400' : 'text-zinc-900 dark:text-slate-100'
                      }`}
                    >
                      {exp.title}
                    </h3>

                    <div className="space-y-1 text-xs text-zinc-500 dark:text-slate-400 pt-1">
                      <p className="text-zinc-700 truncate">
                        İşletme: <strong>{exp.provider}</strong>
                      </p>
                      <p className="truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" /> {exp.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <div className="flex items-center gap-1 font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            exp.publishToWeb !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          <Globe className="w-2.5 h-2.5" /> Web
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            exp.publishToMobile !== false
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          <Smartphone className="w-2.5 h-2.5" /> Mobil App
                        </span>
                      </div>
                      <span className="font-mono text-zinc-500">
                        Kontenjan: <strong>{exp.availableSlots ?? 15}</strong> • Komisyon:{' '}
                        <strong>%{exp.commissionRate ?? 15}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-200/80 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(exp)}
                      className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold text-xs rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Düzenle
                    </button>
                    <button
                      onClick={() => toggleStatus(exp)}
                      title={suspended ? 'Yeniden yayınla' : 'Askıya al'}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        suspended
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                          : 'bg-zinc-700/10 hover:bg-zinc-700/20 text-zinc-700 border-zinc-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp)}
                      title="Kalıcı sil"
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/30 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredExperiences.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 dark:text-slate-400 text-xs py-12">
                Aramanızla eşleşen ilan bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800 p-1 rounded-xl border border-amber-200/80 overflow-x-auto w-fit">
            {(['all', 'payment_success', 'provider_pending', 'confirmed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  bookingFilter === f
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'
                }`}
              >
                {f === 'all' ? 'Tümü' : BOOKING_STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-12 text-center text-zinc-500 dark:text-slate-400 border border-amber-200/80 space-y-2">
              <CreditCard className="w-8 h-8 mx-auto text-emerald-400 opacity-40" />
              <p className="text-xs">Bu filtreye uygun bir satın alma/rezervasyon kaydı yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 hover:border-amber-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 font-mono font-bold text-xs">
                        {b.confirmationCode}
                      </span>
                      <strong className="text-sm text-zinc-900 dark:text-slate-100">{b.experienceTitle}</strong>
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-700'
                            : b.status === 'cancelled'
                              ? 'bg-zinc-600/30 text-zinc-500 dark:text-slate-400'
                              : 'bg-amber-500/20 text-amber-800'
                        }`}
                      >
                        {BOOKING_STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-slate-400 space-y-0.5">
                      <p>
                        <strong>Misafir:</strong> {b.guestName} ({b.hotelName} - Oda {b.roomNumber}) • Tel: {b.guestPhone}
                      </p>
                      <p>
                        <strong>Sağlayıcı:</strong> {b.providerName} (Tel: {b.providerPhone})
                      </p>
                      <p>
                        <strong>Tarih:</strong> {b.bookingDate} {b.bookingTime} • {b.guestCount} Kişi • Tutar:{' '}
                        <span className="text-amber-700 font-bold">{formatPrice(b.amount, b.currency)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <a
                      href={`/confirm-booking/${b.id}`}
                      target="_blank"
                      className="px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-white/5 border border-amber-200/80 text-zinc-700 rounded-xl font-semibold flex items-center gap-1 transition"
                    >
                      <span>Onay Sayfası</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {b.status === 'confirmed' ? (
                      <span className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-700 font-bold">
                        ✓ Onaylandı
                      </span>
                    ) : b.status !== 'cancelled' ? (
                      <button
                        onClick={() => handleApproveBooking(b.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {isNewOpen && (
        <ExperienceFormModal
          title="Yeni İlan Girişi (Web Sitesi & Mobil App)"
          submitLabel="İlanı Yayınla & Senkronize Et"
          values={draft}
          onChange={(next) => setDraft(next)}
          onCancel={() => setIsNewOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* EDIT MODAL */}
      {editingId && (
        <ExperienceFormModal
          title="İlan, Fiyat & Yayın Kanalı Düzenleme"
          submitLabel="Değişiklikleri Canlıya Al"
          values={editDraft}
          onChange={(next) => setEditDraft(next)}
          onCancel={() => setEditingId(null)}
          onSubmit={handleSaveEdit}
        />
      )}
    </div>
  );
}

interface ExperienceFormModalProps {
  title: string;
  submitLabel: string;
  values: NewExpDraft;
  onChange: (next: NewExpDraft) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function ExperienceFormModal({ title, submitLabel, values, onChange, onCancel, onSubmit }: ExperienceFormModalProps) {
  const set = (patch: Partial<NewExpDraft>) => onChange({ ...values, ...patch });
  const [imageError, setImageError] = useState(false);
  const suppliers = useMemo(() => XeniosStore.getSuppliers(), []);

  const handleSelectSupplier = (supId: string) => {
    const found = suppliers.find((s) => s.id === supId);
    if (found) {
      set({
        supplierId: found.id,
        provider: found.name,
        phone: found.phone || values.phone,
        website: found.website || values.website,
        location: found.district || values.location,
        category: found.category || values.category,
        categoryTag: found.category || values.categoryTag,
        commissionRate: found.commissionRate ?? values.commissionRate
      });
    } else {
      set({ supplierId: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 border border-amber-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold font-serif text-zinc-900 dark:text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-amber-50/40 hover:bg-amber-100 flex items-center justify-center text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Supplier Quick Selector */}
            <div className="sm:col-span-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80">
              <label className="text-[11px] font-bold text-amber-900 block mb-1">
                Anlaşmalı İşletme / Tedarikçi Seç (Seçildiğinde İletişim & Komisyon Otomatik Dolar)
              </label>
              <select
                value={values.supplierId}
                onChange={(e) => handleSelectSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-zinc-900"
              >
                <option value="">-- Manuel İşletme Girişi veya Listeden Seçin --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category} • %{s.commissionRate} Komisyon)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İlan Başlığı *</label>
              <input
                type="text"
                required
                value={values.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Örn: Özel Yat ile Boğazda Günbatımı & Akşam Yemeği Turu"
                className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İlan Türü</label>
              <select
                value={values.listingType}
                onChange={(e) => set({ listingType: e.target.value as 'experience' | 'stay' })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900"
              >
                <option value="experience">Deneyim / Tur / Restoran / Hizmet</option>
                <option value="stay">Konaklama / Butik Otel / Kısa Dönem Mülk</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Kategori</label>
              <input
                type="text"
                value={values.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder="Boğaz Turları & Yat, Gastronomi, Tarihi Hamam..."
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Kategori Etiketi (Misafir Arayüzünde)</label>
              <input
                type="text"
                value={values.categoryTag}
                onChange={(e) => set({ categoryTag: e.target.value })}
                placeholder="Örn: Boğaz & Deniz"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500" /> Puan
              </label>
              <input
                type="text"
                value={values.scoreStr}
                onChange={(e) => set({ scoreStr: e.target.value })}
                placeholder="Örn: 4.9/5"
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İşletme / Tedarikçi Adı *</label>
              <input
                type="text"
                required
                value={values.provider}
                onChange={(e) => set({ provider: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">İşletme Telefonu</label>
              <input
                type="text"
                value={values.phone}
                onChange={(e) => set({ phone: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Web Sitesi</label>
              <input
                type="text"
                value={values.website}
                onChange={(e) => set({ website: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Fiyat & Para Birimi</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={values.price}
                  onChange={(e) => set({ price: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-emerald-600 font-bold font-mono"
                />
                <select
                  value={values.currency}
                  onChange={(e) => set({ currency: e.target.value })}
                  className="w-24 px-2 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl text-zinc-900 dark:text-slate-100 font-bold"
                >
                  <option value="₺">₺ (TRY)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="$">$ (USD)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Süre</label>
              <input
                type="text"
                value={values.duration}
                onChange={(e) => set({ duration: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Günlük Kontenjan</label>
                <input
                  type="number"
                  min={0}
                  value={values.availableSlots}
                  onChange={(e) => set({ availableSlots: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Komisyon (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={values.commissionRate}
                  onChange={(e) => set({ commissionRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl font-mono font-bold text-amber-800"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.publishToWeb}
                  onChange={(e) => set({ publishToWeb: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Web Sitesinde (purelyistanbul.com Marketplace) Yayınla
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.publishToMobile}
                  onChange={(e) => set({ publishToMobile: e.target.checked })}
                  className="accent-amber-500 w-4 h-4"
                />
                Mobil App & Otel İçi Concierge'da Yayınla
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Buluşma Noktası / Konum (Metin)</label>
              <input
                type="text"
                value={values.location}
                onChange={(e) => set({ location: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" /> Harita Koordinatları (Ulaşım Rotası & Mesafe Hesabı İçin)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={values.lat}
                  onChange={(e) => set({ lat: Number(e.target.value) })}
                  placeholder="Enlem (lat)"
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={values.lng}
                  onChange={(e) => set({ lng: Number(e.target.value) })}
                  placeholder="Boylam (lng)"
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 block">Görsel URL</label>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl border border-amber-200/80 bg-amber-50/40 shrink-0 overflow-hidden flex items-center justify-center">
                  {values.image && !imageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values.image}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <ImageOff className="w-5 h-5 text-zinc-600 dark:text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={values.image ?? ''}
                  onChange={(e) => {
                    setImageError(false);
                    set({ image: e.target.value });
                  }}
                  placeholder="/images/experiences/... veya https://..."
                  className="flex-1 px-3 py-2 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Açıklama / Rehber & Operasyon Notu</label>
              <textarea
                rows={3}
                value={values.agentNote}
                onChange={(e) => set({ agentNote: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl focus:border-amber-500 focus:outline-none text-zinc-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200/80 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-amber-50/40 hover:bg-amber-100 text-zinc-700 font-bold"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" /> {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
