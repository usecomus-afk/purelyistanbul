import { ServiceStatus, ServiceRequest } from './types';

export type ServiceFieldType =
  | 'select'
  | 'multiselect'
  | 'number'
  | 'time'
  | 'text'
  | 'textarea'
  | 'toggle'
  | 'display';

export interface ServiceField {
  key: string;
  label: string;
  type: ServiceFieldType;
  options?: string[];
  min?: number;
  max?: number;
  default?: string | number | boolean | string[];
  placeholder?: string;
  optional?: boolean;
  suffix?: string;
  toggleLabels?: [string, string]; // [on, off]
  /** For type 'display': derives the shown value from the rest of the form + effective pricing. */
  compute?: (details: Record<string, any>, pricing: Record<string, number>) => string;
}

export interface ServiceStage {
  id: string;
  label: string;
}

export interface ServiceModuleConfig {
  key: string;
  title: string;
  department: string;
  icon: string;
  stages: ServiceStage[];
  fields: ServiceField[];
  /** Rejected/failed terminal stages count as 'cancelled' rather than 'completed'. */
  negativeStageIds?: string[];
  urgentIf?: (details: Record<string, any>) => boolean;
  /** Default numeric pricing knobs (cockpit-editable). Keys are either an exact option label
   *  (per-item price) or a named parameter (e.g. ironFeePerItem, nightlyRate). */
  pricingDefaults?: Record<string, number>;
  /** Which select/multiselect field's option labels double as pricing keys, if any. */
  pricedFieldKey?: string;
}

