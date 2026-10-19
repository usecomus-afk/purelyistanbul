export interface MarketplaceCategory {
  key: string;
  slug?: string;
  label: string;
  subtitle?: string;
  icon: string;
  type: "stay" | "experience";
}

/**
 * Editable category record synced between the Admin Dashboard, the Marketplace Web App,
 * and the In-Room Guest PWA.
 */
export interface CategoryConfig extends MarketplaceCategory {
  labelEn?: string;
  description?: string;
  order: number;
  hidden: boolean;
  unhiddenByAdmin?: boolean;
  custom: boolean;
  deleted?: boolean;
  updatedAt?: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    key: "cat-1",
    slug: "bosphorus-cruises",
    label: "Bosphorus & Boat Cruises",
    subtitle: "Private yachts, sunset charters, and curated strait voyages between Europe and Asia",
    icon: "/icons/categories/bogaz-yatturlari.png",
    type: "experience",
  },
  {
    key: "cat-2",
    slug: "historic-routes",
    label: "Historic Routes & Fast-Track Walks",
    subtitle: "Skip-the-line museum access and historian-led walks through the Old City",
    icon: "/icons/categories/tarih-muzeler.png",
    type: "experience",
  },
  {
    key: "cat-3",
    slug: "culinary-trails",
    label: "Culinary & Street Food Trails",
    subtitle: "Two-continent tasting walks, hidden neighborhood lokantas, and Anatolian pairings",
    icon: "/icons/categories/gastronomi-gurme.png",
    type: "experience",
  },
  {
    key: "cat-4",
    slug: "hammam-rituals",
    label: "Traditional Turkish Bath & Hammam Rituals",
    subtitle: "Centuries-old marble hammams, private kese foam rituals, and holistic spa care",
    icon: "/icons/categories/turk-hamami-spa.png",
    type: "experience",
  },
  {
    key: "cat-5",
    slug: "arts-dervishes",
    label: "Arts & Whirling Dervishes",
    subtitle: "Authentic Mevlevi sema ceremonies, contemporary galleries, and live cultural heritage",
    icon: "/icons/categories/sanat-semazen.png",
    type: "experience",
  },
  {
    key: "cat-6",
    slug: "rooftop-photography",
    label: "Rooftop Photography & Costumes",
    subtitle: "Private panoramic terrace shoots and professional styling with Bosphorus views",
    icon: "/icons/categories/fotograf-kostum.png",
    type: "experience",
  },
  {
    key: "cat-7",
    slug: "vip-transfers",
    label: "Private VIP Airport Transfers (Licensed Fleets)",
    subtitle: "TÜRSAB & D2-certified luxury Mercedes-Benz V-Class airport and chauffeur service",
    icon: "/icons/categories/ozel-vip-transfer.png",
    type: "experience",
  },
  {
    key: "cat-8",
    slug: "artisan-bazaar",
    label: "Curated Artisan & Bazaar Shopping",
    subtitle: "Authentic craftsmanship, private bazaar access, and bespoke atelier visits",
    icon: "/icons/categories/alisveris-carsilar.png",
    type: "experience",
  },
  {
    key: "cat-9",
    slug: "in-stay-catering",
    label: "In-Stay Breakfast & Gourmet Catering",
    subtitle: "Artisanal Turkish breakfast and private chef dining delivered to your suite",
    icon: "/icons/categories/onerdigimiz-restoranlar.png",
    type: "experience",
  },
  {
    key: "cat-10",
    slug: "in-stay-laundry",
    label: "In-Stay Express Laundry & Garment Care",
    subtitle: "Same-day valet laundry, dry cleaning, and delicate garment pressing",
    icon: "/icons/menu/laundry.png",
    type: "experience",
  },
];

const REMOVED_CATEGORY_KEYS = new Set(["cat-11", "cat-12"]);
const DEFAULT_HIDDEN_CATEGORY_KEYS = new Set(["cat-9", "cat-10"]);

const CATEGORY_QUERY_ALIASES: Record<string, string> = {
  shopping: "cat-8",
  "artisan-bazaar": "cat-8",
  bazaar: "cat-8",
  "bosphorus-cruises": "cat-1",
  bosphorus: "cat-1",
  "historic-routes": "cat-2",
  history: "cat-2",
  "culinary-trails": "cat-3",
  culinary: "cat-3",
  "hammam-rituals": "cat-4",
  hammam: "cat-4",
  "arts-dervishes": "cat-5",
  arts: "cat-5",
  "rooftop-photography": "cat-6",
  photography: "cat-6",
  "vip-transfers": "cat-7",
  transfer: "cat-7",
  "in-stay-catering": "cat-9",
  "in-stay-laundry": "cat-10",
};

export function resolveCategoryParam(rawParam: string | null | undefined): string {
  if (!rawParam) return "";
  const cleaned = rawParam.trim().toLowerCase();
  if (!cleaned) return "";
  if (CATEGORY_QUERY_ALIASES[cleaned]) return CATEGORY_QUERY_ALIASES[cleaned];
  const matched = MARKETPLACE_CATEGORIES.find(
    (c) => c.key.toLowerCase() === cleaned || c.slug?.toLowerCase() === cleaned
  );
  return matched ? matched.key : "";
}

const STALE_DEFAULT_LABELS = new Set([
  "Tarih & Müzeler",
  "History & Museums",
  "Gastronomi & Gurme",
  "Gastronomy & Food Tours",
  "Sanat & Semazen",
  "Art & Whirling Dervishes",
  "Alışveriş & Çarşılar",
  "Shopping & Bazaars",
  "Boğaz Turları & Yat",
  "Bosphorus & Yacht Cruises",
  "Kültürel Miras",
  "Cultural Heritage",
  "Türk Hamamı & Spa",
  "Turkish Bath & Spa",
  "Fotoğraf & Kostüm",
  "Photography & Costumes",
  "Özel VIP Transfer",
  "Private VIP Transfer",
  "Önerdiğimiz Restoranlar",
  "Recommended Restaurants",
  "Medikal Estetik & Güzellik",
  "Aesthetic & Beauty Clinics",
  "İstanbul'da Yatırım",
  "Invest in Istanbul",
]);

