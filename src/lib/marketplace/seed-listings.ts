import type { GroupType, MarketplaceListing } from './types';

/**
 * Purely Istanbul vitrininde yer alan doğrulanmış, gerçek fotoğraflı
 * seçkin İstanbul ilanları. 13 kategorinin tamamı gerçek fotoğraflarla,
 * doğru semt ve fiyatlandırma bilgileriyle donatılmıştır.
 */
const now = new Date().toISOString();

/**
 * Arama filtrelerinde (katılım tipi, çocuk/evcil hayvan uygunluğu, süre)
 * kullanılan varsayılanlar — kategoriye göre belirlenir; her ilanın kendi
 * özel değerlerle bu varsayılanları ezmesine gerek kalmaz.
 */
const CATEGORY_FILTER_DEFAULTS: Record<
  string,
  { suitableFor: GroupType[]; childFriendly: boolean; petFriendly: boolean; durationMinutes: number }
> = {
  'bogaz-yat': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 180 },
  gastronomi: { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 150 },
  'kulturel-miras': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 120 },
  'tarih-muzeler': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 90 },
  'hamam-spa': { suitableFor: ['single', 'couple'], childFriendly: false, petFriendly: false, durationMinutes: 90 },
  'macera-doga': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: true, durationMinutes: 240 },
  'vip-transfer': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: true, durationMinutes: 60 },
  alisveris: { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 150 },
  'sanat-semazen': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 75 },
  estetik: { suitableFor: ['single', 'couple'], childFriendly: false, petFriendly: false, durationMinutes: 90 },
  restoranlar: { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 120 },
  'fotograf-kostum': { suitableFor: ['single', 'couple', 'group'], childFriendly: true, petFriendly: false, durationMinutes: 60 }
};

function createRealListing(data: {
  id: string;
  type: 'stay' | 'experience';
  title: string;
  description: string;
  category: string;
  district: string;
  pricing: { basePrice: number; currency: string; cleaningFee?: number };
  capacity: number;
  amenities: string[];
  coverImageUrl: string;
  galleryUrls?: string[];
}): MarketplaceListing {
  const images = (
    data.galleryUrls && data.galleryUrls.length > 0
      ? data.galleryUrls
      : [data.coverImageUrl]
  ).map((url) => ({ url, path: url }));

  const filterDefaults = CATEGORY_FILTER_DEFAULTS[data.category];

  return {
    id: data.id,
    hostId: 'purely-curated',
    type: data.type,
    title: data.title,
    description: data.description,
    category: data.category,
    district: data.district,
    pricing: data.pricing,
    capacity: data.capacity,
    amenities: data.amenities,
    coverImageUrl: data.coverImageUrl,
    images,
    ...filterDefaults,
    status: 'approved',
    stats: { viewCount: 154, clickCount: 92, favoriteCount: 41, bookingCount: 14 },
    createdAt: now,
    updatedAt: now,
    approvedAt: now
  };
}