export const SERVICE_MODULES: Record<string, ServiceModuleConfig> = {
  breakfast: {
    key: 'breakfast',
    title: 'Kahvaltı Talebi',
    department: 'Room Service (Mutfak KDS)',
    icon: '/icons/menu/breakfast.png',
    stages: [
      { id: 'pending', label: 'Bekleme' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'on_the_way', label: 'Yolda' },
      { id: 'delivered', label: 'Teslim' }
    ],
    fields: [
      { key: 'breakfastType', label: 'Kahvaltı Türü', type: 'select', options: ['Türk Kahvaltısı', 'Kontinental Kahvaltı', 'Vegan Kahvaltı', 'Çocuk Menüsü'], default: 'Türk Kahvaltısı' },
      { key: 'guestCount', label: 'Kişi Sayısı', type: 'number', min: 1, max: 10, default: 2 },
      { key: 'time', label: 'Saat', type: 'time', default: '08:30' },
      { key: 'specialRequests', label: 'Özel İstekler', type: 'textarea', optional: true, placeholder: 'Örn: laktozsuz süt, bal yerine reçel...' },
      {
        key: 'totalPrice', label: 'Toplam Ücret', type: 'display',
        compute: (d, pricing) => {
          const perPerson = pricing[d.breakfastType] ?? 300;
          return `${perPerson * (Number(d.guestCount) || 1)} ₺`;
        }
      }
    ],
    pricingDefaults: { 'Türk Kahvaltısı': 350, 'Kontinental Kahvaltı': 250, 'Vegan Kahvaltı': 300, 'Çocuk Menüsü': 150 },
    pricedFieldKey: 'breakfastType'
  },

  dnd: {
    key: 'dnd',
    title: 'Rahatsız Etmeyin',
    department: 'Housekeeping Planlama',
    icon: '/icons/menu/dnd.png',
    stages: [
      { id: 'active', label: 'Aktif' },
      { id: 'removed', label: 'Kaldırıldı' }
    ],
    fields: [
      { key: 'active', label: 'Durum (Aktif/Pasif)', type: 'toggle', toggleLabels: ['Aktif', 'Pasif'], default: true },
      { key: 'removalTime', label: 'Kaldırılma Saati', type: 'select', options: ['1 Saat Sonra', '3 Saat Sonra', 'Yarın Sabah 08:00', 'Belirsiz / Ben Kaldırırım'], default: 'Belirsiz / Ben Kaldırırım' },
      { key: 'urgentHelp', label: 'Acil Yardım Butonu', type: 'toggle', toggleLabels: ['Acil Yardım Gerekiyor', 'Hayır'], default: false }
    ],
    urgentIf: (d) => !!d.urgentHelp
  },

  cleaning: {
    key: 'cleaning',
    title: 'Oda Temizliği',
    department: 'Housekeeping',
    icon: '/icons/menu/cleaning.png',
    stages: [
      { id: 'pending', label: 'Bekleme' },
      { id: 'in_progress', label: 'Devam Ediyor' },
      { id: 'at_door', label: 'Kapıda' },
      { id: 'completed', label: 'Tamamlandı' }
    ],
    fields: [
      { key: 'urgency', label: 'Aciliyet Derecesi', type: 'select', options: ['Standart', 'Acil'], default: 'Standart' },
      { key: 'reason', label: 'Temizlik Nedeni', type: 'select', options: ['Genel Temizlik', 'Kahvaltı Sonrası Toparlama', 'Acil Kirlilik / Dökülme', 'Koku Şikayeti', 'Diğer'], default: 'Genel Temizlik' },
      { key: 'roomState', label: 'Oda Durumu', type: 'select', options: ['Oda Boş', 'Oda Dolu (Misafir İçeride)'], default: 'Oda Boş' },
      { key: 'note', label: 'Özel Not', type: 'textarea', optional: true },
      {
        key: 'expectedTime', label: 'Beklenen Zaman', type: 'display',
        compute: (d) => d.urgency === 'Acil' ? '~10 dakika içinde' : '~30-45 dakika içinde'
      }
    ],
    urgentIf: (d) => d.urgency === 'Acil'
  },

  towels: {
    key: 'towels',
    title: 'Temiz Havlu',
    department: 'Housekeeping & Çamaşırhane Envanteri',
    icon: '/icons/menu/towels.png',
    stages: [
      { id: 'stock_check', label: 'Stok Yeterli' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'on_the_way', label: 'Yolda' },
      { id: 'delivered', label: 'Teslim' }
    ],
    fields: [
      { key: 'towelType', label: 'Havlu Türü', type: 'select', options: ['Banyo Havlusu', 'Yüz Havlusu', 'Ayak Havlusu', 'Bornoz'], default: 'Banyo Havlusu' },
      { key: 'quantity', label: 'Adet Sayısı', type: 'number', min: 1, max: 10, default: 2 },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', '30 Dakika İçinde', '1 Saat İçinde'], default: 'Hemen' },
      { key: 'oldTowelPickup', label: 'Eski Havlu Alınması', type: 'toggle', toggleLabels: ['Evet', 'Hayır'], default: true }
    ]
  },

  linens: {
    key: 'linens',
    title: 'Çarşaf & Nevresim',
    department: 'Çamaşırhane + Housekeeping',
    icon: '/icons/menu/linens.png',
    stages: [
      { id: 'pending', label: 'Bekleme' },
      { id: 'laundry_room', label: 'Temizlik Odası' },
      { id: 'drying', label: 'Kurutma' },
      { id: 'ironing', label: 'Ütüleme' },
      { id: 'packing', label: 'Paketleme' },
      { id: 'ready', label: 'Hazır' }
    ],
    fields: [
      { key: 'changeType', label: 'Değişim Türü', type: 'select', options: ['Tam Takım (Çarşaf + Nevresim)', 'Sadece Nevresim', 'Sadece Alt Çarşaf'], default: 'Tam Takım (Çarşaf + Nevresim)' },
      { key: 'status', label: 'Durum (Teslim/Değiştirelim)', type: 'select', options: ['Odaya Teslim Edilsin', 'Odada Değiştirilsin (Housekeeping Girsin)'], default: 'Odada Değiştirilsin (Housekeeping Girsin)' },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', 'Bugün İçinde', 'Belirli Saatte'], default: 'Bugün İçinde' },
      {
        key: 'fee', label: 'Ücret', type: 'display',
        compute: (_d, pricing) => {
          const fee = pricing.fee ?? 0;
          return fee > 0 ? `${fee} ₺` : 'Ücretsiz (Standart Hizmet Kapsamında)';
        }
      }
    ],
    pricingDefaults: { fee: 0 }
  },

  pillows: {
    key: 'pillows',
    title: 'Ekstra Yastık',
    department: 'Housekeeping Envanteri',
    icon: '/icons/menu/pillows.png',
    stages: [
      { id: 'stock', label: 'Stok' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'on_the_way', label: 'Yolda' },
      { id: 'delivered', label: 'Teslim' }
    ],
    fields: [
      { key: 'pillowType', label: 'Yastık Türü', type: 'select', options: ['Standart', 'Ortopedik', 'Lateks', 'Tüy (Kaz Tüyü)'], default: 'Standart' },
      { key: 'quantity', label: 'Adet Sayısı', type: 'number', min: 1, max: 4, default: 1 },
      { key: 'sleepIssue', label: 'Uyku Sorunu (Opsiyonel)', type: 'select', options: ['Yok', 'Boyun Ağrısı', 'Sırt Ağrısı', 'Alerji'], default: 'Yok', optional: true },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', '30 Dakika İçinde', 'Akşam Turndown İle'], default: 'Hemen' }
    ]
  },

  toiletries: {
    key: 'toiletries',
    title: 'Banyo Bukleti',
    department: 'Mini Kit Envanteri',
    icon: '/icons/menu/toiletries.png',
    stages: [
      { id: 'depot', label: 'Depo' },
      { id: 'room', label: 'Oda' },
      { id: 'consumed', label: 'Tüketildi' }
    ],
    fields: [
      { key: 'items', label: 'Malzeme Seçimi', type: 'multiselect', options: ['Şampuan', 'Duş Jeli', 'Sabun', 'Vücut Losyonu', 'Nemlendirici Krem'], default: ['Şampuan', 'Duş Jeli'] },
      { key: 'brand', label: 'Marka', type: 'select', options: ['Standart', 'Premium', 'Organik', 'Vegan'], default: 'Standart' },
      { key: 'allergyWarning', label: 'Allerji Uyarıları', type: 'textarea', optional: true, placeholder: 'Varsa bilinen alerjilerinizi belirtin' },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', '30 Dakika İçinde', '1 Saat İçinde'], default: 'Hemen' }
    ]
  },

  hygiene: {
    key: 'hygiene',
    title: 'Hijyen & Bakım Seti',
    department: 'Özel Kit Yönetimi',
    icon: '/icons/menu/hygiene.png',
    stages: [
      { id: 'depot', label: 'Depo' },
      { id: 'room', label: 'Oda' },
      { id: 'consumed', label: 'Tüketildi' }
    ],
    fields: [
      { key: 'setType', label: 'Set Türü', type: 'select', options: ['Kadın Bakım Seti', 'Erkek Tıraş Seti', 'Çocuk Hijyen Seti', 'Seyahat Seti'], default: 'Seyahat Seti' },
      { key: 'extras', label: 'Ek Ürünler', type: 'multiselect', options: ['Diş Fırçası & Macun', 'Tıraş Bıçağı & Köpük', 'Terlik', 'Duş Bonesi', 'Pamuklu Çubuk'], default: [] },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', '30 Dakika İçinde', '1 Saat İçinde'], default: 'Hemen' }
    ]
  },

  roomservice: {
    key: 'roomservice',
    title: 'Oda Servisi (Menü)',
    department: 'Mutfak (KDS) + Room Service',
    icon: '/icons/menu/roomservice.png',
    stages: [
      { id: 'order_received', label: 'Sipariş Alındı' },
      { id: 'kitchen', label: 'Mutfakta' },
      { id: 'ready', label: 'Hazır' },
      { id: 'picked_up', label: 'Room Service Almıştır' },
      { id: 'delivered', label: 'Odasında' }
    ],
    fields: [
      { key: 'menuItems', label: 'Menü Seçimi', type: 'multiselect', options: ['Geleneksel Türk Serpme Kahvaltısı', 'Dana Antrikot Izgara & Trüflü Patates Püresi', 'El Yapımı Yaban Mantarlı Fettuccine', 'Xenios Gurme Kulüp Sandviç', 'Geleneksel Fırın Sütlaç & Fındık', 'Taze Sıkılmış Akdeniz Portakal Suyu'], default: ['Xenios Gurme Kulüp Sandviç'] },
      { key: 'quantity', label: 'Miktar', type: 'number', min: 1, max: 10, default: 1 },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'time', default: '' },
      { key: 'specialNotes', label: 'Özel Notlar', type: 'textarea', optional: true },
      {
        key: 'totalPrice', label: 'Toplam Ücret', type: 'display',
        compute: (d, pricing) => {
          const items: string[] = d.menuItems || [];
          const qty = Number(d.quantity) || 1;
          const unitTotal = items.reduce((sum, i) => sum + (pricing[i] ?? 150), 0);
          return `${unitTotal * qty} ₺`;
        }
      }
    ],
    pricingDefaults: { 'Geleneksel Türk Serpme Kahvaltısı': 840, 'Dana Antrikot Izgara & Trüflü Patates Püresi': 1190, 'El Yapımı Yaban Mantarlı Fettuccine': 630, 'Xenios Gurme Kulüp Sandviç': 560, 'Geleneksel Fırın Sütlaç & Fındık': 280, 'Taze Sıkılmış Akdeniz Portakal Suyu': 210 },
    pricedFieldKey: 'menuItems'
  },

  minibar: {
    key: 'minibar',
    title: 'Mini Bar Dolumu',
    department: 'Mini Bar Envanteri',
    icon: '/icons/menu/minibar.png',
    stages: [
      { id: 'requested', label: 'Talep' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'on_the_way', label: 'Yolda' },
      { id: 'delivered', label: 'Odasında' }
    ],
    fields: [
      { key: 'drinkSelection', label: 'İçecek Seçimi', type: 'multiselect', options: ['Su (0.5L)', 'Kola', 'Meyve Suyu', 'Bira', 'Şarap (Kırmızı/Beyaz)', 'Enerji İçeceği'], default: ['Su (0.5L)'] },
      { key: 'quantity', label: 'Adet Sayısı', type: 'number', min: 1, max: 12, default: 2 },
      { key: 'brand', label: 'Marka', type: 'select', options: ['Standart', 'Premium'], default: 'Standart' },
      { key: 'deliveryTime', label: 'Teslimat Zamanı', type: 'select', options: ['Hemen', '30 Dakika İçinde', '1 Saat İçinde'], default: 'Hemen' },
      {
        key: 'fee', label: 'Ücret', type: 'display',
        compute: (d, pricing) => {
          const items: string[] = d.drinkSelection || [];
          const qty = Number(d.quantity) || 1;
          const brandMultiplier = d.brand === 'Premium' ? (pricing.premiumMultiplierPercent ?? 150) / 100 : 1;
          const unitTotal = items.reduce((sum, i) => sum + (pricing[i] ?? 50), 0) || 50;
          return `${Math.round(unitTotal * qty * brandMultiplier)} ₺ (Tahmini)`;
        }
      }
    ],
    pricingDefaults: { 'Su (0.5L)': 30, 'Kola': 60, 'Meyve Suyu': 70, 'Bira': 120, 'Şarap (Kırmızı/Beyaz)': 450, 'Enerji İçeceği': 90, premiumMultiplierPercent: 150 },
    pricedFieldKey: 'drinkSelection'
  },

  safe: {
    key: 'safe',
    title: 'Kasa & Güvenlik',
    department: 'Güvenlik & Teknik Servis',
    icon: '/icons/menu/safe.png',
    stages: [
      { id: 'reported', label: 'Bildirilen' },
      { id: 'checked', label: 'Kontrol Edildi' },
      { id: 'resolved', label: 'Çözüldü' }
    ],
    fields: [
      { key: 'issueType', label: 'Sorun Türü', type: 'select', options: ['Kasa Açılmıyor', 'Şifremi Unuttum', 'Kasa Arızalı', 'Güvenlik Endişesi', 'Diğer'], default: 'Kasa Açılmıyor' },
      { key: 'detail', label: 'Detay Açıklaması', type: 'textarea' },
      { key: 'contactPhone', label: 'İletişim (Telefon)', type: 'text', placeholder: '+90 5xx xxx xx xx' }
    ],
    urgentIf: (d) => d.issueType === 'Güvenlik Endişesi'
  },

  technical: {
    key: 'technical',
    title: 'Teknik Destek',
    department: 'Teknik Servis (Maintenance)',
    icon: '/icons/menu/technical.png',
    stages: [
      { id: 'reported', label: 'Bildirilen' },
      { id: 'in_progress', label: 'Devam Ediyor' },
      { id: 'resolved', label: 'Çözüldü' },
      { id: 'failed', label: 'Başarısız' }
    ],
    negativeStageIds: ['failed'],
    fields: [
      { key: 'category', label: 'Sorun Kategorisi', type: 'select', options: ['Klima', 'Televizyon', 'Elektrik / Priz', 'Su Tesisatı', 'WiFi / İnternet', 'Aydınlatma', 'Diğer'], default: 'Klima' },
      { key: 'description', label: 'Sorun Açıklaması', type: 'textarea' },
      { key: 'urgency', label: 'Aciliyet Derecesi', type: 'select', options: ['Standart', 'Acil'], default: 'Standart' },
      { key: 'expectedTime', label: 'Beklenen Zaman', type: 'display', compute: (d) => d.urgency === 'Acil' ? '~15 dakika içinde' : '~1 saat içinde' }
    ],
    urgentIf: (d) => d.urgency === 'Acil'
  },

  laundry: {
    key: 'laundry',
    title: 'Çamaşırhane & Ütü',
    department: 'Çamaşırhane Yönetimi',
    icon: '/icons/menu/laundry.png',
    stages: [
      { id: 'picked_up', label: 'Alındı' },
      { id: 'washing', label: 'Yıkamada' },
      { id: 'drying', label: 'Kurutmada' },
      { id: 'ironing', label: 'Ütülüyor' },
      { id: 'packed', label: 'Paketlendi' },
      { id: 'ready', label: 'Hazır' }
    ],
    fields: [
      { key: 'serviceType', label: 'Hizmet Türü', type: 'select', options: ['Express (4-6 Saat)', 'Standart (24 Saat)', 'Kuru Temizleme'], default: 'Standart (24 Saat)' },
      { key: 'itemType', label: 'Kıyafet Türü', type: 'multiselect', options: ['Gömlek', 'Pantolon', 'Elbise', 'Takım Elbise', 'Ceket', 'Diğer'], default: ['Gömlek'] },
      { key: 'itemIssue', label: 'Kıyafet Sorunu (Leke/Hasar)', type: 'select', options: ['Yok', 'Leke Var', 'Hasar Var'], default: 'Yok' },
      { key: 'ironingRequested', label: 'Ütü Talep Edimi', type: 'toggle', toggleLabels: ['Evet', 'Hayır'], default: true },
      { key: 'checkoutTime', label: 'Çıkış Saati', type: 'time', optional: true },
      {
        key: 'fee', label: 'Ücret', type: 'display',
        compute: (d, pricing) => {
          const items: string[] = d.itemType || [];
          const count = Math.max(items.length, 1);
          const perItemPrice = pricing[d.serviceType] ?? 40;
          const ironFee = d.ironingRequested ? (pricing.ironFeePerItem ?? 20) * count : 0;
          return `${perItemPrice * count + ironFee} ₺ (Tahmini)`;
        }
      }
    ],
    pricingDefaults: { 'Express (4-6 Saat)': 60, 'Standart (24 Saat)': 35, 'Kuru Temizleme': 80, ironFeePerItem: 20 },
    pricedFieldKey: 'serviceType',
    urgentIf: (d) => d.serviceType === 'Express (4-6 Saat)'
  },

  lateCheckout: {
    key: 'lateCheckout',
    title: 'Geç Çıkış Talebi',
    department: 'Ön Büro (Front Desk)',
    icon: '/icons/menu/lateCheckout.png',
    stages: [
      { id: 'requested', label: 'İstek' },
      { id: 'checked', label: 'Kontrol Edildi' },
      { id: 'approved', label: 'Onaylandı' },
      { id: 'rejected', label: 'Reddedildi' }
    ],
    negativeStageIds: ['rejected'],
    fields: [
      { key: 'requestedTime', label: 'İstenen Çıkış Saati', type: 'select', options: ['14:00', '15:00', '16:00', '18:00 (Gün Sonu)'], default: '14:00' },
      { key: 'feeInfo', label: 'Ek Ücret Bilgisi', type: 'display', compute: () => "14:00'e kadar ücretsiz, sonrası oda ücretinin %25'i yansıtılır (Onaya tabidir)." },
      { key: 'note', label: 'Not (Opsiyonel)', type: 'textarea', optional: true }
    ]
  },

  extendStay: {
    key: 'extendStay',
    title: 'Konaklama Uzatma',
    department: 'Gelir Yönetimi + Ön Büro',
    icon: '/icons/menu/extendStay.png',
    stages: [
      { id: 'requested', label: 'İstek' },
      { id: 'system_check', label: 'Sistem Kontrolü' },
      { id: 'approved', label: 'Onaylandı' },
      { id: 'rejected', label: 'Reddedildi' }
    ],
    negativeStageIds: ['rejected'],
    fields: [
      { key: 'extensionUnit', label: 'Uzatma Süresi (Gece/Gün)', type: 'select', options: ['1 Gece', '2 Gece', '3 Gece', '1 Hafta'], default: '1 Gece' },
      { key: 'roomPreference', label: 'Oda Durumu (Aynı/Farklı)', type: 'select', options: ['Aynı Odada Kalmak İstiyorum', 'Farklı Odaya Geçebilirim'], default: 'Aynı Odada Kalmak İstiyorum' },
      {
        key: 'feeEstimate', label: 'Ücret Hesaplaması', type: 'display',
        compute: (d, pricing) => {
          const nightsMap: Record<string, number> = { '1 Gece': 1, '2 Gece': 2, '3 Gece': 3, '1 Hafta': 7 };
          const nights = nightsMap[d.extensionUnit] ?? 1;
          const rate = pricing.nightlyRate ?? 3200;
          return `${(nights * rate).toLocaleString('tr-TR')} ₺ (Tahmini, ${nights} gece)`;
        }
      },
      { key: 'note', label: 'Not (Opsiyonel)', type: 'textarea', optional: true }
    ],
    pricingDefaults: { nightlyRate: 3200 }
  },

  taxi: {
    key: 'taxi',
    title: 'Taksi Çağır',
    department: 'Concierge & Ulaşım',
    icon: '/icons/menu/taksi.png',
    stages: [
      { id: 'requested', label: 'İstek' },
      { id: 'called', label: 'Çağrı Yapıldı' },
      { id: 'assigned', label: 'Sürücü Atandı' },
      { id: 'on_the_way', label: 'Yolda' },
      { id: 'arrived', label: 'Varıştı' },
      { id: 'completed', label: 'Tamamlandı' }
    ],
    fields: [
      { key: 'pickup', label: 'Başlangıç Noktası', type: 'text', default: 'Otel Girişi' },
      { key: 'destination', label: 'Varış Noktası', type: 'text', placeholder: 'Örn: Atatürk Havalimanı, Sultanahmet Meydanı' },
      { key: 'passengerCount', label: 'Yolcu Sayısı', type: 'number', min: 1, max: 8, default: 1 },
      { key: 'luggageCount', label: 'Bagaj Sayısı', type: 'number', min: 0, max: 8, default: 1 },
      { key: 'vehicleType', label: 'Araç Tipi', type: 'select', options: ['Standart Sarı Taksi', 'VIP Transfer (Binek)', 'Minivan (Grup)'], default: 'Standart Sarı Taksi' },
      { key: 'time', label: 'Zaman', type: 'select', options: ['Hemen', '15 Dakika Sonra', '30 Dakika Sonra', 'Planlı Saat'], default: 'Hemen' },
      {
        key: 'priceEstimate', label: 'Fiyat Tahmini', type: 'display',
        compute: (d, pricing) => {
          const pct = pricing[d.vehicleType] ?? 100;
          const m = pct / 100;
          const min = pricing.baseMin ?? 180;
          const max = pricing.baseMax ?? 650;
          return `${Math.round(min * m)} - ${Math.round(max * m)} ₺ (Güzergaha Göre Tahmini)`;
        }
      },
      { key: 'driverInfo', label: 'Sürücü Bilgisi', type: 'display', compute: () => 'Talep onaylandığında atanacak' },
      { key: 'liveTracking', label: 'Canlı Takip', type: 'display', compute: () => 'Sürücü atandığında aktif olacak' }
    ],
    pricingDefaults: { 'Standart Sarı Taksi': 100, 'VIP Transfer (Binek)': 220, 'Minivan (Grup)': 160, baseMin: 180, baseMax: 650 },
    pricedFieldKey: 'vehicleType'
  }
};

