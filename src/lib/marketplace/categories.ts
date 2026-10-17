export interface MarketplaceCategory {
  key: string;
  label: string;
  icon: string;
  type: "stay" | "experience";
}

/**
 * Yönetim panelinden düzenlenebilen kategori kaydı. Hem web sitesi hem mobil
 * uygulama bu yapıyı okur. Hazır (varsayılan) kategoriler için yalnızca fark
 * (override) saklanır; panelden eklenen özel kategoriler tam kayıt olarak tutulur.
 */
export interface CategoryConfig extends MarketplaceCategory {
  /** İngilizce ad (EN dilindeki misafirler için). */
  labelEn?: string;
  /** Kısa açıklama (uygulamadaki kategori kartı altı vb.). */
  description?: string;
  /** Küçükten büyüğe sıralama. */
  order: number;
  /** true ise kategori ve ilanları web + uygulamadan gizlenir. */
  hidden: boolean;
  /** Panelden eklenen özel kategori mi? (hazır kategoriler silinemez, yalnızca gizlenir) */
  custom: boolean;
  /** Silinmiş özel kategori mezar taşı (cihazlar arası silme senkronu için). */
  deleted?: boolean;
  updatedAt?: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { key: "cat-1", label: "History & Museums", icon: "/icons/categories/tarih-muzeler.png", type: "experience" },
  { key: "cat-2", label: "Gastronomy & Food Tours", icon: "/icons/categories/gastronomi-gurme.png", type: "experience" },
  { key: "cat-3", label: "Art & Whirling Dervishes", icon: "/icons/categories/sanat-semazen.png", type: "experience" },
  { key: "cat-4", label: "Shopping & Bazaars", icon: "/icons/categories/alisveris-carsilar.png", type: "experience" },
  { key: "cat-5", label: "Bosphorus & Yacht Cruises", icon: "/icons/categories/bogaz-yatturlari.png", type: "experience" },
  { key: "cat-6", label: "Cultural Heritage", icon: "/icons/categories/kulturel-miras.png", type: "experience" },
  { key: "cat-7", label: "Turkish Bath & Spa", icon: "/icons/categories/turk-hamami-spa.png", type: "experience" },
  { key: "cat-8", label: "Photography & Costumes", icon: "/icons/categories/fotograf-kostum.png", type: "experience" },
  { key: "cat-9", label: "Private VIP Transfer", icon: "/icons/categories/ozel-vip-transfer.png", type: "experience" },
  { key: "cat-10", label: "Recommended Restaurants", icon: "/icons/categories/onerdigimiz-restoranlar.png", type: "experience" },
  { key: "cat-11", label: "Aesthetic & Beauty Clinics", icon: "/icons/categories/aesthetic-beauty.png", type: "experience" },
  { key: "cat-12", label: "Invest in Istanbul", icon: "/icons/categories/invest.png", type: "experience" }
];

export const LEGACY_TR_DEFAULT_LABELS: Record<string, string> = {
  "Tarih & Müzeler": "History & Museums",
  "Gastronomi & Gurme": "Gastronomy & Food Tours",
  "Sanat & Semazen": "Art & Whirling Dervishes",
  "Alışveriş & Çarşılar": "Shopping & Bazaars",
  "Boğaz Turları & Yat": "Bosphorus & Yacht Cruises",
  "Kültürel Miras": "Cultural Heritage",
  "Türk Hamamı & Spa": "Turkish Bath & Spa",
  "Fotoğraf & Kostüm": "Photography & Costumes",
  "Özel VIP Transfer": "Private VIP Transfer",
  "Önerdiğimiz Restoranlar": "Recommended Restaurants",
  "Medikal Estetik & Güzellik": "Aesthetic & Beauty Clinics",
  "İstanbul'da Yatırım": "Invest in Istanbul",
};

export function normalizeCategoryLabel(label: string | undefined, fallback = ""): string {
  if (!label) return fallback;
  return LEGACY_TR_DEFAULT_LABELS[label] || label;
}

export const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = MARKETPLACE_CATEGORIES.map((c, i) => ({
  ...c,
  labelEn: c.label,
  order: i,
  hidden: c.key === "cat-11" || c.key === "cat-12",
  custom: false,
}));

export function getCategoryByKey(key: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}

/** Özel kategori anahtarı. İçinde "cat-" geçtiği için getCategoryCode() bunu olduğu gibi döndürür. */
export function createCustomCategoryKey(): string {
  return `cat-c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/**
 * Varsayılan kategoriler + panelden kaydedilen override'lar birleştirilir.
 * Silinmiş (deleted) özel kategoriler çıkarılır; sonuç `order` alanına göre sıralanır.
 */
export function mergeCategoryConfigs(overrides: Partial<CategoryConfig>[]): CategoryConfig[] {
  const byKey = new Map<string, Partial<CategoryConfig>>();
  overrides.forEach((o) => {
    if (o && o.key) byKey.set(o.key, o);
  });

  const result: CategoryConfig[] = DEFAULT_CATEGORY_CONFIGS.map((base) => {
    const o = byKey.get(base.key);
    if (!o) return { ...base };
    const normalizedLabel =
      o.label && LEGACY_TR_DEFAULT_LABELS[o.label] ? LEGACY_TR_DEFAULT_LABELS[o.label] : o.label || base.label;
    return {
      ...base,
      ...o,
      key: base.key,
      label: normalizedLabel,
      labelEn: o.labelEn || normalizedLabel,
      custom: false,
    } as CategoryConfig;
  });

  const defaultKeys = new Set(DEFAULT_CATEGORY_CONFIGS.map((c) => c.key));
  byKey.forEach((o, key) => {
    if (defaultKeys.has(key) || o.deleted) return;
    const rawLabel = o.label || "New Category";
    const normalizedLabel = LEGACY_TR_DEFAULT_LABELS[rawLabel] || rawLabel;
    result.push({
      key,
      label: normalizedLabel,
      icon: o.icon || "",
      type: o.type || "experience",
      labelEn: o.labelEn || normalizedLabel,
      description: o.description,
      order: typeof o.order === "number" ? o.order : 1000 + result.length,
      hidden: !!o.hidden,
      custom: true,
      updatedAt: o.updatedAt,
    });
  });

  return result.sort((a, b) => a.order - b.order);
}
