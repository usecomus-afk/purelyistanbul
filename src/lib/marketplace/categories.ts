export interface MarketplaceCategory {
  key: string;
  label: string;
  icon: string;
  type: "stay" | "experience";
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

export function getCategoryByKey(key: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}