export function getModuleConfig(key: string): ServiceModuleConfig | undefined {
  return SERVICE_MODULES[key];
}

export function buildInitialDetails(config: ServiceModuleConfig): Record<string, any> {
  const details: Record<string, any> = {};
  config.fields.forEach((f) => {
    if (f.type === 'display') return;
    if (f.default !== undefined) {
      details[f.key] = f.default;
    } else if (f.type === 'multiselect') {
      details[f.key] = [];
    } else if (f.type === 'toggle') {
      details[f.key] = true;
    } else if (f.type === 'number') {
      details[f.key] = f.min ?? 1;
    } else {
      details[f.key] = '';
    }
  });
  return details;
}

export function deriveStatus(config: ServiceModuleConfig, stageId: string): ServiceStatus {
  const idx = config.stages.findIndex((s) => s.id === stageId);
  if (idx <= 0) return 'pending';
  if (config.negativeStageIds?.includes(stageId)) return 'cancelled';
  if (idx === config.stages.length - 1) return 'completed';
  return 'in_progress';
}

export function nextStage(config: ServiceModuleConfig, stageId: string): ServiceStage | undefined {
  const idx = config.stages.findIndex((s) => s.id === stageId);
  if (idx === -1 || idx === config.stages.length - 1) return undefined;
  return config.stages[idx + 1];
}

export function formatFieldValue(field: ServiceField, value: any): string {
  if (field.type === 'toggle') {
    const [onLabel, offLabel] = field.toggleLabels ?? ['Evet', 'Hayır'];
    return value ? onLabel : offLabel;
  }
  if (value === undefined || value === null || value === '') return '—';
  if (field.type === 'multiselect') {
    return Array.isArray(value) && value.length ? value.join(', ') : '—';
  }
  return String(value);
}

/** Merges cockpit-managed pricing overrides on top of a module's shipped defaults. */
export function resolvePricing(config: ServiceModuleConfig, overrides?: Record<string, number>): Record<string, number> {
  return { ...(config.pricingDefaults ?? {}), ...(overrides ?? {}) };
}

/** Merges cockpit-managed content (option list) overrides for one field; falls back to shipped options. */
export function resolveFieldOptions(field: ServiceField, overrides?: Record<string, string[]>): string[] {
  return overrides?.[field.key] ?? field.options ?? [];
}

/** The request's live operational status: derived from its module workflow stage when available. */
export function deriveRequestStatus(req: ServiceRequest): ServiceStatus {
  const config = getModuleConfig(req.serviceKey);
  if (config && req.stage) return deriveStatus(config, req.stage);
  return req.status;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
