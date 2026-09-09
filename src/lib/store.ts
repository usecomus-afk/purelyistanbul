import { Hotel, Room, ServiceRequest, Booking, GuestProfile, Language, Complaint, ComplaintStatus, XeniosUser, Experience, ModuleAdminSettings, ModuleAdminSettingsMap, PropertyListing, InvestmentLead, InRoomServiceItem, RoomServiceMenuItem, OTAChannelItem, AiTokenStats, TokenUsageInfo } from './types';
import { UserPreferences } from '@/types/comusAi';
import rawHotels from '@/data/hotels.json';
import rawExperiences from '@/data/experiences.json';
import rawProperties from '@/data/properties.json';

const hotelsData: Hotel[] = rawHotels as Hotel[];

const STORAGE_KEYS = {
  CURRENT_HOTEL: 'xenios_hotel_id',
  CURRENT_ROOM: 'xenios_room_id',
  LANG: 'xenios_lang',
  REQUESTS: 'xenios_live_requests',
  BOOKINGS: 'xenios_bookings',
  PROFILE: 'xenios_guest_profile',
  USER_PREFERENCES: 'xenios_user_preferences',
  COMPLAINTS: 'xenios_tourist_complaints',
  CURRENT_USER: 'xenios_auth_user',
  MODULE_SETTINGS: 'xenios_module_settings',
  IN_ROOM_SERVICES: 'xenios_in_room_services_v2',
  PROPERTIES: 'xenios_custom_properties',
  INVESTMENT_LEADS: 'xenios_investment_leads',
  HIDE_DEMO_DATA: 'xenios_hide_demo_data',
  ROOM_SERVICE_MENU: 'xenios_room_service_menu',
  OTA_CHANNELS: 'xenios_ota_channels',
  AI_TOKEN_USAGE: 'xenios_ai_token_usage',
  AI_CHAT_MESSAGES: 'xenios_ai_chat_messages'
};

const DEFAULT_MODULE_SETTING: ModuleAdminSettings = { enabled: true, hidden: false };

function safeGet(key: string, defaultVal: string = ''): string {
  if (typeof window === 'undefined') return defaultVal;
  try {
    return localStorage.getItem(key) || defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function safeSet(key: string, val: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, val);
  } catch (e) {}
}

