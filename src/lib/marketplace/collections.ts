/**
 * Marketplace modülünün Firestore koleksiyon adları.
 * Mevcut uygulamanın koleksiyonlarıyla (hotels, experiences, listings, bookings, ...)
 * çakışmaması için tamamen ayrı adlandırma kullanılır.
 */
export const MARKETPLACE_COLLECTIONS = {
  USERS: 'users',
  HOST_APPLICATIONS: 'host_applications',
  LISTINGS: 'marketplace_listings',
  BOOKINGS: 'marketplace_bookings',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  LEGAL_CONSENTS: 'legal_consents',
  CMS_MEDIA: 'cms_media',
  CONTACT_MESSAGES: 'marketplace_contact_messages'
} as const;
