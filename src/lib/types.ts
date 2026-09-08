export type Language = 'tr' | 'en' | 'ar' | 'ru' | 'de' | 'fr';

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: string;
  wifiSsid: string;
  wifiPass: string;
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
}

export type ExperienceStatus = 'active' | 'suspended';

export interface Experience {
  id: string;
  category: string;
  provider: string;
  title: string;
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
  reviewsCount?: string;
  providerEmail?: string;
  capacity?: number;
  availableSlots?: number;
  quotaNote?: string;
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

