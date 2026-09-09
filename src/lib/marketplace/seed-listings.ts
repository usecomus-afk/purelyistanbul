import type { MarketplaceListing } from './types';

/**
 * Vitrin ısınana kadar (henüz onaylı gerçek host ilanı yokken) gösterilen
 * örnek ilanlar. Kapak görselleri gerçek bir işletmeye ait FOTOĞRAF DEĞİLDİR —
 * markanın kendi çizgi-sanat şehir silüetinden türetilmiş, kategoriye göre
 * renklendirilmiş özgün kapak illüstrasyonlarıdır (bkz.
 * public/images/marketplace-seed/*.png). Belirli bir gerçek işletmeyi
 * çağrıştıracak isim/görsel kullanılmaz; içerik ve kategori taksonomisi
 * Airbnb'nin Deneyimler/Hizmetler modelinden (History & Culture, Food &
 * Drink, Nature & Outdoors, Art & Design, Fitness & Wellness, Services)
 * ilham alır. Gerçek onaylı ilan olduğu an MarketplaceHome bunları
 * göstermeyi bırakır. Her kategoride yatay kaydırmanın anlamlı olması için
 * en az iki örnek bulunur.
 */
const now = new Date().toISOString();

function seedImage(key: string) {
  const url = `/images/marketplace-seed/${key}.png`;
  return { url, path: url };
}

function seedListing(
  partial: Omit<MarketplaceListing, 'images' | 'coverImageUrl' | 'status' | 'stats' | 'createdAt' | 'updatedAt' | 'approvedAt' | 'hostId'> & {
    imageKey: string;
  }
): MarketplaceListing {
  const { imageKey, ...rest } = partial;
  return {
    ...rest,
    hostId: 'seed-host',
    images: [seedImage(imageKey)],
    coverImageUrl: seedImage(imageKey).url,
    status: 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: now,
    updatedAt: now,
    approvedAt: now
  };
}