export const XeniosStore = {
  // User Authentication
  getUser(): XeniosUser | null {
    try {
      const stored = safeGet(STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  },

  setUser(user: XeniosUser | null) {
    if (user) {
      safeSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_auth_updated'));
    }
  },

  logout() {
    this.setUser(null);
  },

  // Hotels Management & Live Inventory
  getHotels(): Hotel[] {
    try {
      const stored = safeGet('xenios_custom_hotels');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return hotelsData;
  },

  saveHotels(hotels: Hotel[]) {
    safeSet('xenios_custom_hotels', JSON.stringify(hotels));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_hotels_updated'));
    }
  },

  addHotel(hotel: Hotel) {
    const list = this.getHotels();
    list.push(hotel);
    this.saveHotels(list);
  },

  updateHotel(id: string, updated: Partial<Hotel>) {
    const list = this.getHotels().map(h => h.id === id ? { ...h, ...updated } : h);
    this.saveHotels(list);
  },

  deleteHotel(id: string) {
    const list = this.getHotels().filter(h => h.id !== id);
    this.saveHotels(list);
  },

  getHotelById(id: string): Hotel | undefined {
    return this.getHotels().find(h => h.id === id) || this.getHotels()[0];
  },

  getHotelManagerProfile(hotelId?: string) {
    const key = `xenios_manager_profile_${hotelId || this.getActiveHotelId()}`;
    try {
      const stored = safeGet(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      managerName: 'Ahmet Yılmaz',
      managerTitle: 'Genel Müdür / Ön Büro Direktörü',
      managerPhone: '+90 532 555 44 33',
      contactEmail: 'heritage@xenios.istanbul',
      notificationEmail: 'concierge@heritagehotel.com',
      notifyOnNewBooking: true,
      notifyOnRoomRequest: true
    };
  },

  saveHotelManagerProfile(hotelId: string, profile: any) {
    const key = `xenios_manager_profile_${hotelId}`;
    safeSet(key, JSON.stringify(profile));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_manager_profile_updated'));
    }
  },

  addRoomToHotel(hotelId: string, room: Room) {
    const hotels = this.getHotels();
    const h = hotels.find(item => item.id === hotelId);
    if (h) {
      if (!h.rooms) h.rooms = [];
      if (!h.rooms.some(r => r.number === room.number)) {
        h.rooms.push(room);
        this.saveHotels(hotels);
      }
    }
  },

  updateRoomInHotel(hotelId: string, roomNumber: string, updated: Partial<Room>) {
    const hotels = this.getHotels();
    const h = hotels.find(item => item.id === hotelId);
    if (h && h.rooms) {
      h.rooms = h.rooms.map(r => r.number === roomNumber ? { ...r, ...updated } : r);
      this.saveHotels(hotels);
    }
  },

  deleteRoomFromHotel(hotelId: string, roomNumber: string) {
    const hotels = this.getHotels();
    const h = hotels.find(item => item.id === hotelId);
    if (h && h.rooms) {
      h.rooms = h.rooms.filter(r => r.number !== roomNumber);
      this.saveHotels(hotels);
    }
  },

  // Master Admin & Hotel Portal Session Auth
  isMasterAdminLoggedIn(): boolean {
    return safeGet('xenios_master_admin_session') === '1';
  },

  setMasterAdminLoggedIn(logged: boolean) {
    safeSet('xenios_master_admin_session', logged ? '1' : '0');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_master_admin_auth'));
    }
  },

  isHotelPortalLoggedIn(): boolean {
    return safeGet('xenios_hotel_portal_session') === '1';
  },

  setHotelPortalLoggedIn(logged: boolean) {
    safeSet('xenios_hotel_portal_session', logged ? '1' : '0');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_hotel_portal_auth'));
    }
  },

  getExperiences(): Experience[] {
    try {
      const stored = safeGet('xenios_custom_experiences');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return rawExperiences as Experience[];
  },

  saveExperiences(exps: Experience[]) {
    safeSet('xenios_custom_experiences', JSON.stringify(exps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_experiences_updated'));
    }
  },

  updateExperience(id: string, updated: Partial<Experience>) {
    const list = this.getExperiences().map(e => e.id === id ? { ...e, ...updated } : e);
    this.saveExperiences(list);
  },

  updateExperienceQuota(id: string, availableSlots: number, capacity?: number) {
    const list = this.getExperiences().map(e => {
      if (e.id === id) {
        return {
          ...e,
          availableSlots: Math.max(0, availableSlots),
          capacity: capacity !== undefined ? capacity : (e.capacity || 20)
        };
      }
      return e;
    });
    this.saveExperiences(list);
  },

  addExperience(exp: Experience) {
    const list = this.getExperiences();
    list.unshift(exp);
    this.saveExperiences(list);
  },

  deleteExperience(id: string) {
    const list = this.getExperiences().filter(e => e.id !== id);
    this.saveExperiences(list);
  },

  getExperienceById(id: string) {
    return this.getExperiences().find((e: any) => e.id === id);
  },

  // Invest & Live in Istanbul — Emlak Vitrini
  getPropertyListings(): PropertyListing[] {
    try {
      const stored = safeGet(STORAGE_KEYS.PROPERTIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id?.startsWith('invest-')) {
          return parsed;
        }
      }
    } catch (e) {}
    return rawProperties as PropertyListing[];
  },

  savePropertyListings(properties: PropertyListing[]) {
    safeSet(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_properties_updated'));
    }
  },

  addPropertyListing(property: PropertyListing) {
    const list = this.getPropertyListings();
    list.unshift(property);
    this.savePropertyListings(list);
  },

  updatePropertyListing(id: string, updated: Partial<PropertyListing>) {
    const list = this.getPropertyListings().map(p => p.id === id ? { ...p, ...updated } : p);
    this.savePropertyListings(list);
  },

  deletePropertyListing(id: string) {
    const list = this.getPropertyListings().filter(p => p.id !== id);
    this.savePropertyListings(list);
  },

  trackPropertyView(property: PropertyListing) {
    const profile = this.getGuestProfile();
    const viewed = [...(profile.investPropertyTypesViewed ?? []), property.propertyType].slice(-20);
    const scores = { ...(profile.investPersonaScores ?? {}) };
    property.personas.forEach((p) => { scores[p] = (scores[p] ?? 0) + 1; });
    const personaGuess = (Object.entries(scores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0]) as GuestProfile['investPersonaGuess'];
    this.setGuestProfile({ ...profile, investPropertyTypesViewed: viewed, investPersonaScores: scores, investPersonaGuess: personaGuess });
  },

  getInvestmentLeads(): InvestmentLead[] {
    try {
      const stored = safeGet(STORAGE_KEYS.INVESTMENT_LEADS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  addInvestmentLead(lead: Omit<InvestmentLead, 'id' | 'createdAt'>): InvestmentLead {
    const list = this.getInvestmentLeads();
    const newLead: InvestmentLead = { ...lead, id: 'lead-' + Date.now(), createdAt: new Date().toISOString() };
    list.unshift(newLead);
    try {
      safeSet(STORAGE_KEYS.INVESTMENT_LEADS, JSON.stringify(list));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_investment_leads_updated'));
    } catch (e) {}
    return newLead;
  },

  // Active Session
  /**
   * True only if a hotel/room session was explicitly established (QR scan via
   * /stay/[hotelId]/[roomId], or a prior session in this browser) — unlike
   * getActiveHotelId(), this never falls back to a default demo hotel.
   * Used to tell an organic public website visitor apart from an actual
   * hotel guest, so the marketing site doesn't show in-room concierge
   * features (or the app-only intro splash) to the general public.
   */
  hasActiveHotelSession(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return !!window.localStorage.getItem(STORAGE_KEYS.CURRENT_HOTEL);
    } catch {
      return false;
    }
  },

  getActiveHotelId(): string {
    return safeGet(STORAGE_KEYS.CURRENT_HOTEL, hotelsData[0]?.id || 'hotel-1');
  },

  setActiveHotelId(id: string) {
    safeSet(STORAGE_KEYS.CURRENT_HOTEL, id);
  },

  getActiveRoomId(): string {
    return safeGet(STORAGE_KEYS.CURRENT_ROOM, '101');
  },

  setActiveRoomId(roomNum: string) {
    safeSet(STORAGE_KEYS.CURRENT_ROOM, roomNum);
  },

  getLanguage(): Language {
    const l = safeGet(STORAGE_KEYS.LANG, 'tr');
    return (['tr', 'en', 'ar', 'ru', 'de', 'fr'].includes(l) ? l : 'tr') as Language;
  },

  setLanguage(lang: Language) {
    safeSet(STORAGE_KEYS.LANG, lang);
  },

  // In-Room Service Requests
  getRequests(): ServiceRequest[] {
    try {
      const stored = safeGet(STORAGE_KEYS.REQUESTS);
      if (stored) {
        const list: ServiceRequest[] = JSON.parse(stored);
        const realList = list.filter(r => !r.isDemo && !r.id?.includes('demo'));
        if (realList.length !== list.length) {
          safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(realList));
        }
        return realList;
      }
    } catch (e) {}
    return [];
  },

  addRequest(req: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): ServiceRequest {
    const list = this.getRequests();
    const newReq: ServiceRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newReq);
    try {
      safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_requests_updated'));
        window.dispatchEvent(new CustomEvent('xenios_request_created', { detail: newReq }));
      }
    } catch (e) {}
    return newReq;
  },

  updateRequestStatus(id: string, status: ServiceRequest['status']) {
    const list = this.getRequests();
    const item = list.find(r => r.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      try {
        safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
      } catch (e) {}
    }
  },

  syncRequestsFromRemote(list: ServiceRequest[]) {
    try {
      safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_requests_updated'));
      }
    } catch (e) {}
  },

  updateRequestStage(id: string, stage: string, status: ServiceRequest['status']) {
    const list = this.getRequests();
    const item = list.find(r => r.id === id);
    if (item) {
      item.stage = stage;
      item.status = status;
      item.updatedAt = new Date().toISOString();
      try {
        safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
      } catch (e) {}
    }
  },

  // Cockpit: Otel İçi Hizmet Modülleri Yönetimi
  getModuleSettings(): ModuleAdminSettingsMap {
    try {
      const stored = safeGet(STORAGE_KEYS.MODULE_SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  },

  getModuleSetting(key: string): ModuleAdminSettings {
    const all = this.getModuleSettings();
    return { ...DEFAULT_MODULE_SETTING, ...(all[key] ?? {}) };
  },

  setModuleSetting(key: string, settings: ModuleAdminSettings) {
    const all = this.getModuleSettings();
    all[key] = settings;
    try {
      safeSet(STORAGE_KEYS.MODULE_SETTINGS, JSON.stringify(all));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_module_settings_updated'));
    } catch (e) {}
  },

  // In-Room Services
  getInRoomServices(): InRoomServiceItem[] {
    const defaultServices: InRoomServiceItem[] = [
      { id: 'breakfast', key: 'breakfast', label: 'Kahvaltı Talebi', desc: 'Odaya sıcak kahvaltı servisi', icon: '/icons/menu/breakfast.png', department: 'Room Service (Mutfak KDS)', enabled: true, hidden: false, order: 1 },
      { id: 'dnd', key: 'dnd', label: 'Rahatsız Etmeyin', desc: 'Rahatsız edilmek istemiyorum', icon: '/icons/menu/dnd.png', department: 'Housekeeping', enabled: true, hidden: false, order: 2 },
      { id: 'cleaning', key: 'cleaning', label: 'Oda Temizliği', desc: 'Oda temizliği ve havalandırma', icon: '/icons/menu/cleaning.png', department: 'Housekeeping', enabled: true, hidden: false, order: 3 },
      { id: 'towels', key: 'towels', label: 'Temiz Havlu', desc: 'Banyo & el havluları değişimi', icon: '/icons/menu/towels.png', department: 'Housekeeping', enabled: true, hidden: false, order: 4 },
      { id: 'linens', key: 'linens', label: 'Çarşaf & Nevresim', desc: 'Çarşaf ve nevresim takımı', icon: '/icons/menu/linens.png', department: 'Housekeeping', enabled: true, hidden: false, order: 5 },
      { id: 'pillows', key: 'pillows', label: 'Ekstra Yastık', desc: 'Ortopedik / ekstra yastık', icon: '/icons/menu/pillows.png', department: 'Housekeeping', enabled: true, hidden: false, order: 6 },
      { id: 'toiletries', key: 'toiletries', label: 'Banyo Bukleti', desc: 'Şampuan, duş jeli, sabun', icon: '/icons/menu/toiletries.png', department: 'Housekeeping', enabled: true, hidden: false, order: 7 },
      { id: 'hygiene', key: 'hygiene', label: 'Hijyen & Bakım Seti', desc: 'Diş & tıraş seti, terlik', icon: '/icons/menu/hygiene.png', department: 'Housekeeping', enabled: true, hidden: false, order: 8 },
      { id: 'roomservice', key: 'roomservice', label: 'Oda Servisi', desc: 'Yiyecek & içecek menüsü', icon: '/icons/menu/roomservice.png', department: 'Room Service (Mutfak KDS)', enabled: true, hidden: false, order: 9 },
      { id: 'minibar', key: 'minibar', label: 'Mini Bar Dolumu', desc: 'Mini bar dolumu ve su', icon: '/icons/menu/minibar.png', department: 'Housekeeping', enabled: true, hidden: false, order: 10 },
      { id: 'safe', key: 'safe', label: 'Kasa & Güvenlik', desc: 'Kasa kullanımı & güvenlik', icon: '/icons/menu/safe.png', department: 'Resepsiyon & Güvenlik', enabled: true, hidden: false, order: 11 },
      { id: 'technical', key: 'technical', label: 'Teknik Destek', desc: 'Klima, TV, priz ve aydınlatma', icon: '/icons/menu/technical.png', department: 'Teknik Servis', enabled: true, hidden: false, order: 12 },
      { id: 'laundry', key: 'laundry', label: 'Çamaşırhane & Ütü', desc: 'Kuru temizleme ve ütü', icon: '/icons/menu/laundry.png', department: 'Housekeeping (Çamaşırhane)', enabled: true, hidden: false, order: 13 },
      { id: 'lateCheckout', key: 'lateCheckout', label: 'Geç Çıkış Talebi', desc: "Saat 14:00'e kadar geç çıkış", icon: '/icons/menu/lateCheckout.png', department: 'Resepsiyon / Ön Büro', enabled: true, hidden: false, order: 14 },
      { id: 'extendStay', key: 'extendStay', label: 'Konaklama Uzatma', desc: 'Konaklama süresini uzat', icon: '/icons/menu/extendStay.png', department: 'Resepsiyon / Rezervasyon', enabled: true, hidden: false, order: 15 },
      { id: 'taxi', key: 'taxi', label: 'Taksi Çağır', desc: 'Otel kapısına sarı taksi', icon: '/icons/menu/taksi.png', department: 'Concierge / Bellboy', enabled: true, hidden: false, order: 16 }
    ];

    let items: InRoomServiceItem[] = defaultServices;
    try {
      const stored = safeGet(STORAGE_KEYS.IN_ROOM_SERVICES);
      if (stored) {
        items = JSON.parse(stored);
      }
    } catch (e) {}

    const moduleSettings = this.getModuleSettings();
    return items.map(item => {
      const ms = moduleSettings[item.key];
      return {
        ...item,
        enabled: ms?.enabled !== undefined ? ms.enabled : item.enabled,
        hidden: ms?.hidden !== undefined ? ms.hidden : item.hidden
      };
    }).sort((a, b) => (a.order || 99) - (b.order || 99));
  },

  saveInRoomService(item: InRoomServiceItem) {
    const list = this.getInRoomServices();
    const idx = list.findIndex(s => s.id === item.id || s.key === item.key);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push({ ...item, isCustom: true, order: list.length + 1 });
    }

    try {
      safeSet(STORAGE_KEYS.IN_ROOM_SERVICES, JSON.stringify(list));
      this.setModuleSetting(item.key, {
        enabled: item.enabled,
        hidden: item.hidden,
        pricing: item.pricingDefaults,
        fieldOptions: item.fieldOptions
      });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_in_room_services_updated'));
    } catch (e) {}
  },

  deleteInRoomService(idOrKey: string) {
    let list = this.getInRoomServices();
    const item = list.find(s => s.id === idOrKey || s.key === idOrKey);
    if (item?.isCustom) {
      list = list.filter(s => s.id !== idOrKey && s.key !== idOrKey);
    } else if (item) {
      item.hidden = true;
    }
    try {
      safeSet(STORAGE_KEYS.IN_ROOM_SERVICES, JSON.stringify(list));
      if (item) {
        this.setModuleSetting(item.key, { enabled: item.enabled, hidden: true });
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_in_room_services_updated'));
    } catch (e) {}
  },

  resetInRoomServicesToDefault() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.IN_ROOM_SERVICES);
        localStorage.removeItem(STORAGE_KEYS.MODULE_SETTINGS);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_in_room_services_updated'));
        window.dispatchEvent(new Event('xenios_module_settings_updated'));
      }
    } catch (e) {}
  },

  // Room Service (F&B) Menu Management
  getRoomServiceMenu(hotelId?: string): RoomServiceMenuItem[] {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const defaultMenu: RoomServiceMenuItem[] = [
      {
        id: 'menu-item-1',
        hotelId: targetHotelId,
        name: 'Geleneksel Türk Serpme Kahvaltısı',
        category: 'Kahvaltı',
        description: 'Ezine peyniri, Kars kaşarı, petek bal, kaymak, organik zeytin çeşitleri, tereyağı, domates, salatalık, menemen ve taze pişmiş simit.',
        ingredients: 'Yumurta, Peynir Çeşitleri, Bal, Kaymak, Zeytin, Tereyağı, Simit',
        price: 24,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-1.jpg',
        available: true,
        preparationTimeMinutes: 20,
        createdAt: new Date().toISOString()
      },
      {
        id: 'menu-item-2',
        hotelId: targetHotelId,
        name: 'Dana Antrikot Izgara & Trüflü Patates Püresi',
        category: 'Ana Yemek',
        description: 'Közlenmiş arpacık soğan, ızgara kuşkonmaz ve trüf yağlı taze patates püresi eşliğinde 220gr dinlendirilmiş antrikot.',
        ingredients: '220gr Dana Antrikot, Trüf Yağı, Patates, Kuşkonmaz, Biberiye',
        price: 34,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-2.jpg',
        available: true,
        preparationTimeMinutes: 25,
        createdAt: new Date().toISOString()
      },
      {
        id: 'menu-item-3',
        hotelId: targetHotelId,
        name: 'El Yapımı Yaban Mantarlı Fettuccine',
        category: 'Ana Yemek',
        description: 'Porçini ve istiridye mantarları, taze krema sosu, parmesan peyniri ve taze kekik yaprakları ile taze el açması makarna.',
        ingredients: 'Taze Makarna, Porçini Mantarı, Krema, Parmesan, Sarımsak',
        price: 21,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-3.jpg',
        available: true,
        preparationTimeMinutes: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: 'menu-item-4',
        hotelId: targetHotelId,
        name: 'Xenios Gurme Kulüp Sandviç',
        category: 'Atıştırmalık',
        description: 'Izgara tavuk göğsü, füme dana eti, haşlanmış yumurta, kaşar peyniri, domates, marul ve çıtır patates kızartması.',
        ingredients: 'Tost Ekmeği, Tavuk Göğsü, Füme Et, Yumurta, Patates',
        price: 16,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-4.jpg',
        available: true,
        preparationTimeMinutes: 12,
        createdAt: new Date().toISOString()
      },
      {
        id: 'menu-item-5',
        hotelId: targetHotelId,
        name: 'Geleneksel Fırın Sütlaç & Fındık',
        category: 'Tatlı',
        description: 'Taş fırında nar gibi kızartılmış karamelize kabuklu hakiki manda sütlü fırın sütlaç, kavrulmuş Giresun fındığı ile.',
        ingredients: 'Manda Sütü, Pirinç, Şeker, Giresun Fındığı, Vanilya',
        price: 9,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-5.jpg',
        available: true,
        preparationTimeMinutes: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'menu-item-6',
        hotelId: targetHotelId,
        name: 'Taze Sıkılmış Akdeniz Portakal Suyu',
        category: 'İçecek',
        description: 'Antalya Finike bahçelerinden günlük taze sıkılmış %100 doğal katkısız portakal suyu.',
        ingredients: '%100 Doğal Portakal',
        price: 7,
        currency: 'EUR',
        image: '/images/experiences/exp-gastro-6.jpg',
        available: true,
        preparationTimeMinutes: 5,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      const stored = safeGet(`${STORAGE_KEYS.ROOM_SERVICE_MENU}_${targetHotelId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return defaultMenu;
  },

  saveRoomServiceMenu(hotelId: string, menu: RoomServiceMenuItem[]) {
    safeSet(`${STORAGE_KEYS.ROOM_SERVICE_MENU}_${hotelId}`, JSON.stringify(menu));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_room_service_menu_updated'));
    }
  },

  addRoomServiceMenuItem(hotelId: string, item: Omit<RoomServiceMenuItem, 'id' | 'createdAt'>) {
    const list = this.getRoomServiceMenu(hotelId);
    const newItem: RoomServiceMenuItem = {
      ...item,
      id: `menu-item-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newItem);
    this.saveRoomServiceMenu(hotelId, list);
    return newItem;
  },

  updateRoomServiceMenuItem(hotelId: string, id: string, updated: Partial<RoomServiceMenuItem>) {
    const list = this.getRoomServiceMenu(hotelId).map(item => item.id === id ? { ...item, ...updated } : item);
    this.saveRoomServiceMenu(hotelId, list);
  },

  deleteRoomServiceMenuItem(hotelId: string, id: string) {
    const list = this.getRoomServiceMenu(hotelId).filter(item => item.id !== id);
    this.saveRoomServiceMenu(hotelId, list);
  },

  // OTA & iCal Channels Management
  getOTAChannels(hotelId?: string): OTAChannelItem[] {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const defaultChannels: OTAChannelItem[] = [
      { id: 'chan-1', hotelId: targetHotelId, name: 'Airbnb', roomNumber: 'all', feedUrl: 'https://www.airbnb.com/calendar/ical/sample-hotel.ics', status: 'Senkronize', lastSync: '10 dk önce', active: true },
      { id: 'chan-2', hotelId: targetHotelId, name: 'Booking.com', roomNumber: 'all', feedUrl: 'https://admin.booking.com/hotel/hotelparams/ical.html', status: 'Senkronize', lastSync: '6 dk önce', active: true },
      { id: 'chan-3', hotelId: targetHotelId, name: 'VRBO / HomeAway', roomNumber: 'all', feedUrl: 'https://www.vrbo.com/icalendar/sample.ics', status: 'Senkronize', lastSync: '18 dk önce', active: true },
      { id: 'chan-4', hotelId: targetHotelId, name: 'Expedia Partner', roomNumber: 'all', feedUrl: 'https://www.expediapartnercentral.com/ical/feed.ics', status: 'Senkronize', lastSync: '14 dk önce', active: true }
    ];

    try {
      const stored = safeGet(`${STORAGE_KEYS.OTA_CHANNELS}_${targetHotelId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return defaultChannels;
  },

  saveOTAChannels(hotelId: string, channels: OTAChannelItem[]) {
    safeSet(`${STORAGE_KEYS.OTA_CHANNELS}_${hotelId}`, JSON.stringify(channels));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_ota_channels_updated'));
    }
  },

  addOTAChannel(hotelId: string, channel: Omit<OTAChannelItem, 'id'>) {
    const list = this.getOTAChannels(hotelId);
    const newChan: OTAChannelItem = {
      ...channel,
      id: `chan-${Date.now()}`
    };
    list.unshift(newChan);
    this.saveOTAChannels(hotelId, list);
    return newChan;
  },

  deleteOTAChannel(hotelId: string, id: string) {
    const list = this.getOTAChannels(hotelId).filter(c => c.id !== id);
    this.saveOTAChannels(hotelId, list);
  },

  isDemoDataHidden(): boolean {
    return true;
  },

  setHideDemoData(_val: boolean) {
    // Demo data permanently hidden
  },

  // Bookings & Virtual POS
  getBookings(): Booking[] {
    try {
      const stored = safeGet(STORAGE_KEYS.BOOKINGS);
      if (stored) {
        const list: Booking[] = JSON.parse(stored);
        const realList = list.filter(b => !b.isDemo && !b.id?.includes('demo'));
        if (realList.length !== list.length) {
          safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(realList));
        }
        return realList;
      }
    } catch (e) {}
    return [];
  },

  addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'confirmationCode'>): Booking {
    const list = this.getBookings();
    const confirmationCode = 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newBooking: Booking = {
      ...booking,
      id: `book-${Date.now()}`,
      confirmationCode,
      createdAt: new Date().toISOString()
    };
    list.unshift(newBooking);
    try {
      safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_bookings_updated'));
    } catch (e) {}
    return newBooking;
  },

  updateBookingStatus(id: string, status: Booking['status']) {
    const list = this.getBookings();
    const item = list.find(b => b.id === id);
    if (item) {
      item.status = status;
      try {
        safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_bookings_updated'));
      } catch (e) {}
    }
  },

  // Guest AI Profile
  getGuestProfile(): GuestProfile {
    try {
      const stored = safeGet(STORAGE_KEYS.PROFILE);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      travelStyle: 'couple',
      budgetLevel: 'luxury',
      interests: ['Boğaz Turları', 'Tarih', 'Gastronomi', 'Hamam', 'Yatırım', 'Medikal Estetik'],
      dietaryRestrictions: ['Helal', 'Deniz Ürünleri'],
      kvkkConsent: false
    };
  },

  setGuestProfile(profile: GuestProfile) {
    try {
      safeSet(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {}
  },

  clearGuestProfile() {
    const cleared: GuestProfile = { kvkkConsent: false };
    try {
      safeSet(STORAGE_KEYS.PROFILE, JSON.stringify(cleared));
    } catch (e) {}
    return cleared;
  },

  // -------------------------------------------------------------
  // Comus AI User Preferences & Viewed Listings State Engine
  // -------------------------------------------------------------
  getUserPreferences(): UserPreferences {
    try {
      const stored = safeGet(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Default Initial State for Alex Mercer
    return {
      guest_id: 'usr_alex_304',
      first_name: 'Alex',
      last_name: 'Mercer',
      hotel_info: {
        hotel_id: this.getActiveHotelId(),
        hotel_name: 'Pera Palace Hotel',
        room_number: this.getActiveRoomId(),
        district: 'Beyoğlu',
        location: { lat: 41.0312, lng: 28.9744 }
      },
      know_me_profile: {
        travel_purpose: 'HEALTH_AESTHETICS',
        interests: {
          aesthetic_and_wellness: {
            interested: true,
            sub_categories: ['HYDRAFACIAL', 'SPA_MASSAGE', 'HAMMAM', 'BOTOX_FILLERS']
          },
          gastronomy: true,
          bosphorus_tours: true,
          real_estate_investment: false,
          nightlife_pubcrawl: false
        },
        budget_tier: 'LUXURY'
      },
      viewed_listings_history: [
        {
          listing_id: 'exp-1',
          title: 'Tarihi Cağaloğlu Hamamı Masaj & Kese',
          category: 'Kültür & Hamam',
          district: 'Sultanahmet',
          viewed_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          listing_id: 'exp-aesthetic-1',
          title: 'Quartz Clinique – Nişantaşı Glow & Fraksiyonel Cilt Yenileme',
          category: 'Medikal Estetik',
          district: 'Nişantaşı / Şişli',
          viewed_at: new Date(Date.now() - 1800000).toISOString()
        }
      ],
      blacklisted_offers: [],
      booked_itinerary: [
        {
          booking_id: 'bk_sample_01',
          title: 'Mega Lüfer Sunset Dinner Cruise',
          category: 'Boğaz & Tekne',
          location_name: 'Kabataş İskelesi',
          district: 'Beyoğlu',
          location_coordinates: { lat: 41.0365, lng: 28.9895 },
          date: '2026-08-24',
          start_time: '19:30',
          end_time: '22:30',
          status: 'CONFIRMED'
        }
      ]
    };
  },

  saveUserPreferences(prefs: UserPreferences) {
    safeSet(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_user_preferences_updated'));
    }
  },

  updateUserPreferences(partial: Partial<UserPreferences>) {
    const current = this.getUserPreferences();
    const updated = {
      ...current,
      ...partial,
      hotel_info: { ...current.hotel_info, ...(partial.hotel_info || {}) },
      know_me_profile: { ...current.know_me_profile, ...(partial.know_me_profile || {}) }
    };
    this.saveUserPreferences(updated);
    return updated;
  },

  addViewedListing(listing: { listing_id: string; title: string; category: string; district: string }) {
    const prefs = this.getUserPreferences();
    const history = [...(prefs.viewed_listings_history || [])];
    
    // Avoid immediate duplicate
    if (history.length === 0 || history[history.length - 1].listing_id !== listing.listing_id) {
      history.push({
        ...listing,
        viewed_at: new Date().toISOString()
      });
      // Keep last 15
      if (history.length > 15) history.shift();
      prefs.viewed_listings_history = history;
      this.saveUserPreferences(prefs);
    }
  },

  addBlacklistedOffer(topic_or_category: string, reason?: string) {
    const prefs = this.getUserPreferences();
    const list = [...(prefs.blacklisted_offers || [])];
    if (!list.some(b => b.topic_or_category.toUpperCase() === topic_or_category.toUpperCase())) {
      list.push({
        topic_or_category: topic_or_category.toUpperCase(),
        rejected_at: new Date().toISOString(),
        reason: reason || 'Kullanıcı ilgilenmediğini belirtti'
      });
      prefs.blacklisted_offers = list;
      this.saveUserPreferences(prefs);
    }
  },

  getBookedItinerary() {
    return this.getUserPreferences().booked_itinerary || [];
  },

  addToBookedItinerary(item: UserPreferences['booked_itinerary'][0]) {
    const prefs = this.getUserPreferences();
    const list = [...(prefs.booked_itinerary || [])];
    list.push(item);
    prefs.booked_itinerary = list;
    this.saveUserPreferences(prefs);
  },

  getAiIntroDismissed(): boolean {
    return safeGet('xenios_ai_intro_dismissed') === '1';
  },

  setAiIntroDismissed(v: boolean) {
    safeSet('xenios_ai_intro_dismissed', v ? '1' : '0');
  },

  // Tourist Complaints
  getComplaints(): Complaint[] {
    try {
      const stored = safeGet(STORAGE_KEYS.COMPLAINTS);
      if (stored) {
        const list: Complaint[] = JSON.parse(stored);
        const realList = list.filter(c => !c.isDemo && !c.id?.includes('demo'));
        if (realList.length !== list.length) {
          safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(realList));
        }
        return realList;
      }
    } catch (e) {}
    return [];
  },

  addComplaint(complaint: Omit<Complaint, 'id' | 'trackingCode' | 'daysPending' | 'isPublicAlert' | 'createdAt' | 'updatedAt'>): Complaint {
    const list = this.getComplaints();
    const trackingCode = 'XEN-HAK-' + Math.floor(1000 + Math.random() * 9000);
    const newComp: Complaint = {
      ...complaint,
      id: `comp-${Date.now()}`,
      trackingCode,
      daysPending: 0,
      isPublicAlert: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newComp);
    try {
      safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_complaints_updated'));
    } catch (e) {}
    return newComp;
  },

  updateComplaintStatus(id: string, status: ComplaintStatus, responseNote?: string, isPublicAlert?: boolean) {
    const list = this.getComplaints();
    const item = list.find(c => c.id === id);
    if (item) {
      item.status = status;
      if (responseNote !== undefined) item.businessResponse = responseNote;
      if (isPublicAlert !== undefined) item.isPublicAlert = isPublicAlert;
      if (status === 'published_blacklisted') item.isPublicAlert = true;
      item.updatedAt = new Date().toISOString();
      try {
        safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_complaints_updated'));
      } catch (e) {}
    }
  },

  // Comus AI Token Harcama ve Tasarruf İstatistikleri
  getAiTokenStats(): AiTokenStats {
    const defaultStats: AiTokenStats = {
      totalPromptTokens: 12450,
      totalCompletionTokens: 3820,
      totalTokensUsed: 16270,
      totalTokensSaved: 54300,
      totalQueries: 142,
      cacheHitQueries: 112,
      estimatedCostUSD: 0.024,
      lastQueryTokens: 0,
      lastQuerySaved: 0,
      lastQuerySource: 'gemini_3_6_flash',
      updatedAt: new Date().toISOString()
    };

    try {
      const stored = safeGet(STORAGE_KEYS.AI_TOKEN_USAGE);
      if (stored) {
        return { ...defaultStats, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return defaultStats;
  },

  recordAiTokenUsage(usage: Partial<TokenUsageInfo>) {
    const current = this.getAiTokenStats();
    const promptTokens = Number(usage.promptTokens) || 0;
    const completionTokens = Number(usage.completionTokens) || 0;
    const totalTokens = Number(usage.totalTokens) || (promptTokens + completionTokens);
    const saved = Number(usage.cachedTokensSaved) || 0;
    const isCacheHit = usage.source === 'cache_hit' || usage.source === 'instant_knowledge';

    // Gemini pricing: $0.075 / 1M prompt, $0.30 / 1M output
    const costIncrement = ((promptTokens * 0.075) + (completionTokens * 0.30)) / 1000000;

    const updated: AiTokenStats = {
      totalPromptTokens: current.totalPromptTokens + promptTokens,
      totalCompletionTokens: current.totalCompletionTokens + completionTokens,
      totalTokensUsed: current.totalTokensUsed + totalTokens,
      totalTokensSaved: current.totalTokensSaved + saved,
      totalQueries: current.totalQueries + 1,
      cacheHitQueries: current.cacheHitQueries + (isCacheHit ? 1 : 0),
      estimatedCostUSD: +(current.estimatedCostUSD + costIncrement).toFixed(5),
      lastQueryTokens: totalTokens,
      lastQuerySaved: saved,
      lastQuerySource: usage.source || 'gemini_3_6_flash',
      updatedAt: new Date().toISOString()
    };

    safeSet(STORAGE_KEYS.AI_TOKEN_USAGE, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_ai_token_updated', { detail: updated }));
    }
    return updated;
  },

  resetAiTokenStats() {
    const resetStats: AiTokenStats = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokensUsed: 0,
      totalTokensSaved: 0,
      totalQueries: 0,
      cacheHitQueries: 0,
      estimatedCostUSD: 0,
      lastQueryTokens: 0,
      lastQuerySaved: 0,
      lastQuerySource: 'reset',
      updatedAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.AI_TOKEN_USAGE, JSON.stringify(resetStats));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xenios_ai_token_updated', { detail: resetStats }));
    }
    return resetStats;
  },

  // -------------------------------------------------------------
  // Persistent AI Chat History (Preserved until user explicitly deletes)
  // -------------------------------------------------------------
  getAiChatMessages(): any[] {
    try {
      const stored = safeGet(STORAGE_KEYS.AI_CHAT_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  },

  saveAiChatMessages(messages: any[]): void {
    try {
      safeSet(STORAGE_KEYS.AI_CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {}
  },

  clearAiChatMessages(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AI_CHAT_MESSAGES);
      }
    } catch (e) {}
  }
};
