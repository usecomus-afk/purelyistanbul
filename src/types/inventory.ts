/**
 * Xenios Hybrid Inventory & Overbooking Prevention Engine Data Types
 * Supports Tip A (Native Firestore ACID) and Tip B (OCTO Channel Manager API)
 */

export type InventoryType = 'NATIVE_FIRESTORE' | 'OCTO_API';

export type LockStatus = 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'RELEASED';

export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';

// ==========================================
// 1. Listings (İlanlar)
// ==========================================
export interface Listing {
  id: string;
  title: string;
  category: 'hamam' | 'bosphorus_cruise' | 'workshop' | 'tour' | 'transfer' | 'gastronomy';
  inventory_type: InventoryType;
  provider_id: string;
  provider_name: string;
  provider_phone?: string;
  price_eur: number;
  currency: string;
  duration?: string;
  location: string;
  
  // Tip B için Harici Entegrasyon Konfigürasyonu
  octo_config?: OctoChannelConfig;

  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface OctoChannelConfig {
  provider_platform: 'BOKUN' | 'FAREHARBOR' | 'GENERIC_OCTO';
  endpoint_url: string;
  api_key_secret_id: string; // Google Secret Manager veya Env referansı
  product_id: string;
  option_id: string;
  supplier_id?: string;
}

// ==========================================
// 2. Listing Slots (Seans ve Kapasite) - Tip A
// ==========================================
export interface ListingSlot {
  slot_id: string;             // Format: `${listing_id}_${YYYYMMDD_HHmm}`
  listing_id: string;
  start_time: string;          // ISO Date
  end_time: string;            // ISO Date
  date?: string;               // YYYY-MM-DD
  time_slot?: string;          // HH:mm
  capacity: number;            // Toplam kontenjan
  booked_count: number;        // Kesinleşmiş satılan koltuk sayısı
  locked_count: number;        // Aktif ödeme aşamasındaki geçici kilitler
  available_spots: number;     // capacity - (booked_count + locked_count)
  status?: 'open' | 'closed' | 'sold_out';
  closed_reason?: string;
  external_source?: 'none' | 'airbnb' | 'booking' | 'tripadvisor' | 'octo' | 'manual';
  version: number;             // Optimistic concurrency versiyonu
  updated_at: string;
}

// ==========================================
// 3. Inventory Locks (Geçici Kontenjan Kilitleri)
// ==========================================
export interface InventoryLock {
  lock_id: string;             // UUID v4
  slot_id: string;
  listing_id: string;
  guest_id: string;
  hotel_id: string;
  room_number: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  spots_count: number;
  
  status: LockStatus;
  created_at: string;          // ISO Date
  expires_at: string;          // created_at + 10 Dakika TTL
  
  payment_intent_id?: string;
  converted_booking_id?: string;
}

// ==========================================
// 4. Bookings (Kesinleşen Rezervasyonlar)
// ==========================================
export interface InventoryBooking {
  booking_id: string;
  listing_id: string;
  slot_id?: string;
  inventory_type: InventoryType;
  
  guest_details: {
    guest_id: string;
    guest_name: string;
    hotel_id: string;
    hotel_name: string;
    room_number: string;
    phone: string;
    email: string;
  };
  
  spots_count: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  
  // Tip A Referansı
  lock_id?: string;
  
  // Tip B OCTO Referansları
  octo_booking_reference?: string;
  octo_voucher_url?: string;
  octo_barcode?: string;
  
  payment_intent_id?: string;
  confirmation_code: string;
  created_at: string;
  confirmed_at: string;
}

// ==========================================
// 5. OCTO Standard v1.0.0 DTOs
// ==========================================
export interface OctoAvailabilityCheckRequest {
  productId: string;
  optionId: string;
  localDate: string;           // YYYY-MM-DD
}

export interface OctoAvailabilitySlot {
  id: string;
  localDateTimeStart: string;
  localDateTimeEnd: string;
  allDay: boolean;
  available: boolean;
  status: 'AVAILABLE' | 'FREESALE' | 'SOLD_OUT' | 'LIMITED';
  vacancies: number;
  capacity: number;
  maxUnits?: number;
  pricing?: {
    currency: string;
    retail: number;
    net?: number;
  };
}

export interface OctoHoldRequest {
  productId: string;
  optionId: string;
  availabilityId: string;
  units: Array<{
    id: string;
    quantity: number;
  }>;
  holdExpirationMinutes?: number; // Varsayılan: 15 dk
}

export interface OctoHoldResponse {
  id: string;                  // External Booking UUID
  status: 'ON_HOLD';
  utcHoldExpiration: string;
  reference: string;
  orderId?: string;
}

export interface OctoBookingPayload {
  productId: string;
  optionId: string;
  availabilityId: string;
  units: Array<{
    id: string;
    quantity: number;
  }>;
  contact: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    notes?: string;
  };
  notes?: string;
}

export interface OctoBookingResult {
  id: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  reference: string;
  voucher?: {
    deliveryUrl?: string;
    redemptionUrl?: string;
  };
  ticket?: {
    url?: string;
    barcode?: string;
  };
}

// ==========================================
// 6. Fail-Safe Alert & Retry Models
// ==========================================
export interface FailSafeAlertPayload {
  alert_id: string;
  type: 'OCTO_CONFIRMATION_TIMEOUT' | 'LOCK_INTEGRITY_MISMATCH' | 'SUPPLIER_MANUAL_ACTION_REQUIRED';
  listing_id: string;
  provider_name: string;
  provider_phone: string;
  guest_name: string;
  hotel_room: string;
  spots_count: number;
  error_details: string;
  timestamp: string;
}