export const SEED_LISTINGS: MarketplaceListing[] = [
  // Boğaz & Yat Turları
  seedListing({
    id: 'seed-1',
    type: 'experience',
    title: "Boğaz'da Gün Batımı Tekne Turu",
    description: 'Küçük bir tekneyle boğazın iki yakasını gün batımında keşfedin; ikramlar ve rehberlik dahildir.',
    category: 'bogaz-yat',
    district: 'Ortaköy, Beşiktaş',
    pricing: { basePrice: 850, currency: 'TRY' },
    capacity: 8,
    amenities: ['İkramlar Dahil', 'Rehber Eşliğinde', 'Fotoğraf Molası'],
    imageKey: 'bogaz-yat'
  }),
  seedListing({
    id: 'seed-2',
    type: 'experience',
    title: 'Özel Yatla Adalar Turu',
    description: 'Kadıköy açıklarından kalkışla, Adalar çevresinde özel bir yat turu ve serbest yüzme molası.',
    category: 'bogaz-yat',
    district: 'Kadıköy',
    pricing: { basePrice: 1450, currency: 'TRY' },
    capacity: 10,
    amenities: ['Yüzme Molası', 'İkramlar Dahil', 'Tam Gün'],
    imageKey: 'bogaz-yat'
  }),

  // Gastronomi & Gurme
  seedListing({
    id: 'seed-3',
    type: 'experience',
    title: "Kadıköy'de Sokak Lezzetleri Turu",
    description: "Kadıköy'ün yerel pazarlarında ve esnaf lokantalarında rehberli bir lezzet yolculuğu.",
    category: 'gastronomi',
    district: 'Kadıköy',
    pricing: { basePrice: 650, currency: 'TRY' },
    capacity: 6,
    amenities: ['Tadım Dahil', 'Yerel Rehber', 'Küçük Grup'],
    imageKey: 'gastronomi'
  }),
  seedListing({
    id: 'seed-4',
    type: 'experience',
    title: 'Türk Kahvesi ve Baklava Atölyesi',
    description: 'Geleneksel Türk kahvesi pişirme ve baklava katlama tekniklerini uygulamalı olarak öğrenin.',
    category: 'gastronomi',
    district: 'Karaköy, Beyoğlu',
    pricing: { basePrice: 480, currency: 'TRY' },
    capacity: 8,
    amenities: ['Malzemeler Dahil', 'Uygulamalı Atölye', '1.5 Saat'],
    imageKey: 'gastronomi'
  }),

  // Kültürel Miras
  seedListing({
    id: 'seed-5',
    type: 'experience',
    title: 'Tarihi Yarımada Kültür Yürüyüşü',
    description: 'Sultanahmet ve çevresindeki tarihi sokaklarda yerel bir rehberle yürüyüş turu.',
    category: 'kulturel-miras',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 500, currency: 'TRY' },
    capacity: 10,
    amenities: ['Yerel Rehber', 'Yürüyüş', '2 Saat'],
    imageKey: 'kulturel-miras'
  }),
  seedListing({
    id: 'seed-6',
    type: 'experience',
    title: 'Balat ve Fener Renkli Sokaklar Turu',
    description: "Balat ve Fener'in renkli tarihi evleri arasında fotoğraflık bir yürüyüş rotası.",
    category: 'kulturel-miras',
    district: 'Balat, Fatih',
    pricing: { basePrice: 450, currency: 'TRY' },
    capacity: 10,
    amenities: ['Yerel Rehber', 'Fotoğraf Molaları', '2 Saat'],
    imageKey: 'kulturel-miras'
  }),

  // Tarih & Müzeler
  seedListing({
    id: 'seed-7',
    type: 'experience',
    title: 'Topkapı ve Ayasofya Rehberli Turu',
    description: "İstanbul'un simge yapılarını uzman bir rehber eşliğinde, kuyruğa girmeden gezin.",
    category: 'tarih-muzeler',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 900, currency: 'TRY' },
    capacity: 12,
    amenities: ['Giriş Ücretleri Dahil', 'Uzman Rehber', 'Kuyruksuz Giriş'],
    imageKey: 'tarih-muzeler'
  }),
  seedListing({
    id: 'seed-8',
    type: 'experience',
    title: 'Yerebatan Sarnıcı ve Çevresi Turu',
    description: 'Yerebatan Sarnıcı ve çevresindeki tarihi yapıları anlatımlı bir turla keşfedin.',
    category: 'tarih-muzeler',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 600, currency: 'TRY' },
    capacity: 12,
    amenities: ['Giriş Ücreti Dahil', 'Anlatımlı Tur', '1.5 Saat'],
    imageKey: 'tarih-muzeler'
  }),

  // Türk Hamamı & Spa
  seedListing({
    id: 'seed-9',
    type: 'experience',
    title: 'Geleneksel Hamam ve Masaj Deneyimi',
    description: 'Tarihi bir hamamda kese, köpük ve masaj içeren geleneksel bir arınma ritüeli.',
    category: 'hamam-spa',
    district: 'Çemberlitaş, Fatih',
    pricing: { basePrice: 1200, currency: 'TRY' },
    capacity: 1,
    amenities: ['Kese & Köpük', 'Masaj', 'Havlu & Terlik'],
    imageKey: 'hamam-spa'
  }),
  seedListing({
    id: 'seed-10',
    type: 'experience',
    title: 'Modern Spa’da Aromaterapi Masajı',
    description: 'Şehrin karmaşasından uzak, modern bir spa merkezinde rahatlatıcı aromaterapi masajı.',
    category: 'hamam-spa',
    district: 'Beşiktaş',
    pricing: { basePrice: 1100, currency: 'TRY' },
    capacity: 1,
    amenities: ['Aromaterapi', 'Sauna Girişi', '1 Saat'],
    imageKey: 'hamam-spa'
  }),

  // Macera & Doğa
  seedListing({
    id: 'seed-11',
    type: 'experience',
    title: 'Kuzey Ormanları Doğa Yürüyüşü',
    description: "İstanbul'un kuzeyindeki orman parkurlarında şehirden uzak, huzurlu bir doğa yürüyüşü.",
    category: 'macera-doga',
    district: 'Belgrad Ormanı, Sarıyer',
    pricing: { basePrice: 700, currency: 'TRY' },
    capacity: 8,
    amenities: ['Rehber Eşliğinde', 'Ekipman Önerileri', 'Yarım Gün'],
    imageKey: 'macera-doga'
  }),
  seedListing({
    id: 'seed-12',
    type: 'experience',
    title: 'Şile Sahilinde Bisiklet Turu',
    description: "Şile'nin sahil şeridi boyunca rehberli bir bisiklet turu; bisiklet ve kask dahildir.",
    category: 'macera-doga',
    district: 'Şile',
    pricing: { basePrice: 600, currency: 'TRY' },
    capacity: 6,
    amenities: ['Bisiklet & Kask Dahil', 'Rehber Eşliğinde', 'Yarım Gün'],
    imageKey: 'macera-doga'
  }),

  // VIP Transfer
  seedListing({
    id: 'seed-13',
    type: 'experience',
    title: 'Havalimanı VIP Transfer Hizmeti',
    description: 'Konforlu bir araçla havalimanı ile konaklama adresiniz arasında özel transfer.',
    category: 'vip-transfer',
    district: 'İstanbul Havalimanı',
    pricing: { basePrice: 1800, currency: 'TRY' },
    capacity: 4,
    amenities: ['Karşılama Tabelası', 'Su İkramı', 'Bagaj Yardımı'],
    imageKey: 'vip-transfer'
  }),
  seedListing({
    id: 'seed-14',
    type: 'experience',
    title: 'Şoförlü Günlük Araç Kiralama',
    description: 'Şehir içi ya da şehir dışı gezileriniz için şoförlü, konforlu bir araç günlüğü.',
    category: 'vip-transfer',
    district: 'Şişli',
    pricing: { basePrice: 2200, currency: 'TRY' },
    capacity: 4,
    amenities: ['Şoförlü', 'Tam Gün', 'Esnek Rota'],
    imageKey: 'vip-transfer'
  }),

  // Alışveriş & Çarşılar
  seedListing({
    id: 'seed-15',
    type: 'experience',
    title: "Kapalıçarşı'da Rehberli Alışveriş Turu",
    description: 'Yerel bir rehberle Kapalıçarşı ve çevresindeki otantik dükkanlarda pazarlık ve alışveriş deneyimi.',
    category: 'alisveris',
    district: 'Kapalıçarşı, Fatih',
    pricing: { basePrice: 550, currency: 'TRY' },
    capacity: 6,
    amenities: ['Yerel Rehber', 'Pazarlık Desteği', '2 Saat'],
    imageKey: 'alisveris'
  }),
  seedListing({
    id: 'seed-16',
    type: 'experience',
    title: "Mahmutpaşa'da Yerel Pazarlık Turu",
    description: "Mahmutpaşa'nın toptancı çarşılarında yerel fiyatlarla alışveriş için rehberli bir tur.",
    category: 'alisveris',
    district: 'Mahmutpaşa, Fatih',
    pricing: { basePrice: 500, currency: 'TRY' },
    capacity: 6,
    amenities: ['Yerel Rehber', 'Pazarlık Desteği', '2 Saat'],
    imageKey: 'alisveris'
  }),

  // Sanat & Semazen
  seedListing({
    id: 'seed-17',
    type: 'experience',
    title: 'Semazen Gösterisi ve Tasavvuf Müziği Akşamı',
    description: 'Tarihi bir mekanda semazen gösterisi ve canlı tasavvuf müziği eşliğinde bir akşam.',
    category: 'sanat-semazen',
    district: 'Sirkeci, Fatih',
    pricing: { basePrice: 800, currency: 'TRY' },
    capacity: 10,
    amenities: ['Canlı Gösteri', 'Oturma Düzeni', '1 İkram'],
    imageKey: 'sanat-semazen'
  }),
  seedListing({
    id: 'seed-18',
    type: 'experience',
    title: 'Modern Sanat Galerileri Turu',
    description: "Karaköy ve çevresindeki çağdaş sanat galerilerini bir küratörle birlikte gezin.",
    category: 'sanat-semazen',
    district: 'Karaköy, Beyoğlu',
    pricing: { basePrice: 400, currency: 'TRY' },
    capacity: 8,
    amenities: ['Küratör Eşliğinde', 'Yürüyüş', '1.5 Saat'],
    imageKey: 'sanat-semazen'
  }),

  // Estetik & Güzellik
  seedListing({
    id: 'seed-19',
    type: 'experience',
    title: 'Nişantaşı’nda Cilt Bakımı ve Spa Günü',
    description: 'Seçkin bir klinikte cilt bakımı, masaj ve rahatlatıcı spa ritüellerinden oluşan bir gün.',
    category: 'estetik',
    district: 'Nişantaşı, Şişli',
    pricing: { basePrice: 2400, currency: 'TRY' },
    capacity: 1,
    amenities: ['Cilt Analizi', 'Masaj', 'Uzman Danışmanlık'],
    imageKey: 'estetik'
  }),
  seedListing({
    id: 'seed-20',
    type: 'experience',
    title: 'Saç & Bakım Günü Paketi',
    description: 'Etiler’de bir güzellik salonunda saç bakımı, şekillendirme ve el-ayak bakımı paketi.',
    category: 'estetik',
    district: 'Etiler, Beşiktaş',
    pricing: { basePrice: 1800, currency: 'TRY' },
    capacity: 1,
    amenities: ['Saç Bakımı', 'El & Ayak Bakımı', 'Danışmanlık'],
    imageKey: 'estetik'
  }),

  // Önerilen Restoranlar
  seedListing({
    id: 'seed-21',
    type: 'experience',
    title: 'Boğaz Manzaralı Akşam Yemeği Rezervasyonu',
    description: 'Boğaz manzaralı seçkin bir restoranda öncelikli masa rezervasyonu ve özel menü deneyimi.',
    category: 'restoranlar',
    district: 'Bebek, Beşiktaş',
    pricing: { basePrice: 1500, currency: 'TRY' },
    capacity: 4,
    amenities: ['Öncelikli Masa', 'Özel Menü', 'Manzaralı Salon'],
    imageKey: 'restoranlar'
  }),
  seedListing({
    id: 'seed-22',
    type: 'experience',
    title: "Kadıköy'de Meyhane Deneyimi Rezervasyonu",
    description: 'Kadıköy’ün canlı sokaklarında geleneksel bir meyhanede meze ve canlı müzik eşliğinde akşam.',
    category: 'restoranlar',
    district: 'Kadıköy',
    pricing: { basePrice: 1300, currency: 'TRY' },
    capacity: 6,
    amenities: ['Öncelikli Masa', 'Canlı Müzik', 'Meze Menüsü'],
    imageKey: 'restoranlar'
  }),

  // Fotoğraf & Kostüm
  seedListing({
    id: 'seed-23',
    type: 'experience',
    title: 'Osmanlı Kostümlü Fotoğraf Çekimi',
    description: 'Tarihi bir stüdyoda Osmanlı dönemi kostümleriyle profesyonel fotoğraf çekim deneyimi.',
    category: 'fotograf-kostum',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 950, currency: 'TRY' },
    capacity: 4,
    amenities: ['Kostüm Dahil', 'Profesyonel Fotoğrafçı', 'Dijital Kopyalar'],
    imageKey: 'fotograf-kostum'
  }),
  seedListing({
    id: 'seed-24',
    type: 'experience',
    title: 'Boğaz Manzaralı Dış Mekan Çekimi',
    description: "Ortaköy sahilinde profesyonel bir fotoğrafçı ile dış mekan çekim deneyimi.",
    category: 'fotograf-kostum',
    district: 'Ortaköy, Beşiktaş',
    pricing: { basePrice: 1100, currency: 'TRY' },
    capacity: 6,
    amenities: ['Profesyonel Fotoğrafçı', 'Dijital Kopyalar', '1 Saat'],
    imageKey: 'fotograf-kostum'
  })
];

export function getSeedListing(id: string): MarketplaceListing | null {
  return SEED_LISTINGS.find((l) => l.id === id) ?? null;
}

export function isSeedListingId(id: string): boolean {
  return id.startsWith('seed-');
}
