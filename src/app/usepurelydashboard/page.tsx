"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { adminLogin } from "@/lib/admin-auth";
import { XeniosStore } from "@/lib/store";
import { FirestoreService } from "@/lib/firestore-service";
import {
  Experience,
  Hotel,
  PropertyListing,
  SupplierPartner,
  Booking,
  ServiceRequest,
  InvestmentLead,
  BookingStatus,
} from "@/lib/types";
import { MARKETPLACE_COLLECTIONS } from "@/lib/marketplace/collections";
import type { HostApplication, MarketplaceListing } from "@/lib/marketplace/types";
import { approveHostApplication, rejectHostApplication } from "@/lib/marketplace/firestore";
import { watchPendingListings, approveListing, rejectListing } from "@/lib/marketplace/listings";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";
import { getCategoryCode } from "@/lib/marketplace/seed-listings";
import { SupplierAdminPanel } from "@/components/cockpit/supplier-admin-panel";
import { PropertyAdminPanel } from "@/components/cockpit/property-admin-panel";
import { HotelAdminPanel } from "@/components/cockpit/hotel-admin-panel";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutGrid,
  Globe,
  Smartphone,
  Compass,
  Briefcase,
  Building2,
  Hotel as HotelIcon,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
  ExternalLink,
  LogOut,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  Menu,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Star,
  Power,
  EyeOff,
  Layers,
  Bell,
  CreditCard,
} from "lucide-react";

type DashboardTab =
  | "overview"
  | "channels"
  | "listings"
  | "suppliers"
  | "properties"
  | "hotels";

type ChannelSubTab = "matrix" | "modules" | "marketplace" | "requests";

type NewExpDraft = {
  title: string;
  category: string;
  categoryTag: string;
  provider: string;
  supplierId: string;
  commissionRate: number;
  listingType: "experience" | "stay";
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
  title: "",
  category: "Boğaz Turları & Yat",
  categoryTag: "Boğaz & Deniz",
  provider: "",
  supplierId: "",
  commissionRate: 15,
  listingType: "experience",
  availableSlots: 15,
  publishToWeb: true,
  publishToMobile: true,
  location: "Sultanahmet, Fatih",
  phone: "+90 532 000 00 00",
  website: "https://",
  agentNote: "",
  price: 1500,
  currency: "₺",
  duration: "2.5 Saat",
  image: "/images/istanbul/il_1588xN.6201904451_eqr3.webp",
  lat: 41.0082,
  lng: 28.9784,
  scoreStr: "5.0",
};

const CATEGORIES = [
  { label: "Tarih & Müzeler", tag: "Tarih & Kültür" },
  { label: "Gastronomi & Gurme", tag: "Gastronomi" },
  { label: "Sanat & Semazen", tag: "Sanat & Tasarım" },
  { label: "Alışveriş & Çarşılar", tag: "Alışveriş" },
  { label: "Boğaz Turları & Yat", tag: "Boğaz & Deniz" },
  { label: "Kültürel Miras", tag: "Kültür & İnanç" },
  { label: "Türk Hamamı & Spa", tag: "Wellness & Spa" },
  { label: "Fotoğraf & Kostüm", tag: "Fotoğraf & Anı" },
  { label: "Özel VIP Transfer", tag: "VIP Ulaşım" },
  { label: "Önerdiğimiz Restoranlar", tag: "Seçkin Restoranlar" },
  { label: "Medikal Estetik & Güzellik", tag: "Medikal Estetik" },
  { label: "İstanbul'da Yatırım", tag: "Gayrimenkul & Yatırım" },
];

const APP_MODULES_CONFIG = [
  {
    id: "mod-reception",
    title: "7/24 Dijital Resepsiyon & AI Concierge",
    channel: "iOS App & Otel İçi PWA",
    desc: "Misafirlerin kendi dilinde sesli ve yazılı resepsiyon / şehir rehberi asistanı.",
    badge: "Her Zaman Aktif",
  },
  {
    id: "mod-housekeeping",
    title: "Kat Hizmetleri & Oda İhtiyaçları",
    channel: "Otel İçi PWA & iOS App",
    desc: "Havlu, yastık, oda temizliği, minibar ve teknik servis taleplerini anında otele iletir.",
    badge: "Aktif",
  },
  {
    id: "mod-dining",
    title: "Oda Servisi & Seçkin Restoran Rezervasyonu",
    channel: "Web, iOS App & PWA",
    desc: "Odaya yemek siparişi ve İstanbul'un anlaşmalı fine-dining restoranlarına VIP masa rezervasyonu.",
    badge: "Aktif",
  },
  {
    id: "mod-transfer",
    title: "Taksi, VIP Vito & Havalimanı Transfer",
    channel: "iOS App & Otel İçi PWA",
    desc: "Otel kapısına tek dokunuşla taksi veya özel şoförlü lüks transfer çağırma modülü.",
    badge: "Aktif",
  },
  {
    id: "mod-tours",
    title: "Boğaz Yatları, Özel Turlar & Deneyimler",
    channel: "purelyistanbul.com Web + iOS App + PWA",
    desc: "Anlaşmalı tedarikçilerin sunduğu tüm kültür, sanat, yat ve gastronomi deneyimleri.",
    badge: "Aktif",
  },
  {
    id: "mod-realestate",
    title: "Gayrimenkul & Kısa Dönem Kiralık Portföy",
    channel: "purelyistanbul.com Web + iOS App + PWA",
    desc: "Yatırımlık mülkler, vatandaşlığa uygun daireler ve kısa dönem rezidans kiralama vitrini.",
    badge: "Aktif",
  },
];

function experienceToDraft(exp: Experience): NewExpDraft {
  return {
    title: exp.title,
    category: exp.category,
    categoryTag: exp.categoryTag || exp.category,
    provider: exp.provider,
    supplierId: exp.supplierId || "",
    commissionRate: exp.commissionRate ?? 15,
    listingType: exp.listingType || "experience",
    availableSlots: exp.availableSlots ?? 15,
    publishToWeb: exp.publishToWeb !== false,
    publishToMobile: exp.publishToMobile !== false,
    location: exp.location,
    phone: exp.phone,
    website: exp.website,
    agentNote: exp.agentNote || exp.desc || "",
    price: exp.price,
    currency: exp.currency,
    duration: exp.duration,
    image: exp.image,
    lat: exp.coords?.lat ?? 41.0082,
    lng: exp.coords?.lng ?? 28.9784,
    scoreStr: exp.scoreStr || "5.0",
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
    coords: {
      lat: Number(draft.lat) || 41.0082,
      lng: Number(draft.lng) || 28.9784,
    },
    scoreStr: draft.scoreStr || "5.0",
    rating: ratingNum,
  };
}

