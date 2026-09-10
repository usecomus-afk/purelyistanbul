export interface MarketplaceCategory {
  key: string;
  label: string;
  icon: string;
  type: "stay" | "experience";
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { key: "cat-1", label: "Boğaz & Tekne Deneyimleri", icon: "/icons/categories/bogaz-yatturlari.png", type: "experience" },
  { key: "cat-2", label: "Tarihi Rota & Hızlı Geçiş Turları", icon: "/icons/categories/tarih-muzeler.png", type: "experience" },
  { key: "cat-3", label: "Gastronomi & Sokak Lezzetleri", icon: "/icons/categories/gastronomi-gurme.png", type: "experience" },
  { key: "cat-4", label: "Geleneksel & Kültürel Deneyimler", icon: "/icons/categories/kulturel-miras.png", type: "experience" },
  { key: "cat-5", label: "Günübirlik Şehir Dışı Turlar", icon: "/icons/categories/macera-doga.png", type: "experience" },
  { key: "cat-6", label: "Ulaşım, Transfer & Şehir Kartları", icon: "/icons/categories/ozel-vip-transfer.png", type: "experience" },
  { key: "cat-7", label: "Fotoğrafçılık & Sosyal Medya Çekimleri", icon: "/icons/categories/fotograf-kostum.png", type: "experience" },
  { key: "cat-8", label: "Gece Hayatı, Bar Turları & Pub Crawl", icon: "/icons/categories/onerdigimiz-restoranlar.png", type: "experience" },
  { key: "cat-9", label: "Alışveriş, Stilist & Pazarlık Asistanlığı", icon: "/icons/categories/alisveris-carsilar.png", type: "experience" },
  { key: "cat-10", label: "Aile, Çocuk & Tematik Eğlence Parkları", icon: "/icons/categories/macera-doga.png", type: "experience" },
  { key: "cat-11", label: "Modern Sanat, Tasarım & Mimarlık Yürüyüşleri", icon: "/icons/categories/sanat-semazen.png", type: "experience" },
  { key: "cat-12", label: "Mistik, İnanç & Çok Kültürlü Miras Rotaları", icon: "/icons/categories/kulturel-miras.png", type: "experience" },
  { key: "cat-13", label: "Doğa, Macera & Açık Hava Aktiviteleri", icon: "/icons/categories/macera-doga.png", type: "experience" },
  { key: "cat-14", label: "Önerdiğimiz Restoranlar", icon: "/icons/categories/onerdigimiz-restoranlar.png", type: "experience" },
  { key: "cat-15", label: "Medikal Estetik & Güzellik", icon: "/icons/categories/aesthetic-beauty.png", type: "experience" }
];

export function getCategoryByKey(key: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.key === key);
}
