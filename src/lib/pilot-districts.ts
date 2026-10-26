import type { Experience, Hotel, Language, PilotDistrictKey } from './types';
import { getExperienceCategoryKey } from './marketplace/seed-listings';

export interface PilotDistrictConfig {
  key: PilotDistrictKey;
  label: string;
  labelEn: string;
  neighborhoods: string;
  profileSummary: string;
}

export const PILOT_DISTRICTS: PilotDistrictConfig[] = [
  {
    key: 'fatih',
    label: 'Fatih',
    labelEn: 'Fatih (Old City)',
    neighborhoods: 'Sultanahmet · Sirkeci · Eminönü · Balat',
    profileSummary: 'Tarihi Yarımada, kültür mirası, saray mutfağı, geleneksel hamam ve Boğaz turları profili',
  },
  {
    key: 'besiktas',
    label: 'Beşiktaş',
    labelEn: 'Beşiktaş (Bosphorus)',
    neighborhoods: 'Ortaköy · Bebek · Kuruçeşme · Akaretler',
    profileSummary: 'Boğaz hattı, özel yat kiralama, deniz manzaralı fine-dining ve VIP ulaşım profili',
  },
  {
    key: 'beyoglu',
    label: 'Beyoğlu',
    labelEn: 'Beyoğlu (Galata & Pera)',
    neighborhoods: 'Galata · Karaköy · Pera · Taksim · Cihangir',
    profileSummary: 'Şef restoranları, çağdaş sanat müzeleri, tasarım butikler, meyhane ve gece hayatı profili',
  },
  {
    key: 'sisli',
    label: 'Şişli',
    labelEn: 'Şişli (Nişantaşı)',
    neighborhoods: 'Nişantaşı · Teşvikiye · Bomonti · Mecidiyeköy',
    profileSummary: 'Lüks alışveriş, özel şoförlü VIP transfer, özel yat, gurme gastronomi ve couture bakım profili',
  },
  {
    key: 'kadikoy',
    label: 'Kadıköy',
    labelEn: 'Kadıköy (Asian Side)',
    neighborhoods: 'Moda · Caferağa · Çarşı · Bağdat Caddesi',
    profileSummary: 'Asya yakası yerel gurme rotaları, iki kıta lezzet turları, atölyeler ve seçkin deneyimler profili',
  },
];

export const PILOT_DISTRICT_KEYS: PilotDistrictKey[] = [
  'fatih',
  'besiktas',
  'beyoglu',
  'sisli',
  'kadikoy',
];

/**
 * Mevcut katalog ilanları için 5 pilot bölgenin turist tüketim profiline göre
 * varsayılan "Sizin İçin Seçtiklerimiz" dağılımı.
 * Yönetici /usepurelydashboard üzerinden bir ilanın kutucuklarını değiştirdiğinde
 * doğrudan ilanın kendi `recommendedDistricts` alanı geçerli olur.
 */
