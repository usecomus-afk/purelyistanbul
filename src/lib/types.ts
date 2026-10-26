export type Language = 'tr' | 'en' | 'ar' | 'ru' | 'de' | 'fr';

export type RoomOccupancyStatus = 'occupied' | 'clean' | 'cleaning' | 'reserved' | 'maintenance';

export interface RoomStateInfo {
  status: RoomOccupancyStatus;
  guest?: string;
  guestPhone?: string;
  checkout?: string;
  whatsappConfirmedAt?: string;
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
}

export interface HotelWhatsAppTemplate {
  id: string;
  title: string;
  body: string;
  isDefault?: boolean;
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: string;
  wifiSsid: string;
  wifiPass: string;
  /** Birim bazlı konum bilgisi (PMC şirketlerinin farklı konumlardaki daireleri için) */
  locationAddress?: string;
  mapsUrl?: string;
  coords?: { lat: number; lng: number };
  /** Birim bazlı Ev Rehberi & Comus AI Bilgi Bankası (her mülk için değişen özel bilgiler) */
  doorCode?: string;
  applianceGuide?: string;
  houseGuideNotes?: string;
  /** Self-Servis PMS Takvim & Fiyat Optimizasyonu (Birim bazlı fiyatlama ve takvim) */
  basePriceEur?: number;
  minStayNights?: number;
  weekendMarkupPct?: number;
  highOccupancyMarkupPct?: number;
  lastMinuteDiscountPct?: number;
  channelMarkups?: {
    airbnb?: number;
    booking?: number;
    expedia?: number;
    vrbo?: number;
  };
  calendarOverrides?: Record<
    string,
    {
      status?: 'available' | 'booked' | 'blocked';
      channel?: 'Direkt' | 'Airbnb' | 'Booking.com' | 'Expedia' | 'VRBO' | 'Bloke';
      priceEur?: number;
      guestName?: string;
    }
  >;
  status?: RoomOccupancyStatus;
  guest?: string;
  guestPhone?: string;
  checkout?: string;
  whatsappConfirmedAt?: string;
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
}

export type StaffDepartmentKey =
  | 'all'
  | 'Housekeeping'
  | 'Mutfak'
  | 'Teknik'
  | 'Resepsiyon'
  | 'Concierge'
  | 'Çamaşırhane';

export interface HotelStaffMember {
  id: string;
  name: string;
  roleTitle: string;
  whatsappPhone: string;
  departments: StaffDepartmentKey[];
  receiveAllAlerts?: boolean;
  active: boolean;
  createdAt: string;
}

export interface HotelModules {
  enable_guest_self_kbs?: boolean;
  [key: string]: any;
}

export interface Hotel {
  id: string;
  name: string;
  district: string;
  type: string;
  address: string;
  phone: string;
  website: string;
  ratingStr: string;
  targetReason: string;
  coords: { lat: number; lng: number };
  rooms: Room[];
  breakfastHours: string;
  checkoutTime: string;
  receptionExt: string;
  featured?: boolean;
  modules?: HotelModules;
  status?: 'active' | 'suspended';
  supplierId?: string;
  commissionRate?: number;
  contactEmail?: string;
  managerName?: string;
  managerPhone?: string;
  whatsappPhone?: string;
  /** İşletme sorumlu personel kayıtları ve departman bazlı otomatik WhatsApp yönlendirme haritası */
  staffMembers?: HotelStaffMember[];
  departmentStaffRouting?: Record<string, string>;
  publishToWeb?: boolean;
  publishToMobile?: boolean;
  /** Beş pilot bölgeden ("fatih" | "besiktas" | "beyoglu" | "sisli" | "kadikoy") hangilerinde "Sizin için seçtiklerimiz" vitrininde öne çıkarılacağı */
  recommendedDistricts?: PilotDistrictKey[];
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
  deleted?: boolean;
}

export type SupplierType =
  | 'tour_operator'
  | 'restaurant'
  | 'yacht_charter'
  | 'property_management'
  | 'hotel'
  | 'transfer_vip'
  | 'clinic_wellness'
  | 'hammam_spa'
  | 'other';

export type SupplierContractStatus = 'active' | 'pending' | 'suspended';

export interface SupplierPartner {
  id: string;
  name: string;
  legalName?: string;
  type: SupplierType;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  website?: string;
  district: string;
  address?: string;
  taxId?: string;
  tursabNo?: string;
  iban?: string;
  commissionRate: number;
  contractStatus: SupplierContractStatus;
  contractStartDate?: string;
  contractNotes?: string;
  publishToWeb?: boolean;
  publishToMobile?: boolean;
  /** Beş pilot bölgeden ("fatih" | "besiktas" | "beyoglu" | "sisli" | "kadikoy") hangilerinde "Sizin için seçtiklerimiz" vitrininde öne çıkarılacağı */
  recommendedDistricts?: PilotDistrictKey[];
  createdAt: string;
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
  deleted?: boolean;
}

export type ExperienceStatus = 'active' | 'suspended';
export type PilotDistrictKey = 'fatih' | 'besiktas' | 'beyoglu' | 'sisli' | 'kadikoy';