export const LEGACY_TR_DEFAULT_LABELS: Record<string, string> = {
  "Boğaz Turları & Yat": "Bosphorus & Boat Cruises",
  "Bosphorus & Yacht Cruises": "Bosphorus & Boat Cruises",
  "Tarih & Müzeler": "Historic Routes & Fast-Track Walks",
  "History & Museums": "Historic Routes & Fast-Track Walks",
  "Kültürel Miras": "Historic Routes & Fast-Track Walks",
  "Cultural Heritage": "Historic Routes & Fast-Track Walks",
  "Gastronomi & Gurme": "Culinary & Street Food Trails",
  "Gastronomy & Food Tours": "Culinary & Street Food Trails",
  "Türk Hamamı & Spa": "Traditional Turkish Bath & Hammam Rituals",
  "Turkish Bath & Spa": "Traditional Turkish Bath & Hammam Rituals",
  "Sanat & Semazen": "Arts & Whirling Dervishes",
  "Art & Whirling Dervishes": "Arts & Whirling Dervishes",
  "Fotoğraf & Kostüm": "Rooftop Photography & Costumes",
  "Photography & Costumes": "Rooftop Photography & Costumes",
  "Özel VIP Transfer": "Private VIP Airport Transfers (Licensed Fleets)",
  "Private VIP Transfer": "Private VIP Airport Transfers (Licensed Fleets)",
  "Alışveriş & Çarşılar": "Curated Artisan & Bazaar Shopping",
  "Shopping & Bazaars": "Curated Artisan & Bazaar Shopping",
  "Önerdiğimiz Restoranlar": "In-Stay Breakfast & Gourmet Catering",
  "Recommended Restaurants": "In-Stay Breakfast & Gourmet Catering",
};

export function isRemovedCategory(keyOrLabel: string | undefined): boolean {
  if (!keyOrLabel) return false;
  if (REMOVED_CATEGORY_KEYS.has(keyOrLabel)) return true;
  const lower = keyOrLabel.toLowerCase();
  return (
    lower.includes("estetik") ||
    lower.includes("aesthetic") ||
    lower.includes("medical") ||
    lower.includes("yatırım") ||
    lower.includes("invest") ||
    lower.includes("real estate")
  );
}

export function normalizeCategoryLabel(label: string | undefined, fallback = ""): string {
  if (!label) return fallback;
  return LEGACY_TR_DEFAULT_LABELS[label] || label;
}

export const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = MARKETPLACE_CATEGORIES.map((c, i) => ({
  ...c,
  labelEn: c.label,
  description: c.subtitle,
  order: i,
  hidden: DEFAULT_HIDDEN_CATEGORY_KEYS.has(c.key),
  custom: false,
}));

export function getCategoryByKey(key: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}

export function createCustomCategoryKey(): string {
  return `cat-c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function mergeCategoryConfigs(overrides: Partial<CategoryConfig>[]): CategoryConfig[] {
  const byKey = new Map<string, Partial<CategoryConfig>>();
  overrides.forEach((o) => {
    if (o && o.key && !isRemovedCategory(o.key) && !isRemovedCategory(o.label)) {
      byKey.set(o.key, o);
    }
  });

  // Built-in categories (cat-1..cat-10) always use their canonical English label, slug, and subtitle
  // so stale or shifted Firestore overrides (e.g., cat-8 having "Rooftop Photography & Costumes") never corrupt the UI.
  const result: CategoryConfig[] = DEFAULT_CATEGORY_CONFIGS.map((base) => {
    const o = byKey.get(base.key);
    if (!o) return { ...base };
    const useBaseIcon =
      !o.icon ||
      o.icon.startsWith("/icons/categories/") ||
      o.icon.startsWith("/icons/menu/");
    const resolvedHidden = DEFAULT_HIDDEN_CATEGORY_KEYS.has(base.key)
      ? o.unhiddenByAdmin === true
        ? !!o.hidden
        : true
      : !!o.hidden;
    return {
      ...base,
      ...o,
      key: base.key,
      slug: base.slug,
      label: base.label,
      labelEn: base.label,
      subtitle: base.subtitle,
      description: base.subtitle,
      icon: useBaseIcon ? base.icon : o.icon!,
      hidden: resolvedHidden,
      order: base.order,
      custom: false,
    } as CategoryConfig;
  });

  const defaultKeys = new Set(DEFAULT_CATEGORY_CONFIGS.map((c) => c.key));
  byKey.forEach((o, key) => {
    if (defaultKeys.has(key) || o.deleted || isRemovedCategory(key) || isRemovedCategory(o.label)) return;
    const rawLabel = o.label || "New Category";
    const normalizedLabel = LEGACY_TR_DEFAULT_LABELS[rawLabel] || rawLabel;
    const customSlug = o.slug || key;
    const customSubtitle = o.subtitle || o.description || "";
    result.push({
      key,
      slug: customSlug,
      label: normalizedLabel,
      subtitle: customSubtitle,
      icon: o.icon || "",
      type: o.type || "experience",
      labelEn: o.labelEn || normalizedLabel,
      description: customSubtitle,
      order: typeof o.order === "number" ? o.order : 1000 + result.length,
      hidden: !!o.hidden,
      custom: true,
      updatedAt: o.updatedAt,
    });
  });

  return result.sort((a, b) => a.order - b.order);
}
