/**
 * Marketplace kategori taksonomisi. Deneyim kategorileri, mevcut guest
 * uygulamasındaki deneyim ikonlarıyla (public/icons/categories) hizalıdır —
 * platform genelinde tutarlı bir kategori dili sağlar. Host, ilan
 * oluştururken bu listeden seçer; grid sayfası aynı listeyi buton olarak
 * gösterir ve seçime göre filtreler.
 */
export interface MarketplaceCategory {
  key: string;
  label: string;
  icon: string;
  /** Bu kategori hangi ilan türüyle eşleşir. */
  type: "stay" | "experience";
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { key: "konaklama", label: "Konaklama", icon: "/icons/categories/konaklama.png", type: "stay" },
  { key: "bogaz-yat", label: "Boğaz & Yat Turları", icon: "/icons/categories/bogaz-yatturlari.png", type: "experience" },
  { key: "gastronomi", label: "Gastronomi & Gurme", icon: "/icons/categories/gastronomi-gurme.png", type: "experience" },
  { key: "kulturel-miras", label: "Kültürel Miras", icon: "/icons/categories/kulturel-miras.png", type: "experience" },
  { key: "tarih-muzeler", label: "Tarih & Müzeler", icon: "/icons/categories/tarih-muzeler.png", type: "experience" },
  { key: "hamam-spa", label: "Türk Hamamı & Spa", icon: "/icons/categories/turk-hamami-spa.png", type: "experience" },
  { key: "macera-doga", label: "Macera & Doğa", icon: "/icons/categories/macera-doga.png", type: "experience" },
  { key: "vip-transfer", label: "VIP Transfer", icon: "/icons/categories/ozel-vip-transfer.png", type: "experience" },
  { key: "alisveris", label: "Alışveriş & Çarşılar", icon: "/icons/categories/alisveris-carsilar.png", type: "experience" },
  { key: "sanat-semazen", label: "Sanat & Semazen", icon: "/icons/categories/sanat-semazen.png", type: "experience" },
  { key: "estetik", label: "Estetik & Güzellik", icon: "/icons/categories/aesthetic-beauty.png", type: "experience" },
  { key: "restoranlar", label: "Önerilen Restoranlar", icon: "/icons/categories/onerdigimiz-restoranlar.png", type: "experience" },
  { key: "fotograf-kostum", label: "Fotoğraf & Kostüm", icon: "/icons/categories/fotograf-kostum.png", type: "experience" }
];

export function getCategoryByKey(key: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}