export interface Experience {
  id: string;
  category: string;
  /** Panel kategorisine açık bağ (örn. "cat-5" veya "cat-c-xxxx"). Yoksa `category` metninden tahmin edilir. */
  categoryKey?: string;
  provider: string;
  title: string;
  desc?: string;
  location: string;
  phone: string;
  website: string;
  agentNote: string;
  scoreStr: string;
  price: number;
  currency: string;
  duration: string;
  rating: number;
  coords: { lat: number; lng: number };
  categoryTag: string;
  iconName: string;
  featured?: boolean;
  image?: string;
  /** Admin-controlled listing status. Missing/undefined is treated as 'active' for older records. */
  status?: ExperienceStatus;
  cuisine?: string;
  priceLevel?: string;
  specialties?: string[];
  features?: string[];
  reviewsCount?: string;
  providerEmail?: string;
  capacity?: number;
  availableSlots?: number;
  quotaNote?: string;
  supplierId?: string;
  commissionRate?: number;
  listingType?: 'experience' | 'stay';
  publishToWeb?: boolean;
  publishToMobile?: boolean;
  /** Beş pilot bölgeden ("fatih" | "besiktas" | "beyoglu" | "sisli" | "kadikoy") hangilerinde "Sizin için seçtiklerimiz" vitrininde öne çıkarılacağı */
  recommendedDistricts?: PilotDistrictKey[];
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
  deleted?: boolean;
}

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ServicePriority = 'standart' | 'acil';

export interface ServiceRequest {
  id: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  serviceKey: string;
  serviceTitle: string;
  notes?: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  // Structured per-module form data (see src/lib/service-modules.ts)
  details?: Record<string, string | number | boolean | string[]>;
  department?: string;
  priority?: ServicePriority;
  stage?: string;
  isDemo?: boolean;
  paymentMethod?: 'online_card' | 'room_charge' | 'complimentary';
  paymentStatus?: 'paid_online' | 'room_folio' | 'room_charge' | 'unpaid';
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentReference?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
}

export type BookingStatus = 'payment_success' | 'provider_pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  experienceId: string;
  experienceTitle: string;
  providerName: string;
  providerPhone: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCount: number;
  bookingDate: string;
  bookingTime: string;
  amount: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  calendarLink?: string;
  confirmationCode: string;
  isDemo?: boolean;
}

export type TourPace = 'sakin' | 'dengeli' | 'yogun';

// Invest & Live in Istanbul — yatırımcı/yaşam profilleri
export type InvestorPersona = 'citizenship' | 'short_term_rental' | 'luxury_lifestyle';

export interface GuestProfile {
  name?: string;
  travelStyle?: 'solo' | 'couple' | 'family' | 'business';
  interests?: string[];
  dietaryRestrictions?: string[];
  budgetLevel?: 'economy' | 'moderate' | 'luxury';
  notes?: string;
  // Kişisel rehberlik anketi (comusAI) — tamamı isteğe bağlı, misafir ne kadarını paylaşacağına kendi karar verir
  healthNotes?: string;
  allergies?: string[];
  gastronomyPreferences?: string[];
  shoppingInterests?: string[];
  cityTourInterests?: string[];
  tourPace?: TourPace;
  businessNeeds?: string[];
  // KVKK aydınlatma & açık rıza onayı — kişisel/sağlık verisi işlemek için zorunlu
  kvkkConsent?: boolean;
  consentTimestamp?: string;
  // Invest & Live in Istanbul — sessizce toplanan nitelikli veri (comusAI akıllı profilleme)
  investPropertyTypesViewed?: string[];
  investPersonaScores?: Partial<Record<InvestorPersona, number>>;
  investPersonaGuess?: InvestorPersona;
  investBudgetRange?: string;
}

export type PropertyStatus = 'active' | 'suspended';

export interface PropertyListing {
  id: string;
  title: string;
  district: string;
  propertyType: string;
  personas: InvestorPersona[];
  priceUSD: number;
  bedrooms: number;
  areaM2: number;
  description: string;
  highlights: string[];
  developer: string;
  contactPhone: string;
  contactWebsite: string;
  image: string;
  coords: { lat: number; lng: number };
  citizenshipEligible: boolean;
  roiEstimate?: string;
  agency?: string;
  referenceUrl?: string;
  categoryType?: string;
  targetProfile?: string;
  citizenshipStatus?: string;
  airbnbEligible?: boolean;
  /** Admin-controlled listing status. Missing/undefined is treated as 'active' for older records. */
  status?: PropertyStatus;
  supplierId?: string;
  commissionRate?: number;
  managementType?: 'sale' | 'short_term_rental' | 'both';
  publishToWeb?: boolean;
  publishToMobile?: boolean;
  /** Beş pilot bölgeden ("fatih" | "besiktas" | "beyoglu" | "sisli" | "kadikoy") hangilerinde "Sizin için seçtiklerimiz" vitrininde öne çıkarılacağı */
  recommendedDistricts?: PilotDistrictKey[];
  /** Otele özel görünürlük: 'all' (tüm oteller) veya 'specific' (yalnızca allowedHotelIds'deki otellerin misafirleri) */
  hotelVisibility?: 'all' | 'specific';
  allowedHotelIds?: string[];
  updatedAt?: string;
  deleted?: boolean;
}

