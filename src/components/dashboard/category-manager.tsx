"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { XeniosStore } from "@/lib/store";
import { FirestoreService } from "@/lib/firestore-service";
import type { Experience, PropertyListing } from "@/lib/types";
import {
  MARKETPLACE_CATEGORIES,
  createCustomCategoryKey,
  type CategoryConfig,
} from "@/lib/marketplace/categories";
import { getExperienceCategoryKey } from "@/lib/marketplace/seed-listings";
import { fileToResizedDataUrl } from "@/lib/image-utils";

interface CategoryManagerProps {
  experiences: Experience[];
  properties: PropertyListing[];
  /** İlan/kategori verisi değiştiğinde üst bileşenin listeleri yenilemesi için */
  onDataChanged: () => void;
  /** "İlanları Gör" — İlan Yönetimi sekmesine bu kategori filtresiyle geçer */
  onOpenListings: (categoryKey: string) => void;
}

interface CategoryDraft {
  label: string;
  labelEn: string;
  description: string;
  icon: string;
}

const EMPTY_DRAFT: CategoryDraft = { label: "", labelEn: "", description: "", icon: "" };

function defaultIconFor(key: string): string {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key)?.icon ?? "";
}

export function CategoryManager({
  experiences,
  properties,
  onDataChanged,
  onOpenListings,
}: CategoryManagerProps) {
  const [configs, setConfigs] = useState<CategoryConfig[]>(() => XeniosStore.getCategoryConfigs());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<CategoryDraft>(EMPTY_DRAFT);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    const refresh = () => setConfigs(XeniosStore.getCategoryConfigs());
    refresh();
    window.addEventListener("xenios_categories_updated", refresh);
    return () => window.removeEventListener("xenios_categories_updated", refresh);
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; live: number; suspended: number }>();
    configs.forEach((c) => map.set(c.key, { total: 0, live: 0, suspended: 0 }));
    experiences.forEach((e) => {
      const s = map.get(getExperienceCategoryKey(e));
      if (!s) return;
      s.total += 1;
      if (e.status === "suspended") s.suspended += 1;
      else s.live += 1;
    });
    const inv = map.get("cat-12");
    if (inv) {
      properties.forEach((p) => {
        inv.total += 1;
        if (p.status === "suspended") inv.suspended += 1;
        else inv.live += 1;
      });
    }
    return map;
  }, [configs, experiences, properties]);

  const syncExperiences = (changed: Experience[]) => {
    changed.forEach((e) => FirestoreService.upsertExperience(e).catch(() => {}));
  };

  // ---------- Kategori düzenleme ----------

  const startEdit = (cfg: CategoryConfig) => {
    setEditingKey(cfg.key);
    setDraft({
      label: cfg.label,
      labelEn: cfg.labelEn ?? "",
      description: cfg.description ?? "",
      icon: cfg.icon,
    });
  };

  const saveEdit = (cfg: CategoryConfig) => {
    const label = draft.label.trim();
    if (!label) {
      toast.error("Kategori adı boş bırakılamaz.");
      return;
    }
    XeniosStore.upsertCategoryConfig({
      ...cfg,
      label,
      labelEn: draft.labelEn.trim() || undefined,
      description: draft.description.trim() || undefined,
      icon: draft.icon.trim() || (cfg.custom ? "" : defaultIconFor(cfg.key)),
    });
    setEditingKey(null);
    onDataChanged();
    toast.success(`"${label}" kategorisi güncellendi. Web sitesi ve uygulamada anında görünür.`);
  };

  const handleIconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    apply: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 192, mime: "image/png" });
      apply(dataUrl);
      toast.success("İkon yüklendi. Kaydet'e basınca yayına alınır.");
    } catch (err: any) {
      toast.error(err?.message || "İkon yüklenemedi.");
    }
  };

  // ---------- Görünürlük / sıralama ----------

  const toggleHidden = (cfg: CategoryConfig) => {
    const nextHidden = !cfg.hidden;
    XeniosStore.upsertCategoryConfig({ ...cfg, hidden: nextHidden });
    onDataChanged();
    toast.success(
      nextHidden
        ? `"${cfg.label}" kategorisi ve ilanları web sitesi ile uygulamadan gizlendi.`
        : `"${cfg.label}" kategorisi tekrar yayında.`
    );
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= configs.length) return;
    const list = [...configs];
    [list[index], list[target]] = [list[target], list[index]];
    const changed = list
      .map((c, i) => ({ ...c, order: i }))
      .filter((c, i) => configs.find((o) => o.key === c.key)?.order !== i || list[i].key !== configs[i].key);
    XeniosStore.upsertCategoryConfigs(changed);
    onDataChanged();
  };

  // ---------- Yeni / sil / sıfırla ----------

  const createCategory = () => {
    const label = newDraft.label.trim();
    if (!label) {
      toast.error("Lütfen kategori adını girin.");
      return;
    }
    const maxOrder = configs.reduce((m, c) => Math.max(m, c.order), -1);
    XeniosStore.upsertCategoryConfig({
      key: createCustomCategoryKey(),
      label,
      labelEn: newDraft.labelEn.trim() || undefined,
      description: newDraft.description.trim() || undefined,
      icon: newDraft.icon.trim(),
      type: "experience",
      order: maxOrder + 1,
      hidden: false,
      custom: true,
    });
    setNewDraft(EMPTY_DRAFT);
    setShowNew(false);
    onDataChanged();
    toast.success(
      `"${label}" kategorisi eklendi. İlan eklerken/düzenlerken bu kategoriyi seçebilirsiniz.`
    );
  };

  const deleteCategory = (cfg: CategoryConfig) => {
    const count = stats.get(cfg.key)?.total ?? 0;
    if (count > 0) {
      toast.error("Bu kategoride ilan var. Önce ilanları başka bir kategoriye taşıyın.");
      return;
    }
    if (!window.confirm(`"${cfg.label}" kategorisi kalıcı olarak silinsin mi?`)) return;
    XeniosStore.deleteCustomCategory(cfg.key);
    onDataChanged();
    toast.success("Kategori silindi.");
  };

  const resetCategory = (cfg: CategoryConfig) => {
    if (!window.confirm(`"${cfg.label}" varsayılan ad, ikon ve ayarlarına döndürülsün mü?`)) return;
    XeniosStore.resetCategoryConfig(cfg.key);
    setEditingKey(null);
    onDataChanged();
    toast.success("Kategori varsayılan ayarlara döndürüldü.");
  };

  // ---------- Kategorideki ilanlara toplu işlem ----------

  const setAllListingsStatus = (cfg: CategoryConfig, status: "active" | "suspended") => {
    const all = XeniosStore.getExperiences();
    const changed: Experience[] = [];
    const next = all.map((e) => {
      if (getExperienceCategoryKey(e) !== cfg.key) return e;
      const patched: Experience =
        status === "active"
          ? { ...e, status: "active", publishToWeb: true, publishToMobile: true }
          : { ...e, status: "suspended" };
      changed.push(patched);
      return patched;
    });
    XeniosStore.saveExperiences(next);
    syncExperiences(changed);

    if (cfg.key === "cat-12") {
      const nextProps = XeniosStore.getPropertyListings().map((p) => {
        const patched: PropertyListing =
          status === "active"
            ? { ...p, status: "active", publishToWeb: true }
            : { ...p, status: "suspended", publishToWeb: false };
        FirestoreService.upsertProperty(patched).catch(() => {});
        return patched;
      });
      XeniosStore.savePropertyListings(nextProps);
    }

    onDataChanged();
    toast.success(
      status === "active"
        ? `"${cfg.label}" kategorisindeki tüm ilanlar yayına alındı.`
        : `"${cfg.label}" kategorisindeki tüm ilanlar askıya alındı.`
    );
  };

  const moveAllListings = (cfg: CategoryConfig) => {
    const targetKey = moveTargets[cfg.key];
    const target = configs.find((c) => c.key === targetKey);
    if (!target) {
      toast.error("Önce taşınacak kategoriyi seçin.");
      return;
    }
    const count = experiences.filter((e) => getExperienceCategoryKey(e) === cfg.key).length;
    if (count === 0) {
      toast.info("Taşınacak ilan yok.");
      return;
    }
    if (!window.confirm(`${count} ilan "${cfg.label}" kategorisinden "${target.label}" kategorisine taşınsın mı?`))
      return;

    const changed: Experience[] = [];
    const next = XeniosStore.getExperiences().map((e) => {
      if (getExperienceCategoryKey(e) !== cfg.key) return e;
      const patched: Experience = {
        ...e,
        categoryKey: target.key,
        category: target.label,
        categoryTag: target.label,
      };
      changed.push(patched);
      return patched;
    });
    XeniosStore.saveExperiences(next);
    syncExperiences(changed);
    setMoveTargets((prev) => ({ ...prev, [cfg.key]: "" }));
    onDataChanged();
    toast.success(`${changed.length} ilan "${target.label}" kategorisine taşındı.`);
  };

  // ---------- Arayüz ----------

  const renderIcon = (icon: string, label: string, size = "w-12 h-12") =>
    icon ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt={label} className={`${size} object-contain`} />
    ) : (
      <span className={`${size} rounded-xl bg-[#EDE8DE] text-[#6B6B55] flex items-center justify-center text-lg font-semibold`}>
        {label.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );

  const renderIconField = (value: string, cfgKey: string | null, onChange: (v: string) => void) => (
    <div>
      <label className="comus-label">İkon</label>
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-xl border border-[#C8C4B0] bg-[#FFFCFA] flex items-center justify-center shrink-0 overflow-hidden">
          {renderIcon(value, "?", "w-10 h-10")}
        </div>
        <input
          type="text"
          value={value.startsWith("data:") ? "(yüklenen görsel)" : value}
          readOnly={value.startsWith("data:")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/icons/... veya https://..."
          className="comus-input flex-1"
        />
        <label className="comus-btn-ghost text-xs px-3 py-1.5 shrink-0 cursor-pointer">
          <ImagePlus className="w-3.5 h-3.5" /> Yükle
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleIconUpload(e, onChange)}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(cfgKey ? defaultIconFor(cfgKey) : "")}
            className="p-2 rounded-full border border-[#C8C4B0] text-[#6B6B55] hover:text-red-700 cursor-pointer"
            title={cfgKey && defaultIconFor(cfgKey) ? "Varsayılan ikona dön" : "İkonu kaldır"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#C8C4B0]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#3B6D11]">
            Katalog &amp; Vitrin Yönetimi
          </div>
          <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
            Kategori <em className="italic text-[#3B6D11]">Yönetimi</em>
          </h1>
          <p className="text-sm text-[#6B6B55] font-light mt-1 max-w-2xl">
            Kategorilerin adını, ikonunu ve sırasını değiştirin; yenisini ekleyin veya geçici
            olarak gizleyin. Yaptığınız her değişiklik <strong>purelyistanbul.com</strong> ve{" "}
            <strong>iOS uygulaması / otel PWA</strong> üzerinde anında yansır.
          </p>
        </div>
        <button onClick={() => setShowNew((v) => !v)} className="comus-btn-primary">
          <Plus className="w-4 h-4" />
          <span>{showNew ? "Formu Kapat" : "Yeni Kategori Ekle"}</span>
        </button>
      </div>

      {showNew && (
        <div className="comus-card space-y-4 border-2 border-[#3B6D11]">
          <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A]">Yeni Kategori</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="comus-label">Kategori Adı (Türkçe) *</label>
              <input
                type="text"
                value={newDraft.label}
                onChange={(e) => setNewDraft({ ...newDraft, label: e.target.value })}
                placeholder="Örn: Günübirlik Turlar"
                className="comus-input"
              />
            </div>
            <div>
              <label className="comus-label">Kategori Adı (İngilizce)</label>
              <input
                type="text"
                value={newDraft.labelEn}
                onChange={(e) => setNewDraft({ ...newDraft, labelEn: e.target.value })}
                placeholder="Örn: Day Trips"
                className="comus-input"
              />
            </div>
          </div>
          <div>
            <label className="comus-label">Kısa Açıklama</label>
            <input
              type="text"
              value={newDraft.description}
              onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
              className="comus-input"
            />
          </div>
          {renderIconField(newDraft.icon, null, (v) => setNewDraft((d) => ({ ...d, icon: v })))}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C8C4B0]/60">
            <button onClick={() => setShowNew(false)} className="comus-btn-ghost">
              Vazgeç
            </button>
            <button onClick={createCategory} className="comus-btn-primary">
              <Save className="w-4 h-4" /> Kategoriyi Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {configs.map((cfg, index) => {
          const s = stats.get(cfg.key) ?? { total: 0, live: 0, suspended: 0 };
          const isEditing = editingKey === cfg.key;
          const hasOverride = !cfg.custom && XeniosStore.getCategoryOverrides().some((o) => o.key === cfg.key);

          return (
            <div
              key={cfg.key}
              className={`comus-card space-y-4 ${cfg.hidden ? "opacity-80 border-[#C1622F]/40" : ""}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0">{renderIcon(cfg.icon, cfg.label)}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="comus-serif text-xl font-medium text-[#2C2C1A]">{cfg.label}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F6F1E8] border border-[#C8C4B0] text-[#6B6B55]">
                        {cfg.custom ? "Özel" : "Hazır"} • {cfg.key}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          cfg.hidden
                            ? "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                            : "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]"
                        }`}
                      >
                        {cfg.hidden ? "Gizli" : "Yayında"}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B55] mt-0.5">
                      Toplam <strong>{s.total}</strong> ilan • <strong>{s.live}</strong> aktif •{" "}
                      <strong>{s.suspended}</strong> askıda
                      {cfg.labelEn ? ` • EN: ${cfg.labelEn}` : ""}
                    </p>
                    {cfg.hidden && (
                      <p className="text-[11px] text-[#9C4E24] mt-0.5">
                        Bu kategori ve içindeki tüm ilanlar web sitesinde ve uygulamada görünmüyor.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => moveCategory(index, -1)}
                    disabled={index === 0}
                    className="p-2 rounded-full border border-[#C8C4B0] text-[#6B6B55] hover:text-[#2C2C1A] disabled:opacity-30 cursor-pointer"
                    title="Yukarı taşı"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveCategory(index, 1)}
                    disabled={index === configs.length - 1}
                    className="p-2 rounded-full border border-[#C8C4B0] text-[#6B6B55] hover:text-[#2C2C1A] disabled:opacity-30 cursor-pointer"
                    title="Aşağı taşı"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleHidden(cfg)}
                    className={`text-xs py-1.5 px-3 rounded-full border flex items-center gap-1.5 cursor-pointer transition ${
                      cfg.hidden
                        ? "bg-[#3B6D11] text-white border-[#3B6D11]"
                        : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                    }`}
                  >
                    {cfg.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {cfg.hidden ? "Tekrar Yayına Al" : "Gizle"}
                  </button>
                  <button
                    onClick={() => (isEditing ? setEditingKey(null) : startEdit(cfg))}
                    className="comus-btn-ghost text-xs py-1.5 px-3"
                  >
                    <Pencil className="w-3.5 h-3.5" /> {isEditing ? "Kapat" : "Düzenle"}
                  </button>
                  <button
                    onClick={() => onOpenListings(cfg.key)}
                    className="comus-btn-ghost text-xs py-1.5 px-3"
                  >
                    <ListChecks className="w-3.5 h-3.5" /> İlanlar
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-4 pt-4 border-t border-[#C8C4B0]/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="comus-label">Kategori Adı (Türkçe) *</label>
                      <input
                        type="text"
                        value={draft.label}
                        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        className="comus-input"
                      />
                    </div>
                    <div>
                      <label className="comus-label">Kategori Adı (İngilizce)</label>
                      <input
                        type="text"
                        value={draft.labelEn}
                        onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })}
                        className="comus-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="comus-label">Kısa Açıklama</label>
                    <input
                      type="text"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className="comus-input"
                    />
                  </div>
                  {renderIconField(draft.icon, cfg.custom ? null : cfg.key, (v) =>
                    setDraft((d) => ({ ...d, icon: v }))
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#C8C4B0]/60">
                    <div className="flex flex-wrap items-center gap-2">
                      {!cfg.custom && hasOverride && (
                        <button onClick={() => resetCategory(cfg)} className="comus-btn-ghost text-xs py-1.5 px-3">
                          <RotateCcw className="w-3.5 h-3.5" /> Varsayılana Dön
                        </button>
                      )}
                      {cfg.custom && (
                        <button
                          onClick={() => deleteCategory(cfg)}
                          className="text-xs py-1.5 px-3 rounded-full border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Kategoriyi Sil
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingKey(null)} className="comus-btn-ghost text-xs py-1.5">
                        İptal
                      </button>
                      <button onClick={() => saveEdit(cfg)} className="comus-btn-primary text-xs py-1.5">
                        <Save className="w-3.5 h-3.5" /> Kaydet
                      </button>
                    </div>
                  </div>

                  {/* Bu kategorideki ilanlara toplu işlemler */}
                  <div className="rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0] p-3.5 space-y-3">
                    <div className="text-[11px] uppercase tracking-widest text-[#6B6B55] font-medium">
                      Bu kategorideki {s.total} ilana toplu işlem
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setAllListingsStatus(cfg, "active")}
                        disabled={s.total === 0}
                        className="comus-btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
                      >
                        Tümünü Yayına Al
                      </button>
                      <button
                        onClick={() => setAllListingsStatus(cfg, "suspended")}
                        disabled={s.total === 0}
                        className="comus-btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
                      >
                        Tümünü Askıya Al
                      </button>
                      <span className="text-[#C8C4B0]">|</span>
                      <select
                        value={moveTargets[cfg.key] ?? ""}
                        onChange={(e) => setMoveTargets((prev) => ({ ...prev, [cfg.key]: e.target.value }))}
                        className="comus-input w-auto text-xs py-1.5 px-2.5"
                      >
                        <option value="">Taşınacak kategori…</option>
                        {configs
                          .filter((c) => c.key !== cfg.key)
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => moveAllListings(cfg)}
                        disabled={s.total === 0}
                        className="comus-btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
                      >
                        İlanları Taşı
                      </button>
                    </div>
                    {cfg.key === "cat-12" && (
                      <p className="text-[11px] text-[#6B6B55]">
                        Not: Yatırım kategorisindeki mülkler (Mülk &amp; Gayrimenkul sekmesi) bu kategoriye
                        sabittir; taşıma yalnızca deneyim ilanlarını etkiler.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