export const DEFAULT_SEED_RECOMMENDED_DISTRICTS: Record<string, PilotDistrictKey[]> = {
  // Cat-1: Bosphorus & Boat Cruises
  'exp-1': ['fatih', 'besiktas', 'beyoglu', 'kadikoy'],
  'exp-2': ['fatih'],
  'exp-3': ['fatih', 'besiktas'],
  'exp-4': ['besiktas', 'beyoglu', 'sisli', 'kadikoy'],
  'exp-5': ['besiktas', 'beyoglu', 'sisli', 'kadikoy'],

  // Cat-2: Historic Routes & Fast-Track Walks
  'exp-6': ['fatih', 'besiktas', 'beyoglu', 'sisli', 'kadikoy'],
  'exp-7': ['fatih'],
  'exp-8': ['beyoglu', 'besiktas', 'sisli', 'kadikoy'],
  'exp-9': ['fatih'],
  'exp-45': ['beyoglu'],
  'exp-46': ['fatih'],
  'exp-47': ['beyoglu'],
  'exp-48': ['fatih', 'beyoglu'],

  // Cat-3: Culinary & Street Food Trails + Recommended Restaurants
  'exp-10': ['beyoglu', 'kadikoy', 'fatih'],
  'exp-11': ['beyoglu', 'kadikoy'],
  'exp-12': ['fatih', 'beyoglu'],
  'exp-13': ['sisli', 'besiktas'],
  'exp-18': ['fatih', 'beyoglu', 'kadikoy'],
  'rest-1': ['fatih'],
  'rest-2': ['fatih'],
  'rest-3': ['fatih'],
  'rest-4': ['beyoglu', 'sisli'],
  'rest-5': ['beyoglu', 'besiktas', 'sisli'],
  'rest-6': ['fatih'],
  'rest-7': ['beyoglu', 'besiktas'],
  'rest-8': ['fatih'],
  'rest-9': ['kadikoy'],
  'rest-10': ['fatih'],
  'rest-11': ['besiktas', 'sisli'],
  'rest-12': ['beyoglu'],
  'rest-13': ['besiktas'],
  'rest-14': ['beyoglu', 'sisli'],
  'rest-15': ['fatih'],
  'rest-16': ['beyoglu'],
  'rest-17': ['beyoglu'],
  'rest-18': ['kadikoy'],
  'rest-19': ['kadikoy'],
  'rest-20': ['fatih'],

  // Cat-4: Traditional Turkish Bath & Hammam Rituals
  'exp-14': ['fatih', 'kadikoy'],
  'exp-15': ['beyoglu', 'kadikoy'],
  'exp-hammam-3': ['beyoglu', 'besiktas', 'sisli'],
  'exp-hammam-4': ['fatih', 'besiktas', 'sisli'],

  // Cat-5: Arts & Whirling Dervishes / Museums
  'exp-16': ['fatih'],
  'exp-17': ['fatih', 'kadikoy'],
  'exp-41': ['beyoglu', 'besiktas', 'sisli', 'kadikoy'],
  'exp-42': ['beyoglu', 'sisli'],
  'exp-43': ['beyoglu', 'sisli'],
  'exp-44': ['beyoglu', 'kadikoy'],

  // Cat-6: Rooftop Photography & Costumes
  'exp-26': ['fatih'],
  'exp-27': ['beyoglu', 'sisli', 'kadikoy'],
  'exp-28': ['fatih'],
  'exp-29': ['besiktas', 'sisli', 'kadikoy'],

  // Cat-7: Private VIP Airport Transfers & Chauffeur
  'exp-24': ['fatih', 'beyoglu', 'kadikoy'],
  'exp-25': ['besiktas', 'sisli'],
  'exp-transfer-3': ['fatih', 'besiktas', 'beyoglu', 'sisli', 'kadikoy'],
  'exp-transfer-4': ['besiktas', 'beyoglu', 'sisli', 'kadikoy'],

  // Cat-8: Curated Artisan & Bazaar Shopping
  'exp-33': ['fatih', 'kadikoy'],
  'exp-34': ['beyoglu', 'sisli', 'besiktas'],
  'exp-35': ['fatih', 'kadikoy'],
  'exp-bazaar-4': ['fatih', 'sisli'],

  // Cat-9: In-Stay Breakfast & Gourmet Catering
  'exp-catering-1': ['fatih', 'beyoglu', 'kadikoy'],
  'exp-catering-2': ['besiktas', 'beyoglu', 'sisli', 'kadikoy'],
  'exp-catering-3': ['fatih'],
  'exp-catering-4': ['besiktas', 'sisli'],

  // Cat-10: In-Stay Express Laundry & Garment Care
  'exp-laundry-1': ['fatih', 'kadikoy'],
  'exp-laundry-2': ['besiktas', 'sisli'],
  'exp-laundry-3': ['besiktas', 'beyoglu', 'kadikoy'],
  'exp-laundry-4': ['beyoglu', 'sisli'],
};

