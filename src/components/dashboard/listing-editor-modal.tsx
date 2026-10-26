"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, ImagePlus, Save, Sparkles, X } from "lucide-react";
import type { Experience, Hotel, PilotDistrictKey, SupplierPartner } from "@/lib/types";
import type { CategoryConfig } from "@/lib/marketplace/categories";
import { getExperienceCategoryKey } from "@/lib/marketplace/seed-listings";
import { fileToResizedDataUrl } from "@/lib/image-utils";
import {
  PILOT_DISTRICTS,
  PILOT_DISTRICT_KEYS,
  getEffectiveRecommendedDistricts,
} from "@/lib/pilot-districts";

interface ListingEditorModalProps {
  mode: "create" | "edit";
  /** Düzenlenen ilan (edit modunda zorunlu) */
  initial?: Experience | null;
  /** Yeni ilan için ön doldurma (örn. tedarikçi sayfasından gelen bilgiler) */
  prefill?: Partial<Experience> | null;
  suppliers: SupplierPartner[];
  categories: CategoryConfig[];
  hotels?: Hotel[];
  onSave: (listing: Experience) => void;
  onClose: () => void;
}

interface Draft {
  title: string;
  categoryKey: string;
  listingType: "experience" | "stay";
  supplierId: string;
  provider: string;
  commissionRate: string;
  price: string;
  currency: string;
  duration: string;
  location: string;
  phone: string;
  website: string;
  email: string;
  availableSlots: string;
  capacity: string;
  quotaNote: string;
  lat: string;
  lng: string;
  scoreStr: string;
  description: string;
  agentNote: string;
  featuresText: string;
  image: string;
  featured: boolean;
  suspended: boolean;
  publishToWeb: boolean;
  publishToMobile: boolean;
  recommendedDistricts: PilotDistrictKey[];
  hotelVisibility: "all" | "specific";
  allowedHotelIds: string[];
}

const str = (v: unknown, fallback = "") => (v === undefined || v === null ? fallback : String(v));

function toDraft(
  source: Partial<Experience> | null | undefined,
  categories: CategoryConfig[]
): Draft {
  const s = source ?? {};
  const resolvedKey = s.category || s.categoryKey ? getExperienceCategoryKey({ category: s.category ?? "", categoryKey: s.categoryKey }) : "";
  const categoryKey = categories.some((c) => c.key === resolvedKey)
    ? resolvedKey
    : (categories.find((c) => !c.hidden)?.key ?? categories[0]?.key ?? "cat-5");

  return {
    title: str(s.title),
    categoryKey,
    listingType: s.listingType === "stay" ? "stay" : "experience",
    supplierId: str(s.supplierId),
    provider: str(s.provider),
    commissionRate: str(s.commissionRate, "15"),
    price: str(s.price, "1500"),
    currency: str(s.currency, "₺"),
    duration: str(s.duration, "2 Saat"),
    location: str(s.location, "Sultanahmet, Fatih"),
    phone: str(s.phone, "+90 532 000 00 00"),
    website: str(s.website, "https://"),
    email: str(s.providerEmail),
    availableSlots: str(s.availableSlots, "15"),
    capacity: str(s.capacity),
    quotaNote: str(s.quotaNote),
    lat: str(s.coords?.lat, "41.0082"),
    lng: str(s.coords?.lng, "28.9784"),
    scoreStr: str(s.scoreStr, "5.0"),
    description: str(s.desc),
    agentNote: str(s.agentNote),
    featuresText: (s.features ?? []).join(", "),
    image: str(s.image, "/images/istanbul/il_1588xN.6201904451_eqr3.webp"),
    featured: !!s.featured,
    suspended: s.status === "suspended",
    publishToWeb: s.publishToWeb !== false,
    publishToMobile: s.publishToMobile !== false,
    recommendedDistricts: s.id
      ? getEffectiveRecommendedDistricts(s as Experience)
      : Array.isArray(s.recommendedDistricts)
      ? s.recommendedDistricts
      : [],
    hotelVisibility: s.hotelVisibility === "specific" ? "specific" : "all",
    allowedHotelIds: Array.isArray(s.allowedHotelIds) ? s.allowedHotelIds : [],
  };
}

