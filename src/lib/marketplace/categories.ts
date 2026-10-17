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
  { key: "cat-1", label: "Tarih & Müzeler", icon: "/icons/categories/tarih-muzeler.png", type: "experience" },
  { key: "cat-2", label: "Gastronomi & Gurme", icon: "/icons/categories/gastronomi-gurme.png", type: "experience" },
  { key: "cat-3", label: "Sanat & Semazen", icon: "/icons/categories/sanat-semazen.png", type: "experience" },
  { key: "cat-4", label: "Alışveriş & Çarşılar", icon: "/icons/categories/alisveris-carsilar.png", type: "experience" },
  { key: "cat-5", label: "Boğaz Turları & Yat", icon: "/icons/categories/bogaz-yatturlari.png", type: "experience" },
  { key: "cat-6", label: "Kültürel Miras", icon: "/icons/categories/kulturel-miras.png", type: "experience" },
  { key: "cat-7", label: "Türk Hamamı & Spa", icon: "/icons/categories/turk-hamami-spa.png", type: "experience" },
  { key: "cat-8", label: "Fotoğraf & Kostüm", icon: "/icons/categories/fotograf-kostum.png", type: "experience" },
  { key: "cat-9", label: "Özel VIP Transfer", icon: "/icons/categories/ozel-vip-transfer.png", type: "experience" },
  { key: "cat-10", label: "Önerdiğimiz Restoranlar", icon: "/icons/categories/onerdigimiz-restoranlar.png", type: "experience" },
  { key: "cat-11", label: "Medikal Estetik & Güzellik", icon: "/icons/categories/aesthetic-beauty.png", type: "experience" },
  { key: "cat-12", label: "İstanbul'da Yatırım", icon: "/icons/categories/invest.png", type: "experience" }
];

export const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = MARKETPLACE_CATEGORIES.map((c, i) => ({
  ...c,
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
    return o ? ({ ...base, ...o, key: base.key, custom: false } as CategoryConfig) : { ...base };
  });

  const defaultKeys = new Set(DEFAULT_CATEGORY_CONFIGS.map((c) => c.key));
  byKey.forEach((o, key) => {
    if (defaultKeys.has(key) || o.deleted) return;
    result.push({
      key,
      label: o.label || "Yeni Kategori",
      icon: o.icon || "",
      type: o.type || "experience",
      labelEn: o.labelEn,
      description: o.description,
      order: typeof o.order === "number" ? o.order : 1000 + result.length,
      hidden: !!o.hidden,
      custom: true,
      updatedAt: o.updatedAt,
    });
  });

  return result.sort((a, b) => a.order - b.order);
}