export default function UsePurelyDashboardPage() {
  // Auth state
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [channelSubTab, setChannelSubTab] = useState<ChannelSubTab>("matrix");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Store & Firestore data
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPartner[]>([]);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [investmentLeads, setInvestmentLeads] = useState<InvestmentLead[]>([]);
  const [hostApplications, setHostApplications] = useState<HostApplication[]>([]);
  const [pendingMarketplaceListings, setPendingMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [hostRates, setHostRates] = useState<Record<string, string>>({});
  const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Listing CRUD state
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newDraft, setNewDraft] = useState<NewExpDraft>(EMPTY_DRAFT);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NewExpDraft>(EMPTY_DRAFT);
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilterChannel, setListingFilterChannel] = useState<"all" | "web" | "mobile">("all");
  const [listingFilterCategory, setListingFilterCategory] = useState<string>("all");

  // Module toggles (persisted in localStorage for instant UI feedback)
  const [disabledModules, setDisabledModules] = useState<string[]>([]);

  // 1. Force Light Mode & Unlock Body Scroll on Mount
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.height = "auto";

    try {
      const savedDisabled = localStorage.getItem("purely_disabled_modules");
      if (savedDisabled) setDisabledModules(JSON.parse(savedDisabled));
    } catch {}
  }, []);

  // 2. Check Admin Auth & Load Data
  const refreshAllData = () => {
    setExperiences(XeniosStore.getExperiences());
    setSuppliers(XeniosStore.getSuppliers());
    setProperties(XeniosStore.getPropertyListings());
    setHotels(XeniosStore.getHotels());
    setBookings(XeniosStore.getBookings());
    setServiceRequests(XeniosStore.getRequests());
    setInvestmentLeads(XeniosStore.getInvestmentLeads());
  };

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn =
        XeniosStore.isMasterAdminLoggedIn() ||
        XeniosStore.getUser()?.role === "admin" ||
        XeniosStore.getUser()?.role === "pilot";
      setIsAuth(loggedIn);
      if (loggedIn) {
        refreshAllData();
      }
    };
    checkAuth();

    const unsubCatalog = FirestoreService.subscribeToCatalogSync();

    window.addEventListener("xenios_master_admin_auth", checkAuth);
    window.addEventListener("xenios_experiences_updated", refreshAllData);
    window.addEventListener("xenios_suppliers_updated", refreshAllData);
    window.addEventListener("xenios_properties_updated", refreshAllData);
    window.addEventListener("xenios_hotels_updated", refreshAllData);
    window.addEventListener("xenios_bookings_updated", refreshAllData);
    window.addEventListener("xenios_requests_updated", refreshAllData);

    return () => {
      unsubCatalog();
      window.removeEventListener("xenios_master_admin_auth", checkAuth);
      window.removeEventListener("xenios_experiences_updated", refreshAllData);
      window.removeEventListener("xenios_suppliers_updated", refreshAllData);
      window.removeEventListener("xenios_properties_updated", refreshAllData);
      window.removeEventListener("xenios_hotels_updated", refreshAllData);
      window.removeEventListener("xenios_bookings_updated", refreshAllData);
      window.removeEventListener("xenios_requests_updated", refreshAllData);
    };
  }, []);

  // 3. Subscribe to Marketplace Host Applications & Pending Listings
  useEffect(() => {
    if (!isAuth || !db) return;
    let unsubApps = () => {};
    let unsubPending = () => {};
    try {
      const q = query(
        collection(db, MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS),
        orderBy("createdAt", "desc")
      );
      unsubApps = onSnapshot(
        q,
        (snap) => {
          setHostApplications(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<HostApplication, "id">),
            }))
          );
        },
        () => {}
      );
      unsubPending = watchPendingListings(setPendingMarketplaceListings);
    } catch {}
    return () => {
      unsubApps();
      unsubPending();
    };
  }, [isAuth]);

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");
    const result = await adminLogin(email, password);
    setIsLoggingIn(false);

    if (!result.success) {
      setAuthError(
        result.error ||
          "Hatalı yönetici e-postası veya şifre. Lütfen kontrol ediniz."
      );
      toast.error("Giriş yapılamadı.");
      return;
    }

    XeniosStore.setMasterAdminLoggedIn(true);
    XeniosStore.setHotelPortalLoggedIn(true);
    XeniosStore.setUser({
      id: "usr-anilaslan",
      name: result.name || "Anıl Aslan",
      email: result.email || "anilaslan@usecomus.com",
      role: "pilot",
      provider: "email",
      createdAt: new Date().toISOString(),
    });

    if (result.customToken && auth) {
      try {
        await signInWithCustomToken(auth, result.customToken);
      } catch {}
    }

    setIsAuth(true);
    refreshAllData();
    toast.success("Purelyİstanbul Yönetim Masasına hoş geldiniz!");
  };

  const handleLogout = () => {
    XeniosStore.setMasterAdminLoggedIn(false);
    auth?.signOut().catch(() => {});
    setIsAuth(false);
    toast.info("Yönetici oturumu kapatıldı.");
  };

  // Cloud Sync Handler
  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      const exps = XeniosStore.getExperiences();
      const props = XeniosStore.getPropertyListings();
      const htls = XeniosStore.getHotels();
      const sups = XeniosStore.getSuppliers();

      await Promise.all([
        ...exps.map((item) => FirestoreService.upsertExperience(item)),
        ...props.map((item) => FirestoreService.upsertProperty(item)),
        ...htls.map((item) => FirestoreService.upsertHotel(item)),
        ...sups.map((item) => FirestoreService.upsertSupplier(item)),
      ]);
      toast.success(
        "Tüm katalog purelyistanbul.com Web, iOS App ve PWA ile senkronize edildi!"
      );
    } catch {
      toast.error("Senkronizasyon sırasında bir hata oluştu.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Switch Tab + Smooth Scroll to Top
  const switchTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Listing Handlers
  const handleSelectSupplierOnDraft = (
    supplierId: string,
    isEdit: boolean
  ) => {
    const found = suppliers.find((s) => s.id === supplierId);
    if (isEdit) {
      setEditDraft((prev) => ({
        ...prev,
        supplierId,
        provider: found ? found.name : prev.provider,
        phone: found?.phone || prev.phone,
        website: found?.website || prev.website,
        commissionRate: found ? found.commissionRate : prev.commissionRate,
        location: found?.district
          ? `${found.district}, İstanbul`
          : prev.location,
      }));
    } else {
      setNewDraft((prev) => ({
        ...prev,
        supplierId,
        provider: found ? found.name : prev.provider,
        phone: found?.phone || prev.phone,
        website: found?.website || prev.website,
        commissionRate: found ? found.commissionRate : prev.commissionRate,
        location: found?.district
          ? `${found.district}, İstanbul`
          : prev.location,
      }));
    }
  };

  const handleImageFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditDraft((prev) => ({ ...prev, image: dataUrl }));
      } else {
        setNewDraft((prev) => ({ ...prev, image: dataUrl }));
      }
      toast.success("Görsel yüklendi.");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraft.title.trim() || !newDraft.provider.trim()) {
      toast.error("Lütfen ilan başlığı ve işletme/sağlayıcı adını girin.");
      return;
    }
    const patch = draftToExperiencePatch(newDraft);
    const created: Experience = {
      id: "exp-" + Date.now(),
      title: patch.title || "Yeni Deneyim",
      category: patch.category || "Boğaz Turları & Yat",
      categoryTag: patch.categoryTag || "Boğaz & Deniz",
      iconName: "Compass",
      provider: patch.provider || "Purelyİstanbul Partner",
      supplierId: patch.supplierId,
      commissionRate: patch.commissionRate ?? 15,
      listingType: patch.listingType || "experience",
      availableSlots: patch.availableSlots ?? 15,
      publishToWeb: patch.publishToWeb !== false,
      publishToMobile: patch.publishToMobile !== false,
      location: patch.location || "İstanbul",
      phone: patch.phone || "+90 532 000 00 00",
      website: patch.website || "https://purelyistanbul.com",
      agentNote: patch.agentNote || "",
      desc: patch.desc || "",
      price: patch.price ?? 1500,
      currency: patch.currency || "₺",
      duration: patch.duration || "2 Saat",
      image:
        patch.image || "/images/istanbul/il_1588xN.6201904451_eqr3.webp",
      coords: patch.coords || { lat: 41.0082, lng: 28.9784 },
      scoreStr: patch.scoreStr || "5.0",
      rating: patch.rating ?? 5.0,
      reviewsCount: "12",
      status: "active",
    };

    XeniosStore.addExperience(created);
    refreshAllData();
    setNewDraft(EMPTY_DRAFT);
    setShowAddListingModal(false);
    toast.success(`"${created.title}" ilanı Web ve Mobil App'te yayına alındı!`);
  };

  const handleStartEditListing = (exp: Experience) => {
    setEditingListingId(exp.id);
    setEditDraft(experienceToDraft(exp));
  };

  const handleSaveEditListing = (id: string) => {
    if (!editDraft.title.trim()) {
      toast.error("İlan başlığı boş bırakılamaz.");
      return;
    }
    XeniosStore.updateExperience(id, draftToExperiencePatch(editDraft));
    setEditingListingId(null);
    refreshAllData();
    toast.success("İlan güncellendi ve tüm kanallara yansıtıldı.");
  };

  const handleToggleListingChannel = (
    exp: Experience,
    channel: "web" | "mobile"
  ) => {
    if (channel === "web") {
      const next = exp.publishToWeb === false ? true : false;
      XeniosStore.updateExperience(exp.id, { publishToWeb: next });
      toast.success(
        next
          ? `"${exp.title}" purelyistanbul.com Web Vitrininde açıldı.`
          : `"${exp.title}" purelyistanbul.com Web Vitrininden gizlendi.`
      );
    } else {
      const next = exp.publishToMobile === false ? true : false;
      XeniosStore.updateExperience(exp.id, { publishToMobile: next });
      toast.success(
        next
          ? `"${exp.title}" iOS App & PWA'da açıldı.`
          : `"${exp.title}" iOS App & PWA'dan gizlendi.`
      );
    }
    refreshAllData();
  };

  const handleToggleListingActive = (exp: Experience) => {
    const next = exp.status === "suspended" ? "active" : "suspended";
    XeniosStore.updateExperience(exp.id, { status: next });
    refreshAllData();
    toast.info(
      next === "active" ? "İlan tekrar yayına alındı." : "İlan askıya alındı."
    );
  };

  // 1-Click Category Passivation / Activation (Hides/shows category & all its listings on both Web and Mobile App)
  const handleToggleCategoryActive = async (catValue: string, catLabel: string) => {
    const allExps = XeniosStore.getExperiences();
    const matchingExps = allExps.filter((e) => getCategoryCode(e.category) === catValue);
    const allProps = XeniosStore.getPropertyListings();

    const activeExpCount = matchingExps.filter(
      (e) => e.status !== "suspended" && (e.publishToWeb !== false || e.publishToMobile !== false)
    ).length;
    const activePropCount =
      catValue === "cat-12"
        ? allProps.filter((p) => p.status !== "suspended").length
        : 0;

    const isCurrentlyActive = activeExpCount + activePropCount > 0;
    const nextStatus = isCurrentlyActive ? "suspended" : "active";

    const updatedExps: Experience[] = [];
    const nextExpsList = allExps.map((e) => {
      if (getCategoryCode(e.category) === catValue) {
        const patched: Experience =
          nextStatus === "suspended"
            ? { ...e, status: "suspended" }
            : { ...e, status: "active", publishToWeb: true, publishToMobile: true };
        updatedExps.push(patched);
        return patched;
      }
      return e;
    });
    XeniosStore.saveExperiences(nextExpsList);

    const updatedProps: PropertyListing[] = [];
    if (catValue === "cat-12") {
      const nextPropsList = allProps.map((p) => {
        const patched: PropertyListing =
          nextStatus === "suspended"
            ? { ...p, status: "suspended", publishToWeb: false }
            : { ...p, status: "active", publishToWeb: true };
        updatedProps.push(patched);
        return patched;
      });
      XeniosStore.savePropertyListings(nextPropsList);
    }

    refreshAllData();

    toast.success(
      nextStatus === "suspended"
        ? `"${catLabel}" kategorisi ve ait olan tüm ilanlar Web sitesinden ve Mobil Uygulamadan gizlendi (pasife alındı).`
        : `"${catLabel}" kategorisi ve ait olan tüm ilanlar tekrar yayına alındı!`
    );

    try {
      await Promise.all([
        ...updatedExps.map((item) => FirestoreService.upsertExperience(item)),
        ...updatedProps.map((item) => FirestoreService.upsertProperty(item)),
      ]);
    } catch {}
  };

  const handleDeleteListing = (exp: Experience) => {
    if (
      !window.confirm(
        `"${exp.title}" ilanını kalıcı olarak silmek istediğinize emin misiniz?`
      )
    )
      return;
    XeniosStore.deleteExperience(exp.id);
    refreshAllData();
    toast.success("İlan silindi.");
  };

  const toggleAppModule = (modId: string) => {
    if (modId === "mod-reception") {
      toast.info("7/24 Dijital Resepsiyon temel modüldür, her zaman aktiftir.");
      return;
    }
    const next = disabledModules.includes(modId)
      ? disabledModules.filter((x) => x !== modId)
      : [...disabledModules, modId];
    setDisabledModules(next);
    try {
      localStorage.setItem("purely_disabled_modules", JSON.stringify(next));
    } catch {}
    toast.success("Mobil App & PWA modül durumu güncellendi.");
  };

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return experiences.filter((exp) => {
      if (listingFilterChannel === "web" && exp.publishToWeb === false)
        return false;
      if (listingFilterChannel === "mobile" && exp.publishToMobile === false)
        return false;
      if (
        listingFilterCategory !== "all" &&
        getCategoryCode(exp.category) !== listingFilterCategory
      )
        return false;
      if (!listingSearch.trim()) return true;
      const q = listingSearch.toLowerCase();
      return (
        exp.title.toLowerCase().includes(q) ||
        exp.provider.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.location.toLowerCase().includes(q)
      );
    });
  }, [experiences, listingSearch, listingFilterChannel, listingFilterCategory]);

  const renderCategoryPassivationSection = () => (
    <div className="comus-card space-y-4 border border-[#3B6D11]/35">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C8C4B0]/60">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
            Hızlı Kategori Kontrolü (Web + iOS App + PWA)
          </div>
          <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
            Kategorileri ve Ait İlanları Tek Tıkla Gizle / Pasife Al
          </h3>
          <p className="text-xs text-[#6B6B55]">
            Pasife aldığınız kategori ve içindeki tüm ilanlar hem{" "}
            <strong>purelyistanbul.com</strong> web sitesinden hem de{" "}
            <strong>iOS Mobil Uygulama / Otel PWA</strong> ekranlarından anında
            gizlenir. İstediğiniz zaman tek tıkla tekrar yayına alabilirsiniz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MARKETPLACE_CATEGORIES.map((cat) => {
          const matchingExps = experiences.filter(
            (e) => getCategoryCode(e.category) === cat.key
          );
          const activeExps = matchingExps.filter(
            (e) =>
              e.status !== "suspended" &&
              (e.publishToWeb !== false || e.publishToMobile !== false)
          );
          const totalProps = cat.key === "cat-12" ? properties.length : 0;
          const activeProps =
            cat.key === "cat-12"
              ? properties.filter((p) => p.status !== "suspended").length
              : 0;

          const totalCount = matchingExps.length + totalProps;
          const activeCount = activeExps.length + activeProps;
          const isCategoryActive = activeCount > 0;

          return (
            <div
              key={cat.key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition ${
                isCategoryActive
                  ? "bg-[#FFFCFA] border-[#C8C4B0]"
                  : "bg-[#EDE8DE]/70 border-[#C1622F]/40 opacity-85"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#2C2C1A]">
                    {cat.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                      isCategoryActive
                        ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                        : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                    }`}
                  >
                    {isCategoryActive ? "Yayında (Aktif)" : "Pasif (Gizli)"}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B55]">
                  Toplam <strong>{totalCount}</strong> ilan •{" "}
                  <strong>{activeCount}</strong> aktif
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#C8C4B0]/50">
                <button
                  type="button"
                  onClick={() => handleToggleCategoryActive(cat.key, cat.label)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    isCategoryActive
                      ? "bg-[#F3E3D8] text-[#9C4E24] hover:bg-[#E5C4B0] border border-[#E5C4B0]"
                      : "bg-[#3B6D11] text-white hover:bg-[#2F570D]"
                  }`}
                >
                  {isCategoryActive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Kategoriyi &amp; İlanları Gizle</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" />
                      <span>Tekrar Yayına Al</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Computed stats
  const webActiveCount = experiences.filter(
    (e) => e.status !== "suspended" && e.publishToWeb !== false
  ).length;
  const mobileActiveCount = experiences.filter(
    (e) => e.status !== "suspended" && e.publishToMobile !== false
  ).length;
  const totalRoomsCount = hotels.reduce(
    (acc, h) => acc + (h.rooms?.length || 0),
    0
  );
  const pendingRequestsCount = serviceRequests.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  ).length;

  // Loading state
  if (isAuth === null) {
    return (
      <div
        data-comus-dashboard="true"
        className="min-h-screen flex items-center justify-center p-6"
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#3B6D11] border-t-transparent animate-spin" />
      </div>
    );
  }

  // LOGIN SCREEN (usecomus.com Minimalist Cream & Olive Design)
  if (!isAuth) {
    return (
      <div
        data-comus-dashboard="true"
        className="min-h-screen flex flex-col justify-between p-6 md:p-12 overflow-y-auto"
      >
        {/* Top Minimalist Nav */}
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="comus-logo">
            purely<span>istanbul</span>
          </Link>
          <Link href="/" className="comus-btn-ghost">
            purelyistanbul.com&apos;a Dön →
          </Link>
        </header>

        {/* Center Editorial Login Card */}
        <main className="my-auto py-12">
          <div className="max-w-md w-full mx-auto comus-card space-y-6">
            <div className="text-center space-y-3">
              <div className="comus-badge mx-auto">
                <span className="comus-badge-dot" />
                Merkezi Yönetim Masası
              </div>
              <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A] leading-tight">
                Purelyİstanbul için <br />
                <em className="italic text-[#3B6D11]">sade ve akıllı</em> yönetim
              </h1>
              <p className="text-sm text-[#6B6B55] font-light leading-relaxed">
                purelyistanbul.com Web Sitesi, iOS App ve Otel İçi PWA&apos;yı
                tek ekrandan yönetmek için giriş yapın.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {authError}
                </div>
              )}

              <div>
                <label className="comus-label">Yönetici E-Posta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anilaslan@usecomus.com"
                  className="comus-input"
                />
              </div>

              <div>
                <label className="comus-label">Güvenlik Şifresi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="comus-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="comus-btn-primary w-full py-3 text-sm"
              >
                {isLoggingIn
                  ? "Giriş Yapılıyor..."
                  : "Yönetim Paneline Giriş Yap →"}
              </button>
            </form>

            <div className="pt-4 border-t border-[#C8C4B0]/60 flex items-center justify-between text-xs text-[#6B6B55]">
              <span>Gizli Yönetici Bağlantısı</span>
              <span className="font-mono text-[11px] text-[#3B6D11]">
                /usepurelydashboard
              </span>
            </div>
          </div>
        </main>

        <footer className="max-w-5xl w-full mx-auto text-center text-xs text-[#6B6B55]">
          © 2026 purelyİstanbul • Web, iOS App &amp; PWA Merkezi Yönetim
        </footer>
      </div>
    );
  }

  // NAVIGATION ITEMS
  const navItems: {
    id: DashboardTab;
    label: string;
    sublabel: string;
    icon: any;
    count?: number;
  }[] = [
    {
      id: "overview",
      label: "Genel Bakış",
      sublabel: "Özet & Hızlı İşlemler",
      icon: LayoutGrid,
    },
    {
      id: "channels",
      label: "Web, iOS App & PWA",
      sublabel: "Kanal, Onay & Modül Kontrolü",
      icon: Smartphone,
      count:
        pendingMarketplaceListings.length +
        hostApplications.filter((a) => a.status === "pending").length +
        pendingRequestsCount,
    },
    {
      id: "listings",
      label: "İlan Yönetimi",
      sublabel: "Deneyim, Tur, Restoran & Konaklama",
      icon: Compass,
      count: experiences.length,
    },
    {
      id: "suppliers",
      label: "İşletmeler & Tedarikçiler",
      sublabel: "Partner Kaydı & Komisyon (%)",
      icon: Briefcase,
      count: suppliers.length,
    },
    {
      id: "properties",
      label: "Mülk & Gayrimenkul",
      sublabel: "Satılık, Kiralık & Yatırımcılar",
      icon: Building2,
      count: properties.length,
    },
    {
      id: "hotels",
      label: "Partner Oteller & QR",
      sublabel: "Otel, Oda, Wi-Fi & QR Kodlar",
      icon: HotelIcon,
      count: hotels.length,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFCFA] border-r border-[#C8C4B0] text-[#2C2C1A]">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[#C8C4B0]/70 flex items-center justify-between shrink-0">
        <div>
          <Link href="/usepurelydashboard" className="comus-logo block">
            purely<span>istanbul</span>
          </Link>
          <p className="text-[11px] text-[#6B6B55] mt-0.5 tracking-wide">
            Web • iOS App • PWA Yönetimi
          </p>
        </div>
        {mobileNavOpen && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-lg border border-[#C8C4B0] text-[#6B6B55]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="p-4 border-b border-[#C8C4B0]/60 bg-[#F6F1E8]/50 shrink-0">
        <button
          onClick={() => {
            switchTab("listings");
            setShowAddListingModal(true);
          }}
          className="comus-btn-primary w-full text-xs py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İlan Ekle</span>
        </button>
      </div>

      {/* Scrollable Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
        <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-[#6B6B55]">
          Yönetim Modülleri
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`w-full text-left flex items-center justify-between px-3.5 py-3 rounded-xl transition cursor-pointer ${
                active
                  ? "bg-[#EAF3DE] text-[#2C2C1A] border border-[#C0DD97]"
                  : "text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#2C2C1A] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active
                      ? "bg-[#3B6D11] text-white"
                      : "bg-[#EDE8DE] text-[#6B6B55]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div
                    className={`text-xs ${
                      active ? "font-semibold text-[#2C2C1A]" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] text-[#6B6B55] truncate">
                    {item.sublabel}
                  </div>
                </div>
              </div>
              {typeof item.count === "number" && item.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    active
                      ? "bg-[#3B6D11] text-white"
                      : "bg-[#EDE8DE] text-[#2C2C1A]"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Direct Links to Live Surfaces */}
        <div className="pt-4 mt-4 border-t border-[#C8C4B0]/60 space-y-1.5">
          <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-[#6B6B55]">
            Canlı Ekranlar &amp; Araçlar
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#3B6D11] transition"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-3.5 h-3.5 text-[#3B6D11]" />
              purelyistanbul.com Web Vitrin
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/hotel?h=1&r=304"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#3B6D11] transition"
          >
            <span className="flex items-center gap-2.5">
              <Smartphone className="w-3.5 h-3.5 text-[#C1622F]" />
              iOS App &amp; Otel PWA Önizleme
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/hotel-portal"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#3B6D11] transition"
          >
            <span className="flex items-center gap-2.5">
              <HotelIcon className="w-3.5 h-3.5 text-[#3B6D11]" />
              Partner Otel Yönetim Paneli
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/qr-generator"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-[#6B6B55] hover:bg-[#F6F1E8] hover:text-[#3B6D11] transition"
          >
            <span className="flex items-center gap-2.5">
              <QrCode className="w-3.5 h-3.5 text-[#3B6D11]" />
              Toplu Oda QR Kod Yazdır
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Bottom Cloud Sync & Logout */}
      <div className="p-4 border-t border-[#C8C4B0]/70 bg-[#F6F1E8]/40 space-y-2 shrink-0">
        <button
          onClick={handleCloudSync}
          disabled={isSyncing}
          className="comus-btn-ghost w-full text-xs py-2"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#3B6D11] ${
              isSyncing ? "animate-spin" : ""
            }`}
          />
          <span>
            {isSyncing ? "Senkronize Ediliyor..." : "Bulut İle Şimdi Eşitle"}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-full text-xs text-[#6B6B55] hover:text-red-700 hover:bg-red-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Oturumu Kapat</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-comus-dashboard="true"
      className="min-h-screen flex flex-col md:flex-row bg-[#F6F1E8] text-[#2C2C1A]"
    >
      {/* Desktop Sticky Left Sidebar (Independently Scrollable) */}
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 overflow-y-auto shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Scrollable Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#F6F1E8]/90 backdrop-blur-md border-b border-[#C8C4B0] px-4 md:px-10 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#FFFCFA] border border-[#C8C4B0] text-[#2C2C1A]"
              aria-label="Menü"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="comus-badge">
              <span className="comus-badge-dot" />
              <span>Canlı Senkronizasyon Aktif</span>
            </div>
            <span className="hidden lg:inline text-xs text-[#6B6B55]">
              Yaptığınız her değişiklik anında{" "}
              <strong className="font-medium text-[#2C2C1A]">
                purelyistanbul.com
              </strong>
              , <strong className="font-medium text-[#2C2C1A]">iOS App</strong>{" "}
              ve <strong className="font-medium text-[#2C2C1A]">PWA</strong>{" "}
              üzerinde güncellenir.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="comus-btn-ghost text-xs py-1.5 px-3.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#3B6D11] ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Tüm Kanalları Eşitle</span>
            </button>
            <Link href="/" target="_blank" className="comus-btn-primary text-xs py-1.5 px-4">
              <Globe className="w-3.5 h-3.5" />
              <span>Web Vitrini Gör ↗</span>
            </Link>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-8 max-w-6xl w-full mx-auto space-y-10">
          {/* =========================================================
              TAB 1: GENEL BAKIŞ (OVERVIEW)
          ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-10">
              {/* Comus Hero Banner */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#C8C4B0]">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.14em] text-[#3B6D11] font-medium">
                    Purelyİstanbul Merkezi Yönetim
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-5xl font-light text-[#2C2C1A] leading-tight">
                    Tek merkezden{" "}
                    <em className="italic text-[#3B6D11]">akıllı</em> yönetim
                  </h1>
                  <p className="text-sm sm:text-base text-[#6B6B55] font-light max-w-2xl">
                    Web sitesi (purelyistanbul.com), iOS App ve Otel İçi Misafir
                    PWA kanallarını; anlaşmalı tedarikçileri, mülk portföyünü ve
                    partner otelleri göz yormayan sade bir akışla yönetin.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("listings");
                      setShowAddListingModal(true);
                    }}
                    className="comus-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni İlan Gir
                  </button>
                  <button
                    onClick={() => setActiveTab("suppliers")}
                    className="comus-btn-terracotta"
                  >
                    <Briefcase className="w-4 h-4" />
                    Yeni İşletme Ekle
                  </button>
                  <button
                    onClick={() => setActiveTab("properties")}
                    className="comus-btn-ghost"
                  >
                    <Building2 className="w-4 h-4" />
                    Mülk Ekle
                  </button>
                </div>
              </section>

              {/* Comus Hairline Stat Grid */}
              <section className="comus-hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab("listings")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-2">
                    Deneyim &amp; Konaklama İlanları
                  </div>
                  <div className="comus-serif text-4xl font-light text-[#2C2C1A]">
                    {experiences.length}
                  </div>
                  <p className="text-xs text-[#6B6B55] mt-2">
                    Web: <strong>{webActiveCount}</strong> aktif • iOS/PWA:{" "}
                    <strong>{mobileActiveCount}</strong> aktif
                  </p>
                  <div className="text-xs text-[#3B6D11] font-medium mt-3">
                    İlanları yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("suppliers")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[11px] uppercase tracking-widest text-[#C1622F] font-medium mb-2">
                    Anlaşmalı İşletmeler
                  </div>
                  <div className="comus-serif text-4xl font-light text-[#2C2C1A]">
                    {suppliers.length}
                  </div>
                  <p className="text-xs text-[#6B6B55] mt-2">
                    Aktif sözleşmeli tedarikçi, restoran, acente ve mülk
                    firmaları
                  </p>
                  <div className="text-xs text-[#C1622F] font-medium mt-3">
                    İşletmeleri yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("properties")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-2">
                    Mülk &amp; Gayrimenkul
                  </div>
                  <div className="comus-serif text-4xl font-light text-[#2C2C1A]">
                    {properties.length}
                  </div>
                  <p className="text-xs text-[#6B6B55] mt-2">
                    Satılık &amp; kısa dönem kiralık •{" "}
                    <strong>{investmentLeads.length}</strong> yatırımcı talebi
                  </p>
                  <div className="text-xs text-[#3B6D11] font-medium mt-3">
                    Portföyü yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("hotels")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-2">
                    Partner Oteller &amp; QR
                  </div>
                  <div className="comus-serif text-4xl font-light text-[#2C2C1A]">
                    {hotels.length}
                  </div>
                  <p className="text-xs text-[#6B6B55] mt-2">
                    Toplam <strong>{totalRoomsCount}</strong> oda QR envanteri
                    tanımlı
                  </p>
                  <div className="text-xs text-[#3B6D11] font-medium mt-3">
                    Otelleri &amp; QR yönet →
                  </div>
                </div>
              </section>

              {/* 3 Platform Durum & Yönetim Kartları (Web, iOS App, PWA) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                      Yayın Kanalları
                    </div>
                    <h2 className="comus-serif text-2xl sm:text-3xl font-light text-[#2C2C1A]">
                      Web Sitesi, <em className="italic text-[#3B6D11]">iOS App</em>{" "}
                      ve PWA Kontrolü
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("channels")}
                    className="comus-btn-ghost text-xs"
                  >
                    Tüm Kanal Ayarlarını Aç →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: purelyistanbul.com Web */}
                  <div className="comus-card flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11]">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="comus-badge">
                          <span className="comus-badge-dot" /> Canlı
                        </span>
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        purelyistanbul.com Web Sitesi
                      </h3>
                      <p className="text-xs text-[#6B6B55] leading-relaxed">
                        Herkese açık Marketplace vitrini. Onayladığınız konaklama,
                        deneyim ve mülk ilanları anında ana sayfada listelenir.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-[#2C2C1A]">
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>{webActiveCount}</strong> Web İlanı Yayında
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>{pendingMarketplaceListings.length}</strong>{" "}
                          Onay Bekleyen
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#C8C4B0]/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("channels");
                          setChannelSubTab("matrix");
                        }}
                        className="text-xs font-medium text-[#3B6D11] hover:underline cursor-pointer"
                      >
                        Vitrin İlanlarını Seç →
                      </button>
                      <Link
                        href="/"
                        target="_blank"
                        className="text-xs text-[#6B6B55] hover:text-[#2C2C1A] flex items-center gap-1"
                      >
                        Siteyi Aç <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: iOS App */}
                  <div className="comus-card flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[#F3E3D8] flex items-center justify-center text-[#C1622F]">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E3D8] text-[#9C4E24] border border-[#E5C4B0] text-[11px] font-medium uppercase tracking-wider">
                          iOS App (Capacitor)
                        </span>
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        Purelyİstanbul iOS App
                      </h3>
                      <p className="text-xs text-[#6B6B55] leading-relaxed">
                        Apple iOS uygulamasında görünen deneyim kartları,
                        yapay zekâ konsiyerj, harita ve gayrimenkul vitrini
                        buradan yönetilir.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-[#2C2C1A]">
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>{mobileActiveCount}</strong> Mobil İlan Aktif
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>
                            {APP_MODULES_CONFIG.length - disabledModules.length}
                          </strong>{" "}
                          Modül Açık
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#C8C4B0]/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("channels");
                          setChannelSubTab("modules");
                        }}
                        className="text-xs font-medium text-[#C1622F] hover:underline cursor-pointer"
                      >
                        iOS Modüllerini Yönet →
                      </button>
                      <Link
                        href="/hotel?h=1&r=304"
                        target="_blank"
                        className="text-xs text-[#6B6B55] hover:text-[#2C2C1A] flex items-center gap-1"
                      >
                        Uygulamayı Önizle <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 3: Otel İçi Misafir PWA */}
                  <div className="comus-card flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11]">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <span className="comus-badge">
                          <span className="comus-badge-dot" /> QR PWA
                        </span>
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        Otel İçi Misafir PWA
                      </h3>
                      <p className="text-xs text-[#6B6B55] leading-relaxed">
                        Otel odalarındaki QR kod okutulduğunda uygulama
                        indirmeden açılan çok dilli dijital oda rehberi ve
                        sipariş sistemi.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-[#2C2C1A]">
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>{hotels.length}</strong> Otel •{" "}
                          <strong>{totalRoomsCount}</strong> Oda QR
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F1E8] border border-[#C8C4B0]">
                          <strong>{pendingRequestsCount}</strong> Açık Oda Talebi
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#C8C4B0]/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveTab("hotels")}
                        className="text-xs font-medium text-[#3B6D11] hover:underline cursor-pointer"
                      >
                        Otel &amp; Oda QR Yönet →
                      </button>
                      <Link
                        href="/qr-generator"
                        className="text-xs text-[#6B6B55] hover:text-[#2C2C1A] flex items-center gap-1"
                      >
                        QR Yazdır <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* 1-Click Category Passivation / Activation */}
              {renderCategoryPassivationSection()}

              {/* Quick Recent Listings & Recent Requests */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Listings */}
                <div className="comus-card space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        Son Eklenen &amp; Güncellenen İlanlar
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        Web ve Mobil App üzerindeki vitrin ilanlarınız
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="text-xs text-[#3B6D11] font-medium hover:underline cursor-pointer"
                    >
                      Tümünü Gör ({experiences.length}) →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {experiences.slice(0, 5).map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0]/70"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#2C2C1A] truncate">
                            {exp.title}
                          </div>
                          <div className="text-[11px] text-[#6B6B55] truncate">
                            {exp.provider} • {exp.location} •{" "}
                            <strong className="text-[#2C2C1A]">
                              {formatPrice(exp.price, exp.currency)}
                            </strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleListingChannel(exp, "web")}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${
                              exp.publishToWeb !== false
                                ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                : "bg-[#EDE8DE] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                            title="purelyistanbul.com Web Vitrininde Göster/Gizle"
                          >
                            Web {exp.publishToWeb !== false ? "Açık" : "Kapalı"}
                          </button>
                          <button
                            onClick={() =>
                              handleToggleListingChannel(exp, "mobile")
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${
                              exp.publishToMobile !== false
                                ? "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                                : "bg-[#EDE8DE] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                            title="iOS App ve PWA'da Göster/Gizle"
                          >
                            Mobil{" "}
                            {exp.publishToMobile !== false ? "Açık" : "Kapalı"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Bookings & In-Room Requests */}
                <div className="comus-card space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        Canlı Oda Talepleri &amp; Rezervasyonlar
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        iOS App, PWA ve Web üzerinden gelen son işlemler
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("channels");
                        setChannelSubTab("requests");
                      }}
                      className="text-xs text-[#3B6D11] font-medium hover:underline cursor-pointer"
                    >
                      Tüm Talepler →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {serviceRequests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0]/70"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#2C2C1A]">
                            Oda {req.roomNumber} • {req.serviceTitle}
                          </div>
                          <div className="text-[11px] text-[#6B6B55] truncate">
                            {req.notes || req.serviceKey} ({req.hotelName || "Partner Otel"})
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${
                            req.status === "completed"
                              ? "bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]"
                              : "bg-[#F3E3D8] text-[#9C4E24] border border-[#E5C4B0]"
                          }`}
                        >
                          {req.status === "pending"
                            ? "Yeni"
                            : req.status === "in_progress"
                            ? "İşlemde"
                            : req.status === "completed"
                            ? "Tamamlandı"
                            : "İptal"}
                        </span>
                      </div>
                    ))}
                    {bookings.slice(0, 2).map((bk) => (
                      <div
                        key={bk.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0]/70"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#2C2C1A] truncate">
                            🎟️ {bk.experienceTitle}
                          </div>
                          <div className="text-[11px] text-[#6B6B55]">
                            {bk.guestName} • Oda {bk.roomNumber} •{" "}
                            <strong className="text-[#2C2C1A]">
                              {formatPrice(bk.amount, bk.currency)}
                            </strong>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97] shrink-0">
                          Rezervasyon
                        </span>
                      </div>
                    ))}
                    {serviceRequests.length === 0 && bookings.length === 0 && (
                      <p className="text-xs text-[#6B6B55] py-4 text-center">
                        Henüz aktif oda talebi veya rezervasyon bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =========================================================
              TAB 2: WEB, IOS APP & PWA KANAL YÖNETİMİ
          ========================================================= */}
          {activeTab === "channels" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#C8C4B0]">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                    Çoklu Platform Yönetimi
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    Web Sitesi, <em className="italic text-[#3B6D11]">iOS App</em>{" "}
                    &amp; PWA Yönetimi
                  </h1>
                  <p className="text-sm text-[#6B6B55] font-light mt-1">
                    purelyistanbul.com Web Vitrinini, iOS uygulamasını, otel içi
                    PWA modüllerini ve onay kuyruklarını tek ekrandan kontrol
                    edin.
                  </p>
                </div>

                {/* Sub-navigation Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      id: "matrix" as ChannelSubTab,
                      label: "1. Web & Mobil Yayın Matrisi",
                    },
                    {
                      id: "modules" as ChannelSubTab,
                      label: "2. iOS App & PWA Modülleri",
                    },
                    {
                      id: "marketplace" as ChannelSubTab,
                      label: `3. Web Onayları & Host Başvuruları (${
                        pendingMarketplaceListings.length +
                        hostApplications.filter((a) => a.status === "pending")
                          .length
                      })`,
                    },
                    {
                      id: "requests" as ChannelSubTab,
                      label: `4. Canlı Oda Talepleri & Satışlar (${
                        serviceRequests.length + bookings.length
                      })`,
                    },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setChannelSubTab(st.id)}
                      className={
                        channelSubTab === st.id
                          ? "comus-btn-primary text-xs py-2 px-4"
                          : "comus-btn-ghost text-xs py-2 px-4"
                      }
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBTAB 1: WEB & MOBILE CHANNEL MATRIX */}
              {channelSubTab === "matrix" && (
                <div className="space-y-6">
                  {renderCategoryPassivationSection()}
                  <div className="comus-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C8C4B0]/60">
                    <div>
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Hangi İlan Nerede Gösterilsin?
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        İlanların <strong>purelyistanbul.com Web</strong> veya{" "}
                        <strong>iOS App / PWA</strong> görünürlüğünü tek tıkla
                        açıp kapatabilirsiniz.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("listings");
                        setShowAddListingModal(true);
                      }}
                      className="comus-btn-primary text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Yeni İlan Ekle
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F6F1E8]/60 border border-[#C8C4B0]"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#2C2C1A]">
                              {exp.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#6B6B55]">
                              {exp.category}
                            </span>
                          </div>
                          <div className="text-xs text-[#6B6B55]">
                            İşletme: <strong>{exp.provider}</strong> •{" "}
                            {exp.location} •{" "}
                            <strong>
                              {formatPrice(exp.price, exp.currency)}
                            </strong>{" "}
                            • Komisyon: %{exp.commissionRate ?? 15}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              handleToggleListingChannel(exp, "web")
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition flex items-center gap-1.5 ${
                              exp.publishToWeb !== false
                                ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                : "bg-[#FFFCFA] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>
                              purelyistanbul.com:{" "}
                              {exp.publishToWeb !== false ? "Yayında" : "Gizli"}
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleToggleListingChannel(exp, "mobile")
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition flex items-center gap-1.5 ${
                              exp.publishToMobile !== false
                                ? "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                                : "bg-[#FFFCFA] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>
                              iOS App &amp; PWA:{" "}
                              {exp.publishToMobile !== false
                                ? "Yayında"
                                : "Gizli"}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: IOS APP & PWA MODULES */}
              {channelSubTab === "modules" && (
                <div className="space-y-4">
                  <div className="comus-card space-y-2">
                    <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                      iOS App &amp; Otel İçi PWA Hizmet Modülleri
                    </h3>
                    <p className="text-xs text-[#6B6B55]">
                      Misafirlerin mobil uygulamada ve otel odasındaki QR PWA
                      ekranında gördüğü ana hizmet kartlarını buradan
                      yönetebilirsiniz.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {APP_MODULES_CONFIG.map((mod) => {
                      const isEnabled = !disabledModules.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          className="comus-card flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] uppercase tracking-wider text-[#3B6D11] font-medium">
                                {mod.channel}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                  isEnabled
                                    ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                    : "bg-[#EDE8DE] text-[#6B6B55] border-[#C8C4B0]"
                                }`}
                              >
                                {isEnabled ? "Aktif" : "Pasif"}
                              </span>
                            </div>
                            <h4 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                              {mod.title}
                            </h4>
                            <p className="text-xs text-[#6B6B55] leading-relaxed">
                              {mod.desc}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#C8C4B0]/60 flex items-center justify-between">
                            <span className="text-[11px] text-[#6B6B55]">
                              Durum:{" "}
                              <strong>
                                {isEnabled
                                  ? "iOS & PWA'da Görünür"
                                  : "Geçici Olarak Gizli"}
                              </strong>
                            </span>
                            <button
                              onClick={() => toggleAppModule(mod.id)}
                              className={
                                isEnabled
                                  ? "comus-btn-ghost text-xs py-1.5 px-3"
                                  : "comus-btn-primary text-xs py-1.5 px-3"
                              }
                            >
                              {isEnabled ? "Modülü Gizle" : "Modülü Aktifleştir"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: MARKETPLACE APPROVALS & HOST APPLICATIONS */}
              {channelSubTab === "marketplace" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pending Marketplace Listings */}
                  <div className="comus-card space-y-4">
                    <div className="border-b border-[#C8C4B0]/60 pb-3">
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Web Vitrin İlan Onayları
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        Tedarikçi veya host&apos;ların gönderdiği onay bekleyen
                        ilanlar
                      </p>
                    </div>

                    {pendingMarketplaceListings.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#F6F1E8]/60 border border-[#C8C4B0]/60 text-center text-xs text-[#6B6B55]">
                        Onay bekleyen vitrin ilanı bulunmuyor. Tüm ilanlar güncel.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingMarketplaceListings.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-medium text-[#2C2C1A]">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-[#6B6B55]">
                                  {item.district} •{" "}
                                  {item.type === "stay"
                                    ? "Konaklama"
                                    : "Deneyim"}{" "}
                                  • {item.pricing.basePrice}{" "}
                                  {item.pricing.currency}
                                </p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#F3E3D8] text-[#9C4E24] border border-[#E5C4B0]">
                                İncelemede
                              </span>
                            </div>
                            <p className="text-xs text-[#6B6B55] line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                disabled={busyApprovalId === item.id}
                                onClick={async () => {
                                  setBusyApprovalId(item.id);
                                  try {
                                    await approveListing(item.id);
                                    toast.success(
                                      "İlan onaylandı ve purelyistanbul.com vitrinine alındı."
                                    );
                                  } catch (err: any) {
                                    toast.error(
                                      err?.message || "Onay işlemi başarısız."
                                    );
                                  } finally {
                                    setBusyApprovalId(null);
                                  }
                                }}
                                className="comus-btn-primary text-xs py-1.5 px-4"
                              >
                                Onayla &amp; Vitrine Al
                              </button>
                              <button
                                disabled={busyApprovalId === item.id}
                                onClick={async () => {
                                  const reason =
                                    window.prompt("Reddetme nedeni:") || "";
                                  if (!reason) return;
                                  setBusyApprovalId(item.id);
                                  try {
                                    await rejectListing(item.id, reason);
                                    toast.info("İlan reddedildi.");
                                  } finally {
                                    setBusyApprovalId(null);
                                  }
                                }}
                                className="comus-btn-ghost text-xs py-1.5 px-4 text-red-700"
                              >
                                Reddet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Host Applications */}
                  <div className="comus-card space-y-4">
                    <div className="border-b border-[#C8C4B0]/60 pb-3">
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Host &amp; Partner Başvuruları
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        purelyistanbul.com üzerinden başvuran işletmelerin
                        komisyon oranını belirleyip onaylayın
                      </p>
                    </div>

                    {hostApplications.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#F6F1E8]/60 border border-[#C8C4B0]/60 text-center text-xs text-[#6B6B55]">
                        Henüz bekleyen host başvurusu bulunmuyor.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hostApplications.map((app) => (
                          <div
                            key={app.id}
                            className="p-4 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-[#2C2C1A]">
                                  {app.applicantName}
                                </div>
                                <div className="text-xs text-[#6B6B55]">
                                  {app.applicantEmail} •{" "}
                                  {app.businessType === "company"
                                    ? "Kurumsal İşletme"
                                    : "Bireysel Host"}
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  app.status === "approved"
                                    ? "bg-[#EAF3DE] text-[#3B6D11]"
                                    : app.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-[#F3E3D8] text-[#9C4E24]"
                                }`}
                              >
                                {app.status === "pending"
                                  ? "Bekliyor"
                                  : app.status === "approved"
                                  ? "Onaylandı"
                                  : "Reddedildi"}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B6B55]">{app.about}</p>
                            {app.status === "pending" && (
                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  placeholder="Host Payı % (Örn: 85)"
                                  value={hostRates[app.id] ?? "85"}
                                  onChange={(e) =>
                                    setHostRates((r) => ({
                                      ...r,
                                      [app.id]: e.target.value,
                                    }))
                                  }
                                  className="comus-input w-40 text-xs py-1.5"
                                />
                                <button
                                  disabled={busyApprovalId === app.id}
                                  onClick={async () => {
                                    const hostPercent = parseFloat(
                                      hostRates[app.id] ?? "85"
                                    );
                                    const adminUid =
                                      auth?.currentUser?.uid || "admin-master";
                                    setBusyApprovalId(app.id);
                                    try {
                                      await approveHostApplication({
                                        applicationId: app.id,
                                        adminUid,
                                        hostRate: hostPercent / 100,
                                        platformRate: (100 - hostPercent) / 100,
                                      });
                                      toast.success(
                                        `${app.applicantName} onaylandı.`
                                      );
                                    } catch (err: any) {
                                      toast.error(
                                        err?.message || "Onay başarısız."
                                      );
                                    } finally {
                                      setBusyApprovalId(null);
                                    }
                                  }}
                                  className="comus-btn-primary text-xs py-1.5 px-4"
                                >
                                  Onayla
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: LIVE GUEST REQUESTS & BOOKINGS */}
              {channelSubTab === "requests" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* In-Room PWA Requests */}
                  <div className="comus-card space-y-4">
                    <div className="border-b border-[#C8C4B0]/60 pb-3">
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Otel İçi PWA &amp; iOS Oda Talepleri
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        Misafirlerin odalarından QR ile gönderdiği talepler
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {serviceRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-medium text-[#2C2C1A]">
                              Oda {req.roomNumber} • {req.serviceTitle}
                            </div>
                            <div className="text-xs text-[#6B6B55]">
                              {req.notes || req.serviceKey} ({req.hotelName || "Partner Otel"})
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(
                              [
                                { key: "pending", label: "Yeni" },
                                { key: "in_progress", label: "İşlemde" },
                                { key: "completed", label: "Tamamlandı" },
                              ] as const
                            ).map((st) => (
                              <button
                                key={st.key}
                                onClick={() => {
                                  XeniosStore.updateRequestStatus(
                                    req.id,
                                    st.key
                                  );
                                  refreshAllData();
                                  toast.success(
                                    `Oda ${req.roomNumber} talebi "${st.label}" olarak güncellendi.`
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer ${
                                  req.status === st.key
                                    ? "bg-[#3B6D11] text-white border-[#3B6D11]"
                                    : "bg-[#FFFCFA] text-[#6B6B55] border-[#C8C4B0]"
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience Bookings */}
                  <div className="comus-card space-y-4">
                    <div className="border-b border-[#C8C4B0]/60 pb-3">
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Deneyim &amp; Tur Rezervasyonları
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        Web, iOS App ve PWA üzerinden yapılan rezervasyonlar
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {bookings.length === 0 ? (
                        <p className="text-xs text-[#6B6B55] py-4 text-center">
                          Henüz kayıtlı deneyim rezervasyonu bulunmuyor.
                        </p>
                      ) : (
                        bookings.map((bk) => (
                          <div
                            key={bk.id}
                            className="p-3.5 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="text-xs font-medium text-[#2C2C1A]">
                                {bk.experienceTitle} ({bk.confirmationCode})
                              </div>
                              <div className="text-[11px] text-[#6B6B55]">
                                {bk.guestName} • {bk.guestCount} Kişi •{" "}
                                <strong>
                                  {formatPrice(bk.amount, bk.currency)}
                                </strong>
                              </div>
                            </div>
                            <select
                              value={bk.status}
                              onChange={(e) => {
                                XeniosStore.updateBookingStatus(
                                  bk.id,
                                  e.target.value as BookingStatus
                                );
                                refreshAllData();
                                toast.success("Rezervasyon durumu güncellendi.");
                              }}
                              className="comus-input w-auto text-xs py-1 px-2.5"
                            >
                              <option value="payment_success">
                                Ödeme Alındı
                              </option>
                              <option value="provider_pending">
                                Tedarikçi Onayında
                              </option>
                              <option value="confirmed">Onaylandı</option>
                              <option value="cancelled">İptal Edildi</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 3: İLAN YÖNETİMİ (DENEYİM, TUR, RESTORAN, KONAKLAMA)
          ========================================================= */}
          {activeTab === "listings" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#C8C4B0]">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                    Katalog &amp; Vitrin Yönetimi
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    İlan Girişi &amp;{" "}
                    <em className="italic text-[#3B6D11]">Düzenleme</em>
                  </h1>
                  <p className="text-sm text-[#6B6B55] font-light mt-1">
                    Anlaşmalı işletmelerin turlarını, restoranlarını,
                    transferlerini ve konaklama ilanlarını ekleyin veya
                    düzenleyin.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddListingModal(!showAddListingModal)}
                  className="comus-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {showAddListingModal
                      ? "Formu Kapat"
                      : "+ Yeni İlan Girişi Yap"}
                  </span>
                </button>
              </div>

              {/* ADD NEW LISTING FORM (CLEAN COMUS CARD) */}
              {showAddListingModal && (
                <form
                  onSubmit={handleCreateListing}
                  className="comus-card space-y-5 border-2 border-[#3B6D11]"
                >
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
                        Yeni İlan Girişi (Web + iOS App + PWA)
                      </h3>
                      <p className="text-xs text-[#6B6B55]">
                        Anlaşmalı tedarikçiyi seçtiğinizde işletme bilgileri ve
                        komisyon oranı otomatik doldurulur.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddListingModal(false)}
                      className="p-1.5 rounded-full hover:bg-[#EDE8DE] text-[#6B6B55]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="comus-label">
                        İlan Başlığı (Türkçe / İngilizce) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDraft.title}
                        onChange={(e) =>
                          setNewDraft({ ...newDraft, title: e.target.value })
                        }
                        placeholder="Örn: Özel Boğaz Yatı ile Gün Batımı Turu"
                        className="comus-input"
                      />
                    </div>

                    <div>
                      <label className="comus-label">
                        Anlaşmalı İşletme / Tedarikçi Seçin
                      </label>
                      <select
                        value={newDraft.supplierId}
                        onChange={(e) =>
                          handleSelectSupplierOnDraft(e.target.value, false)
                        }
                        className="comus-input"
                      >
                        <option value="">
                          — Manuel İşletme Girişi veya Seçin —
                        </option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Komisyon: %{s.commissionRate})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="comus-label">
                        İşletme / Sağlayıcı Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDraft.provider}
                        onChange={(e) =>
                          setNewDraft({ ...newDraft, provider: e.target.value })
                        }
                        placeholder="Örn: Bosphorus Luxury Yachts"
                        className="comus-input"
                      />
                    </div>

                    <div>
                      <label className="comus-label">Kategori</label>
                      <select
                        value={newDraft.category}
                        onChange={(e) => {
                          const found = CATEGORIES.find(
                            (c) => c.label === e.target.value
                          );
                          setNewDraft({
                            ...newDraft,
                            category: e.target.value,
                            categoryTag: found?.tag || e.target.value,
                          });
                        }}
                        className="comus-input"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.label} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="comus-label">Vitrin İlan Tipi</label>
                      <select
                        value={newDraft.listingType}
                        onChange={(e) =>
                          setNewDraft({
                            ...newDraft,
                            listingType: e.target.value as "experience" | "stay",
                          })
                        }
                        className="comus-input"
                      >
                        <option value="experience">
                          Deneyim / Tur / Restoran / Hizmet
                        </option>
                        <option value="stay">
                          Konaklama / Butik Otel / Yalı Dairesi
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="comus-label">Fiyat *</label>
                        <input
                          type="number"
                          required
                          value={newDraft.price}
                          onChange={(e) =>
                            setNewDraft({
                              ...newDraft,
                              price: Number(e.target.value),
                            })
                          }
                          className="comus-input"
                        />
                      </div>
                      <div>
                        <label className="comus-label">Birim</label>
                        <select
                          value={newDraft.currency}
                          onChange={(e) =>
                            setNewDraft({
                              ...newDraft,
                              currency: e.target.value,
                            })
                          }
                          className="comus-input"
                        >
                          <option value="₺">₺ TRY</option>
                          <option value="€">€ EUR</option>
                          <option value="$">$ USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="comus-label">Komisyon %</label>
                        <input
                          type="number"
                          value={newDraft.commissionRate}
                          onChange={(e) =>
                            setNewDraft({
                              ...newDraft,
                              commissionRate: Number(e.target.value),
                            })
                          }
                          className="comus-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="comus-label">Konum / Semt</label>
                      <input
                        type="text"
                        value={newDraft.location}
                        onChange={(e) =>
                          setNewDraft({ ...newDraft, location: e.target.value })
                        }
                        placeholder="Bebek, Beşiktaş"
                        className="comus-input"
                      />
                    </div>

                    <div>
                      <label className="comus-label">Süre / Periyot</label>
                      <input
                        type="text"
                        value={newDraft.duration}
                        onChange={(e) =>
                          setNewDraft({ ...newDraft, duration: e.target.value })
                        }
                        placeholder="Örn: 3 Saat veya 1 Gece"
                        className="comus-input"
                      />
                    </div>

                    <div>
                      <label className="comus-label">
                        Görsel URL veya Bilgisayardan Yükle
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDraft.image || ""}
                          onChange={(e) =>
                            setNewDraft({ ...newDraft, image: e.target.value })
                          }
                          placeholder="/images/istanbul/..."
                          className="comus-input flex-1"
                        />
                        <label className="comus-btn-ghost text-xs px-3 py-1.5 shrink-0 cursor-pointer">
                          Dosya Seç
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileSelect(e, false)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="comus-label">
                      İlan Açıklaması &amp; Misafir Notu
                    </label>
                    <textarea
                      rows={3}
                      value={newDraft.agentNote}
                      onChange={(e) =>
                        setNewDraft({ ...newDraft, agentNote: e.target.value })
                      }
                      placeholder="Misafirlere sunulacak hizmetin detayları, dahil olanlar..."
                      className="comus-input"
                    />
                  </div>

                  {/* Channel Selection Checkboxes */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#C8C4B0]/60">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newDraft.publishToWeb}
                          onChange={(e) =>
                            setNewDraft({
                              ...newDraft,
                              publishToWeb: e.target.checked,
                            })
                          }
                          className="accent-[#3B6D11] w-4 h-4"
                        />
                        <span>purelyistanbul.com Web Sitesinde Yayınla</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newDraft.publishToMobile}
                          onChange={(e) =>
                            setNewDraft({
                              ...newDraft,
                              publishToMobile: e.target.checked,
                            })
                          }
                          className="accent-[#3B6D11] w-4 h-4"
                        />
                        <span>iOS App &amp; Otel İçi PWA&apos;da Yayınla</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddListingModal(false)}
                        className="comus-btn-ghost"
                      >
                        Vazgeç
                      </button>
                      <button type="submit" className="comus-btn-primary">
                        <Save className="w-4 h-4" />
                        <span>İlanı Kaydet ve Yayına Al</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 1-Click Category Passivation / Activation */}
              {renderCategoryPassivationSection()}

              {/* Search & Filter Bar */}
              <div className="comus-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6B6B55] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="İlan adı, işletme, kategori veya semt ara..."
                    className="comus-input pl-10"
                  />
                </div>
                <select
                  value={listingFilterCategory}
                  onChange={(e) => setListingFilterCategory(e.target.value)}
                  className="comus-input w-auto text-xs py-2 px-3"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: "all", label: `Tümü (${experiences.length})` },
                      { id: "web", label: `Web Vitrin (${webActiveCount})` },
                      {
                        id: "mobile",
                        label: `iOS & PWA (${mobileActiveCount})`,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setListingFilterChannel(f.id)}
                      className={
                        listingFilterChannel === f.id
                          ? "comus-btn-primary text-xs py-2 px-3.5"
                          : "comus-btn-ghost text-xs py-2 px-3.5"
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listings List */}
              <div className="space-y-3">
                {filteredListings.map((exp) => {
                  const isEditing = editingListingId === exp.id;
                  return (
                    <div key={exp.id} className="comus-card">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-2.5">
                            <span className="comus-serif text-xl font-medium text-[#3B6D11]">
                              İlanı Düzenle: {exp.title}
                            </span>
                            <button
                              onClick={() => setEditingListingId(null)}
                              className="text-xs text-[#6B6B55] hover:text-[#2C2C1A]"
                            >
                              Kapat ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="comus-label">İlan Başlığı</label>
                              <input
                                type="text"
                                value={editDraft.title}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    title: e.target.value,
                                  })
                                }
                                className="comus-input"
                              />
                            </div>
                            <div>
                              <label className="comus-label">
                                Anlaşmalı Tedarikçi
                              </label>
                              <select
                                value={editDraft.supplierId}
                                onChange={(e) =>
                                  handleSelectSupplierOnDraft(
                                    e.target.value,
                                    true
                                  )
                                }
                                className="comus-input"
                              >
                                <option value="">— Seçin veya Manuel —</option>
                                {suppliers.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} (%{s.commissionRate})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="comus-label">İşletme Adı</label>
                              <input
                                type="text"
                                value={editDraft.provider}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    provider: e.target.value,
                                  })
                                }
                                className="comus-input"
                              />
                            </div>
                            <div>
                              <label className="comus-label">Fiyat</label>
                              <input
                                type="number"
                                value={editDraft.price}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    price: Number(e.target.value),
                                  })
                                }
                                className="comus-input"
                              />
                            </div>
                            <div>
                              <label className="comus-label">
                                Komisyon Oranı (%)
                              </label>
                              <input
                                type="number"
                                value={editDraft.commissionRate}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    commissionRate: Number(e.target.value),
                                  })
                                }
                                className="comus-input"
                              />
                            </div>
                            <div>
                              <label className="comus-label">Konum / Semt</label>
                              <input
                                type="text"
                                value={editDraft.location}
                                onChange={(e) =>
                                  setEditDraft({
                                    ...editDraft,
                                    location: e.target.value,
                                  })
                                }
                                className="comus-input"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="comus-label">Açıklama</label>
                            <textarea
                              rows={2}
                              value={editDraft.agentNote}
                              onChange={(e) =>
                                setEditDraft({
                                  ...editDraft,
                                  agentNote: e.target.value,
                                })
                              }
                              className="comus-input"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#C8C4B0]/60">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editDraft.publishToWeb}
                                  onChange={(e) =>
                                    setEditDraft({
                                      ...editDraft,
                                      publishToWeb: e.target.checked,
                                    })
                                  }
                                  className="accent-[#3B6D11]"
                                />
                                <span>purelyistanbul.com Web</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editDraft.publishToMobile}
                                  onChange={(e) =>
                                    setEditDraft({
                                      ...editDraft,
                                      publishToMobile: e.target.checked,
                                    })
                                  }
                                  className="accent-[#3B6D11]"
                                />
                                <span>iOS App &amp; PWA</span>
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingListingId(null)}
                                className="comus-btn-ghost text-xs py-1.5"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => handleSaveEditListing(exp.id)}
                                className="comus-btn-primary text-xs py-1.5"
                              >
                                <Save className="w-3.5 h-3.5" /> Değişiklikleri
                                Kaydet
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            {exp.image && (
                              <img
                                src={exp.image}
                                alt={exp.title}
                                className="w-20 h-20 rounded-xl object-cover border border-[#C8C4B0] shrink-0"
                              />
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                                  {exp.title}
                                </h3>
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F6F1E8] border border-[#C8C4B0] text-[#6B6B55]">
                                  {exp.category}
                                </span>
                                {exp.status === "suspended" && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                    Askıda
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B6B55]">
                                İşletme: <strong>{exp.provider}</strong> •{" "}
                                {exp.location} • Süre: {exp.duration} •
                                Komisyon:{" "}
                                <strong className="text-[#3B6D11]">
                                  %{exp.commissionRate ?? 15}
                                </strong>
                              </p>
                              <p className="text-xs text-[#6B6B55] line-clamp-1">
                                {exp.agentNote || exp.desc}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="text-right mr-2">
                              <div className="comus-serif text-2xl font-medium text-[#2C2C1A]">
                                {formatPrice(exp.price, exp.currency)}
                              </div>
                              <div className="text-[10px] text-[#6B6B55]">
                                Kontenjan: {exp.availableSlots ?? 15}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleToggleListingChannel(exp, "web")
                              }
                              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border cursor-pointer ${
                                exp.publishToWeb !== false
                                  ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                  : "bg-[#F6F1E8] text-[#6B6B55] border-[#C8C4B0]"
                              }`}
                            >
                              Web {exp.publishToWeb !== false ? "✓" : "✕"}
                            </button>

                            <button
                              onClick={() =>
                                handleToggleListingChannel(exp, "mobile")
                              }
                              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border cursor-pointer ${
                                exp.publishToMobile !== false
                                  ? "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                                  : "bg-[#F6F1E8] text-[#6B6B55] border-[#C8C4B0]"
                              }`}
                            >
                              iOS/PWA{" "}
                              {exp.publishToMobile !== false ? "✓" : "✕"}
                            </button>

                            <button
                              onClick={() => handleStartEditListing(exp)}
                              className="comus-btn-ghost text-xs py-1.5 px-3"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Düzenle
                            </button>

                            <button
                              onClick={() => handleToggleListingActive(exp)}
                              className="comus-btn-ghost text-xs py-1.5 px-3"
                              title="Yayına Al / Askıya Al"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteListing(exp)}
                              className="p-2 rounded-full border border-[#C8C4B0] text-[#6B6B55] hover:text-red-700 hover:border-red-300 cursor-pointer"
                              title="İlanı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: ANLAŞMALI İŞLETMELER & TEDARİKÇİLER
          ========================================================= */}
          {activeTab === "suppliers" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#C8C4B0]">
                <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                  Tedarikçi &amp; Sözleşme Yönetimi
                </div>
                <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                  Anlaşmalı <em className="italic text-[#3B6D11]">İşletmeler</em>{" "}
                  &amp; Tedarikçiler
                </h1>
                <p className="text-sm text-[#6B6B55] font-light mt-1">
                  Purelyİstanbul&apos;un anlaştığı acenteleri, restoranları,
                  transfer ve mülk yönetim firmalarını komisyon oranlarıyla
                  birlikte kaydedin.
                </p>
              </div>

              <SupplierAdminPanel
                onCreateListingForSupplier={(supplier) => {
                  setNewDraft({
                    ...EMPTY_DRAFT,
                    supplierId: supplier.id,
                    provider: supplier.name,
                    phone: supplier.phone,
                    website: supplier.website || "https://",
                    commissionRate: supplier.commissionRate,
                    location: `${supplier.district}, İstanbul`,
                  });
                  setActiveTab("listings");
                  setShowAddListingModal(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}

          {/* =========================================================
              TAB 5: MÜLK & GAYRİMENKUL YÖNETİMİ
          ========================================================= */}
          {activeTab === "properties" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#C8C4B0]">
                <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                  Portföy &amp; Yatırımcı Talepleri
                </div>
                <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                  Mülk &amp;{" "}
                  <em className="italic text-[#3B6D11]">Gayrimenkul</em>{" "}
                  Yönetimi
                </h1>
                <p className="text-sm text-[#6B6B55] font-light mt-1">
                  Satılık yatırım mülklerini, kısa dönem kiralık rezidansları,
                  mülk yönetim firmalarını ve gelen yatırımcı taleplerini
                  yönetin.
                </p>
              </div>

              <PropertyAdminPanel />
            </div>
          )}

          {/* =========================================================
              TAB 6: PARTNER OTELLER & ODA QR YÖNETİMİ
          ========================================================= */}
          {activeTab === "hotels" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#C8C4B0]">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                    Konaklama &amp; Oda İçi Dijital Rehber
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    Partner <em className="italic text-[#3B6D11]">Oteller</em>{" "}
                    &amp; Oda QR Yönetimi
                  </h1>
                  <p className="text-sm text-[#6B6B55] font-light mt-1">
                    Anlaşmalı otelleri, oda numaralarını, Wi-Fi şifrelerini ve
                    oda içi PWA QR kodlarını buradan yönetin.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/qr-generator" className="comus-btn-primary">
                    <QrCode className="w-4 h-4" />
                    <span>Toplu Oda QR Kod Yazdır →</span>
                  </Link>
                  <Link href="/hotel-portal" className="comus-btn-ghost">
                    <span>Otel Paneline Geç ↗</span>
                  </Link>
                </div>
              </div>

              <HotelAdminPanel />
            </div>
          )}
        </main>

        {/* Minimalist Comus Footer */}
        <footer className="mt-16 border-t border-[#C8C4B0] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B55]">
          <div className="flex items-center gap-3">
            <span className="comus-logo text-lg">
              purely<span>istanbul</span>
            </span>
            <span>•</span>
            <span>Merkezi Yönetim Paneli (/usepurelydashboard)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="hover:text-[#3B6D11]">
              purelyistanbul.com Web
            </Link>
            <span>|</span>
            <Link
              href="/hotel?h=1&r=304"
              target="_blank"
              className="hover:text-[#3B6D11]"
            >
              iOS App &amp; PWA Önizleme
            </Link>
            <span>|</span>
            <Link href="/qr-generator" className="hover:text-[#3B6D11]">
              QR Kod Üretici
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
