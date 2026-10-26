"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  adminLogin,
  establishAdminFirebaseSession,
  hasAdminFirebaseSession,
} from "@/lib/admin-auth";
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
import { DEFAULT_CATEGORY_CONFIGS, type CategoryConfig } from "@/lib/marketplace/categories";
import { getExperienceCategoryKey } from "@/lib/marketplace/seed-listings";
import rawExperiences from "@/data/experiences.json";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { ListingEditorModal } from "@/components/dashboard/listing-editor-modal";
import { SupplierAdminPanel } from "@/components/cockpit/supplier-admin-panel";
import { PropertyAdminPanel } from "@/components/cockpit/property-admin-panel";
import { HotelAdminPanel } from "@/components/cockpit/hotel-admin-panel";
import { Admin2FASetupModal } from "@/components/dashboard/admin-2fa-setup-modal";
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
  PauseCircle,
  EyeOff,
  Layers,
  Bell,
  CreditCard,
  Copy,
  BarChart3,
  Download,
  KeyRound,
  TrendingUp,
  Percent,
  Wallet,
} from "lucide-react";

type DashboardTab =
  | "overview"
  | "channels"
  | "listings"
  | "categories"
  | "suppliers"
  | "properties"
  | "hotels"
  | "payments"
  | "reports";

type PaymentGatewayConfig = {
  activeProvider: "stripe" | "iyzico" | "paytr";
  defaultCurrency: "EUR" | "TRY" | "USD" | "GBP";
  vendorSharePercent: number;
  platformSharePercent: number;
  platformCommissionPct: number;
  hotelReferralPercent: number;
  hotelReferralPct: number;
  require3DSecure: boolean;
  roomChargeEnabled: boolean;
  cashOnArrivalEnabled: boolean;
  autoPayoutSchedule: "daily" | "weekly" | "monthly";
  settlementAccountName: string;
  settlementIban: string;
  stripeEnabled: boolean;
  stripeMode: "live" | "test";
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeSplitConnect: boolean;
  iyzicoEnabled: boolean;
  iyzicoMode: "live" | "sandbox";
  iyzicoApiKey: string;
  iyzicoSecretKey: string;
  iyzicoBaseUrl: string;
  iyzicoSubMerchantSplit: boolean;
  iyzicoForce3DS: boolean;
  paytrEnabled: boolean;
  paytrMerchantId: string;
  paytrMerchantKey: string;
  paytrMerchantSalt: string;
  roomFolioChargeEnabled: boolean;
  onSiteCashOrPosEnabled: boolean;
};

const DEFAULT_PAYMENT_CONFIG: PaymentGatewayConfig = {
  activeProvider: "stripe",
  defaultCurrency: "EUR",
  vendorSharePercent: 85,
  platformSharePercent: 12,
  platformCommissionPct: 12,
  hotelReferralPercent: 3,
  hotelReferralPct: 3,
  require3DSecure: true,
  roomChargeEnabled: true,
  cashOnArrivalEnabled: true,
  autoPayoutSchedule: "weekly",
  settlementAccountName: "Purely İstanbul Turizm & Teknoloji A.Ş.",
  settlementIban: "TR48 0006 2000 4120 0006 2984 10",
  stripeEnabled: true,
  stripeMode: "live",
  stripePublishableKey: "pk_live_51PurelyIstanbul...",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  stripeSplitConnect: true,
  iyzicoEnabled: true,
  iyzicoMode: "live",
  iyzicoApiKey: "iyz_api_purelyistanbul...",
  iyzicoSecretKey: "",
  iyzicoBaseUrl: "https://api.iyzipay.com",
  iyzicoSubMerchantSplit: true,
  iyzicoForce3DS: true,
  paytrEnabled: false,
  paytrMerchantId: "",
  paytrMerchantKey: "",
  paytrMerchantSalt: "",
  roomFolioChargeEnabled: true,
  onSiteCashOrPosEnabled: true,
};

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

