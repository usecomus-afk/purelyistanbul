export interface BookedItineraryItem {
  booking_id: string;
  title: string;
  category: string;
  location_name: string;
  district: string;
  location_coordinates: { lat: number; lng: number };
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: 'CONFIRMED' | 'COMPLETED';
}

export interface UserPreferences {
  guest_id: string;
  first_name: string;
  last_name: string;
  hotel_info: {
    hotel_id: string;
    hotel_name: string;
    room_number: string;
    district: string; // Örn: "Sultanahmet", "Galata", "Nişantaşı"
    location: { lat: number; lng: number };
  };
  know_me_profile: {
    travel_purpose: 'LEISURE' | 'BUSINESS' | 'HEALTH_AESTHETICS' | 'GASTRONOMY';
    interests: {
      aesthetic_and_wellness: {
        interested: boolean;
        sub_categories: ('HYDRAFACIAL' | 'BOTOX_FILLERS' | 'HAIR_TRANSPLANT' | 'SPA_MASSAGE' | 'HAMMAM' | 'DENTAL_SMILE')[];
      };
      gastronomy: boolean;
      bosphorus_tours: boolean;
      real_estate_investment: boolean;
      nightlife_pubcrawl: boolean;
    };
    budget_tier: 'BUDGET' | 'MODERATE' | 'LUXURY';
  };
  // Misafirin uygulama içinde tıkladığı / incelediği ilan geçmişi
  viewed_listings_history: {
    listing_id: string;
    title: string;
    category: string;
    district: string;
    viewed_at: string;
  }[];
  // Misafirin "istemiyorum", "ilgilenmiyorum" dediği KESİN KİLİTLİ kategoriler
  blacklisted_offers: {
    topic_or_category: string; // Örn: "GAYRIMENKUL_YATIRIM", "PUB_CRAWL"
    rejected_at: string;
    reason?: string;
  }[];
  // Satın alınan / randevusu onaylanan etkinlikler dizisi
  booked_itinerary: BookedItineraryItem[];
}

export interface AiActionItem {
  id: string;
  type: 'BOOK_APPOINTMENT' | 'VIEW_ITINERARY' | 'GET_DIRECTIONS' | 'VIEW_LISTING' | 'OPEN_SURVEY';
  label: string;
  payload?: {
    listing_id?: string;
    service_title?: string;
    preferred_date?: string;
    preferred_time?: string;
    booking_type?: string;
    coordinates?: { lat: number; lng: number };
    url?: string;
  };
}

export interface ComusAiChatRequest {
  message: string;
  user_preferences?: Partial<UserPreferences>;
  hotelName?: string;
  hotelDistrict?: string;
  roomNumber?: string;
  language?: string;
  session_history?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface ComusAiChatResponse {
  reply: string;
  actions?: AiActionItem[];
  recommendations?: Array<{
    title: string;
    category: string;
    location: string;
    action?: string;
  }>;
  itinerary_update?: any;
  negative_locked_categories?: string[];
  source: 'gemini_2_5_flash' | 'instant_knowledge' | 'cache_hit' | 'local_fallback' | 'error_fallback';
  tokensSaved?: boolean;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokensSaved: number;
    estimatedCostUSD: number;
    source: string;
  };
}