export interface InvestmentLead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  guestName: string;
  guestContact: string;
  note?: string;
  personaGuess?: InvestorPersona;
  createdAt: string;
}

export interface TransitCalculation {
  distanceKm: number;
  taxi: {
    durationMin: number;
    costTl: number;
    desc: string;
  };
  vipTransfer: {
    durationMin: number;
    costEur: number;
    desc: string;
  };
  publicTransit: {
    durationMin: number;
    costTl: number;
    routeSteps: string[];
    lineName: string;
  };
}

export type ComplaintStatus = 
  | 'under_review' 
  | 'contacted_business' 
  | 'resolved_refunded' 
  | 'published_blacklisted';

export interface Complaint {
  id: string;
  trackingCode: string;
  businessName: string;
  businessCategory: 'Taksi / Ulaşım' | 'Restoran / Kafe' | 'Alışveriş / Halı & Deri' | 'Tur & Acente' | 'Gece Kulübü / Bar' | 'Döviz & Diğer';
  location: string;
  incidentDate: string;
  amountPaid: number;
  amountExpected: number;
  currency: string;
  discrepancyAmount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelName: string;
  roomNumber: string;
  description: string;
  receiptPhotoUrl?: string;
  refundIbanOrCard?: string;
  status: ComplaintStatus;
  businessEmail?: string;
  businessResponse?: string;
  daysPending: number;
  isPublicAlert: boolean;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}


// Cockpit: Otel İçi Hizmet Modülleri Yönetimi (içerik/fiyat/aktiflik/görünürlük/özel hizmetler)
export interface InRoomServiceItem {
  id: string; // unique key e.g. 'breakfast', 'custom-123'
  key: string;
  label: string;
  desc: string;
  icon: string;
  department: string;
  enabled: boolean;
  hidden: boolean;
  explicitlyHidden?: boolean;
  isCustom?: boolean;
  price?: number;
  currency?: string;
  pricingDefaults?: Record<string, number>;
  fieldOptions?: Record<string, string[]>;
  options?: string[];
  order?: number;
}

export interface ModuleAdminSettings {
  enabled: boolean;
  hidden: boolean;
  explicitlyHidden?: boolean;
  pricing?: Record<string, number>;
  fieldOptions?: Record<string, string[]>;
}

export type ModuleAdminSettingsMap = Record<string, ModuleAdminSettings>;

export interface RoomServiceMenuItem {
  id: string;
  hotelId: string;
  name: string;
  category: 'Kahvaltı' | 'Başlangıç' | 'Ana Yemek' | 'Tatlı' | 'İçecek' | 'Atıştırmalık' | 'Gece Menüsü';
  description: string;
  ingredients: string;
  allergens?: string;
  calories?: number | string;
  price: number;
  currency: string;
  image: string;
  available: boolean;
  preparationTimeMinutes?: number;
  createdAt: string;
}

export interface OTAChannelItem {
  id: string;
  hotelId: string;
  name: string;
  roomNumber?: string; // 'all' or specific room number
  feedUrl: string;
  status: 'Senkronize' | 'Bağlantı Hazır' | 'Hata' | 'Beklemede';
  lastSync?: string;
  active: boolean;
}

export interface XeniosUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'guest' | 'hotel' | 'pilot' | 'admin';
  hotelCode?: string;
  hotelName?: string;
  provider: 'google' | 'email';
  phone?: string;
  createdAt: string;
}

export interface TokenUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokensSaved: number;
  estimatedCostUSD: number;
  source: 'gemini_3_6_flash' | 'gemini_2_5_flash' | 'instant_knowledge' | 'cache_hit' | 'local_fallback';
}

export interface AiTokenStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokensUsed: number;
  totalTokensSaved: number;
  totalQueries: number;
  cacheHitQueries: number;
  estimatedCostUSD: number;
  lastQueryTokens?: number;
  lastQuerySaved?: number;
  lastQuerySource?: string;
  updatedAt: string;
}

export interface HotelPartnerApplication {
  id: string;
  propertyName: string;
  businessType: string; // Konaklama işletme tipi (Butik Otel, PMC, Apart Otel vb.)
  capacity: number; // Oda / bağımsız birim kapasitesi
  locationDistrict: string; // Tesisin bulunduğu ilçe/bölge
  locationAddress: string; // Tesisin açık yeri / adresi
  authorizedPerson: string; // Yetkili kişi Ad Soyad (& Ünvan)
  phone: string; // Standart iletişim - Telefon / WhatsApp
  email: string; // Standart iletişim - E-posta
  website?: string; // Opsiyonel web sitesi / sosyal medya
  notes?: string;
  wantsToBePartner: boolean; // "PurelyIstanbul partneri olmak istiyorum" onayı
  reviewedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