export function ListingEditorModal({
  mode,
  initial,
  prefill,
  suppliers,
  categories,
  hotels = [],
  onSave,
  onClose,
}: ListingEditorModalProps) {
  const selectableCategories = useMemo(() => categories.filter((c) => !c.deleted), [categories]);
  const [d, setD] = useState<Draft>(() =>
    toDraft(mode === "edit" ? initial : prefill, selectableCategories)
  );
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  const applySupplier = (supplierId: string) => {
    const found = suppliers.find((s) => s.id === supplierId);
    setD((prev) => ({
      ...prev,
      supplierId,
      provider: found ? found.name : prev.provider,
      phone: found?.phone || prev.phone,
      website: found?.website || prev.website,
      commissionRate: found ? String(found.commissionRate) : prev.commissionRate,
      location: found?.district ? `${found.district}, İstanbul` : prev.location,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 1100, mime: "image/jpeg", quality: 0.78 });
      set("image", dataUrl);
      toast.success("Görsel yüklendi.");
    } catch (err: any) {
      toast.error(err?.message || "Görsel yüklenemedi.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.title.trim()) {
      toast.error("İlan başlığı boş bırakılamaz.");
      return;
    }
    if (!d.provider.trim()) {
      toast.error("İşletme / sağlayıcı adı boş bırakılamaz.");
      return;
    }
    const category = selectableCategories.find((c) => c.key === d.categoryKey);
    const rating = parseFloat(d.scoreStr) || 5;
    const capacityNum = Number(d.capacity);
    const features = d.featuresText
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const patch: Partial<Experience> = {
      title: d.title.trim(),
      category: category?.label ?? initial?.category ?? "",
      categoryKey: d.categoryKey,
      categoryTag: category?.label ?? initial?.categoryTag ?? "",
      listingType: d.listingType,
      supplierId: d.supplierId || undefined,
      provider: d.provider.trim(),
      commissionRate: Number(d.commissionRate) || 15,
      price: Number(d.price) || 0,
      currency: d.currency,
      duration: d.duration,
      location: d.location,
      phone: d.phone,
      website: d.website,
      providerEmail: d.email.trim() || undefined,
      availableSlots: Math.max(0, Number(d.availableSlots) || 0),
      capacity: capacityNum > 0 ? capacityNum : undefined,
      quotaNote: d.quotaNote.trim() || undefined,
      coords: { lat: Number(d.lat) || 41.0082, lng: Number(d.lng) || 28.9784 },
      scoreStr: d.scoreStr || "5.0",
      rating,
      desc: d.description.trim() || d.agentNote.trim(),
      agentNote: d.agentNote.trim() || d.description.trim(),
      features: features.length ? features : undefined,
      image: d.image,
      featured: d.featured,
      status: d.suspended ? "suspended" : "active",
      publishToWeb: d.publishToWeb,
      publishToMobile: d.publishToMobile,
      recommendedDistricts: d.recommendedDistricts,
      hotelVisibility: d.hotelVisibility,
      allowedHotelIds: d.hotelVisibility === "specific" ? d.allowedHotelIds : undefined,
    };

    if (mode === "edit" && initial) {
      onSave({ ...initial, ...patch } as Experience);
      return;
    }

    onSave({
      id: "exp-" + Date.now(),
      iconName: "Compass",
      reviewsCount: "0",
      ...patch,
    } as Experience);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-xs p-2 sm:p-6">
      <form
        onSubmit={handleSubmit}
        data-comus-dashboard="true"
        className="comus-card w-full max-w-4xl my-2 sm:my-4 max-h-[92dvh] overflow-y-auto space-y-5 border-2 border-[#3B6D11]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#C8C4B0]/60 pb-3">
          <div>
            <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">
              {mode === "edit" ? "İlanı Düzenle" : "Yeni İlan Girişi"}
            </h3>
            <p className="text-xs text-[#6B6B55]">
              {mode === "edit"
                ? "Kaydettiğiniz değişiklikler web sitesi, iOS uygulaması ve otel PWA'ya anında yansır."
                : "Anlaşmalı tedarikçiyi seçtiğinizde işletme bilgileri ve komisyon oranı otomatik dolar."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EDE8DE] text-[#6B6B55] cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Temel bilgiler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="comus-label">İlan Başlığı *</label>
            <input
              type="text"
              value={d.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Örn: Özel Boğaz Yatı ile Gün Batımı Turu"
              className="comus-input"
              required
            />
          </div>
          <div>
            <label className="comus-label">Kategori</label>
            <select
              value={d.categoryKey}
              onChange={(e) => set("categoryKey", e.target.value)}
              className="comus-input"
            >
              {selectableCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                  {c.hidden ? " (gizli)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="comus-label">İlan Tipi</label>
            <select
              value={d.listingType}
              onChange={(e) => set("listingType", e.target.value as "experience" | "stay")}
              className="comus-input"
            >
              <option value="experience">Deneyim / Tur / Restoran / Hizmet</option>
              <option value="stay">Konaklama / Butik Otel / Yalı Dairesi</option>
            </select>
          </div>
          <div>
            <label className="comus-label">Anlaşmalı İşletme / Tedarikçi</label>
            <select
              value={d.supplierId}
              onChange={(e) => applySupplier(e.target.value)}
              className="comus-input"
            >
              <option value="">— Manuel giriş veya seçin —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Komisyon: %{s.commissionRate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="comus-label">İşletme / Sağlayıcı Adı *</label>
            <input
              type="text"
              value={d.provider}
              onChange={(e) => set("provider", e.target.value)}
              className="comus-input"
              required
            />
          </div>
        </div>

        {/* Fiyat & operasyon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="comus-label">Fiyat *</label>
            <input type="number" min={0} value={d.price} onChange={(e) => set("price", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Para Birimi</label>
            <select value={d.currency} onChange={(e) => set("currency", e.target.value)} className="comus-input">
              <option value="₺">₺ TRY</option>
              <option value="€">€ EUR</option>
              <option value="$">$ USD</option>
            </select>
          </div>
          <div>
            <label className="comus-label">Komisyon %</label>
            <input type="number" min={0} max={100} value={d.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Süre / Periyot</label>
            <input type="text" value={d.duration} onChange={(e) => set("duration", e.target.value)} placeholder="3 Saat veya 1 Gece" className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Kalan Kontenjan</label>
            <input type="number" min={0} value={d.availableSlots} onChange={(e) => set("availableSlots", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Toplam Kapasite</label>
            <input type="number" min={0} value={d.capacity} onChange={(e) => set("capacity", e.target.value)} className="comus-input" />
          </div>
          <div className="col-span-2">
            <label className="comus-label">Kontenjan Notu</label>
            <input type="text" value={d.quotaNote} onChange={(e) => set("quotaNote", e.target.value)} placeholder="Örn: Hafta sonu için erken rezervasyon önerilir" className="comus-input" />
          </div>
        </div>

        {/* İletişim & konum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="comus-label">Konum / Semt</label>
            <input type="text" value={d.location} onChange={(e) => set("location", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Telefon</label>
            <input type="text" value={d.phone} onChange={(e) => set("phone", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">İşletme E-Posta</label>
            <input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} className="comus-input" />
          </div>
          <div className="md:col-span-1">
            <label className="comus-label">Web Sitesi</label>
            <input type="text" value={d.website} onChange={(e) => set("website", e.target.value)} className="comus-input" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="comus-label">Enlem</label>
              <input type="text" value={d.lat} onChange={(e) => set("lat", e.target.value)} className="comus-input" />
            </div>
            <div>
              <label className="comus-label">Boylam</label>
              <input type="text" value={d.lng} onChange={(e) => set("lng", e.target.value)} className="comus-input" />
            </div>
          </div>
          <div>
            <label className="comus-label">Puan (0-5)</label>
            <input type="text" value={d.scoreStr} onChange={(e) => set("scoreStr", e.target.value)} className="comus-input" />
          </div>
        </div>

        {/* Görsel */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-start">
          <div className="w-full h-28 md:h-32 rounded-xl border border-[#C8C4B0] bg-[#F6F1E8] overflow-hidden">
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="Önizleme" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#6B6B55]">Görsel yok</div>
            )}
          </div>
          <div>
            <label className="comus-label">Görsel URL veya Bilgisayardan Yükle</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={d.image.startsWith("data:") ? "(yüklenen görsel)" : d.image}
                readOnly={d.image.startsWith("data:")}
                onChange={(e) => set("image", e.target.value)}
                placeholder="/images/istanbul/... veya https://..."
                className="comus-input flex-1"
              />
              <label className="comus-btn-ghost text-xs px-3 py-1.5 shrink-0 cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5" /> Dosya Seç
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-[11px] text-[#6B6B55] mt-1">
              Yüklenen görsel otomatik olarak web için küçültülür (en fazla 1100 px).
            </p>
          </div>
        </div>

        {/* Açıklama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="comus-label">İlan Açıklaması</label>
            <textarea rows={4} value={d.description} onChange={(e) => set("description", e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Misafir Notu / Acente Notu</label>
            <textarea rows={4} value={d.agentNote} onChange={(e) => set("agentNote", e.target.value)} className="comus-input" />
          </div>
        </div>
        <div>
          <label className="comus-label">Öne Çıkan Özellikler (virgülle ayırın)</label>
          <input
            type="text"
            value={d.featuresText}
            onChange={(e) => set("featuresText", e.target.value)}
            placeholder="Örn: Otelden alım, Rehber dahil, İkram"
            className="comus-input"
          />
        </div>

        {/* Sizin İçin Seçtiklerimiz — 5 Pilot Bölge Seçimi */}
        <div className="p-4 rounded-2xl bg-[#F6F1E8] border-2 border-[#3B6D11]/35 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#3B6D11]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sizin İçin Seçtiklerimiz — Pilot Bölge Önerileri</span>
              </div>
              <p className="text-xs text-[#6B6B55] mt-0.5">
                İlan normal kategorisinde yayınlanmaya devam eder; işaretlediğiniz pilot bölgelerdeki otellerde konaklayan misafirlere <strong>&ldquo;Sizin İçin Seçtiklerimiz&rdquo;</strong> vitrininde öne çıkarılarak gösterilir.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => set("recommendedDistricts", [...PILOT_DISTRICT_KEYS])}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97] hover:bg-[#dcebc9] cursor-pointer transition"
              >
                Tümünü İşaretle
              </button>
              <button
                type="button"
                onClick={() => set("recommendedDistricts", [])}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FFFCFA] text-[#6B6B55] border border-[#C8C4B0] hover:bg-[#EDE8DE] cursor-pointer transition"
              >
                Temizle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {PILOT_DISTRICTS.map((region) => {
              const checked = d.recommendedDistricts.includes(region.key);
              return (
                <label
                  key={region.key}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${
                    checked
                      ? "bg-[#EAF3DE] border-[#3B6D11] shadow-xs"
                      : "bg-[#FFFCFA] border-[#C8C4B0] hover:border-[#3B6D11]/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setD((prev) => {
                        const current = prev.recommendedDistricts;
                        const next = isChecked
                          ? Array.from(new Set([...current, region.key]))
                          : current.filter((k) => k !== region.key);
                        return { ...prev, recommendedDistricts: next };
                      });
                    }}
                    className="accent-[#3B6D11] w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#2C2C1A] leading-tight">
                      {region.label}
                    </div>
                    <div className="text-[10px] text-[#6B6B55] leading-snug mt-0.5">
                      {region.neighborhoods}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Otele Özel Görünürlük & Yayın Hedefleme */}
        <div className="p-4 rounded-2xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2C2C1A]">
            <Building2 className="w-4 h-4 text-[#3B6D11]" />
            <span>Otel Portalı &amp; PWA Görünürlük Hedefleme</span>
          </div>
          <p className="text-xs text-[#6B6B55]">
            Bu ilanın yalnızca belirli bir otelin misafirlerine mi yoksa platformdaki tüm partner otellere mi açık olduğunu belirleyin.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2C2C1A]">
              <input
                type="radio"
                name="hotelVisibility"
                checked={d.hotelVisibility === "all"}
                onChange={() => set("hotelVisibility", "all")}
                className="accent-[#3B6D11]"
              />
              <span>Tüm Partner Otellerde Yayınla (Genel İstanbul)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[#2C2C1A]">
              <input
                type="radio"
                name="hotelVisibility"
                checked={d.hotelVisibility === "specific"}
                onChange={() => set("hotelVisibility", "specific")}
                className="accent-[#3B6D11]"
              />
              <span>Yalnızca Seçili Otellerin Misafirlerine Özel</span>
            </label>
          </div>

          {d.hotelVisibility === "specific" && (
            <div className="pt-2">
              <label className="comus-label">Görünür Olacağı Oteller:</label>
              {hotels.length === 0 ? (
                <p className="text-xs text-[#6B6B55]">Kayıtlı partner otel bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {hotels.map((h) => {
                    const checked = d.allowedHotelIds.includes(h.id);
                    return (
                      <label
                        key={h.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                          checked
                            ? "bg-[#EAF3DE] border-[#3B6D11] text-[#2C2C1A]"
                            : "bg-white border-[#C8C4B0] text-[#6B6B55] hover:border-[#3B6D11]/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setD((prev) => ({
                              ...prev,
                              allowedHotelIds: isChecked
                                ? Array.from(new Set([...prev.allowedHotelIds, h.id]))
                                : prev.allowedHotelIds.filter((id) => id !== h.id),
                            }));
                          }}
                          className="accent-[#3B6D11]"
                        />
                        <span className="truncate">{h.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Yayın durumu */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#C8C4B0]/60">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
              <input type="checkbox" checked={d.publishToWeb} onChange={(e) => set("publishToWeb", e.target.checked)} className="accent-[#3B6D11] w-4 h-4" />
              <span>purelyistanbul.com Web</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
              <input type="checkbox" checked={d.publishToMobile} onChange={(e) => set("publishToMobile", e.target.checked)} className="accent-[#3B6D11] w-4 h-4" />
              <span>iOS App &amp; Otel PWA</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#2C2C1A] cursor-pointer">
              <input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-[#3B6D11] w-4 h-4" />
              <span>Öne çıkan</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#9C4E24] cursor-pointer">
              <input type="checkbox" checked={d.suspended} onChange={(e) => set("suspended", e.target.checked)} className="accent-[#C1622F] w-4 h-4" />
              <span>Askıya al (hiçbir kanalda gösterme)</span>
            </label>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button type="button" onClick={onClose} className="comus-btn-ghost flex-1 sm:flex-initial justify-center">
              Vazgeç
            </button>
            <button type="submit" className="comus-btn-primary flex-1 sm:flex-initial justify-center">
              <Save className="w-4 h-4" />
              <span>{mode === "edit" ? "Değişiklikleri Kaydet" : "İlanı Kaydet ve Yayına Al"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
