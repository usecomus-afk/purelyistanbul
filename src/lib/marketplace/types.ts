/**
 * Purely Istanbul Marketplace — Firestore şema tipleri.
 *
 * Bu modül mevcut Xenios/purelyIstanbul Next.js uygulamasına eklenen, Airbnb tarzı
 * host/guest ilan pazaryerini kapsar. Mevcut `listings`/`bookings` koleksiyonları
 * (OCTO tur/deneyim rezervasyon sistemi, bkz. firestore.rules) ile çakışmamak için
 * bu modülün koleksiyonları `marketplace_` önekini taşır.
 *
 * Komisyon modeli: ilk etapta sabit bir oran yok. Her host başvurusu admin
 * tarafından incelenir; onaylanırken admin `hostRate` / `platformRate` değerlerini
 * belirler ve bu oran host'un profiline (`HostProfile.commissionRate`) yazılır.
 * Kullanıcıya komisyon bilgisi ancak başvurusu onaylandığında iletilir.
 */

export type UserRole = 'guest' | 'host';

export type HostApplicationStatus = 'pending' | 'approved' | 'rejected';

/** Onaylanmış host'un komisyon anlaşması. Toplamı 1.0 (100%) etmesi beklenir. */
export interface CommissionRate {
  hostRate: number;
  platformRate: number;
  /** Admin onay notu / anlaşma özeti, host'a bildirimde gösterilir. */
  note?: string;
  setBy: string; // admin uid
  setAt: string; // ISO
}

/** users/{uid} */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  roles: {
    guest: true;
    host: boolean;
  };
  activeRole: UserRole;
  /** Sadece roles.host === true olduğunda dolu. */
  hostProfile?: {
    applicationId: string;
    commissionRate: CommissionRate;
    approvedAt: string;
  };
  isAdmin?: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

/** host_applications/{id} */
export interface HostApplication {
  id: string;
  uid: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  businessType: 'individual' | 'company';
  taxId?: string;
  about: string;
  status: HostApplicationStatus;
  /** Onaylanınca admin tarafından set edilir; reddedilirse boş kalır. */
  commissionRate?: CommissionRate;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ListingType = 'stay' | 'experience';
export type ListingStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';

/** Cloud Storage'a yüklenen bir ilan fotoğrafı; path silme işlemi için saklanır. */
export interface ListingImage {
  url: string;
  path: string;
}

/** marketplace_listings/{id} */
export interface MarketplaceListing {
  id: string;
  hostId: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  images: ListingImage[];
  coverImageUrl?: string;
  /** Kısa bölge/mahalle etiketi, örn. "Sultanahmet, Fatih" */
  district: string;
  address?: string;
  coords?: { lat: number; lng: number };
  pricing: {
    basePrice: number;
    currency: string;
    cleaningFee?: number;
  };
  capacity: number;
  amenities: string[];
  status: ListingStatus;
  /** Listing onaylanırken host'un o anki komisyon oranından kopyalanır. */
  commissionRateSnapshot?: CommissionRate;
  rejectedReason?: string;
  stats: {
    viewCount: number;
    clickCount: number;
    favoriteCount: number;
    bookingCount: number;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';

/** marketplace_bookings/{id} */
export interface MarketplaceBooking {
  id: string;
  listingId: string;
  hostId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'completed' | 'failed';
/** Şu an sadece 'mock'. Sanal POS anlaşması sağlandığında yeni değerler eklenecek. */
export type PaymentProvider = 'mock' | 'iyzico' | 'paytr' | 'stripe';

/** orders/{id} — ödeme durumu takibi (Virtual POS entegrasyonuna hazır) */
export interface Order {
  id: string;
  bookingId: string;
  listingId: string;
  guestId: string;
  hostId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  provider: PaymentProvider;
  providerRef?: string;
  /** Ödeme tamamlandığında komisyon hesaplaması burada donar. */
  splitBreakdown?: {
    hostAmount: number;
    platformAmount: number;
    hostRate: number;
    platformRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

/** reviews/{id} */
export interface Review {
  id: string;
  listingId: string;
  bookingId: string;
  guestId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

/** favorites/{uid}_{listingId} — çift taraflı sorgu (kullanıcının favorileri / ilanın favori sayısı) için top-level koleksiyon */
export interface Favorite {
  id: string;
  uid: string;
  listingId: string;
  createdAt: string;
}

export type ConsentContext = 'registration' | 'booking';

/**
 * legal_consents/{id} — KVKK/GDPR kanıt kaydı. Çerez tercihleri burada DEĞİL;
 * onlar localStorage'da tutulur (bkz. src/lib/marketplace/cookie-consent.ts).
 * Bu koleksiyon sadece kayıt/rezervasyon sırasında zorunlu sözleşme onaylarının
 * ispat edilebilir logunu tutar.
 */
export interface LegalConsentRecord {
  id: string;
  uid?: string;
  context: ConsentContext;
  documents: {
    userAgreementVersion: string;
    privacyPolicyVersion: string;
    distanceSalesAgreementVersion: string;
    preInfoFormVersion: string;
  };
  acceptedAt: string;
}

/** marketplace_contact_messages/{id} — herkese açık iletişim formu gönderimi. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  uid?: string;
  createdAt: string;
}

/** cms_media/{id} — Cloud Storage'a yüklenen site içeriği görselleri (admin CMS) */
export interface CmsMediaAsset {
  id: string;
  key: string;
  storagePath: string;
  url: string;
  altText?: string;
  uploadedBy: string;
  uploadedAt: string;
  isActive: boolean;
}