/** Uygulama sürümüne gömülü hazır katalog ilanlarının kimlikleri (bunlar gerçekten silinemez, yalnızca gizlenir). */
const SEED_EXPERIENCE_IDS = new Set((rawExperiences as { id: string }[]).map((e) => e.id));

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
  const [totpCode, setTotpCode] = useState("");
  const [require2FA, setRequire2FA] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
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
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilterChannel, setListingFilterChannel] = useState<"all" | "web" | "mobile">("all");
  const [listingFilterCategory, setListingFilterCategory] = useState<string>("all");
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(new Set());
  const [bulkMoveCategory, setBulkMoveCategory] = useState("");

  // Panelden düzenlenen kategoriler (ad, ikon, sıra, gizli/açık)
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(DEFAULT_CATEGORY_CONFIGS);
  useEffect(() => {
    const refresh = () => setCategoryConfigs(XeniosStore.getCategoryConfigs());
    refresh();
    window.addEventListener("xenios_categories_updated", refresh);
    return () => window.removeEventListener("xenios_categories_updated", refresh);
  }, []);

  // Module toggles (persisted in localStorage for instant UI feedback)
  const [disabledModules, setDisabledModules] = useState<string[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(DEFAULT_PAYMENT_CONFIG);

  // 1. Force Light Mode & Unlock Document Scroll on Mount
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.overflowY = "auto";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.overscrollBehavior = "auto";
    document.documentElement.style.height = "auto";
    document.body.style.overflow = "visible";
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "visible";
    document.body.style.overscrollBehavior = "auto";
    document.body.style.position = "static";
    document.body.style.height = "auto";

    try {
      const savedDisabled = localStorage.getItem("purely_disabled_modules");
      if (savedDisabled) setDisabledModules(JSON.parse(savedDisabled));
    } catch {}
    try {
      const savedPay = localStorage.getItem("purely_payment_gateway_config");
      if (savedPay) {
        setPaymentConfig({ ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(savedPay) });
      }
    } catch {}
  }, []);

  const handleSavePaymentConfig = () => {
    try {
      localStorage.setItem("purely_payment_gateway_config", JSON.stringify(paymentConfig));
    } catch {}
    toast.success("Ödeme yöntemi ve Sanal POS entegrasyon ayarları kaydedildi!");
  };

  const handleExportReportsCsv = () => {
    const headers = [
      "ID",
      "İlan Başlığı",
      "Kategori",
      "İşletme / Tedarikçi",
      "Bölge",
      "Fiyat",
      "Para Birimi",
      "Komisyon (%)",
      "Durum",
      "Web Yayını",
      "Mobil Yayını",
    ];
    const rows = experiences.map((e) => [
      e.id,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${(e.category || "").replace(/"/g, '""')}"`,
      `"${(e.provider || "").replace(/"/g, '""')}"`,
      `"${(e.location || "").replace(/"/g, '""')}"`,
      e.price,
      e.currency,
      e.commissionRate ?? 15,
      e.status === "suspended" ? "Askıda" : "Aktif",
      e.publishToWeb !== false ? "Açık" : "Kapalı",
      e.publishToMobile !== false ? "Açık" : "Kapalı",
    ]);
    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purelyistanbul-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Rapor CSV dosyası olarak indirildi.");
  };

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

    // Firestore yazması reddedilirse kullanıcıya açıkça bildir (en fazla 15 sn'de bir)
    let lastSyncToast = 0;
    const handleSyncError = (e: Event) => {
      const now = Date.now();
      if (now - lastSyncToast < 15000) return;
      lastSyncToast = now;
      const code = (e as CustomEvent).detail?.code || "";
      toast.error(
        code === "permission-denied"
          ? "Değişiklik buluta kaydedilemedi: yetki yok. Çıkış yapıp yeniden giriş yapın."
          : "Değişiklik buluta kaydedilemedi. İnternet bağlantınızı kontrol edin.",
        { duration: 8000 }
      );
    };
    window.addEventListener("xenios_sync_error", handleSyncError);

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
      window.removeEventListener("xenios_sync_error", handleSyncError);
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
    const result = await adminLogin(email, password, totpCode);
    setIsLoggingIn(false);

    if (result.require2FA) {
      setRequire2FA(true);
      setAuthError(
        result.error ||
          "Lütfen telefonunuzdaki Google Authenticator uygulamasından 6 haneli kodu giriniz."
      );
      toast.info("Google Authenticator 2FA doğrulaması gerekiyor.");
      return;
    }

    if (!result.success) {
      setAuthError(
        result.error ||
          "Hatalı yönetici e-postası veya şifre. Lütfen kontrol ediniz."
      );
      toast.error(result.error || "Giriş yapılamadı.");
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

    await establishAdminFirebaseSession({
      email: result.email || email,
      password,
      customToken: result.customToken,
    }).catch(() => false);
    FirestoreService.pushLocalCategoryConfigs().catch(() => {});

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
        FirestoreService.pushLocalCategoryConfigs(),
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
    document
      .getElementById("dashboard-main-scroll")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Listing Handlers
  const handleStartEditListing = (exp: Experience) => {
    setEditingListingId(exp.id);
  };

  const editingListing = editingListingId
    ? experiences.find((e) => e.id === editingListingId) ?? null
    : null;

  /** Ekleme / düzenleme penceresinden gelen tam ilan kaydı */
  const handleSaveListingFromEditor = (listing: Experience) => {
    const exists = XeniosStore.getExperiences().some((e) => e.id === listing.id);
    if (exists) {
      XeniosStore.updateExperience(listing.id, listing);
      toast.success("İlan güncellendi ve tüm kanallara yansıtıldı.");
      setEditingListingId(null);
    } else {
      XeniosStore.addExperience(listing);
      toast.success(`"${listing.title}" ilanı kaydedildi.`);
      setShowAddListingModal(false);
      setNewDraft(EMPTY_DRAFT);
    }
    refreshAllData();
  };

  const handleDuplicateListing = (exp: Experience) => {
    const copy: Experience = {
      ...exp,
      id: "exp-" + Date.now(),
      title: `${exp.title} (Kopya)`,
      status: "suspended",
      updatedAt: new Date().toISOString(),
    };
    XeniosStore.addExperience(copy);
    refreshAllData();
    setEditingListingId(copy.id);
    toast.success(
      "İlan çoğaltıldı. Kopya askıda oluşturuldu; düzenleyip yayına alabilirsiniz."
    );
  };

  // Toplu seçim & işlemler
  const toggleListingSelected = (id: string) => {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedListingIds((prev) => {
      const allSelected =
        filteredListings.length > 0 &&
        filteredListings.every((l) => prev.has(l.id));
      const next = new Set(prev);
      filteredListings.forEach((l) => {
        if (allSelected) next.delete(l.id);
        else next.add(l.id);
      });
      return next;
    });
  };

  const bulkUpdateSelected = (patch: Partial<Experience>, doneText: string) => {
    if (selectedListingIds.size === 0) return;
    const now = new Date().toISOString();
    const changed: Experience[] = [];
    const next = XeniosStore.getExperiences().map((e) => {
      if (!selectedListingIds.has(e.id)) return e;
      const patched = { ...e, ...patch, updatedAt: now } as Experience;
      changed.push(patched);
      return patched;
    });
    XeniosStore.saveExperiences(next);
    changed.forEach((c) => FirestoreService.upsertExperience(c).catch(() => {}));
    refreshAllData();
    toast.success(`${changed.length} ilan ${doneText}.`);
  };

  const bulkMoveSelected = () => {
    const target = categoryConfigs.find((c) => c.key === bulkMoveCategory);
    if (!target || selectedListingIds.size === 0) return;
    bulkUpdateSelected(
      { categoryKey: target.key, category: target.label, categoryTag: target.label },
      `"${target.label}" kategorisine taşındı`
    );
    setBulkMoveCategory("");
  };

  /**
   * İlanı kalıcı olarak siler (askıya almaktan tamamen ayrı bir işlemdir).
   */
  const permanentlyDeleteListing = (exp: Experience) => {
    XeniosStore.deleteExperience(exp.id);
  };

  const bulkDeleteSelected = () => {
    if (selectedListingIds.size === 0) return;
    const toDelete = XeniosStore.getExperiences().filter((e) =>
      selectedListingIds.has(e.id)
    );
    if (toDelete.length === 0) return;
    toDelete.forEach((e) => permanentlyDeleteListing(e));
    setSelectedListingIds(new Set());
    refreshAllData();
    toast.success(`${toDelete.length} ilan silindi.`, {
      action: {
        label: "Geri Al",
        onClick: () => {
          toDelete.forEach((item) => XeniosStore.addExperience(item));
          refreshAllData();
          toast.info(`${toDelete.length} ilan geri yüklendi.`);
        },
      },
    });
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
    toast.success(
      next === "active"
        ? `"${exp.title}" ilanı tekrar yayına alındı.`
        : `"${exp.title}" ilanı askıya alındı (vitrinlerden gizlendi).`
    );
  };

  // Kategori görünürlüğü: gizlenen kategori ve içindeki tüm ilanlar web + uygulamadan kalkar
  const handleToggleCategoryHidden = (cfg: CategoryConfig) => {
    const nextHidden = !cfg.hidden;
    XeniosStore.upsertCategoryConfig({ ...cfg, hidden: nextHidden });
    refreshAllData();
    toast.success(
      nextHidden
        ? `"${cfg.label}" kategorisi ve ilanları Web sitesi ile Mobil Uygulamadan gizlendi.`
        : `"${cfg.label}" kategorisi ve ilanları tekrar yayına alındı.`
    );
  };

  const handleDeleteListing = (exp: Experience) => {
    permanentlyDeleteListing(exp);
    setSelectedListingIds((prev) => {
      if (!prev.has(exp.id)) return prev;
      const next = new Set(prev);
      next.delete(exp.id);
      return next;
    });
    refreshAllData();
    toast.success(`"${exp.title}" ilanı silindi.`, {
      action: {
        label: "Geri Al",
        onClick: () => {
          XeniosStore.addExperience(exp);
          refreshAllData();
          toast.info(`"${exp.title}" ilanı geri yüklendi.`);
        },
      },
    });
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
        getExperienceCategoryKey(exp) !== listingFilterCategory
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
            Kategorileri ve Ait İlanları Tek Tıkla Gizle / Yayına Al
          </h3>
          <p className="text-xs text-[#6B6B55]">
            Gizlediğiniz kategori ve içindeki tüm ilanlar hem{" "}
            <strong>purelyistanbul.com</strong> web sitesinden hem de{" "}
            <strong>iOS Mobil Uygulama / Otel PWA</strong> ekranlarından anında
            kalkar; ilanların kendi durumu değişmez. Ad, ikon ve sıra düzenlemek için{" "}
            <button
              type="button"
              onClick={() => switchTab("categories")}
              className="font-medium text-[#3B6D11] underline cursor-pointer"
            >
              Kategori Yönetimi
            </button>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categoryConfigs.map((cat) => {
          const matchingExps = experiences.filter(
            (e) => getExperienceCategoryKey(e) === cat.key
          );
          const liveExps = matchingExps.filter((e) => e.status !== "suspended");
          const totalProps = cat.key === "cat-12" ? properties.length : 0;
          const liveProps =
            cat.key === "cat-12"
              ? properties.filter((p) => p.status !== "suspended").length
              : 0;

          const totalCount = matchingExps.length + totalProps;
          const liveCount = liveExps.length + liveProps;
          const isCategoryActive = !cat.hidden;

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
                    {isCategoryActive ? "Yayında" : "Gizli"}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B55]">
                  Toplam <strong>{totalCount}</strong> ilan •{" "}
                  <strong>{liveCount}</strong> aktif
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#C8C4B0]/50">
                <button
                  type="button"
                  onClick={() => handleToggleCategoryHidden(cat)}
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
        className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 md:p-12 overflow-y-auto"
      >
        {/* Top Minimalist Nav */}
        <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-2">
          <Link href="/" translate="no" className="notranslate comus-logo">
            <span translate="no" className="notranslate">purely</span><span translate="no" className="notranslate">istanbul</span>
          </Link>
          <Link href="/" className="comus-btn-ghost text-xs sm:text-sm py-2 px-3">
            <span translate="no" className="notranslate">purelyistanbul.com</span>&apos;a Dön →
          </Link>
        </header>

        {/* Center Editorial Login Card */}
        <main className="my-auto py-8 sm:py-12">
          <div className="max-w-md w-full mx-auto comus-card space-y-6">
            <div className="text-center space-y-3">
              <div className="comus-badge mx-auto">
                <span className="comus-badge-dot" />
                Merkezi Yönetim Masası
              </div>
              <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A] leading-tight">
                <span translate="no" className="notranslate">Purelyİstanbul</span> için <br />
                <em className="italic text-[#3B6D11]">sade ve akıllı</em> yönetim
              </h1>
              <p className="text-sm text-[#6B6B55] font-light leading-relaxed">
                <span translate="no" className="notranslate">purelyistanbul.com</span> Web Sitesi, iOS App ve Otel İçi PWA&apos;yı
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

              {require2FA && (
                <div className="p-3.5 rounded-xl bg-[#F4F9F1] border border-[#C2D8B8] space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#2D5A1E] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3B6D11]" />
                      <span>Google Authenticator (6 Haneli Kod)</span>
                    </label>
                    <span className="text-[10px] text-[#6B6B55] uppercase tracking-wider font-mono">2FA Aktif</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.3em] font-mono font-bold text-lg rounded-xl border border-[#A4C99A] bg-white px-3 py-2 text-[#2C2C1A] focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/30 focus:border-[#3B6D11]"
                  />
                  <p className="text-[11px] text-[#556B48] leading-tight">
                    Telefonunuzdaki Google Authenticator uygulamasında üretilen güncel kodu girin.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="comus-btn-primary w-full py-3 text-sm"
              >
                {isLoggingIn
                  ? "Giriş Yapılıyor..."
                  : require2FA
                  ? "2FA Doğrula ve Giriş Yap →"
                  : "Yönetim Paneline Giriş Yap →"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!email || !password) {
                      setAuthError("Lütfen önce yukarıdaki E-Posta ve Güvenlik Şifrenizi doldurunuz.");
                      return;
                    }
                    setShowSetupModal(true);
                  }}
                  className="text-xs text-[#3B6D11] hover:underline hover:text-[#2D5A1E] font-medium inline-flex items-center gap-1 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Google Authenticator Kur / QR Kodu Görüntüle</span>
                </button>
              </div>
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
          © 2026 <span translate="no" className="notranslate">purelyİstanbul</span> • Web, iOS App &amp; PWA Merkezi Yönetim
        </footer>

        {/* Google Authenticator (2FA) Kurulum Modalı */}
        <Admin2FASetupModal
          email={email}
          password={password}
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSuccess={() => {
            setShowSetupModal(false);
            setRequire2FA(true);
            setTotpCode("");
            toast.success("Google Authenticator başarıyla bağlandı. Şimdi 6 haneli kodunuzla giriş yapabilirsiniz.");
          }}
        />
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
      id: "categories",
      label: "Kategori Yönetimi",
      sublabel: "Ad, İkon, Sıra & Gizle/Göster",
      icon: Layers,
      count: categoryConfigs.filter((c) => !c.hidden).length,
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
    {
      id: "payments",
      label: "Ödeme & Sanal POS",
      sublabel: "Stripe, iyzico, PayTR & Komisyon",
      icon: CreditCard,
    },
    {
      id: "reports",
      label: "Raporlar & Analitik",
      sublabel: "Ciro, Komisyon, Kanal & Kategori Analizi",
      icon: BarChart3,
      count: bookings.length + serviceRequests.length,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFCFA] border-r border-[#C8C4B0] text-[#2C2C1A]">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[#C8C4B0]/70 flex items-center justify-between shrink-0">
        <div>
          <Link href="/usepurelydashboard" translate="no" className="notranslate comus-logo block">
            <span translate="no" className="notranslate">purely</span><span translate="no" className="notranslate">istanbul</span>
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
      className="min-h-dvh w-full max-w-[100dvw] overflow-x-hidden md:h-dvh md:overflow-hidden flex flex-col md:flex-row bg-[#F6F1E8] text-[#2C2C1A]"
    >
      {/* Desktop Sticky Left Sidebar (Independently Scrollable) */}
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 md:h-dvh md:overflow-y-auto">
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
      <div
        id="dashboard-main-scroll"
        className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden md:h-dvh md:overflow-y-auto"
      >
        {/* Top Sticky Header + Mobile Quick Tab Bar */}
        <header className="sticky top-0 z-30 bg-[#F6F1E8]/95 backdrop-blur-md border-b border-[#C8C4B0] w-full max-w-full">
          <div className="px-3 sm:px-4 md:px-10 py-2.5 sm:py-3 flex items-center justify-between gap-2 w-full max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden p-2 rounded-lg bg-[#FFFCFA] border border-[#C8C4B0] text-[#2C2C1A] shrink-0"
                aria-label="Menü"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="comus-badge whitespace-nowrap truncate">
                <span className="comus-badge-dot" />
                <span className="sm:hidden">Canlı Senkron</span>
                <span className="hidden sm:inline">Canlı Senkronizasyon Aktif</span>
              </div>
              <span className="hidden lg:inline text-xs text-[#6B6B55] truncate">
                Yaptığınız her değişiklik anında{" "}
                <strong className="font-medium text-[#2C2C1A]">
                  purelyistanbul.com
                </strong>
                , <strong className="font-medium text-[#2C2C1A]">iOS App</strong>{" "}
                ve <strong className="font-medium text-[#2C2C1A]">PWA</strong>{" "}
                üzerinde güncellenir.
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="comus-btn-ghost text-xs py-2 px-2.5 sm:px-3 whitespace-nowrap"
                title="Tüm Kanalları Eşitle"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#3B6D11] ${
                    isSyncing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Tüm Kanalları Eşitle</span>
              </button>
              <Link
                href="/"
                target="_blank"
                className="comus-btn-primary text-xs py-2 px-2.5 sm:px-4 whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Web Vitrini ↗</span>
              </Link>
            </div>
          </div>

          {/* Mobile Horizontal Quick-Navigation Bar */}
          <nav
            aria-label="Mobil Hızlı Sekmeler"
            className="md:hidden comus-mobile-tabbar px-3 pb-2.5 pt-0.5 border-t border-[#C8C4B0]/50"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#3B6D11] text-white border-[#3B6D11]"
                      : "bg-[#FFFCFA] text-[#2C2C1A] border-[#C8C4B0]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[#EDE8DE] text-[#2C2C1A]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 px-3.5 sm:px-6 md:px-10 py-5 sm:py-8 max-w-6xl w-full min-w-0 overflow-x-hidden mx-auto space-y-6 sm:space-y-10">
          {/* =========================================================
              TAB 1: GENEL BAKIŞ (OVERVIEW)
          ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-10 min-w-0">
              {/* Comus Hero Banner */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-[#C8C4B0]">
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

                <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("listings");
                      setShowAddListingModal(true);
                    }}
                    className="comus-btn-primary w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni İlan Gir
                  </button>
                  <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveTab("suppliers")}
                      className="comus-btn-terracotta w-full sm:w-auto"
                    >
                      <Briefcase className="w-4 h-4 shrink-0" />
                      <span>Yeni İşletme Ekle</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("properties")}
                      className="comus-btn-ghost w-full sm:w-auto"
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Mülk Ekle</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Comus Hairline Stat Grid */}
              <section className="comus-hairline-grid grid-cols-2 lg:grid-cols-4">
                <div
                  onClick={() => setActiveTab("listings")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-1.5 sm:mb-2">
                    Deneyim &amp; Konaklama İlanları
                  </div>
                  <div className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    {experiences.length}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B6B55] mt-1.5 sm:mt-2">
                    Web: <strong>{webActiveCount}</strong> aktif • iOS/PWA:{" "}
                    <strong>{mobileActiveCount}</strong> aktif
                  </p>
                  <div className="text-[11px] sm:text-xs text-[#3B6D11] font-medium mt-2.5 sm:mt-3">
                    İlanları yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("suppliers")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#C1622F] font-medium mb-1.5 sm:mb-2">
                    Anlaşmalı İşletmeler
                  </div>
                  <div className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    {suppliers.length}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B6B55] mt-1.5 sm:mt-2">
                    Aktif sözleşmeli tedarikçi, restoran, acente ve mülk
                    firmaları
                  </p>
                  <div className="text-[11px] sm:text-xs text-[#C1622F] font-medium mt-2.5 sm:mt-3">
                    İşletmeleri yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("properties")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-1.5 sm:mb-2">
                    Mülk &amp; Gayrimenkul
                  </div>
                  <div className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    {properties.length}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B6B55] mt-1.5 sm:mt-2">
                    Satılık &amp; kısa dönem kiralık •{" "}
                    <strong>{investmentLeads.length}</strong> yatırımcı talebi
                  </p>
                  <div className="text-[11px] sm:text-xs text-[#3B6D11] font-medium mt-2.5 sm:mt-3">
                    Portföyü yönet →
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("hotels")}
                  className="comus-hairline-cell cursor-pointer"
                >
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#3B6D11] font-medium mb-1.5 sm:mb-2">
                    Partner Oteller &amp; QR
                  </div>
                  <div className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    {hotels.length}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B6B55] mt-1.5 sm:mt-2">
                    Toplam <strong>{totalRoomsCount}</strong> oda QR envanteri
                    tanımlı
                  </p>
                  <div className="text-[11px] sm:text-xs text-[#3B6D11] font-medium mt-2.5 sm:mt-3">
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
                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0]/70"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#2C2C1A] truncate">
                              {exp.title}
                            </span>
                            {exp.status === "suspended" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                                Askıda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B6B55] truncate">
                            {exp.provider} • {exp.location} •{" "}
                            <strong className="text-[#2C2C1A]">
                              {formatPrice(exp.price, exp.currency)}
                            </strong>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                          <button
                            onClick={() => handleToggleListingActive(exp)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${
                              exp.status === "suspended"
                                ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                            }`}
                          >
                            {exp.status === "suspended" ? "Yayına Al" : "Askıya Al"}
                          </button>
                          <button
                            onClick={() => handleDeleteListing(exp)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium border border-red-300 bg-red-50/70 text-red-700 hover:bg-red-100 cursor-pointer transition"
                            title="İlanı Sil"
                          >
                            Sil
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
            <div className="space-y-6 sm:space-y-8 min-w-0">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full md:w-auto">
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
                          ? "comus-btn-primary text-xs py-2 px-3 sm:px-4 w-full lg:w-auto"
                          : "comus-btn-ghost text-xs py-2 px-3 sm:px-4 w-full lg:w-auto"
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
                      className="comus-btn-primary text-xs w-full sm:w-auto"
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[#2C2C1A]">
                              {exp.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#6B6B55]">
                              {exp.category}
                            </span>
                            {exp.status === "suspended" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Askıda
                              </span>
                            )}
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

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
                          <button
                            onClick={() =>
                              handleToggleListingChannel(exp, "web")
                            }
                            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                              exp.publishToWeb !== false
                                ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                : "bg-[#FFFCFA] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              Web:{" "}
                              {exp.publishToWeb !== false ? "Yayında" : "Gizli"}
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleToggleListingChannel(exp, "mobile")
                            }
                            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                              exp.publishToMobile !== false
                                ? "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                                : "bg-[#FFFCFA] text-[#6B6B55] border-[#C8C4B0]"
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              iOS/PWA:{" "}
                              {exp.publishToMobile !== false
                                ? "Yayında"
                                : "Gizli"}
                            </span>
                          </button>

                          <button
                            onClick={() => handleToggleListingActive(exp)}
                            className={`text-[11px] sm:text-xs py-1.5 px-3 rounded-full border font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
                              exp.status === "suspended"
                                ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97] hover:bg-[#dcebc9]"
                                : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0] hover:bg-[#ebd3c3]"
                            }`}
                          >
                            {exp.status === "suspended" ? (
                              <>
                                <Power className="w-3.5 h-3.5 shrink-0" /> Yayına Al
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5 shrink-0" /> Askıya Al
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteListing(exp)}
                            className="px-3 py-1.5 rounded-full border border-red-300 bg-red-50/70 text-red-700 hover:bg-red-100 text-[11px] sm:text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
                            title="İlanı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Sil
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
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] uppercase tracking-wider text-[#3B6D11] font-medium">
                                {mod.channel}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
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

                          <div className="pt-3 border-t border-[#C8C4B0]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                                  ? "comus-btn-ghost text-xs py-1.5 px-3 w-full sm:w-auto"
                                  : "comus-btn-primary text-xs py-1.5 px-3 w-full sm:w-auto"
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
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#F3E3D8] text-[#9C4E24] border border-[#E5C4B0] shrink-0">
                                İncelemede
                              </span>
                            </div>
                            <p className="text-xs text-[#6B6B55] line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
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
                                className="comus-btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial"
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
                                className="comus-btn-ghost text-xs py-1.5 px-4 text-red-700 flex-1 sm:flex-initial"
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
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[#2C2C1A]">
                                  {app.applicantName}
                                </div>
                                <div className="text-xs text-[#6B6B55] break-all sm:break-normal">
                                  {app.applicantEmail} •{" "}
                                  {app.businessType === "company"
                                    ? "Kurumsal İşletme"
                                    : "Bireysel Host"}
                                </div>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
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
                              <div className="flex flex-wrap items-center gap-2 pt-2">
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
                                  className="comus-input flex-1 sm:w-40 text-xs py-1.5"
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
                                  className="comus-btn-primary text-xs py-1.5 px-4 shrink-0"
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
                          className="p-3.5 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[#2C2C1A]">
                              Birim {req.roomNumber} • {req.serviceTitle}
                            </div>
                            <div className="text-xs text-[#6B6B55] break-words">
                              {req.notes || req.serviceKey} ({req.hotelName || "Partner Otel"})
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto shrink-0">
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
                                  FirestoreService.updateRequestStatus(
                                    req.id,
                                    st.key
                                  );
                                  refreshAllData();
                                  toast.success(
                                    `Birim ${req.roomNumber} talebi "${st.label}" olarak güncellendi.`
                                  );
                                }}
                                className={`px-2.5 py-1.5 sm:py-1 rounded-full text-[10px] font-medium border cursor-pointer text-center ${
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
                            <div className="min-w-0">
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
                              className="comus-input w-full sm:w-auto text-xs py-1.5 sm:py-1 px-2.5"
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
            <div className="space-y-6 sm:space-y-8 min-w-0">
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
                  onClick={() => setShowAddListingModal(true)}
                  className="comus-btn-primary w-full md:w-auto py-2.5"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Yeni İlan Girişi Yap</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="comus-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6B6B55] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="comus-input sm:w-auto text-xs py-2.5 px-3"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categoryConfigs.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                      {cat.hidden ? " (gizli)" : ""}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
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
                          ? "comus-btn-primary text-xs py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap"
                          : "comus-btn-ghost text-xs py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap"
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="comus-card py-3.5 flex flex-wrap items-center gap-2.5">
                <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      filteredListings.length > 0 &&
                      filteredListings.every((l) => selectedListingIds.has(l.id))
                    }
                    onChange={toggleSelectAllVisible}
                    className="accent-[#3B6D11] w-4 h-4"
                  />
                  <span>
                    Görünenlerin tümünü seç ({filteredListings.length})
                  </span>
                </label>
                <span className="text-xs text-[#6B6B55]">
                  {selectedListingIds.size > 0
                    ? `${selectedListingIds.size} ilan seçili`
                    : "Toplu işlem için ilanları seçin"}
                </span>

                {selectedListingIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 w-full pt-2.5 border-t border-[#C8C4B0]/60">
                    <button onClick={() => bulkUpdateSelected({ status: "active" }, "yayına alındı")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Yayına Al
                    </button>
                    <button onClick={() => bulkUpdateSelected({ status: "suspended" }, "askıya alındı")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Askıya Al
                    </button>
                    <button onClick={() => bulkUpdateSelected({ publishToWeb: true }, "web'de açıldı")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Web Aç
                    </button>
                    <button onClick={() => bulkUpdateSelected({ publishToWeb: false }, "web'den gizlendi")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Web Gizle
                    </button>
                    <button onClick={() => bulkUpdateSelected({ publishToMobile: true }, "uygulamada açıldı")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Uygulama Aç
                    </button>
                    <button onClick={() => bulkUpdateSelected({ publishToMobile: false }, "uygulamadan gizlendi")} className="comus-btn-ghost text-xs py-1.5 px-3">
                      Uygulama Gizle
                    </button>
                    <select
                      value={bulkMoveCategory}
                      onChange={(e) => setBulkMoveCategory(e.target.value)}
                      className="comus-input w-full sm:w-auto text-xs py-1.5 px-2.5"
                    >
                      <option value="">Kategoriye taşı…</option>
                      {categoryConfigs.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <button onClick={bulkMoveSelected} disabled={!bulkMoveCategory} className="comus-btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">
                      Taşı
                    </button>
                    <button
                      onClick={bulkDeleteSelected}
                      className="text-xs py-1.5 px-3 rounded-full border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                    <button onClick={() => setSelectedListingIds(new Set())} className="text-xs text-[#6B6B55] hover:text-[#2C2C1A] underline cursor-pointer">
                      Seçimi temizle
                    </button>
                  </div>
                )}
              </div>

              {/* Listings List */}
              <div className="space-y-3">
                {filteredListings.map((exp) => {
                  const isSelected = selectedListingIds.has(exp.id);
                  const rowCategory = categoryConfigs.find(
                    (c) => c.key === getExperienceCategoryKey(exp)
                  );
                  return (
                    <div
                      key={exp.id}
                      className={`comus-card ${isSelected ? "ring-2 ring-[#3B6D11]/60" : ""}`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleListingSelected(exp.id)}
                              className="accent-[#3B6D11] w-4 h-4 mt-1 shrink-0 cursor-pointer"
                              aria-label={`${exp.title} seç`}
                            />
                            {exp.image && (
                              <img
                                src={exp.image}
                                alt={exp.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-xl object-cover border border-[#C8C4B0] shrink-0"
                              />
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h3 className="comus-serif text-lg sm:text-xl font-medium text-[#2C2C1A] leading-snug">
                                  {exp.title}
                                </h3>
                                <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-[#F6F1E8] border border-[#C8C4B0] text-[#6B6B55]">
                                  {rowCategory?.label ?? exp.category}
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

                          <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#C8C4B0]/50 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between md:justify-end gap-2.5 shrink-0">
                            <div className="flex items-baseline justify-between sm:block sm:text-right sm:mr-2">
                              <div className="comus-serif text-2xl font-medium text-[#2C2C1A]">
                                {formatPrice(exp.price, exp.currency)}
                              </div>
                              <div className="text-[10px] text-[#6B6B55]">
                                Kontenjan: {exp.availableSlots ?? 15}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                                onClick={() => handleDuplicateListing(exp)}
                                className="comus-btn-ghost text-xs py-1.5 px-2.5"
                                title="İlanı Çoğalt (askıda kopya oluşturur)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleListingActive(exp)}
                                className={`text-xs py-1.5 px-3 rounded-full border font-medium inline-flex items-center gap-1.5 cursor-pointer transition ${
                                  exp.status === "suspended"
                                    ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97] hover:bg-[#dcebc9]"
                                    : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0] hover:bg-[#ebd3c3]"
                                }`}
                                title={
                                  exp.status === "suspended"
                                    ? "İlanı Tekrar Yayına Al"
                                    : "İlanı Geçici Olarak Askıya Al"
                                }
                              >
                                {exp.status === "suspended" ? (
                                  <>
                                    <Power className="w-3.5 h-3.5" /> Yayına Al
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="w-3.5 h-3.5" /> Askıya Al
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteListing(exp)}
                                className="px-3 py-1.5 rounded-full border border-red-300 bg-red-50/70 text-red-700 hover:bg-red-100 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
                                title="İlanı Kalıcı Olarak Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          </div>
                        </div>
                    </div>
                  );
                })}
                {filteredListings.length === 0 && (
                  <div className="comus-card text-center py-10 text-sm text-[#6B6B55]">
                    Bu filtrelere uyan ilan bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              KATEGORİ YÖNETİMİ (ad, ikon, sıra, gizle/göster, yeni kategori)
          ========================================================= */}
          {activeTab === "categories" && (
            <CategoryManager
              experiences={experiences}
              properties={properties}
              onDataChanged={refreshAllData}
              onOpenListings={(categoryKey) => {
                setListingFilterCategory(categoryKey);
                switchTab("listings");
              }}
            />
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

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Link href="/qr-generator" className="comus-btn-primary flex-1 sm:flex-initial">
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Toplu Oda QR Kod Yazdır →</span>
                  </Link>
                  <Link href="/hotel-portal" className="comus-btn-ghost flex-1 sm:flex-initial">
                    <span>Otel Paneline Geç ↗</span>
                  </Link>
                </div>
              </div>

              <HotelAdminPanel />
            </div>
          )}

          {/* =========================================================
              TAB 7: ÖDEME YÖNTEMİ & SANAL POS ENTEGRASYON ALANI
          ========================================================= */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#C8C4B0]">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                    Finansal Altyapı &amp; Tahsilat Kanalları
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    Ödeme Yöntemi &amp;{" "}
                    <em className="italic text-[#3B6D11]">Sanal POS</em>{" "}
                    Entegrasyonu
                  </h1>
                  <p className="text-sm text-[#6B6B55] font-light mt-1">
                    purelyistanbul.com Web, iOS App ve Oda İçi QR PWA üzerinden
                    alınan rezervasyonların Sanal POS (Stripe, iyzico, PayTR),
                    oda hesabına yansıtma ve komisyon dağıtım ayarlarını yönetin.
                  </p>
                </div>

                <button
                  onClick={handleSavePaymentConfig}
                  className="comus-btn-primary w-full sm:w-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ödeme Ayarlarını Kaydet</span>
                </button>
              </div>

              {/* Aktif Ödeme Sağlayıcı Seçimi & Durum Kartları */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="comus-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#6B6B55] font-medium">
                      Birincil Sanal POS
                    </span>
                    <CreditCard className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <div className="comus-serif text-2xl font-medium text-[#2C2C1A] uppercase">
                    {paymentConfig.activeProvider === "stripe"
                      ? "Stripe Connect"
                      : paymentConfig.activeProvider === "iyzico"
                      ? "iyzico Korumalı"
                      : "PayTR Sanal POS"}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Varsayılan para birimi:{" "}
                    <strong>{paymentConfig.defaultCurrency}</strong> • 3D Secure{" "}
                    <strong>
                      {paymentConfig.require3DSecure ? "Zorunlu" : "Opsiyonel"}
                    </strong>
                  </p>
                </div>

                <div className="comus-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#6B6B55] font-medium">
                      Platform Hizmet Payı
                    </span>
                    <Percent className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <div className="comus-serif text-2xl font-medium text-[#2C2C1A]">
                    %{paymentConfig.platformCommissionPct}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Otel yönlendirme payı:{" "}
                    <strong>%{paymentConfig.hotelReferralPct}</strong>
                  </p>
                </div>

                <div className="comus-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#6B6B55] font-medium">
                      Oda Hesabına Yansıtma
                    </span>
                    <HotelIcon className="w-4 h-4 text-[#C1622F]" />
                  </div>
                  <div className="comus-serif text-2xl font-medium text-[#2C2C1A]">
                    {paymentConfig.roomChargeEnabled ? "Aktif" : "Pasif"}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Kapıda / nakit ödeme:{" "}
                    <strong>
                      {paymentConfig.cashOnArrivalEnabled ? "Açık" : "Kapalı"}
                    </strong>
                  </p>
                </div>

                <div className="comus-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#6B6B55] font-medium">
                      Hakediş Döngüsü
                    </span>
                    <Wallet className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <div className="comus-serif text-2xl font-medium text-[#2C2C1A]">
                    {paymentConfig.autoPayoutSchedule === "daily"
                      ? "Günlük (T+1)"
                      : paymentConfig.autoPayoutSchedule === "weekly"
                      ? "Haftalık"
                      : "Aylık"}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    IBAN: {paymentConfig.settlementIban.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Sanal POS Entegrasyon Kartları: Stripe, iyzico, PayTR */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Stripe Connect */}
                <div
                  className={`comus-card space-y-4 border-2 transition ${
                    paymentConfig.activeProvider === "stripe"
                      ? "border-[#3B6D11]"
                      : "border-[#C8C4B0]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                        Küresel Kart &amp; Apple Pay
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        Stripe Connect
                      </h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.stripeEnabled}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            stripeEnabled: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                      <span>{paymentConfig.stripeEnabled ? "Aktif" : "Pasif"}</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="comus-label">
                        Publishable Key (pk_live / pk_test)
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.stripePublishableKey}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            stripePublishableKey: e.target.value,
                          })
                        }
                        placeholder="pk_live_51PurelyIstanbul..."
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">
                        Secret Key (sk_live / sk_test)
                      </label>
                      <input
                        type="password"
                        value={paymentConfig.stripeSecretKey}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            stripeSecretKey: e.target.value,
                          })
                        }
                        placeholder="sk_live_••••••••••••••••"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">Webhook Signing Secret</label>
                      <input
                        type="password"
                        value={paymentConfig.stripeWebhookSecret}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            stripeWebhookSecret: e.target.value,
                          })
                        }
                        placeholder="whsec_••••••••••••••••"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6B55]">
                      EUR, USD, GBP &amp; Apple Pay destekli
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentConfig({
                          ...paymentConfig,
                          activeProvider: "stripe",
                          stripeEnabled: true,
                        })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer ${
                        paymentConfig.activeProvider === "stripe"
                          ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                          : "bg-[#F6F1E8] text-[#2C2C1A] border-[#C8C4B0]"
                      }`}
                    >
                      {paymentConfig.activeProvider === "stripe"
                        ? "✓ Birincil POS"
                        : "Birincil Yap"}
                    </button>
                  </div>
                </div>

                {/* 2. iyzico Sanal POS */}
                <div
                  className={`comus-card space-y-4 border-2 transition ${
                    paymentConfig.activeProvider === "iyzico"
                      ? "border-[#3B6D11]"
                      : "border-[#C8C4B0]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-[#C1622F] font-semibold">
                        Türkiye Pazaryeri Çözümü
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        iyzico Pazaryeri POS
                      </h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.iyzicoEnabled}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            iyzicoEnabled: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                      <span>{paymentConfig.iyzicoEnabled ? "Aktif" : "Pasif"}</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="comus-label">iyzico API Key</label>
                      <input
                        type="text"
                        value={paymentConfig.iyzicoApiKey}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            iyzicoApiKey: e.target.value,
                          })
                        }
                        placeholder="sandbox- veya live- api key"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">iyzico Secret Key</label>
                      <input
                        type="password"
                        value={paymentConfig.iyzicoSecretKey}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            iyzicoSecretKey: e.target.value,
                          })
                        }
                        placeholder="••••••••••••••••••••"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">API Ortamı (Base URL)</label>
                      <select
                        value={paymentConfig.iyzicoBaseUrl}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            iyzicoBaseUrl: e.target.value,
                          })
                        }
                        className="comus-select text-xs"
                      >
                        <option value="https://api.iyzipay.com">
                          Canlı Ortam (https://api.iyzipay.com)
                        </option>
                        <option value="https://sandbox-api.iyzipay.com">
                          Test / Sandbox (https://sandbox-api.iyzipay.com)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6B55]">
                      Alt üye işyeri hakediş dağıtımı
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentConfig({
                          ...paymentConfig,
                          activeProvider: "iyzico",
                          iyzicoEnabled: true,
                        })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer ${
                        paymentConfig.activeProvider === "iyzico"
                          ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                          : "bg-[#F6F1E8] text-[#2C2C1A] border-[#C8C4B0]"
                      }`}
                    >
                      {paymentConfig.activeProvider === "iyzico"
                        ? "✓ Birincil POS"
                        : "Birincil Yap"}
                    </button>
                  </div>
                </div>

                {/* 3. PayTR Sanal POS */}
                <div
                  className={`comus-card space-y-4 border-2 transition ${
                    paymentConfig.activeProvider === "paytr"
                      ? "border-[#3B6D11]"
                      : "border-[#C8C4B0]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                        Hızlı Tahsilat &amp; Linkle Ödeme
                      </div>
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                        PayTR iFrame POS
                      </h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.paytrEnabled}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            paytrEnabled: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                      <span>{paymentConfig.paytrEnabled ? "Aktif" : "Pasif"}</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="comus-label">Mağaza No (Merchant ID)</label>
                      <input
                        type="text"
                        value={paymentConfig.paytrMerchantId}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            paytrMerchantId: e.target.value,
                          })
                        }
                        placeholder="Örn: 284910"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">Merchant Key</label>
                      <input
                        type="password"
                        value={paymentConfig.paytrMerchantKey}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            paytrMerchantKey: e.target.value,
                          })
                        }
                        placeholder="••••••••••••••••"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="comus-label">Merchant Salt</label>
                      <input
                        type="password"
                        value={paymentConfig.paytrMerchantSalt}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            paytrMerchantSalt: e.target.value,
                          })
                        }
                        placeholder="••••••••••••••••"
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6B55]">
                      Döviz &amp; TL taksitli çekim
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentConfig({
                          ...paymentConfig,
                          activeProvider: "paytr",
                          paytrEnabled: true,
                        })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer ${
                        paymentConfig.activeProvider === "paytr"
                          ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                          : "bg-[#F6F1E8] text-[#2C2C1A] border-[#C8C4B0]"
                      }`}
                    >
                      {paymentConfig.activeProvider === "paytr"
                        ? "✓ Birincil POS"
                        : "Birincil Yap"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Oda İçi Ödeme Kuralları, Komisyon Dağıtımı ve Banka/IBAN Ayarları */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="comus-card space-y-4">
                  <div className="border-b border-[#C8C4B0]/60 pb-3">
                    <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                      Otel &amp; Tedarikçi Gelir Paylaşımı
                    </div>
                    <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                      Komisyon Dağıtımı &amp; Oda Hesabı Kuralları
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="comus-label">
                        Purelyİstanbul Platform Payı (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={paymentConfig.platformCommissionPct}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            platformCommissionPct: Number(e.target.value),
                          })
                        }
                        className="comus-input"
                      />
                    </div>
                    <div>
                      <label className="comus-label">
                        Partner Otel Yönlendirme Payı (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={paymentConfig.hotelReferralPct}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            hotelReferralPct: Number(e.target.value),
                          })
                        }
                        className="comus-input"
                      />
                    </div>
                    <div>
                      <label className="comus-label">Varsayılan Para Birimi</label>
                      <select
                        value={paymentConfig.defaultCurrency}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            defaultCurrency: e.target.value as "EUR" | "TRY" | "USD",
                          })
                        }
                        className="comus-select"
                      >
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="TRY">TRY (₺) - Türk Lirası</option>
                        <option value="USD">USD ($) - Amerikan Doları</option>
                      </select>
                    </div>
                    <div>
                      <label className="comus-label">Otomatik Hakediş Gönderimi</label>
                      <select
                        value={paymentConfig.autoPayoutSchedule}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            autoPayoutSchedule: e.target.value as
                              | "daily"
                              | "weekly"
                              | "monthly",
                          })
                        }
                        className="comus-select"
                      >
                        <option value="daily">Günlük (T+1 İş Günü)</option>
                        <option value="weekly">Haftalık (Her Pazartesi)</option>
                        <option value="monthly">Aylık (Ayın 1. İş Günü)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-[#2C2C1A]">
                          Oda Hesabına Yansıt (Room Charge / Folio)
                        </div>
                        <div className="text-[11px] text-[#6B6B55]">
                          Misafir oda içi QR ile sipariş verdiğinde tutarı çıkışta
                          resepsiyonda ödeyebilir
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={paymentConfig.roomChargeEnabled}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            roomChargeEnabled: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-[#2C2C1A]">
                          Hizmet Anında / Kapıda Ödeme
                        </div>
                        <div className="text-[11px] text-[#6B6B55]">
                          Tekne, VIP transfer veya tur başlangıcında nakit / fiziksel
                          POS ile tahsilat izni
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={paymentConfig.cashOnArrivalEnabled}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            cashOnArrivalEnabled: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] cursor-pointer">
                      <div>
                        <div className="text-xs font-medium text-[#2C2C1A]">
                          3D Secure Doğrulaması Zorunlu
                        </div>
                        <div className="text-[11px] text-[#6B6B55]">
                          Ters ibraz (chargeback) riskini önlemek için kart
                          işlemlerinde SMS / banka onayı iste
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={paymentConfig.require3DSecure}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            require3DSecure: e.target.checked,
                          })
                        }
                        className="accent-[#3B6D11] w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                {/* Kurumsal Hakediş Hesabı & Son POS İşlemleri */}
                <div className="comus-card space-y-4">
                  <div className="border-b border-[#C8C4B0]/60 pb-3">
                    <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                      Kurumsal Banka &amp; Mutabakat
                    </div>
                    <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                      Merkezi Hakediş IBAN &amp; Son Tahsilatlar
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="comus-label">
                        Şirket Ünvanı (Hakediş Alıcısı)
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.settlementAccountName}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            settlementAccountName: e.target.value,
                          })
                        }
                        className="comus-input"
                      />
                    </div>
                    <div>
                      <label className="comus-label">
                        Ana Tahsilat IBAN (TR / EUR)
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.settlementIban}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            settlementIban: e.target.value,
                          })
                        }
                        className="comus-input font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-semibold text-[#2C2C1A]">
                      Son Rezervasyon &amp; Ödeme Hareketleri ({bookings.length})
                    </div>
                    {bookings.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] text-xs text-[#6B6B55]">
                        Henüz kartlı veya oda hesabına yansıtılmış rezervasyon
                        kaydı bulunmuyor.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {bookings.slice(0, 6).map((b) => {
                          const commPct =
                            paymentConfig.platformCommissionPct || 12;
                          const commAmt = Math.round(
                            ((Number(b.amount) || 0) * commPct) / 100
                          );
                          return (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-[#2C2C1A] truncate">
                                  {b.experienceTitle}
                                </div>
                                <div className="text-[11px] text-[#6B6B55]">
                                  {b.guestName} • Oda {b.roomNumber || "-"} •{" "}
                                  {b.bookingDate}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-[#2C2C1A]">
                                  {formatPrice(b.amount, b.currency)}
                                </div>
                                <div className="text-[10px] text-[#3B6D11]">
                                  Komisyon: €{commAmt}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 8: RAPORLAR & ANALİTİK SAYFASI
          ========================================================= */}
          {activeTab === "reports" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#C8C4B0]">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
                    Performans, Gelir &amp; Kanal Raporlaması
                  </div>
                  <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
                    Raporlar &amp;{" "}
                    <em className="italic text-[#3B6D11]">Analitik</em> Merkezi
                  </h1>
                  <p className="text-sm text-[#6B6B55] font-light mt-1">
                    Kategori bazlı ilan dağılımını, tedarikçi komisyon
                    oranlarını, otel oda QR etkileşimlerini ve rezervasyon
                    gelirlerini inceleyin veya CSV olarak dışa aktarın.
                  </p>
                </div>

                <button
                  onClick={handleExportReportsCsv}
                  className="comus-btn-primary w-full sm:w-auto text-center"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Tüm Katalog &amp; Komisyon Raporunu İndir (CSV)</span>
                </button>
              </div>

              {/* Üst Finansal & Operasyonel KPI Kartları */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="comus-card space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#6B6B55]">
                    <span>Toplam Rezervasyon Hacmi (GMV)</span>
                    <TrendingUp className="w-4 h-4 text-[#3B6D11] shrink-0" />
                  </div>
                  <div className="comus-serif text-2xl sm:text-3xl font-light text-[#2C2C1A]">
                    €
                    {bookings
                      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
                      .toLocaleString("tr-TR")}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Toplam <strong>{bookings.length}</strong> onaylı deneyim
                    rezervasyonu
                  </p>
                </div>

                <div className="comus-card space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#6B6B55]">
                    <span>Net Platform Komisyon Geliri</span>
                    <Wallet className="w-4 h-4 text-[#3B6D11] shrink-0" />
                  </div>
                  <div className="comus-serif text-2xl sm:text-3xl font-light text-[#3B6D11]">
                    €
                    {Math.round(
                      bookings.reduce(
                        (sum, b) =>
                          sum +
                          ((Number(b.amount) || 0) *
                            (paymentConfig.platformCommissionPct || 12)) /
                            100,
                        0
                      )
                    ).toLocaleString("tr-TR")}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Ortalama komisyon oranı:{" "}
                    <strong>
                      %
                      {experiences.length > 0
                        ? Math.round(
                            experiences.reduce(
                              (s, e) => s + (e.commissionRate || 15),
                              0
                            ) / experiences.length
                          )
                        : 15}
                    </strong>
                  </p>
                </div>

                <div className="comus-card space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#6B6B55]">
                    <span>Birim İçi QR Misafir Talepleri</span>
                    <QrCode className="w-4 h-4 text-[#C1622F] shrink-0" />
                  </div>
                  <div className="comus-serif text-2xl sm:text-3xl font-light text-[#2C2C1A]">
                    {serviceRequests.length}
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    <strong>
                      {
                        serviceRequests.filter((r) => r.status === "completed")
                          .length
                      }
                    </strong>{" "}
                    tamamlandı • <strong>{pendingRequestsCount}</strong> işlemde
                  </p>
                </div>

                <div className="comus-card space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-[#6B6B55]">
                    <span>Aktif Kanal Kapsaması</span>
                    <BarChart3 className="w-4 h-4 text-[#3B6D11] shrink-0" />
                  </div>
                  <div className="comus-serif text-2xl sm:text-3xl font-light text-[#2C2C1A]">
                    {webActiveCount} Web / {mobileActiveCount} Mobil
                  </div>
                  <p className="text-[11px] text-[#6B6B55]">
                    Toplam <strong>{experiences.length}</strong> deneyim &amp;{" "}
                    <strong>{properties.length}</strong> gayrimenkul
                  </p>
                </div>
              </div>

              {/* Kategori Bazlı İlan, Fiyat ve Komisyon Raporu Tablosu */}
              <div className="comus-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C8C4B0]/60 pb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                      Kategori Performans Matrisi
                    </div>
                    <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                      Kategorilere Göre İlan Sayısı, Ortalama Fiyat ve Komisyon
                    </h3>
                  </div>
                  <span className="text-xs text-[#6B6B55]">
                    Toplam {categoryConfigs.length} kategori tanımlı
                  </span>
                </div>

                <div className="comus-table-wrapper">
                  <table className="comus-responsive-table text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#C8C4B0] text-[11px] uppercase tracking-wider text-[#6B6B55]">
                        <th scope="col" className="py-2.5 px-3">Kategori</th>
                        <th scope="col" className="py-2.5 px-3">Durum</th>
                        <th scope="col" className="py-2.5 px-3">Toplam İlan</th>
                        <th scope="col" className="py-2.5 px-3">Yayında (Aktif)</th>
                        <th scope="col" className="py-2.5 px-3">Askıda</th>
                        <th scope="col" className="py-2.5 px-3">Ort. Komisyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C8C4B0]/50">
                      {categoryConfigs.map((cat) => {
                        const catExps = experiences.filter(
                          (e) => getExperienceCategoryKey(e) === cat.key
                        );
                        const activeExps = catExps.filter(
                          (e) => e.status !== "suspended"
                        );
                        const suspendedExps = catExps.filter(
                          (e) => e.status === "suspended"
                        );
                        const avgComm =
                          catExps.length > 0
                            ? Math.round(
                                catExps.reduce(
                                  (s, e) => s + (e.commissionRate || 15),
                                  0
                                ) / catExps.length
                              )
                            : 15;
                        return (
                          <tr key={cat.key} className="hover:bg-[#F6F1E8]/60">
                            <th scope="row" className="py-2.5 px-3 font-medium text-[#2C2C1A]">
                              {cat.label}
                            </th>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  !cat.hidden
                                    ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                                    : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                                }`}
                              >
                                {!cat.hidden ? "Açık" : "Gizli"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#2C2C1A]">
                              {catExps.length}
                            </td>
                            <td className="py-2.5 px-3 text-[#3B6D11] font-medium">
                              {activeExps.length}
                            </td>
                            <td className="py-2.5 px-3 text-[#9C4E24]">
                              {suspendedExps.length}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#2C2C1A]">
                              %{avgComm}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tedarikçi & Partner Otel Performans Özeti */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="comus-card space-y-4">
                  <div className="border-b border-[#C8C4B0]/60 pb-3">
                    <div className="text-[11px] uppercase tracking-widest text-[#C1622F] font-semibold">
                      Tedarikçi &amp; Komisyon Dağılımı
                    </div>
                    <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                      Anlaşmalı İşletmeler Özeti ({suppliers.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {suppliers.map((sup) => {
                      const supListings = experiences.filter(
                        (e) =>
                          e.supplierId === sup.id || e.provider === sup.name
                      );
                      return (
                        <div
                          key={sup.id}
                          className="p-3 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#2C2C1A] truncate">
                              {sup.name}
                            </div>
                            <div className="text-[11px] text-[#6B6B55]">
                              {sup.category} • {sup.district}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold text-[#3B6D11]">
                              %{sup.commissionRate} Komisyon
                            </div>
                            <div className="text-[11px] text-[#6B6B55]">
                              {supListings.length} bağlı ilan
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="comus-card space-y-4">
                  <div className="border-b border-[#C8C4B0]/60 pb-3">
                    <div className="text-[11px] uppercase tracking-widest text-[#3B6D11] font-semibold">
                      Konaklama &amp; Oda İçi QR Raporu
                    </div>
                    <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">
                      Partner Oteller &amp; Oda Envanteri ({hotels.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {hotels.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-[#2C2C1A] truncate">
                            {h.name}
                          </div>
                          <div className="text-[11px] text-[#6B6B55]">
                            {h.district} • Wi-Fi:{" "}
                            {h.rooms?.[0]?.wifiSsid || "-"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-[#2C2C1A]">
                            {h.rooms?.length || 0} Oda QR
                          </div>
                          <div className="text-[11px] text-[#3B6D11]">
                            {
                              Object.values(h.modules || {}).filter(Boolean)
                                .length
                            }{" "}
                            aktif hizmet modülü
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* İlan Ekle / Düzenle penceresi (tüm alanlar) */}
        {showAddListingModal && (
          <ListingEditorModal
            key="create-listing"
            mode="create"
            prefill={draftToExperiencePatch(newDraft)}
            suppliers={suppliers}
            categories={categoryConfigs}
            onSave={handleSaveListingFromEditor}
            onClose={() => {
              setShowAddListingModal(false);
              setNewDraft(EMPTY_DRAFT);
            }}
          />
        )}
        {editingListing && (
          <ListingEditorModal
            key={`edit-${editingListing.id}`}
            mode="edit"
            initial={editingListing}
            suppliers={suppliers}
            categories={categoryConfigs}
            onSave={handleSaveListingFromEditor}
            onClose={() => setEditingListingId(null)}
          />
        )}

        {/* Minimalist Comus Footer */}
        <footer className="mt-10 sm:mt-16 border-t border-[#C8C4B0] px-4 sm:px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#6B6B55] text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span className="comus-logo text-lg">
              purely<span>istanbul</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Merkezi Yönetim Paneli (/usepurelydashboard)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