export const SEED_LISTINGS: MarketplaceListing[] = [
  // ==========================================
  // 2. BOĞAZ & YAT TURLARI (bogaz-yat)
  // ==========================================
  createRealListing({
    id: 'seed-bogaz-1',
    type: 'experience',
    title: "Bosphorus Dinner Cruise & Canlı Gösteriler",
    description: "Boğaz'ın ışıltılı silüetinde gurme akşam yemeği, semazen, Türk halk dansları ve canlı müzik eşliğinde unutulmaz gece turu.",
    category: 'bogaz-yat',
    district: 'Karaköy / Kabataş',
    pricing: { basePrice: 2450, currency: 'TRY' },
    capacity: 12,
    amenities: ['Akşam Yemeği Dahil', 'Semazen & Dans Gösterisi', 'TÜRSAB Onaylı', 'Rehberlik'],
    coverImageUrl: '/images/experiences/exp-1.jpg',
    galleryUrls: ['/images/experiences/exp-1.jpg', '/images/experiences/exp-2.jpg', '/images/experiences/exp-3.jpg']
  }),
  createRealListing({
    id: 'seed-bogaz-2',
    type: 'experience',
    title: "All-Inclusive Boğaz Akşam Yemeği & Şov",
    description: "Kabataş İskelesi'nden hareketle Boğaz köprülerinin altından geçen lüks gemide sınırsız ikramlar ve kültürel sahne şovları.",
    category: 'bogaz-yat',
    district: 'Kabataş İskelesi',
    pricing: { basePrice: 2450, currency: 'TRY' },
    capacity: 10,
    amenities: ['Açık Büfe / Set Menü', 'Limitsiz İçecek Seçeneği', 'Panoramik Güverte', 'Canlı DJ'],
    coverImageUrl: '/images/experiences/exp-2.jpg',
    galleryUrls: ['/images/experiences/exp-2.jpg', '/images/experiences/exp-1.jpg', '/images/experiences/exp-3.jpg']
  }),
  createRealListing({
    id: 'seed-bogaz-3',
    type: 'experience',
    title: "Bosphorus Turkish Night Dinner Cruise",
    description: "Geleneksel Türk gecesi konseptiyle zenginleştirilmiş, Boğaz'ın tarihi yalıları arasında süzülen akşam yemeği turu.",
    category: 'bogaz-yat',
    district: 'Kabataş / Beşiktaş',
    pricing: { basePrice: 2300, currency: 'TRY' },
    capacity: 12,
    amenities: ['Geleneksel Danslar', 'Akşam Yemeği', 'Ön Sıra Masa Garantisi', 'Transfer Opsiyonu'],
    coverImageUrl: '/images/experiences/exp-3.jpg',
    galleryUrls: ['/images/experiences/exp-3.jpg', '/images/experiences/exp-1.jpg']
  }),
  createRealListing({
    id: 'seed-bogaz-4',
    type: 'experience',
    title: "Lüks Özel Motoryat Kiralama (Kişiye Özel Rota)",
    description: "Aileniz veya dostlarınızla baş başa, kaptan ve servis personeli eşliğinde Boğaz koylarını keşfedeceğiniz lüks özel yat deneyimi.",
    category: 'bogaz-yat',
    district: 'Bebek / Kuruçeşme',
    pricing: { basePrice: 8900, currency: 'TRY' },
    capacity: 8,
    amenities: ['Özel Kaptan & Mürettebat', 'Meyve & İçecek İkramı', 'Ses Sistemi', 'Yüzme Molası'],
    coverImageUrl: '/images/experiences/exp-4.jpg',
    galleryUrls: ['/images/experiences/exp-4.jpg', '/images/experiences/exp-5.jpg']
  }),
  createRealListing({
    id: 'seed-bogaz-5',
    type: 'experience',
    title: "Gün Batımı Boğaz Seyri & Özel Kokteyl",
    description: "Günün en büyüleyici saatinde, altın sarısı Boğaz gün batımını özel yat güvertesinde aperatifler eşliğinde izleyin.",
    category: 'bogaz-yat',
    district: 'Kuruçeşme Marina',
    pricing: { basePrice: 1850, currency: 'TRY' },
    capacity: 6,
    amenities: ['Gün Batımı Rotası', 'Kokteyl & Atıştırmalıklar', 'Fotoğraf Molası', 'Butik Grup'],
    coverImageUrl: '/images/experiences/exp-5.jpg',
    galleryUrls: ['/images/experiences/exp-5.jpg', '/images/experiences/exp-4.jpg']
  }),

  // ==========================================
  // 3. GASTRONOMİ & GURME (gastronomi)
  // ==========================================
  createRealListing({
    id: 'seed-gastro-1',
    type: 'experience',
    title: "İki Kıta Arasında Sokak Lezzetleri Turu",
    description: "Avrupa yakasından vapurla Asya'ya geçiş; Karaköy'den Kadıköy Moda sokaklarına uzanan ödüllü tadım rotası.",
    category: 'gastronomi',
    district: 'Karaköy & Kadıköy',
    pricing: { basePrice: 3200, currency: 'TRY' },
    capacity: 8,
    amenities: ['10 Farklı Tadım Noktası', 'Vapur Geçişi Dahil', 'Yerel Gurme Rehber', 'Tarihi Mekânlar'],
    coverImageUrl: '/images/experiences/exp-10.jpg',
    galleryUrls: ['/images/experiences/exp-10.jpg', '/images/experiences/exp-11.jpg', '/images/experiences/exp-13.jpg']
  }),
  createRealListing({
    id: 'seed-gastro-2',
    type: 'experience',
    title: "Gece Sokak Lezzetleri & Esnaf Lokantaları",
    description: "Beyoğlu'nun arka sokaklarındaki gizli esnaf lokantalarında kokoreçten midyeye, içli köfteden sokak tatlılarına gece gastronomi turu.",
    category: 'gastronomi',
    district: 'Beyoğlu / Taksim',
    pricing: { basePrice: 2100, currency: 'TRY' },
    capacity: 6,
    amenities: ['Gece Yürüyüşü', 'Tüm Tadımlar Dahil', 'Uzman Rehberlik', 'Otantik Tarifler'],
    coverImageUrl: '/images/experiences/exp-11.jpg',
    galleryUrls: ['/images/experiences/exp-11.jpg', '/images/experiences/exp-10.jpg']
  }),
  createRealListing({
    id: 'seed-gastro-3',
    type: 'experience',
    title: "Geleneksel Türk Mutfağı & Meze Atölyesi",
    description: "Tarihi yarımadada usta şeflerle birlikte zeytinyağlı mezeler, yaprak sarma ve geleneksel Osmanlı tatlılarını pişirin.",
    category: 'gastronomi',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 2700, currency: 'TRY' },
    capacity: 6,
    amenities: ['Uygulamalı Yemek Pişirme', 'Akşam Yemeği Ziyafeti', 'Tarif Kitapçığı', 'Önlük Hediyesi'],
    coverImageUrl: '/images/experiences/exp-12.jpg',
    galleryUrls: ['/images/experiences/exp-12.jpg', '/images/experiences/exp-13.jpg']
  }),
  createRealListing({
    id: 'seed-gastro-4',
    type: 'experience',
    title: "Tarihi Mısır Çarşısı Baharat & Lokum Tadımı",
    description: "Yüzyıllık baharatçılarda safran, Türk kahvesi, geleneksel lokum çeşitleri ve peynir çeşitlerini uzman eşliğinde tadın.",
    category: 'gastronomi',
    district: 'Eminönü, Fatih',
    pricing: { basePrice: 1950, currency: 'TRY' },
    capacity: 8,
    amenities: ['Baharat Eğitimi', 'Kahve & Lokum İkramı', 'Alışveriş İndirimleri', 'Tarihi Bilgiler'],
    coverImageUrl: '/images/experiences/exp-13.jpg',
    galleryUrls: ['/images/experiences/exp-13.jpg', '/images/experiences/exp-10.jpg']
  }),

  // ==========================================
  // 4. KÜLTÜREL MİRAS (kulturel-miras)
  // ==========================================
  createRealListing({
    id: 'seed-miras-1',
    type: 'experience',
    title: "Fener, Balat & Musevi Kültürel Miras Yürüyüşü",
    description: "Haliç kıyısındaki tarihi Fener Rum Patrikhanesi, rengarenk Balat evleri, sinagoglar ve çok kültürlü İstanbul mirası.",
    category: 'kulturel-miras',
    district: 'Fatih / Balat',
    pricing: { basePrice: 1650, currency: 'TRY' },
    capacity: 10,
    amenities: ['Uzman Sanat Tarihçisi', 'Kilise ve Sinagog Ziyaretleri', 'Kahve Molası', 'Küçük Grup'],
    coverImageUrl: '/images/experiences/exp-45.jpg',
    galleryUrls: ['/images/experiences/exp-45.jpg', '/images/experiences/exp-46.jpg']
  }),
  createRealListing({
    id: 'seed-miras-2',
    type: 'experience',
    title: "Süleymaniye Külliyesi & Mimar Sinan Rotaları",
    description: "Mimar Sinan'ın başyapıtı Süleymaniye Külliyesi'nin bilinmeyen detayları, medreseler, tarihi kütüphaneler ve Haliç manzarası.",
    category: 'kulturel-miras',
    district: 'Vefa / Süleymaniye',
    pricing: { basePrice: 1450, currency: 'TRY' },
    capacity: 12,
    amenities: ['Mimari Analizler', 'Tarihi Vefa Bozacısı Ziyareti', 'Rehber Kulaklık Sistemi', 'Girişler Dahil'],
    coverImageUrl: '/images/experiences/exp-46.jpg',
    galleryUrls: ['/images/experiences/exp-46.jpg', '/images/experiences/exp-47.jpg']
  }),
  createRealListing({
    id: 'seed-miras-3',
    type: 'experience',
    title: "Bizans Yeraltı Sarnıçları & Kariye Kültür Rotası",
    description: "İstanbul'un yer altı su yolları, gizli sarnıçları ve Bizans mozaik sanatının zirvesi Kariye çevresinde tarihi rota.",
    category: 'kulturel-miras',
    district: 'Edirnekapı / Fatih',
    pricing: { basePrice: 1750, currency: 'TRY' },
    capacity: 8,
    amenities: ['Sarnıç Girişleri Dahil', 'Arkeolojik Anlatım', 'Sur Boyu Yürüyüşü'],
    coverImageUrl: '/images/experiences/exp-47.jpg',
    galleryUrls: ['/images/experiences/exp-47.jpg', '/images/experiences/exp-45.jpg']
  }),
  createRealListing({
    id: 'seed-miras-4',
    type: 'experience',
    title: "Sufi Müziği & Mevlevi Kültürü Miras Buluşması",
    description: "Tasavvuf felsefesi, ney dinletisi ve yüzyıllardır süregelen Mevlevi sema ritüelinin manevi derinliğini anlatan özel etkinlik.",
    category: 'kulturel-miras',
    district: 'Sirkeci, Fatih',
    pricing: { basePrice: 1850, currency: 'TRY' },
    capacity: 10,
    amenities: ['Canlı Gösteri', 'Tarihi Mekân', 'Çay & Lokum İkramı', 'İngilizce / Türkçe Anlatım'],
    coverImageUrl: '/images/experiences/exp-14.jpg',
    galleryUrls: ['/images/experiences/exp-14.jpg', '/images/experiences/exp-46.jpg']
  }),

  // ==========================================
  // 5. TARİH & MÜZELER (tarih-muzeler)
  // ==========================================
  createRealListing({
    id: 'seed-tarih-1',
    type: 'experience',
    title: "Yerebatan Sarnıcı, Topkapı & Ayasofya Hızlı Geçiş",
    description: "Sıra beklemeden lisanslı rehber eşliğinde Tarihi Yarımada'nın 3 büyük şaheserini keşfedin; saray haremi ve medusa başı anlatımı dahil.",
    category: 'tarih-muzeler',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 3400, currency: 'TRY' },
    capacity: 12,
    amenities: ['Hızlı Sırasız Giriş', 'Lisanslı TÜRSAB Rehberi', 'Kulaklık Sistemi', 'Tüm Biletler Dahil'],
    coverImageUrl: '/images/experiences/exp-6.jpg',
    galleryUrls: ['/images/experiences/exp-6.jpg', '/images/experiences/exp-7.jpg', '/images/experiences/exp-8.jpg']
  }),
  createRealListing({
    id: 'seed-tarih-2',
    type: 'experience',
    title: "Tarihi Yarımada Küçük Grup Rehberli Yürüyüşü",
    description: "Hipodrom, Dikilitaş, Sultanahmet Camii ve Arasta Pazarı'nı en fazla 8 kişilik butik grupla detaylı inceleyin.",
    category: 'tarih-muzeler',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 1900, currency: 'TRY' },
    capacity: 8,
    amenities: ['Butik Grup (Maks 8 Kişi)', 'Tarihçi Rehber', 'Soru & Cevap Sohbeti', 'Şehir Haritası'],
    coverImageUrl: '/images/experiences/exp-7.jpg',
    galleryUrls: ['/images/experiences/exp-7.jpg', '/images/experiences/exp-6.jpg']
  }),
  createRealListing({
    id: 'seed-tarih-3',
    type: 'experience',
    title: "Eski İstanbul'un Gizli Cevherleri & Arka Sokaklar",
    description: "Klasik turist rotalarından uzak, bin yıllık taş hanlar, yeraltı şapelleri ve tarihi çeşmelerle dolu gizli avlular.",
    category: 'tarih-muzeler',
    district: 'Çemberlitaş / Beyazıt',
    pricing: { basePrice: 1650, currency: 'TRY' },
    capacity: 8,
    amenities: ['Tarihi Han Çatıları', 'Görülmeyen Avlular', 'Yerel İçecek Molası', 'Fotoğraf Rehberliği'],
    coverImageUrl: '/images/experiences/exp-8.jpg',
    galleryUrls: ['/images/experiences/exp-8.jpg', '/images/experiences/exp-9.jpg']
  }),
  createRealListing({
    id: 'seed-tarih-4',
    type: 'experience',
    title: "Tarihi Yarımada Tam Gün Uzman Rehberli Tur",
    description: "Sabah Topkapı Sarayı'ndan öğleden sonra Kapalıçarşı'ya uzanan, öğle yemeği molalı kapsamlı tarih maratonu.",
    category: 'tarih-muzeler',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 2800, currency: 'TRY' },
    capacity: 10,
    amenities: ['Tam Gün Rehberlik', 'Müze Biletleri', 'Geleneksel Öğle Yemeği', 'Klimalı Araç Desteği'],
    coverImageUrl: '/images/experiences/exp-9.jpg',
    galleryUrls: ['/images/experiences/exp-9.jpg', '/images/experiences/exp-6.jpg']
  }),

  // ==========================================
  // 6. TÜRK HAMAMI & SPA (hamam-spa)
  // ==========================================
  createRealListing({
    id: 'seed-hamam-1',
    type: 'experience',
    title: "Tarihi Cağaloğlu Hamamı Geleneksel Kese & Köpük",
    description: "1741 yılında inşa edilen Barok Osmanlı hamamının sıcak mermer göbek taşında geleneksel kese, köpük banyosu ve rahatlatıcı masaj ritüeli.",
    category: 'hamam-spa',
    district: 'Cağaloğlu, Fatih',
    pricing: { basePrice: 3800, currency: 'TRY' },
    capacity: 2,
    amenities: ['Otantik İpek Kese', 'Köpük Masajı', 'Geleneksel Şerbet & Lokum', 'Tarihi Ambiyans'],
    coverImageUrl: '/images/experiences/exp-16.jpg',
    galleryUrls: ['/images/experiences/exp-16.jpg', '/images/experiences/exp-17.jpg', '/images/experiences/exp-18.jpg']
  }),
  createRealListing({
    id: 'seed-hamam-2',
    type: 'experience',
    title: "Kılıç Ali Paşa Hamamı Arınma & Aromaterapi Masajı",
    description: "Mimar Sinan imzalı 16. yüzyıl başyapıtında, modern spa zarafetiyle harmanlanmış birinci sınıf hamam ve aromaterapi masaj seansı.",
    category: 'hamam-spa',
    district: 'Tophane, Karaköy',
    pricing: { basePrice: 4200, currency: 'TRY' },
    capacity: 2,
    amenities: ['Özel Natır / Tellak', 'Aromaterapi Masajı', 'Doğal Zeytinyağı Sabunları', 'Dinlenme Salonu'],
    coverImageUrl: '/images/experiences/exp-17.jpg',
    galleryUrls: ['/images/experiences/exp-17.jpg', '/images/experiences/exp-16.jpg']
  }),
  createRealListing({
    id: 'seed-hamam-3',
    type: 'experience',
    title: "Ayasofya Hürrem Sultan Hamamı Lüks Paşa Paketi",
    description: "Ayasofya ile Sultanahmet Camii arasında, Kanuni Sultan Süleyman'ın eşi Hürrem Sultan için yaptırdığı tarihi mekânda altın kaplama taslar eşliğinde VIP hizmet.",
    category: 'hamam-spa',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 5500, currency: 'TRY' },
    capacity: 2,
    amenities: ['Altın Kaplama Tas & İpek Peştamal', 'Kil Yüz Maskesi', 'Baş & Boyun Masajı', 'Özel Dinlenme Odası'],
    coverImageUrl: '/images/experiences/exp-18.jpg',
    galleryUrls: ['/images/experiences/exp-18.jpg', '/images/experiences/exp-15.jpg']
  }),
  createRealListing({
    id: 'seed-hamam-4',
    type: 'experience',
    title: "Tarihi Çemberlitaş Hamamı Otantik Kese & Masaj",
    description: "Çemberlitaş Sütunu yanında 1584'ten beri tüten tarihi kubbe altında arındırıcı ve canlandırıcı klasik hamam deneyimi.",
    category: 'hamam-spa',
    district: 'Çemberlitaş, Fatih',
    pricing: { basePrice: 2900, currency: 'TRY' },
    capacity: 4,
    amenities: ['Kese & Köpük', 'Mermer Göbek Taşı', 'Geleneksel Havlu Takımı', 'Türk Çayı İkramı'],
    coverImageUrl: '/images/experiences/exp-15.jpg',
    galleryUrls: ['/images/experiences/exp-15.jpg', '/images/experiences/exp-16.jpg']
  }),

  // ==========================================
  // 7. MACERA & DOĞA (macera-doga)
  // ==========================================
  createRealListing({
    id: 'seed-doga-1',
    type: 'experience',
    title: "Belgrad Ormanı Doğa Yürüyüşü & Dağ Bisikleti Turu",
    description: "İstanbul'un oksijen deposu Belgrad Ormanı parkurlarında uzman rehberle tarihi bentler çevresinde bisiklet ve doğa yürüyüşü.",
    category: 'macera-doga',
    district: 'Bahçeköy, Sarıyer',
    pricing: { basePrice: 1800, currency: 'TRY' },
    capacity: 8,
    amenities: ['Profesyonel Dağ Bisikleti & Kask', 'Rehberlik', 'Orman İçi Piknik İkramı', 'Otelden Transfer'],
    coverImageUrl: '/images/experiences/exp-48.jpg',
    galleryUrls: ['/images/experiences/exp-48.jpg', '/images/experiences/exp-49.jpg']
  }),
  createRealListing({
    id: 'seed-doga-2',
    type: 'experience',
    title: "Şile & Ağva Karadeniz Kıyısı Sakin Doğa Kaçamağı",
    description: "Göksu Nehri'nde kano keyfi, Karadeniz feneri ve yeşillikler içindeki Ağva nehir kıyısı restoranlarında huzurlu bir gün.",
    category: 'macera-doga',
    district: 'Şile / Ağva',
    pricing: { basePrice: 2600, currency: 'TRY' },
    capacity: 6,
    amenities: ['Nehirde Kano Gezisi', 'Öğle Yemeği Dahil', 'Şile Feneri Gezisi', 'Konforlu Ulaşım'],
    coverImageUrl: '/images/experiences/exp-49.jpg',
    galleryUrls: ['/images/experiences/exp-49.jpg', '/images/experiences/exp-50.jpg']
  }),
  createRealListing({
    id: 'seed-doga-3',
    type: 'experience',
    title: "Büyükada Bisikletle Tarihi Köşkler & Doğa Keşfi",
    description: "Prens Adaları'nın en büyüğü Büyükada'da çam ormanları, Aya Yorgi Tepesi ve Viktorya dönemi ahşap köşkler arasında pedal çevirin.",
    category: 'macera-doga',
    district: 'Büyükada, Adalar',
    pricing: { basePrice: 1950, currency: 'TRY' },
    capacity: 8,
    amenities: ['Vapur Bileti Dahil', 'Bisiklet Kiralama', 'Aya Yorgi Rehberliği', 'Ada Dondurması İkramı'],
    coverImageUrl: '/images/experiences/exp-50.jpg',
    galleryUrls: ['/images/experiences/exp-50.jpg', '/images/experiences/exp-48.jpg']
  }),
  createRealListing({
    id: 'seed-doga-4',
    type: 'experience',
    title: "Boğaz Kıyısında Sabah Koşusu & Açık Hava Yoga",
    description: "Bebek Parkı ve Rumeli Hisarı sahil hattında serin sabah esintisinde uzman eğitmen eşliğinde yoga ve dinamik esneme seansı.",
    category: 'macera-doga',
    district: 'Bebek Parkı, Beşiktaş',
    pricing: { basePrice: 1250, currency: 'TRY' },
    capacity: 8,
    amenities: ['Yoga Matı Temini', 'Sertifikalı Eğitmen', 'Detoks İçeceği', 'Boğaz Manzarası'],
    coverImageUrl: '/images/experiences/exp-51.jpg',
    galleryUrls: ['/images/experiences/exp-51.jpg', '/images/experiences/exp-50.jpg']
  }),

  // ==========================================
  // 8. VIP TRANSFER (vip-transfer)
  // ==========================================
  createRealListing({
    id: 'seed-vip-1',
    type: 'experience',
    title: "İstanbul Havalimanı (IST) VIP Mercedes Maybach Transfer",
    description: "Havalimanı kapısında özel karşılama, bagaj asistanlığı ve lüks Mercedes Maybach araçla otelinize ultra konforlu transfer.",
    category: 'vip-transfer',
    district: 'İstanbul Havalimanı (IST)',
    pricing: { basePrice: 4500, currency: 'TRY' },
    capacity: 3,
    amenities: ['İsimle Kapıda Karşılama', 'Wi-Fi & Şarj Üniteleri', 'Soğuk İçecek & İkram Barı', 'Uçuş Takip Sistemi'],
    coverImageUrl: '/images/experiences/exp-22.jpg',
    galleryUrls: ['/images/experiences/exp-22.jpg', '/images/experiences/exp-23.jpg']
  }),
  createRealListing({
    id: 'seed-vip-2',
    type: 'experience',
    title: "Sabiha Gökçen (SAW) Ultra Lüks Vito VIP Transfer",
    description: "Anadolu yakasından veya Avrupa'ya geniş deri koltuklu, multimedya sistemli ve ikramlı VIP Mercedes Vito ile kesintisiz seyahat.",
    category: 'vip-transfer',
    district: 'Sabiha Gökçen Havalimanı (SAW)',
    pricing: { basePrice: 3200, currency: 'TRY' },
    capacity: 6,
    amenities: ['Geniş Bagaj Kapasitesi', 'Apple TV / Netflix', 'Buzdolabı & Atıştırmalıklar', 'Köprü / Tünel Geçişleri Dahil'],
    coverImageUrl: '/images/experiences/exp-23.jpg',
    galleryUrls: ['/images/experiences/exp-23.jpg', '/images/experiences/exp-22.jpg']
  }),
  createRealListing({
    id: 'seed-vip-3',
    type: 'experience',
    title: "Şehir İçi 8 Saat Şoförlü VIP Araç Tahsis Hizmeti",
    description: "Toplantılarınız, alışveriş turlarınız veya özel etkinlikleriniz için gün boyu emrinizde özel şoförlü VIP araç tahsisi.",
    category: 'vip-transfer',
    district: 'Tüm İstanbul',
    pricing: { basePrice: 7500, currency: 'TRY' },
    capacity: 6,
    amenities: ['8 Saat Sınırsız Rota', 'Özel Takım Elbiseli Şoför', 'Yakıt & Otoparklar Dahil', '7/24 Çağrı Desteği'],
    coverImageUrl: '/images/experiences/exp-22.jpg',
    galleryUrls: ['/images/experiences/exp-22.jpg', '/images/experiences/exp-23.jpg']
  }),

  // ==========================================
  // 9. ALIŞVERİŞ & ÇARŞILAR (alisveris)
  // ==========================================
  createRealListing({
    id: 'seed-alisveris-1',
    type: 'experience',
    title: "Kapalıçarşı Kişiye Özel Halı & Mücevher Rehberliği",
    description: "4.000 dükkanlık tarihi çarşıda sertifikalı antik halılar, el yapımı pırlantalar ve usta zanaatkâr atölyelerine güvenli alışveriş turu.",
    category: 'alisveris',
    district: 'Beyazıt / Kapalıçarşı',
    pricing: { basePrice: 1900, currency: 'TRY' },
    capacity: 4,
    amenities: ['Pazarlık Asistanlığı', 'Sertifika & Orijinallik Denetimi', 'Gizli Han Ziyaretleri', 'Özel İkramlar'],
    coverImageUrl: '/images/experiences/exp-32.jpg',
    galleryUrls: ['/images/experiences/exp-32.jpg', '/images/experiences/exp-33.jpg', '/images/experiences/exp-34.jpg']
  }),
  createRealListing({
    id: 'seed-alisveris-2',
    type: 'experience',
    title: "Nişantaşı Lüks Butikler & Kişisel Stilist Alışverişi",
    description: "Abdi İpekçi Caddesi ve Teşvikiye'nin ünlü Türk moda tasarımcılarının showroomlarında kişisel stil danışmanıyla alışveriş.",
    category: 'alisveris',
    district: 'Nişantaşı, Şişli',
    pricing: { basePrice: 3800, currency: 'TRY' },
    capacity: 2,
    amenities: ['Kişisel Stil Analizi', 'Önceden Rezerve Showroomlar', 'Kahve & Şampanya İkramı', 'Paket Taşıma Asistanlığı'],
    coverImageUrl: '/images/experiences/exp-33.jpg',
    galleryUrls: ['/images/experiences/exp-33.jpg', '/images/experiences/exp-32.jpg']
  }),
  createRealListing({
    id: 'seed-alisveris-3',
    type: 'experience',
    title: "Tarihi Mısır Çarşısı Baharat & Gurme Lokum Turu",
    description: "Yüzyıllık aktarlar ve tatlıcılarda en taze Türk lokumları, kuruyemişler, organik çaylar ve safran alışverişi.",
    category: 'alisveris',
    district: 'Eminönü, Fatih',
    pricing: { basePrice: 1450, currency: 'TRY' },
    capacity: 6,
    amenities: ['Tadım İkramları', 'Vakumlu Paketleme Desteği', 'Özel Mağaza İndirimleri', 'Yerel Rehber'],
    coverImageUrl: '/images/experiences/exp-34.jpg',
    galleryUrls: ['/images/experiences/exp-34.jpg', '/images/experiences/exp-32.jpg']
  }),

  // ==========================================
  // 10. SANAT & SEMAZEN (sanat-semazen)
  // ==========================================
  createRealListing({
    id: 'seed-sanat-1',
    type: 'experience',
    title: "Hodjapasha Kültür Merkezi Otantik Semazen Gösterisi",
    description: "550 yıllık tarihi Osmanlı hamamının kubbesi altında ney ve tambur eşliğinde Mevlevi dervişlerinin sema ayini.",
    category: 'sanat-semazen',
    district: 'Sirkeci, Fatih',
    pricing: { basePrice: 1750, currency: 'TRY' },
    capacity: 10,
    amenities: ['Numaralı Oturma Düzeni', 'Canlı Klasik Türk Müziği', 'Program Kitapçığı', 'İçecek İkramı'],
    coverImageUrl: '/images/experiences/exp-14.jpg',
    galleryUrls: ['/images/experiences/exp-14.jpg', '/images/experiences/exp-40.jpg']
  }),
  createRealListing({
    id: 'seed-sanat-2',
    type: 'experience',
    title: "Karaköy & Beyoğlu Çağdaş Sanat Galerileri Yürüyüşü",
    description: "Meclis-i Mebusan Caddesi'nden Galata ve Sıraselviler'e uzanan modern sanat galerileri, küratör buluşmaları ve atölye ziyaretleri.",
    category: 'sanat-semazen',
    district: 'Karaköy / Galata',
    pricing: { basePrice: 1450, currency: 'TRY' },
    capacity: 8,
    amenities: ['Küratör Rehberliği', 'Özel Sergi Girişleri', 'Galeri Sahipleriyle Sohbet', 'Kahve Molası'],
    coverImageUrl: '/images/experiences/exp-40.jpg',
    galleryUrls: ['/images/experiences/exp-40.jpg', '/images/experiences/exp-41.jpg']
  }),
  createRealListing({
    id: 'seed-sanat-3',
    type: 'experience',
    title: "İstanbul Modern & Haliç Tersane Kültür Rotası",
    description: "Renzo Piano tasarımı İstanbul Modern binası ve Tarihi Haliç Tersaneleri çağdaş sanat alanı Tersane İstanbul keşfi.",
    category: 'sanat-semazen',
    district: 'Karaköy / Tersane',
    pricing: { basePrice: 1650, currency: 'TRY' },
    capacity: 10,
    amenities: ['Müze Giriş Bileti Dahil', 'Mimari Tur', 'Haliç Tekne Geçişi', 'Rehberlik'],
    coverImageUrl: '/images/experiences/exp-41.jpg',
    galleryUrls: ['/images/experiences/exp-41.jpg', '/images/experiences/exp-42.jpg']
  }),
  createRealListing({
    id: 'seed-sanat-4',
    type: 'experience',
    title: "Tarihi Pera & Art Nouveau Mimarlık Keşif Turu",
    description: "İstiklal Caddesi'nin 19. yüzyıl Art Nouveau pasajları, Botter Apartmanı, Mısır Apartmanı ve Pera Palace koridorları.",
    category: 'sanat-semazen',
    district: 'İstiklal / Pera',
    pricing: { basePrice: 1550, currency: 'TRY' },
    capacity: 8,
    amenities: ['Tarihi Pasaj Girişleri', 'Pera Palace Çay Saati', 'Mimari Anlatım Kitapçığı'],
    coverImageUrl: '/images/experiences/exp-42.jpg',
    galleryUrls: ['/images/experiences/exp-42.jpg', '/images/experiences/exp-40.jpg']
  }),

  // ==========================================
  // 11. ESTETİK & GÜZELLİK (estetik)
  // ==========================================
  createRealListing({
    id: 'seed-estetik-1',
    type: 'experience',
    title: "Nişantaşı Medikal Cilt Yenileme & Hydrafacial Protokolü",
    description: "Nişantaşı'nın seçkin kliniğinde uzman dermatolog gözetiminde derinlemesine cilt temizliği, hydrafacial ve kolajen yüklemesi.",
    category: 'estetik',
    district: 'Nişantaşı, Şişli',
    pricing: { basePrice: 4500, currency: 'TRY' },
    capacity: 1,
    amenities: ['Dermatolojik Cilt Analizi', 'Orijinal Hydrafacial Cihazı', 'LED Işık Terapisi', 'Ev Devam Kiti'],
    coverImageUrl: '/images/experiences/exp-aesthetic-1.jpg',
    galleryUrls: ['/images/experiences/exp-aesthetic-1.jpg', '/images/experiences/exp-aesthetic-2.jpg']
  }),
  createRealListing({
    id: 'seed-estetik-2',
    type: 'experience',
    title: "VIP Safir FUE Saç Ekimi & Ozonlu PRP Danışmanlığı",
    description: "Uluslararası JCI akreditasyonlu hastanede mikromotor safir bıçak teknolojisiyle acısız saç ekimi ve kişiye özel saç analizi.",
    category: 'estetik',
    district: 'Şişli, İstanbul',
    pricing: { basePrice: 28000, currency: 'TRY' },
    capacity: 1,
    amenities: ['Doktor Konsültasyonu', 'Safir FUE Yöntemi', 'Maksimum Greft Garantisi', '1 Yıllık Takip Protokolü'],
    coverImageUrl: '/images/experiences/exp-aesthetic-2.jpg',
    galleryUrls: ['/images/experiences/exp-aesthetic-2.jpg', '/images/experiences/exp-aesthetic-3.jpg']
  }),
  createRealListing({
    id: 'seed-estetik-3',
    type: 'experience',
    title: "Hollywood Smile & Estetik Diş Kliniği VIP Analizi",
    description: "3D dijital gülüş tasarımı, porselen lamine ve zirkonyum diş estetiği için ödüllü uzman kadroyla birebir planlama seansı.",
    category: 'estetik',
    district: 'Levent, Beşiktaş',
    pricing: { basePrice: 8500, currency: 'TRY' },
    capacity: 1,
    amenities: ['3D Ağız İçi Tarama', 'Dijital Simülasyon', 'Panoramik Röntgen Dahil', 'Birebir Hekim Görüşmesi'],
    coverImageUrl: '/images/experiences/exp-aesthetic-3.jpg',
    galleryUrls: ['/images/experiences/exp-aesthetic-3.jpg', '/images/experiences/exp-aesthetic-5.jpg']
  }),
  createRealListing({
    id: 'seed-estetik-4',
    type: 'experience',
    title: "Lüks Medikal Spa & Yaşlanma Karşıtı Mezoterapi",
    description: "Cildin ışıltısını geri kazandıran somon DNA, hyaluronik asit vitamin kokteyli mezoterapisi ve boyun/dekolte bakımı.",
    category: 'estetik',
    district: 'Nişantaşı, Şişli',
    pricing: { basePrice: 6200, currency: 'TRY' },
    capacity: 1,
    amenities: ['Fransız Dolgu & Mezoterapi', 'Lokal Anestezik Krem', 'Steril VIP Oda', 'Hekim Uygulaması'],
    coverImageUrl: '/images/experiences/exp-aesthetic-5.jpg',
    galleryUrls: ['/images/experiences/exp-aesthetic-5.jpg', '/images/experiences/exp-aesthetic-1.jpg']
  }),

  // ==========================================
  // 12. ÖNERİLEN RESTORANLAR (restoranlar)
  // ==========================================
  createRealListing({
    id: 'seed-resto-1',
    type: 'experience',
    title: "Mikla Restaurant - Çağdaş Türk Mutfağı & Teras Manzarası",
    description: "Michelin yıldızlı şef Mehmet Gürs'ün Anadolu'nun köklü malzemelerini modern gastronomi teknikleriyle sunduğu efsanevi teras restoranı.",
    category: 'restoranlar',
    district: 'Pera, Beyoğlu',
    pricing: { basePrice: 3800, currency: 'TRY' },
    capacity: 4,
    amenities: ['Öncelikli Masa Rezervasyonu', 'Michelin Yıldızlı Menü', 'Boğaz & Haliç Panoraması', 'Sommelier Eşleşmesi'],
    coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    ]
  }),
  createRealListing({
    id: 'seed-resto-2',
    type: 'experience',
    title: "Sunset Grill & Bar - Ulus Parkı Boğaz Panoraması",
    description: "Ulus Tepesi'nden Boğaz Köprüsü'nü kucaklayan manzarada Akdeniz mutfağı, taze sushi ve uluslararası şarap kavı.",
    category: 'restoranlar',
    district: 'Ulus, Beşiktaş',
    pricing: { basePrice: 4200, currency: 'TRY' },
    capacity: 4,
    amenities: ['En İyi Manzara Masası', 'Sushi & Izgara Menü', 'Açık / Kapalı Teras', 'Vale Hizmeti'],
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80'
    ]
  }),
  createRealListing({
    id: 'seed-resto-3',
    type: 'experience',
    title: "Pandeli Restaurant - Tarihi Mısır Çarşısı Kubbesi",
    description: "1901'den bu yana Audrey Hepburn'den Kraliçe Elizabeth'e ağırlayan turkuaz çinili kubbede klasik saray lezzetleri ve hünkarbeğendi.",
    category: 'restoranlar',
    district: 'Eminönü, Fatih',
    pricing: { basePrice: 2100, currency: 'TRY' },
    capacity: 4,
    amenities: ['Tarihi Çini Dekorasyon', 'Geleneksel Hünkarbeğendi', 'Öğle & Akşam Masası', 'Saray Mutfağı'],
    coverImageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
    ]
  }),
  createRealListing({
    id: 'seed-resto-4',
    type: 'experience',
    title: "Nicole Restaurant - Michelin Yıldızlı Gurme Tadım Menüsü",
    description: "Tomtom Kaptan Konağı terasında Türk mutfağının rafine dokunuşlarla yeniden yorumlandığı 7 aşamalı degustasyon menüsü.",
    category: 'restoranlar',
    district: 'Tomtom, Beyoğlu',
    pricing: { basePrice: 4900, currency: 'TRY' },
    capacity: 2,
    amenities: ['Michelin Yıldızlı Degustasyon', 'Tarihi Konak Terası', 'Özel Şarap Eşleşmesi', 'Şefle Tanışma'],
    coverImageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
    ]
  }),
  createRealListing({
    id: 'seed-resto-5',
    type: 'experience',
    title: "Tarihi Karaköy Lokantası - Klasik Meze & Akşam Sofrası",
    description: "Gündüz esnaf lokantası lezzetleri, akşam turkuaz çiniler altında İstanbul'un en taze mezeleri ve deniz mahsulleri sofrası.",
    category: 'restoranlar',
    district: 'Karaköy, Beyoğlu',
    pricing: { basePrice: 1950, currency: 'TRY' },
    capacity: 4,
    amenities: ['Günlük Taze Mezeler', 'Otantik Çini Atmosfer', 'Öncelikli Masa Garantisi', 'Geleneksel Tatlılar'],
    coverImageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    ]
  }),

  // ==========================================
  // 13. FOTOĞRAF & KOSTÜM (fotograf-kostum)
  // ==========================================
  createRealListing({
    id: 'seed-foto-1',
    type: 'experience',
    title: "Galata Çatılarında Uçuşan Elbise Çekimi",
    description: "Tarihi Galata Kulesi manzaralı özel terasta kırmızı ve turkuaz uçuşan kuyruklu tasarım elbiselerle profesyonel moda çekimi.",
    category: 'fotograf-kostum',
    district: 'Galata, Beyoğlu',
    pricing: { basePrice: 3500, currency: 'TRY' },
    capacity: 2,
    amenities: ['Tasarım Elbise Temini', 'Profesyonel Moda Fotoğrafçısı', '15 Düzenlenmiş Fotoğraf', 'Tüm Ham Çekimler'],
    coverImageUrl: '/images/experiences/exp-24.jpg',
    galleryUrls: ['/images/experiences/exp-24.jpg', '/images/experiences/exp-25.jpg', '/images/experiences/exp-26.jpg']
  }),
  createRealListing({
    id: 'seed-foto-2',
    type: 'experience',
    title: "Sultanahmet ve Ayasofya Profesyonel Instagram Çekimi",
    description: "Ayasofya Meydanı, Sultanahmet sütunları ve Gülhane Parkı koridorlarında sosyal medya ve portre odaklı 1.5 saatlik fotoğraf turu.",
    category: 'fotograf-kostum',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 2800, currency: 'TRY' },
    capacity: 4,
    amenities: ['1.5 Saatlik Dış Çekim', 'Renk & Işık Düzenlemesi', 'Reels / Video Kesitleri', 'Aynı Gün Teslim'],
    coverImageUrl: '/images/experiences/exp-25.jpg',
    galleryUrls: ['/images/experiences/exp-25.jpg', '/images/experiences/exp-24.jpg']
  }),
  createRealListing({
    id: 'seed-foto-3',
    type: 'experience',
    title: "Geleneksel Osmanlı Saray Kostümleri Stüdyo Çekimi",
    description: "Tarihi kostüm stüdyosunda sultan, paşa ve şehzade kaftanları, taht ve antika aksesuarlarla unutulmaz hatıra fotoğrafları.",
    category: 'fotograf-kostum',
    district: 'Sultanahmet, Fatih',
    pricing: { basePrice: 2400, currency: 'TRY' },
    capacity: 4,
    amenities: ['Orijinal Kadife & İpek Kaftanlar', 'Taht Dekoru', 'Baskılı Fotoğraf Çerçevesi', 'Dijital Yüksek Çözünürlük'],
    coverImageUrl: '/images/experiences/exp-26.jpg',
    galleryUrls: ['/images/experiences/exp-26.jpg', '/images/experiences/exp-27.jpg']
  }),
  createRealListing({
    id: 'seed-foto-4',
    type: 'experience',
    title: "Balat Renkli Sokakları Fotoğraf Safari Turu",
    description: "Balat'ın rengarenk merdivenli yokuşları, tarihi cumbalı ahşap evleri ve antika kafelerinde canlı sokak fotoğrafçılığı seansı.",
    category: 'fotograf-kostum',
    district: 'Balat, Fatih',
    pricing: { basePrice: 1950, currency: 'TRY' },
    capacity: 6,
    amenities: ['Gizli Fotoğraf Açıları', 'Işık & Kompozisyon Eğitimi', '20 Düzenlenmiş Kare', 'Kahve Molası'],
    coverImageUrl: '/images/experiences/exp-27.jpg',
    galleryUrls: ['/images/experiences/exp-27.jpg', '/images/experiences/exp-24.jpg']
  })
];

export function getSeedListing(id: string): MarketplaceListing | null {
  return SEED_LISTINGS.find((l) => l.id === id) ?? null;
}

export function isSeedListingId(id: string): boolean {
  return id.startsWith('seed-');
}