function normalizeTrText(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * Metin veya otel bilgisinden 5 pilot bölgeden ("fatih" | "besiktas" | "beyoglu" | "sisli" | "kadikoy")
 * hangisine ait olduğunu tespit eder.
 */
export function matchPilotDistrictFromText(rawText?: string | null): PilotDistrictKey | null {
  if (!rawText) return null;
  const text = normalizeTrText(rawText);

  if (
    text.includes('besiktas') ||
    text.includes('ortakoy') ||
    text.includes('bebek') ||
    text.includes('kurucesme') ||
    text.includes('arnavutkoy') ||
    text.includes('etiler') ||
    text.includes('levent') ||
    text.includes('ciragan') ||
    text.includes('kabatas') ||
    text.includes('akaretler') ||
    text.includes('ulus')
  ) {
    return 'besiktas';
  }

  if (
    text.includes('beyoglu') ||
    text.includes('galata') ||
    text.includes('karakoy') ||
    text.includes('taksim') ||
    text.includes('pera') ||
    text.includes('cihangir') ||
    text.includes('tophane') ||
    text.includes('cukurcuma') ||
    text.includes('asmalimescit') ||
    text.includes('istiklal') ||
    text.includes('dolapdere') ||
    text.includes('tarlabasi')
  ) {
    return 'beyoglu';
  }

  if (
    text.includes('sisli') ||
    text.includes('nisantasi') ||
    text.includes('tesvikiye') ||
    text.includes('bomonti') ||
    text.includes('mecidiyekoy') ||
    text.includes('harbiye') ||
    text.includes('osmanbey') ||
    text.includes('esentepe') ||
    text.includes('fulya')
  ) {
    return 'sisli';
  }

  if (
    text.includes('kadikoy') ||
    text.includes('moda') ||
    text.includes('caferaga') ||
    text.includes('fenerbahce') ||
    text.includes('bagdat') ||
    text.includes('kalamis') ||
    text.includes('bostanci') ||
    text.includes('yeldegirmeni') ||
    text.includes('acibadem') ||
    text.includes('uskudar')
  ) {
    return 'kadikoy';
  }

  if (
    text.includes('fatih') ||
    text.includes('sultanahmet') ||
    text.includes('sirkeci') ||
    text.includes('eminonu') ||
    text.includes('beyazit') ||
    text.includes('laleli') ||
    text.includes('aksaray') ||
    text.includes('balat') ||
    text.includes('fener') ||
    text.includes('cagaloglu') ||
    text.includes('suleymaniye') ||
    text.includes('divanyolu') ||
    text.includes('old city')
  ) {
    return 'fatih';
  }

  return null;
}

/**
 * Konaklanan otelin bölgesini 5 pilot bölgeden birine eşler.
 */
export function resolveHotelPilotDistrict(
  hotel?: Hotel | null,
  explicitOverride?: string | null
): PilotDistrictKey {
  if (explicitOverride) {
    const matchedOverride = matchPilotDistrictFromText(explicitOverride);
    if (matchedOverride) return matchedOverride;
  }

  if (hotel) {
    const byDistrict = matchPilotDistrictFromText(hotel.district);
    if (byDistrict) return byDistrict;

    const byAddress = matchPilotDistrictFromText(hotel.address);
    if (byAddress) return byAddress;

    const byName = matchPilotDistrictFromText(hotel.name);
    if (byName) return byName;
  }

  return 'fatih';
}

/**
 * Bir ilanın hangi pilot bölgelerde "Sizin İçin Seçtiklerimiz" arasında gösterileceğini döndürür.
 * Admin panelinden (`recommendedDistricts`) açıkça kaydedilmiş bir dizi varsa onu kullanır;
 * yoksa seed varsayılanına bakar.
 */
export function getEffectiveRecommendedDistricts(exp: Experience): PilotDistrictKey[] {
  if (Array.isArray(exp.recommendedDistricts)) {
    return exp.recommendedDistricts.filter((d): d is PilotDistrictKey =>
      PILOT_DISTRICT_KEYS.includes(d)
    );
  }
  return DEFAULT_SEED_RECOMMENDED_DISTRICTS[exp.id] ?? [];
}

/**
 * Seçili pilot bölge için öne çıkarılan ilanları, bütün kategorilerden karışık (interleaved)
 * olarak tek bir sayfada gösterilmek üzere sıralar.
 */
export function getCuratedMixedExperiencesForDistrict(
  experiences: Experience[],
  district: PilotDistrictKey
): Experience[] {
  const matching = experiences.filter((exp) => {
    if (exp.status === 'suspended') return false;
    const districts = getEffectiveRecommendedDistricts(exp);
    return districts.includes(district);
  });

  // Kategorilere göre grupla ve her kategoriden sırayla (round-robin) alarak karışık tek liste oluştur
  const byCategory = new Map<string, Experience[]>();
  for (const exp of matching) {
    const catKey = getExperienceCategoryKey(exp) || exp.category || 'other';
    const list = byCategory.get(catKey) || [];
    list.push(exp);
    byCategory.set(catKey, list);
  }

  const categoryQueues = Array.from(byCategory.values());
  const mixed: Experience[] = [];
  let hasMore = true;
  let index = 0;

  while (hasMore) {
    hasMore = false;
    for (const queue of categoryQueues) {
      if (index < queue.length) {
        mixed.push(queue[index]);
        if (index + 1 < queue.length) {
          hasMore = true;
        }
      }
    }
    index++;
  }

  return mixed;
}

export function getPilotDistrictConfig(key: PilotDistrictKey): PilotDistrictConfig {
  return PILOT_DISTRICTS.find((d) => d.key === key) || PILOT_DISTRICTS[0];
}

export const PICKED_FOR_YOU_I18N: Record<
  Language,
  {
    badgeTitle: string;
    badgeSubtitle: (districtLabel: string) => string;
    pageTitle: string;
    pageSubtitle: (districtLabel: string) => string;
    moreInCategoryBtn: string;
    moreInCategorySub: (catLabel: string) => string;
    curatedBadge: string;
  }
> = {
  tr: {
    badgeTitle: 'Sizin İçin Seçtiklerimiz',
    badgeSubtitle: (d) => `${d} bölgesi konuklarına özel seçilmiş tüm kategorilerden öneriler`,
    pageTitle: 'Sizin İçin Seçtiklerimiz',
    pageSubtitle: (d) => `${d} bölgesindeki konaklamanıza özel tüm kategorilerden seçme deneyimler`,
    moreInCategoryBtn: 'Daha fazla…',
    moreInCategorySub: (cat) => `${cat} kategorisindeki tüm ilanları gör`,
    curatedBadge: 'ÖZEL SEÇKİ',
  },
  en: {
    badgeTitle: 'Picked for You',
    badgeSubtitle: (d) => `Curated cross-category highlights tailored for guests staying in ${d}`,
    pageTitle: 'Picked for You',
    pageSubtitle: (d) => `Handpicked experiences across all categories tailored for your stay in ${d}`,
    moreInCategoryBtn: 'More in this category…',
    moreInCategorySub: (cat) => `View all listings in ${cat}`,
    curatedBadge: 'CURATED PICKS',
  },
  ar: {
    badgeTitle: 'مختاراتنا لك',
    badgeSubtitle: (d) => `توصيات مختارة من جميع الفئات لضيوف منطقة ${d}`,
    pageTitle: 'مختاراتنا لك',
    pageSubtitle: (d) => `تجارب مختارة من جميع الفئات مصممة لإقامتك في ${d}`,
    moreInCategoryBtn: 'المزيد...',
    moreInCategorySub: (cat) => `عرض جميع الإعلانات في فئة ${cat}`,
    curatedBadge: 'مختارات خاصة',
  },
  ru: {
    badgeTitle: 'Выбрано для вас',
    badgeSubtitle: (d) => `Избранные рекомендации из всех категорий для гостей района ${d}`,
    pageTitle: 'Выбрано для вас',
    pageSubtitle: (d) => `Лучшие предложения из всех категорий для вашего пребывания в районе ${d}`,
    moreInCategoryBtn: 'Ещё...',
    moreInCategorySub: (cat) => `Смотреть все предложения в категории «${cat}»`,
    curatedBadge: 'ИЗБРАННОЕ',
  },
  de: {
    badgeTitle: 'Für Sie ausgewählt',
    badgeSubtitle: (d) => `Kuratierte Empfehlungen aus allen Kategorien für Gäste in ${d}`,
    pageTitle: 'Für Sie ausgewählt',
    pageSubtitle: (d) => `Handverlesene Erlebnisse aus allen Kategorien für Ihren Aufenthalt in ${d}`,
    moreInCategoryBtn: 'Mehr dazu…',
    moreInCategorySub: (cat) => `Alle Angebote in der Kategorie ${cat} ansehen`,
    curatedBadge: 'EMPFEHLUNG',
  },
  fr: {
    badgeTitle: 'Sélectionné pour vous',
    badgeSubtitle: (d) => `Sélection toutes catégories pour les hôtes séjournant à ${d}`,
    pageTitle: 'Sélectionné pour vous',
    pageSubtitle: (d) => `Expériences triées sur le volet dans toutes les catégories pour votre séjour à ${d}`,
    moreInCategoryBtn: 'Voir plus…',
    moreInCategorySub: (cat) => `Voir toutes les annonces dans ${cat}`,
    curatedBadge: 'SÉLECTION',
  },
};
