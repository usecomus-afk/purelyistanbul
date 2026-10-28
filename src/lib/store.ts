import { Hotel, Room, RoomOccupancyStatus, RoomStateInfo, HotelWhatsAppTemplate, ServiceRequest, Booking, GuestProfile, Language, Complaint, ComplaintStatus, XeniosUser, Experience, ModuleAdminSettings, ModuleAdminSettingsMap, PropertyListing, InvestmentLead, InRoomServiceItem, RoomServiceMenuItem, OTAChannelItem, AiTokenStats, TokenUsageInfo, SupplierPartner, SupplierType, HotelPartnerApplication, B2BLead, MirofishSystemParameters, B2BMirofishDataset } from './types';
import { UserPreferences } from '@/types/comusAi';
import { CategoryConfig, mergeCategoryConfigs } from '@/lib/marketplace/categories';
import rawHotels from '@/data/hotels.json';
import rawExperiences from '@/data/experiences.json';
import rawProperties from '@/data/properties.json';
import rawB2BDataset from '@/data/b2b_mirofish_leads.json';

const hotelsData: Hotel[] = rawHotels as Hotel[];
const seedB2BDataset = rawB2BDataset as B2BMirofishDataset;

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
  MODULE_SETTINGS: 'xenios_module_settings_v2',
  IN_ROOM_SERVICES: 'xenios_in_room_services_v3',
  PROPERTIES: 'xenios_custom_properties',
  SUPPLIERS: 'xenios_custom_suppliers',
  INVESTMENT_LEADS: 'xenios_investment_leads',
  HIDE_DEMO_DATA: 'xenios_hide_demo_data',
  ROOM_SERVICE_MENU: 'xenios_room_service_menu',
  OTA_CHANNELS: 'xenios_ota_channels',
  AI_TOKEN_USAGE: 'xenios_ai_token_usage',
  AI_CHAT_MESSAGES: 'xenios_ai_chat_messages',
  PARTNER_APPLICATIONS: 'xenios_hotel_partner_applications',
  B2B_MIROFISH_LEADS: 'xenios_b2b_mirofish_leads_v1',
  B2B_MIROFISH_PARAMS: 'xenios_b2b_mirofish_params_v1',
  B2B_DELETED_IDS: 'xenios_deleted_b2b_lead_ids'
};

function inferSupplierType(category: string): SupplierType {
  const c = (category || '').toLowerCase();
  if (c.includes('yat') || c.includes('boğaz')) return 'yacht_charter';
  if (c.includes('restoran') || c.includes('gastro') || c.includes('gurme')) return 'restaurant';
  if (c.includes('hamam') || c.includes('spa')) return 'hammam_spa';
  if (c.includes('estetik') || c.includes('klinik') || c.includes('sağlık')) return 'clinic_wellness';
  if (c.includes('transfer') || c.includes('vip')) return 'transfer_vip';
  return 'tour_operator';
}

function buildDefaultSuppliers(): SupplierPartner[] {
  const map = new Map<string, SupplierPartner>();
  const now = '2026-01-15T10:00:00.000Z';

  (rawExperiences as Experience[]).forEach((exp, idx) => {
    const name = (exp.provider || exp.title || 'Purelyİstanbul Partner').trim();
    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: `sup-exp-${idx + 1}`,
        name,
        legalName: `${name} Turizm & Hizmet A.Ş.`,
        type: inferSupplierType(exp.category),
        category: exp.category,
        contactPerson: 'Operasyon & Rezervasyon Yetkilisi',
        phone: exp.phone || '+90 212 514 00 00',
        email: exp.providerEmail || `operasyon@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner'}.com`,
        website: exp.website || 'https://',
        district: exp.location || 'Sultanahmet, Fatih',
        address: exp.location || 'İstanbul',
        taxId: `3400${100000 + idx}`,
        tursabNo: inferSupplierType(exp.category) === 'tour_operator' ? `A-${12400 + idx}` : undefined,
        commissionRate: exp.commissionRate ?? 15,
        contractStatus: exp.status === 'suspended' ? 'suspended' : 'active',
        contractStartDate: '2026-01-01',
        contractNotes: exp.agentNote || 'Purelyİstanbul doğrudan anlaşmalı tedarikçi.',
        publishToWeb: true,
        publishToMobile: true,
        createdAt: now,
        updatedAt: now
      });
    }
  });

  (rawProperties as PropertyListing[]).forEach((prop, idx) => {
    const name = (prop.agency || prop.developer || 'TEKCE Overseas / Istanbul Homes').trim();
    const key = `prop-${name.toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, {
        id: `sup-prop-${idx + 1}`,
        name,
        legalName: `${name} Gayrimenkul Yatırım A.Ş.`,
        type: 'property_management',
        category: 'Mülk & Gayrimenkul Yönetimi',
        contactPerson: 'Portföy & Yatırım Direktörü',
        phone: prop.contactPhone || '+90 850 811 07 00',
        email: 'invest@purelyistanbul.com',
        website: prop.contactWebsite || 'https://',
        district: prop.district || 'Beşiktaş / Sarıyer',
        address: prop.district || 'İstanbul',
        taxId: `3499${200000 + idx}`,
        commissionRate: prop.commissionRate ?? 4,
        contractStatus: 'active',
        contractStartDate: '2026-01-01',
        contractNotes: 'Anlaşmalı mülk yönetimi ve yatırım danışmanlığı partneri.',
        publishToWeb: true,
        publishToMobile: true,
        createdAt: now,
        updatedAt: now
      });
    }
  });

  return Array.from(map.values());
}

let defaultSuppliersCache: SupplierPartner[] | null = null;
function getDefaultSuppliers(): SupplierPartner[] {
  if (!defaultSuppliersCache) {
    defaultSuppliersCache = buildDefaultSuppliers();
  }
  return defaultSuppliersCache;
}

const REMOVED_LEGACY_EXP_IDS = new Set([
  'exp-19', 'exp-20', 'exp-21', 'exp-22', 'exp-23',
  'exp-30', 'exp-31', 'exp-32',
  'exp-36', 'exp-37', 'exp-38', 'exp-39', 'exp-40',
  'exp-49', 'exp-50', 'exp-51', 'exp-52',
  'exp-aesthetic-1', 'exp-aesthetic-2', 'exp-aesthetic-3', 'exp-aesthetic-4',
  'exp-aesthetic-5', 'exp-aesthetic-6', 'exp-aesthetic-7', 'exp-aesthetic-8',
  'exp-aesthetic-9', 'exp-aesthetic-10', 'exp-aesthetic-11', 'exp-aesthetic-12'
]);
const SEED_EXPERIENCES_LIST = rawExperiences as Experience[];
const SEED_EXPERIENCES_MAP = new Map<string, Experience>(SEED_EXPERIENCES_LIST.map((e) => [e.id, e]));

const DEFAULT_MODULE_SETTING: ModuleAdminSettings = { enabled: true, hidden: false };

const memoryStore = new Map<string, string>();
const deletedIdSetCache = new Map<string, { raw: string; set: Set<string> }>();
const parsedCache = new Map<string, { stamp: string; value: any; byId?: Map<string, any> }>();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key) {
      memoryStore.clear();
      deletedIdSetCache.clear();
      parsedCache.clear();
      return;
    }
    if (e.newValue === null) {
      memoryStore.delete(e.key);
    } else {
      memoryStore.set(e.key, e.newValue);
    }
    deletedIdSetCache.delete(e.key);
    parsedCache.clear();
  });
}

function safeGet(key: string, defaultVal: string = ''): string {
  if (memoryStore.has(key)) {
    return memoryStore.get(key) || defaultVal;
  }
  if (typeof window === 'undefined') return defaultVal;
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryStore.set(key, val);
      return val;
    }
    return defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function safeSet(key: string, val: string): boolean {
  const current = safeGet(key, '__UNSET__');
  if (current === val) return false;
  memoryStore.set(key, val);
  deletedIdSetCache.delete(key);
  if (typeof window === 'undefined') return true;
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    // QuotaExceededError durumunda büyük base64 görselleri sıkıştırıp tekrar dene
    try {
      if (key === 'xenios_custom_experiences') {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          const compact = parsed.map((item: any) =>
            typeof item?.image === 'string' && item.image.startsWith('data:') && item.image.length > 40000
              ? { ...item, image: '/images/istanbul/il_1588xN.6201904451_eqr3.webp' }
              : item
          );
          const compactJson = JSON.stringify(compact);
          memoryStore.set(key, compactJson);
          localStorage.setItem(key, compactJson);
          return true;
        }
      }
      // Kritik silme/durum anahtarları için yer aç
      const rawExp = localStorage.getItem('xenios_custom_experiences');
      if (rawExp && rawExp.length > 250000) {
        const parsed = JSON.parse(rawExp);
        if (Array.isArray(parsed)) {
          const compact = parsed.map((item: any) =>
            typeof item?.image === 'string' && item.image.startsWith('data:')
              ? { ...item, image: '/images/istanbul/il_1588xN.6201904451_eqr3.webp' }
              : item
          );
          const compactJson = JSON.stringify(compact);
          memoryStore.set('xenios_custom_experiences', compactJson);
          localStorage.setItem('xenios_custom_experiences', compactJson);
        }
      }
      localStorage.setItem(key, val);
    } catch {}
  }
  return true;
}

function safeRemove(key: string): void {
  memoryStore.delete(key);
  deletedIdSetCache.delete(key);
  parsedCache.delete(key);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

function getDeletedIdSet(storageKey: string): Set<string> {
  const raw = safeGet(storageKey);
  const cached = deletedIdSetCache.get(storageKey);
  if (cached && cached.raw === raw) {
    return cached.set;
  }
  const set = new Set<string>();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) set.add(id);
      }
    } catch {}
  }
  deletedIdSetCache.set(storageKey, { raw, set });
  return set;
}

function addDeletedId(storageKey: string, id: string): void {
  const set = getDeletedIdSet(storageKey);
  if (!set.has(id)) {
    set.add(id);
    const raw = JSON.stringify(Array.from(set));
    safeSet(storageKey, raw);
    deletedIdSetCache.set(storageKey, { raw, set });
  }
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
      safeRemove(STORAGE_KEYS.CURRENT_USER);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_auth_updated'));
    }
  },

  logout() {
    this.setUser(null);
  },

  // Deleted ID Tombstones
  getDeletedExperienceIds(): Set<string> {
    return getDeletedIdSet('xenios_deleted_experience_ids');
  },

  markExperienceDeleted(id: string) {
    addDeletedId('xenios_deleted_experience_ids', id);
  },

  getDeletedPropertyIds(): Set<string> {
    return getDeletedIdSet('xenios_deleted_property_ids');
  },

  markPropertyDeleted(id: string) {
    addDeletedId('xenios_deleted_property_ids', id);
  },

  getDeletedHotelIds(): Set<string> {
    return getDeletedIdSet('xenios_deleted_hotel_ids');
  },

  markHotelDeleted(id: string) {
    addDeletedId('xenios_deleted_hotel_ids', id);
  },

  getDeletedSupplierIds(): Set<string> {
    return getDeletedIdSet('xenios_deleted_supplier_ids');
  },

  markSupplierDeleted(id: string) {
    addDeletedId('xenios_deleted_supplier_ids', id);
  },

  // Hotels Management & Live Inventory
  getHotels(): Hotel[] {
    const stored = safeGet('xenios_custom_hotels');
    const deletedRaw = safeGet('xenios_deleted_hotel_ids');
    const stamp = `${stored.length}:${deletedRaw}:${stored.slice(0, 64)}:${stored.slice(-64)}`;
    const cached = parsedCache.get('hotels');
    if (cached && cached.stamp === stamp) {
      return (cached.value as Hotel[]).slice();
    }

    const deletedIds = this.getDeletedHotelIds();
    let result: Hotel[] | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          result = parsed.filter((h: Hotel) => h && h.id && !h.deleted && !deletedIds.has(h.id));
        }
      } catch (e) {}
    }
    if (!result) {
      result = hotelsData.filter((h) => h && h.id && !deletedIds.has(h.id));
    }
    const byId = new Map<string, Hotel>(result.map((h) => [h.id, h]));
    parsedCache.set('hotels', { stamp, value: result, byId });
    return result.slice();
  },

  saveHotels(hotels: Hotel[]) {
    const deletedIds = this.getDeletedHotelIds();
    const filtered = hotels.filter((h) => h && h.id && !h.deleted && !deletedIds.has(h.id));
    const json = JSON.stringify(filtered);
    const changed = safeSet('xenios_custom_hotels', json);
    const deletedRaw = safeGet('xenios_deleted_hotel_ids');
    const stamp = `${json.length}:${deletedRaw}:${json.slice(0, 64)}:${json.slice(-64)}`;
    parsedCache.set('hotels', {
      stamp,
      value: filtered,
      byId: new Map<string, Hotel>(filtered.map((h) => [h.id, h])),
    });
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_hotels_updated'));
    }
  },

  addHotel(hotel: Hotel) {
    const stamped: Hotel = { ...hotel, updatedAt: new Date().toISOString(), deleted: false };
    const list = this.getHotels();
    list.unshift(stamped);
    this.saveHotels(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.upsertHotel(stamped).catch(() => {});
    }).catch(() => {});
  },

  updateHotel(id: string, updated: Partial<Hotel>) {
    const now = new Date().toISOString();
    let target: Hotel | undefined;
    const list = this.getHotels().map(h => {
      if (h.id === id) {
        target = { ...h, ...updated, updatedAt: now };
        return target;
      }
      return h;
    });
    this.saveHotels(list);
    if (target) {
      const synced = target;
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertHotel(synced).catch(() => {});
      }).catch(() => {});
    }
  },

  deleteHotel(id: string) {
    this.markHotelDeleted(id);
    const list = this.getHotels().filter(h => h.id !== id);
    this.saveHotels(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.deleteHotelRemote(id).catch(() => {});
    }).catch(() => {});
  },

  getHotelById(id: string): Hotel | undefined {
    this.getHotels();
    const cached = parsedCache.get('hotels');
    if (cached?.byId) {
      return cached.byId.get(id) || (cached.value as Hotel[])[0];
    }
    const list = this.getHotels();
    return list.find(h => h.id === id) || list[0];
  },

  getHotelManagerProfile(hotelId?: string) {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const key = `xenios_manager_profile_${targetHotelId}`;
    const hotel = this.getHotelById(targetHotelId);
    try {
      const stored = safeGet(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed.managerPhone === '+90 532 555 44 33' ||
          parsed.managerPhone === '+90 532 163 55 20, +90 533 203 62 60'
        ) {
          parsed.managerPhone = hotel?.whatsappPhone || hotel?.managerPhone || '05325809676';
        }
        if (
          !parsed.whatsappPhone ||
          parsed.whatsappPhone === '+90 532 555 44 33' ||
          parsed.whatsappPhone === '+90 532 163 55 20, +90 533 203 62 60'
        ) {
          parsed.whatsappPhone =
            hotel?.whatsappPhone || parsed.managerPhone || '05325809676';
        }
        return parsed;
      }
    } catch (e) {}
    return {
      managerName: hotel?.managerName || 'Ahmet Yılmaz',
      managerTitle: 'Genel Müdür / Ön Büro Direktörü',
      managerPhone: hotel?.managerPhone || '05325809676',
      whatsappPhone: hotel?.whatsappPhone || hotel?.managerPhone || '05325809676',
      contactEmail: hotel?.contactEmail || 'heritage@xenios.istanbul',
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
        h.updatedAt = new Date().toISOString();
        this.saveHotels(hotels);
        import('./firestore-service').then(({ FirestoreService }) => {
          FirestoreService.upsertHotel(h).catch(() => {});
        }).catch(() => {});
      }
    }
  },

  updateRoomInHotel(hotelId: string, roomNumber: string, updated: Partial<Room>) {
    const hotels = this.getHotels();
    const h = hotels.find(item => item.id === hotelId);
    if (h && h.rooms) {
      h.rooms = h.rooms.map(r => r.number === roomNumber ? { ...r, ...updated } : r);
      h.updatedAt = new Date().toISOString();
      this.saveHotels(hotels);
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertHotel(h).catch(() => {});
      }).catch(() => {});
    }
  },

  deleteRoomFromHotel(hotelId: string, roomNumber: string) {
    const hotels = this.getHotels();
    const h = hotels.find(item => item.id === hotelId);
    if (h && h.rooms) {
      h.rooms = h.rooms.filter(r => r.number !== roomNumber);
      h.updatedAt = new Date().toISOString();
      this.saveHotels(hotels);
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertHotel(h).catch(() => {});
      }).catch(() => {});
    }
  },

  getRoomStates(hotelId: string): Record<string, RoomStateInfo> {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const storageKey = `xenios_room_states_v2_${targetHotelId}`;
    let storedMap: Record<string, RoomStateInfo> = {};
    let hadStoredMap = false;

    try {
      const raw = safeGet(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          storedMap = parsed;
          hadStoredMap = Object.keys(parsed).length > 0;
        }
      }
    } catch {}

    const hotel = this.getHotelById(targetHotelId);
    const rooms = hotel?.rooms || [];
    const result: Record<string, RoomStateInfo> = { ...storedMap };
    let needsPersist = false;

    rooms.forEach((r, idx) => {
      const localEntry = storedMap[r.number];
      const roomHasState = Boolean(r.status);
      const roomEntry: RoomStateInfo | undefined = roomHasState
        ? {
            status: r.status as RoomOccupancyStatus,
            guest: r.guest || '',
            guestPhone: r.guestPhone || '',
            checkout: r.checkout || '',
            whatsappConfirmedAt: r.whatsappConfirmedAt || '',
            updatedAt: r.updatedAt || '',
          }
        : undefined;

      let chosen: RoomStateInfo | undefined;
      if (localEntry && roomEntry) {
        chosen =
          (roomEntry.updatedAt || '') > (localEntry.updatedAt || '')
            ? roomEntry
            : localEntry;
      } else if (localEntry) {
        chosen = localEntry;
      } else if (roomEntry) {
        chosen = roomEntry;
        needsPersist = true;
      } else if (!hadStoredMap) {
        // Initial one-time seed only if this hotel has never had stored states
        if (idx % 3 === 0) {
          chosen = { status: 'occupied', guest: 'John Miller', guestPhone: '', checkout: 'Çıkış: 12:00' };
        } else if (idx % 5 === 0) {
          chosen = { status: 'cleaning', guest: '', guestPhone: '', checkout: '' };
        } else if (idx % 7 === 0) {
          chosen = { status: 'reserved', guest: 'Elena Rostova', guestPhone: '', checkout: 'Giriş: 14:00' };
        } else {
          chosen = { status: 'clean', guest: '', guestPhone: '', checkout: '' };
        }
        needsPersist = true;
      } else {
        chosen = { status: 'clean', guest: '', guestPhone: '', checkout: '' };
        needsPersist = true;
      }

      if (chosen.status === 'clean' || chosen.status === 'cleaning') {
        chosen = {
          ...chosen,
          guest: '',
          guestPhone: '',
          checkout: '',
          whatsappConfirmedAt: '',
        };
      }

      result[r.number] = chosen;
    });

    if (needsPersist) {
      safeSet(storageKey, JSON.stringify(result));
    }

    return result;
  },

  updateRoomState(hotelId: string, roomNumber: string, nextState: RoomStateInfo) {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const storageKey = `xenios_room_states_v2_${targetHotelId}`;
    const now = new Date().toISOString();

    const isVacantOrCleaning =
      nextState.status === 'clean' || nextState.status === 'cleaning';

    const sanitized: RoomStateInfo = {
      status: nextState.status,
      guest: isVacantOrCleaning ? '' : (nextState.guest || '').trim(),
      guestPhone: isVacantOrCleaning ? '' : (nextState.guestPhone || '').trim(),
      checkout: isVacantOrCleaning ? '' : (nextState.checkout || '').trim(),
      whatsappConfirmedAt: isVacantOrCleaning ? '' : (nextState.whatsappConfirmedAt || ''),
      updatedAt: now,
    };

    const currentMap = this.getRoomStates(targetHotelId);
    const updatedMap: Record<string, RoomStateInfo> = {
      ...currentMap,
      [roomNumber]: sanitized,
    };
    safeSet(storageKey, JSON.stringify(updatedMap));

    const hotels = this.getHotels();
    const h = hotels.find((item) => item.id === targetHotelId);
    if (h && Array.isArray(h.rooms)) {
      h.rooms = h.rooms.map((r) =>
        r.number === roomNumber
          ? {
              ...r,
              status: sanitized.status,
              guest: sanitized.guest,
              guestPhone: sanitized.guestPhone,
              checkout: sanitized.checkout,
              whatsappConfirmedAt: sanitized.whatsappConfirmedAt,
              updatedAt: now,
            }
          : r
      );
      h.updatedAt = now;
      this.saveHotels(hotels);
      import('./firestore-service')
        .then(({ FirestoreService }) => {
          FirestoreService.upsertHotel(h).catch(() => {});
        })
        .catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_room_states_updated'));
    }
  },

  getHotelWhatsAppTemplates(hotelId?: string): HotelWhatsAppTemplate[] {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const storageKey = `xenios_whatsapp_templates_v1_${targetHotelId}`;

    const defaultTemplates: HotelWhatsAppTemplate[] = [
      {
        id: 'tpl-standard-full',
        title: '1. Standart Rezervasyon Teyit & Karşılama Paketi (Konum + Wi-Fi + Giriş/Çıkış + Purely Istanbul)',
        isDefault: true,
        body: [
          '✨ *REZERVASYON ONAYI & HOŞ GELDİNİZ BİLGİLENDİRMESİ* ✨',
          '━━━━━━━━━━━━━━━━━━━━━━',
          'Sayın *{misafir_adi}*,',
          '*{tesis_adi}* konaklama rezervasyonunuz onaylanmıştır. Sizi ağırlamaktan mutluluk duyacağız!',
          '',
          '📋 *Rezervasyon & Konaklama Bilgileriniz:*',
          '🚪 *Birim / Oda:* Birim {birim_no} ({birim_tipi})',
          '⏰ *Giriş / Çıkış Bilgisi:* {giris_cikis}',
          '📶 *Wi-Fi Ağı:* {wifi_adi}',
          '🔑 *Wi-Fi Şifresi:* {wifi_sifre}',
          '',
          '📍 *Tesis Konumu & Yol Tarifi:*',
          '{konum_adresi}',
          '🗺️ *Harita:* {harita_linki}',
          '━━━━━━━━━━━━━━━━━━━━━━',
          '🌟 *Purely Istanbul — Dijital Konaklama & Şehir Asistanınız:*',
          'Konaklamanız boyunca birim içi tüm sipariş ve taleplerinizi (oda servisi, temizlik, teknik destek, taksi/VIP transfer) tek dokunuşla iletmek ve İstanbul’un seçkin Boğaz turları, gastronomi ve kültür deneyimlerini keşfetmek için biriminize özel bağlantınız:',
          '👉 {purely_link}',
          '',
          'Keyifli bir konaklama dileriz!',
          '📞 *Tesis İletişim:* {tesis_telefon}',
        ].join('\n'),
      },
      {
        id: 'tpl-checkin-wifi',
        title: '2. Hızlı Check-In, Wi-Fi Şifresi & Konum Bilgisi',
        isDefault: true,
        body: [
          '🏨 *{tesis_adi} — Hoş Geldiniz!*',
          '━━━━━━━━━━━━━━━━━━━━━━',
          'Sayın *{misafir_adi}*, *Birim {birim_no}* konaklamanız için hızlı erişim bilgileriniz aşağıdadır:',
          '',
          '📶 *Wi-Fi Ağı:* {wifi_adi}',
          '🔑 *Wi-Fi Şifresi:* {wifi_sifre}',
          '⏰ *Giriş / Çıkış:* {giris_cikis}',
          '📍 *Konum & Yol Tarifi:* {harita_linki}',
          '',
          '🛎️ *7/24 Dijital Oda Servisi & Purely Istanbul Rehberi:*',
          'Birim içi siparişlerinizi vermek ve İstanbul deneyimlerini incelemek için tıklayın:',
          '👉 {purely_link}',
        ].join('\n'),
      },
      {
        id: 'tpl-purely-intro',
        title: '3. Purely Istanbul Dijital Concierge & Şehir Rehberi Tanıtımı',
        isDefault: true,
        body: [
          '✨ *PURELY ISTANBUL İLE AYRICALIKLI KONAKLAMA* ✨',
          '━━━━━━━━━━━━━━━━━━━━━━',
          'Sayın *{misafir_adi}*,',
          '*{tesis_adi}* (Birim {birim_no}) konaklamanız süresince size özel dijital asistanınız *Purely Istanbul* hizmetinizdedir.',
          '',
          '• 🛎️ *Birim İçi Sipariş & Talepler:* Oda servisi, ekstra havlu/yastık, temizlik ve taksi çağırma işlemlerinizi resepsiyonu aramadan anında iletin.',
          '• 🛥️ *Seçkin İstanbul Deneyimleri:* Özel Boğaz yat turları, tarihi hamam & spa, seçkin restoran rezervasyonları ve VIP transfer ayrıcalıklarına tek tıkla ulaşın.',
          '',
          '🔗 *Biriminize Özel Dijital Rehber Bağlantınız:*',
          '{purely_link}',
        ].join('\n'),
      },
      {
        id: 'tpl-english-welcome',
        title: '4. 🇬🇧 English — Reservation Confirmation & Digital Concierge Guide',
        isDefault: true,
        body: [
          '✨ *RESERVATION CONFIRMATION & WELCOME GUIDE* ✨',
          '━━━━━━━━━━━━━━━━━━━━━━',
          'Dear *{misafir_adi}*,',
          'Your reservation at *{tesis_adi}* (*Unit {birim_no} - {birim_tipi}*) is confirmed. We look forward to welcoming you!',
          '',
          '📋 *Stay & Check-In Details:*',
          '⏰ *Check-In / Check-Out:* {giris_cikis}',
          '📶 *Wi-Fi Network:* {wifi_adi}',
          '🔑 *Wi-Fi Password:* {wifi_sifre}',
          '📍 *Address:* {konum_adresi}',
          '🗺️ *Google Maps:* {harita_linki}',
          '━━━━━━━━━━━━━━━━━━━━━━',
          '🌟 *Purely Istanbul — Your Personal Digital Concierge:*',
          'Order in-room dining, housekeeping, or a taxi with one tap, and explore curated Bosphorus yacht cruises, fine dining, and cultural experiences in Istanbul via your personal unit link:',
          '👉 {purely_link}',
        ].join('\n'),
      },
    ];

    try {
      const raw = safeGet(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const hotel = this.getHotelById(targetHotelId);
    if (Array.isArray(hotel?.modules?.whatsappTemplates) && hotel!.modules!.whatsappTemplates.length > 0) {
      safeSet(storageKey, JSON.stringify(hotel!.modules!.whatsappTemplates));
      return hotel!.modules!.whatsappTemplates;
    }

    return defaultTemplates;
  },

  saveHotelWhatsAppTemplates(hotelId: string, templates: HotelWhatsAppTemplate[]) {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const storageKey = `xenios_whatsapp_templates_v1_${targetHotelId}`;
    safeSet(storageKey, JSON.stringify(templates));

    const hotel = this.getHotelById(targetHotelId);
    if (hotel) {
      this.updateHotel(targetHotelId, {
        modules: {
          ...(hotel.modules || {}),
          whatsappTemplates: templates,
        },
      });
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

  normalizeExperiences(list: Experience[]): Experience[] {
    const deletedIds = this.getDeletedExperienceIds();

    const isRemovedExp = (item: Experience) => {
      if (!item || !item.id) return true;
      if ((item as any).deleted === true) {
        deletedIds.add(item.id);
        this.markExperienceDeleted(item.id);
        return true;
      }
      if (REMOVED_LEGACY_EXP_IDS.has(item.id) || item.id.startsWith('exp-aesthetic-')) return true;
      const cat = `${item.category || ''} ${item.categoryTag || ''}`.toLowerCase();
      if (
        cat.includes('medikal') ||
        cat.includes('estetik') ||
        cat.includes('aesthetic') ||
        cat.includes('medical') ||
        cat.includes('yatırım') ||
        cat.includes('real estate')
      ) {
        return true;
      }
      return false;
    };

    const itemMap = new Map<string, Experience>();
    const customItems: Experience[] = [];

    for (const item of list) {
      if (isRemovedExp(item) || deletedIds.has(item.id)) continue;
      if (itemMap.has(item.id)) continue;
      itemMap.set(item.id, item);
      if (!SEED_EXPERIENCES_MAP.has(item.id)) {
        customItems.push(item);
      }
    }

    const mergedSeedItems: Experience[] = [];
    for (const seed of SEED_EXPERIENCES_LIST) {
      if (deletedIds.has(seed.id) || isRemovedExp(seed)) continue;
      const existing = itemMap.get(seed.id);
      if (existing) {
        mergedSeedItems.push({
          ...seed,
          ...existing,
          desc: existing.desc ?? existing.agentNote ?? seed.desc ?? seed.agentNote,
          features: existing.features ?? existing.specialties ?? seed.features ?? seed.specialties,
          image: existing.image || seed.image,
          recommendedDistricts: Array.isArray(existing.recommendedDistricts)
            ? existing.recommendedDistricts
            : seed.recommendedDistricts,
        });
      } else {
        mergedSeedItems.push(seed);
      }
    }

    return [...customItems, ...mergedSeedItems];
  },

  getExperiences(): Experience[] {
    const stored = safeGet('xenios_custom_experiences');
    const deletedRaw = safeGet('xenios_deleted_experience_ids');
    const stamp = `${stored.length}:${deletedRaw}:${stored.slice(0, 64)}:${stored.slice(-64)}`;
    const cached = parsedCache.get('experiences');
    if (cached && cached.stamp === stamp) {
      return (cached.value as Experience[]).slice();
    }

    let normalized: Experience[] | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          normalized = this.normalizeExperiences(parsed);
        }
      } catch (e) {}
    }
    if (!normalized) {
      normalized = this.normalizeExperiences(SEED_EXPERIENCES_LIST);
    }
    const byId = new Map<string, Experience>(normalized.map((e) => [e.id, e]));
    parsedCache.set('experiences', { stamp, value: normalized, byId });
    return normalized.slice();
  },

  saveExperiences(exps: Experience[]) {
    const normalized = this.normalizeExperiences(exps);
    const json = JSON.stringify(normalized);
    const changed = safeSet('xenios_custom_experiences', json);
    const deletedRaw = safeGet('xenios_deleted_experience_ids');
    const stamp = `${json.length}:${deletedRaw}:${json.slice(0, 64)}:${json.slice(-64)}`;
    parsedCache.set('experiences', {
      stamp,
      value: normalized,
      byId: new Map<string, Experience>(normalized.map((e) => [e.id, e])),
    });
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_experiences_updated'));
    }
  },

  updateExperience(id: string, updated: Partial<Experience>) {
    const now = new Date().toISOString();
    let target: Experience | undefined;
    const list = this.getExperiences().map(e => {
      if (e.id === id) {
        target = { ...e, ...updated, updatedAt: now };
        return target;
      }
      return e;
    });
    this.saveExperiences(list);
    if (target) {
      const synced = target;
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertExperience(synced).catch(() => {});
      }).catch(() => {});
    }
  },

  updateExperienceQuota(id: string, availableSlots: number, capacity?: number) {
    const now = new Date().toISOString();
    let target: Experience | undefined;
    const list = this.getExperiences().map(e => {
      if (e.id === id) {
        target = {
          ...e,
          availableSlots: Math.max(0, availableSlots),
          capacity: capacity !== undefined ? capacity : (e.capacity || 20),
          updatedAt: now
        };
        return target;
      }
      return e;
    });
    this.saveExperiences(list);
    if (target) {
      const synced = target;
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertExperience(synced).catch(() => {});
      }).catch(() => {});
    }
  },

  addExperience(exp: Experience) {
    const stamped: Experience = { ...exp, updatedAt: new Date().toISOString(), deleted: false };
    const list = this.getExperiences();
    list.unshift(stamped);
    this.saveExperiences(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.upsertExperience(stamped).catch(() => {});
    }).catch(() => {});
  },

  deleteExperience(id: string) {
    this.markExperienceDeleted(id);
    const list = this.getExperiences().filter(e => e.id !== id);
    this.saveExperiences(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.deleteExperienceRemote(id).catch(() => {});
    }).catch(() => {});
  },

  getExperienceById(id: string) {
    this.getExperiences();
    const cached = parsedCache.get('experiences');
    if (cached?.byId) {
      return cached.byId.get(id);
    }
    return this.getExperiences().find((e: any) => e.id === id);
  },

  // Agreed Suppliers & Partner Businesses (Anlaşmalı İşletmeler & Tedarikçiler)
  getSuppliers(): SupplierPartner[] {
    const stored = safeGet(STORAGE_KEYS.SUPPLIERS);
    const deletedRaw = safeGet('xenios_deleted_supplier_ids');
    const stamp = `${stored.length}:${deletedRaw}:${stored.slice(0, 64)}:${stored.slice(-64)}`;
    const cached = parsedCache.get('suppliers');
    if (cached && cached.stamp === stamp) {
      return (cached.value as SupplierPartner[]).slice();
    }

    const deletedIds = this.getDeletedSupplierIds();
    let result: SupplierPartner[] | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          result = parsed.filter((s: SupplierPartner) => s && s.id && !s.deleted && !deletedIds.has(s.id));
        }
      } catch (e) {}
    }
    if (!result) {
      result = getDefaultSuppliers().filter((s) => s && s.id && !deletedIds.has(s.id));
    }
    parsedCache.set('suppliers', { stamp, value: result });
    return result.slice();
  },

  saveSuppliers(suppliers: SupplierPartner[]) {
    const deletedIds = this.getDeletedSupplierIds();
    const filtered = suppliers.filter((s) => s && s.id && !s.deleted && !deletedIds.has(s.id));
    const json = JSON.stringify(filtered);
    const changed = safeSet(STORAGE_KEYS.SUPPLIERS, json);
    const deletedRaw = safeGet('xenios_deleted_supplier_ids');
    const stamp = `${json.length}:${deletedRaw}:${json.slice(0, 64)}:${json.slice(-64)}`;
    parsedCache.set('suppliers', { stamp, value: filtered });
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_suppliers_updated'));
    }
  },

  addSupplier(supplier: SupplierPartner) {
    const stamped: SupplierPartner = { ...supplier, updatedAt: new Date().toISOString(), deleted: false };
    const list = this.getSuppliers();
    list.unshift(stamped);
    this.saveSuppliers(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.upsertSupplier(stamped).catch(() => {});
    }).catch(() => {});
  },

  updateSupplier(id: string, updated: Partial<SupplierPartner>) {
    let target: SupplierPartner | undefined;
    const list = this.getSuppliers().map(s => {
      if (s.id === id) {
        target = { ...s, ...updated, updatedAt: new Date().toISOString() };
        return target;
      }
      return s;
    });
    this.saveSuppliers(list);
    if (target) {
      const synced = target;
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertSupplier(synced).catch(() => {});
      }).catch(() => {});
    }
  },

  deleteSupplier(id: string) {
    this.markSupplierDeleted(id);
    const list = this.getSuppliers().filter(s => s.id !== id);
    this.saveSuppliers(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.deleteSupplierRemote(id).catch(() => {});
    }).catch(() => {});
  },

  // Site Kategorileri — panelden düzenlenebilir (web + mobil uygulama ortak okur)
  getCategoryOverrides(): Partial<CategoryConfig>[] {
    const stored = safeGet('xenios_site_categories_v2');
    const cached = parsedCache.get('category_overrides');
    if (cached && cached.stamp === stored) {
      return (cached.value as Partial<CategoryConfig>[]).slice();
    }
    try {
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsedCache.set('category_overrides', { stamp: stored, value: parsed });
          return parsed.slice();
        }
      }
    } catch (e) {}
    return [];
  },

  saveCategoryOverrides(list: Partial<CategoryConfig>[]) {
    const json = JSON.stringify(list);
    const changed = safeSet('xenios_site_categories_v2', json);
    parsedCache.set('category_overrides', { stamp: json, value: list });
    parsedCache.delete('category_configs');
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_categories_updated'));
    }
  },

  /** Varsayılan + panel düzenlemeleri birleşik, sıralı kategori listesi (gizliler dahil). */
  getCategoryConfigs(): CategoryConfig[] {
    const stored = safeGet('xenios_site_categories_v2');
    const cached = parsedCache.get('category_configs');
    if (cached && cached.stamp === stored) {
      return (cached.value as CategoryConfig[]).slice();
    }
    const merged = mergeCategoryConfigs(this.getCategoryOverrides());
    parsedCache.set('category_configs', { stamp: stored, value: merged });
    return merged.slice();
  },

  /** Kategori kaydını (tam alanlarıyla) yerel olarak kaydeder ve Firestore'a yansıtır. */
  upsertCategoryConfig(cfg: CategoryConfig) {
    const stamped: CategoryConfig = {
      ...cfg,
      unhiddenByAdmin: !cfg.hidden,
      updatedAt: new Date().toISOString(),
    };
    const list = this.getCategoryOverrides().filter((o) => o.key !== stamped.key);
    list.push(stamped);
    this.saveCategoryOverrides(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.upsertCategory(stamped).catch(() => {});
    }).catch(() => {});
  },

  /** Birden fazla kategoriyi tek seferde (örn. sıralama) kaydeder. */
  upsertCategoryConfigs(cfgs: CategoryConfig[]) {
    const stampedAt = new Date().toISOString();
    const stamped = cfgs.map((c) => ({ ...c, updatedAt: stampedAt }));
    const keys = new Set(stamped.map((c) => c.key));
    const list = this.getCategoryOverrides().filter((o) => !o.key || !keys.has(o.key));
    this.saveCategoryOverrides([...list, ...stamped]);
    import('./firestore-service').then(({ FirestoreService }) => {
      stamped.forEach((c) => FirestoreService.upsertCategory(c).catch(() => {}));
    }).catch(() => {});
  },

  /** Özel kategoriyi siler (mezar taşı bırakır; böylece diğer cihazlardan da kalkar). */
  deleteCustomCategory(key: string) {
    const existing = this.getCategoryConfigs().find((c) => c.key === key);
    if (!existing || !existing.custom) return;
    this.upsertCategoryConfig({ ...existing, deleted: true, hidden: true });
  },

  /** Hazır kategoriyi varsayılan ayarlara döndürür (override'ı kaldırır). */
  resetCategoryConfig(key: string) {
    const list = this.getCategoryOverrides().filter((o) => o.key !== key);
    const base = this.getCategoryConfigs().find((c) => c.key === key);
    this.saveCategoryOverrides(list);
    if (base && !base.custom) {
      // Uzak kayıt da varsayılana çekilir (updatedAt güncel, alanlar varsayılan).
      import('./firestore-service').then(({ FirestoreService }) => {
        const def = mergeCategoryConfigs([]).find((c) => c.key === key);
        if (def) FirestoreService.upsertCategory({ ...def, updatedAt: new Date().toISOString() }).catch(() => {});
      }).catch(() => {});
    }
  },

  // Invest & Live in Istanbul — Emlak & Mülk Yönetimi Vitrini
  getPropertyListings(): PropertyListing[] {
    const stored = safeGet(STORAGE_KEYS.PROPERTIES);
    const deletedRaw = safeGet('xenios_deleted_property_ids');
    const stamp = `${stored.length}:${deletedRaw}:${stored.slice(0, 64)}:${stored.slice(-64)}`;
    const cached = parsedCache.get('properties');
    if (cached && cached.stamp === stamp) {
      return (cached.value as PropertyListing[]).slice();
    }

    const deletedIds = this.getDeletedPropertyIds();
    let result: PropertyListing[] | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          result = parsed.filter((p: PropertyListing) => p && p.id && !p.deleted && !deletedIds.has(p.id));
        }
      } catch (e) {}
    }
    if (!result) {
      result = (rawProperties as PropertyListing[]).filter((p) => p && p.id && !deletedIds.has(p.id));
    }
    parsedCache.set('properties', { stamp, value: result });
    return result.slice();
  },

  savePropertyListings(properties: PropertyListing[]) {
    const deletedIds = this.getDeletedPropertyIds();
    const filtered = properties.filter((p) => p && p.id && !p.deleted && !deletedIds.has(p.id));
    const json = JSON.stringify(filtered);
    const changed = safeSet(STORAGE_KEYS.PROPERTIES, json);
    const deletedRaw = safeGet('xenios_deleted_property_ids');
    const stamp = `${json.length}:${deletedRaw}:${json.slice(0, 64)}:${json.slice(-64)}`;
    parsedCache.set('properties', { stamp, value: filtered });
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_properties_updated'));
    }
  },

  addPropertyListing(property: PropertyListing) {
    const stamped: PropertyListing = { ...property, updatedAt: new Date().toISOString(), deleted: false };
    const list = this.getPropertyListings();
    list.unshift(stamped);
    this.savePropertyListings(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.upsertProperty(stamped).catch(() => {});
    }).catch(() => {});
  },

  updatePropertyListing(id: string, updated: Partial<PropertyListing>) {
    const now = new Date().toISOString();
    let target: PropertyListing | undefined;
    const list = this.getPropertyListings().map(p => {
      if (p.id === id) {
        target = { ...p, ...updated, updatedAt: now };
        return target;
      }
      return p;
    });
    this.savePropertyListings(list);
    if (target) {
      const synced = target;
      import('./firestore-service').then(({ FirestoreService }) => {
        FirestoreService.upsertProperty(synced).catch(() => {});
      }).catch(() => {});
    }
  },

  deletePropertyListing(id: string) {
    this.markPropertyDeleted(id);
    const list = this.getPropertyListings().filter(p => p.id !== id);
    this.savePropertyListings(list);
    import('./firestore-service').then(({ FirestoreService }) => {
      FirestoreService.deletePropertyRemote(id).catch(() => {});
    }).catch(() => {});
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
      const w = window as any;
      const isNativeApp =
        !!w.Capacitor?.isNativePlatform?.() ||
        !!w.webkit?.messageHandlers?.bridge;
      if (isNativeApp) return true;

      const pathname = window.location.pathname || '';
      if (pathname.startsWith('/stay/')) return true;

      const qrVerified = window.localStorage.getItem('xenios_qr_verified') === '1';
      const hotelId = window.localStorage.getItem(STORAGE_KEYS.CURRENT_HOTEL);
      const roomId = window.localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
      return qrVerified && !!hotelId && !!roomId;
    } catch {
      return false;
    }
  },

  setActiveHotelSession(hotelId: string, roomNum: string) {
    safeSet(STORAGE_KEYS.CURRENT_HOTEL, hotelId);
    safeSet(STORAGE_KEYS.CURRENT_ROOM, roomNum);
    safeSet('xenios_qr_verified', '1');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_session_updated'));
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
    const l = safeGet(STORAGE_KEYS.LANG, 'en');
    return (['tr', 'en', 'ar', 'ru', 'de', 'fr'].includes(l) ? l : 'en') as Language;
  },

  setLanguage(lang: Language) {
    safeSet(STORAGE_KEYS.LANG, lang);
  },

  // In-Room Service Requests
  getDeletedRequestIds(): Set<string> {
    return getDeletedIdSet('xenios_deleted_request_ids');
  },

  getRequestStatusOverrides(): Record<string, ServiceRequest['status']> {
    try {
      const raw = safeGet('xenios_request_status_overrides');
      if (raw) {
        const cached = parsedCache.get('status_overrides');
        if (cached && cached.stamp === raw) {
          return cached.value as Record<string, ServiceRequest['status']>;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          parsedCache.set('status_overrides', { stamp: raw, value: parsed });
          return parsed;
        }
      }
    } catch {}
    return {};
  },

  getRequests(): ServiceRequest[] {
    try {
      const stored = safeGet(STORAGE_KEYS.REQUESTS);
      if (stored) {
        const deletedRaw = safeGet('xenios_deleted_request_ids') || '';
        const overridesRaw = safeGet('xenios_request_status_overrides') || '';
        const stamp = `${stored.length}:${deletedRaw}:${overridesRaw}:${stored}`;
        const cached = parsedCache.get('requests');
        if (cached && cached.stamp === stamp) {
          return (cached.value as ServiceRequest[]).slice();
        }
        const deletedIds = this.getDeletedRequestIds();
        const statusOverrides = this.getRequestStatusOverrides();
        const list: ServiceRequest[] = JSON.parse(stored);
        const realList = list
          .filter(r => !r.isDemo && !r.id?.includes('demo') && !r.id?.includes('test') && !deletedIds.has(r.id))
          .map(r => (statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r));
        if (realList.length !== list.length) {
          const nextRaw = JSON.stringify(realList);
          safeSet(STORAGE_KEYS.REQUESTS, nextRaw);
          parsedCache.set('requests', {
            stamp: `${nextRaw.length}:${deletedRaw}:${overridesRaw}:${nextRaw}`,
            value: realList,
          });
        } else {
          parsedCache.set('requests', { stamp, value: realList });
        }
        return realList.slice();
      }
    } catch (e) {}
    return [];
  },

  addRequest(req: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): ServiceRequest {
    const list = this.getRequests();
    const newReq: ServiceRequest = {
      ...req,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newReq);
    try {
      const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      parsedCache.delete('requests');
      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_requests_updated'));
      }
    } catch (e) {}
    return newReq;
  },

  updateRequestStatus(id: string, status: ServiceRequest['status']) {
    try {
      const overrides = { ...this.getRequestStatusOverrides(), [id]: status };
      safeSet('xenios_request_status_overrides', JSON.stringify(overrides));
      parsedCache.delete('status_overrides');
    } catch {}
    const list = this.getRequests().map(r =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    );
    try {
      const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      parsedCache.delete('requests');
      if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
    } catch (e) {}
  },

  updateRequestPayment(
    id: string,
    payment: Pick<ServiceRequest, 'paymentMethod' | 'paymentStatus' | 'paymentAmount' | 'paymentCurrency' | 'paymentReference'>
  ): ServiceRequest | null {
    const list = this.getRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const item = { ...list[idx] };
    item.paymentMethod = payment.paymentMethod;
    item.paymentStatus = payment.paymentStatus;
    item.paymentAmount = payment.paymentAmount;
    item.paymentCurrency = payment.paymentCurrency;
    item.paymentReference = payment.paymentReference;
    if (payment.paymentStatus === 'paid_online' && payment.paymentReference) {
      const tag = `💳 Online Ödendi (${payment.paymentAmount} ${payment.paymentCurrency || 'TRY'} · #${payment.paymentReference})`;
      if (!item.notes?.includes(payment.paymentReference)) {
        item.notes = item.notes ? `${item.notes} · ${tag}` : tag;
      }
    }
    item.updatedAt = new Date().toISOString();
    list[idx] = item;
    try {
      const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      parsedCache.delete('requests');
      if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
    } catch (e) {}
    return item;
  },

  deleteRequest(id: string) {
    try {
      addDeletedId('xenios_deleted_request_ids', id);
    } catch {}
    const list = this.getRequests();
    const filtered = list.filter(r => r.id !== id);
    try {
      const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(filtered));
      parsedCache.delete('requests');
      if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
    } catch (e) {}
  },

  syncRequestsFromRemote(list: ServiceRequest[]) {
    try {
      const deletedIds = this.getDeletedRequestIds();
      const statusOverrides = this.getRequestStatusOverrides();
      const cleaned = list
        .filter(r => !r.isDemo && !r.id?.includes('demo') && !r.id?.includes('test') && !deletedIds.has(r.id))
        .map(r => (statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r));
      const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(cleaned));
      if (changed) {
        parsedCache.delete('requests');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('xenios_requests_updated'));
        }
      }
    } catch (e) {}
  },

  /**
   * YÖNETİCİ: sunucudaki (Firestore) operasyon verisini yerel depoya yansıtır; paneller tek doğruluk
   * kaynağı olarak sunucuyu görür. Yalnızca yönetici oturumunda (OpsSync) çağrılır.
   */
  syncBookingsFromRemote(list: Booking[]) {
    try {
      const changed = safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
      if (changed) {
        parsedCache.delete('bookings');
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_bookings_updated'));
      }
    } catch (e) {}
  },

  syncComplaintsFromRemote(list: Complaint[]) {
    try {
      const changed = safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
      if (changed) {
        parsedCache.delete('complaints');
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_complaints_updated'));
      }
    } catch (e) {}
  },

  syncLeadsFromRemote(list: InvestmentLead[]) {
    try {
      const changed = safeSet(STORAGE_KEYS.INVESTMENT_LEADS, JSON.stringify(list));
      if (changed) {
        parsedCache.delete('leads');
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
      }
    } catch (e) {}
  },

  updateRequestStage(id: string, stage: string, status: ServiceRequest['status']) {
    const list = this.getRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        stage,
        status,
        updatedAt: new Date().toISOString()
      };
      try {
        const changed = safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
        parsedCache.delete('requests');
        if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_requests_updated'));
      } catch (e) {}
    }
  },

  // Cockpit: Otel İçi Hizmet Modülleri Yönetimi
  getModuleSettings(): ModuleAdminSettingsMap {
    try {
      const stored = safeGet(STORAGE_KEYS.MODULE_SETTINGS);
      if (stored) {
        const cached = parsedCache.get('module_settings');
        if (cached && cached.stamp === stored) {
          return cached.value as ModuleAdminSettingsMap;
        }
        const parsed = JSON.parse(stored);
        parsedCache.set('module_settings', { stamp: stored, value: parsed });
        return parsed;
      }
    } catch (e) {}
    return {};
  },

  getModuleSetting(key: string): ModuleAdminSettings {
    const all = this.getModuleSettings();
    return { ...DEFAULT_MODULE_SETTING, ...(all[key] ?? {}) };
  },

  setModuleSetting(key: string, settings: ModuleAdminSettings) {
    const all = { ...this.getModuleSettings(), [key]: settings };
    try {
      const changed = safeSet(STORAGE_KEYS.MODULE_SETTINGS, JSON.stringify(all));
      if (changed) {
        parsedCache.delete('module_settings');
        parsedCache.delete('in_room_services');
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_module_settings_updated'));
      }
    } catch (e) {}
  },

  // Misafir PWA Ön Kayıt & OCR (KBS) Modül Durumu (Kalıcı + Bulut Senkron)
  getGuestSelfKbsEnabled(hotelId?: string): boolean {
    const targetHotelId = hotelId || this.getActiveHotelId();
    try {
      const perHotel = safeGet(`xenios_enable_guest_self_kbs_${targetHotelId}`, '');
      if (perHotel === '0' || perHotel === 'false') return false;
      if (perHotel === '1' || perHotel === 'true') return true;

      const globalVal = safeGet('xenios_enable_guest_self_kbs_global', '');
      if (globalVal === '0' || globalVal === 'false') return false;
      if (globalVal === '1' || globalVal === 'true') return true;

      const hotel = this.getHotelById(targetHotelId);
      if (typeof hotel?.modules?.enable_guest_self_kbs === 'boolean') {
        return hotel.modules.enable_guest_self_kbs;
      }
    } catch {}
    return true;
  },

  setGuestSelfKbsEnabled(hotelId: string, enabled: boolean) {
    const targetHotelId = hotelId || this.getActiveHotelId();
    const now = new Date().toISOString();
    const flag = enabled ? '1' : '0';

    safeSet(`xenios_enable_guest_self_kbs_${targetHotelId}`, flag);
    safeSet(`xenios_enable_guest_self_kbs_updated_at_${targetHotelId}`, now);
    safeSet('xenios_enable_guest_self_kbs_global', flag);
    safeSet('xenios_enable_guest_self_kbs_updated_at_global', now);

    this.setModuleSetting('enable_guest_self_kbs', {
      enabled,
      hidden: !enabled,
      explicitlyHidden: !enabled,
    });

    const hotels = this.getHotels();
    const syncedHotels: Hotel[] = [];
    const nextHotels = hotels.map((h) => {
      if (h.id === targetHotelId || h.id === this.getActiveHotelId() || h.id === 'hotel-1' || h.id === 'hotel_1') {
        const updatedHotel: Hotel = {
          ...h,
          updatedAt: now,
          modules: {
            ...(h.modules || {}),
            enable_guest_self_kbs: enabled,
          },
        };
        syncedHotels.push(updatedHotel);
        return updatedHotel;
      }
      return h;
    });

    this.saveHotels(nextHotels);

    import('./firestore-service')
      .then(({ FirestoreService }) => {
        syncedHotels.forEach((sh) => {
          FirestoreService.upsertHotel(sh).catch(() => {});
        });
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_hotels_updated'));
      window.dispatchEvent(new Event('xenios_module_settings_updated'));
    }
  },

  syncGuestSelfKbsFromRemote(hotelId: string, enabled: boolean, remoteUpdatedAt?: string) {
    try {
      const localUpdatedAt =
        safeGet(`xenios_enable_guest_self_kbs_updated_at_${hotelId}`, '') ||
        safeGet('xenios_enable_guest_self_kbs_updated_at_global', '');
      if (remoteUpdatedAt && localUpdatedAt && remoteUpdatedAt <= localUpdatedAt) {
        return;
      }
      const flag = enabled ? '1' : '0';
      const changedHotel = safeSet(`xenios_enable_guest_self_kbs_${hotelId}`, flag);
      const changedGlobal = safeSet('xenios_enable_guest_self_kbs_global', flag);
      if (remoteUpdatedAt) {
        safeSet(`xenios_enable_guest_self_kbs_updated_at_${hotelId}`, remoteUpdatedAt);
        safeSet('xenios_enable_guest_self_kbs_updated_at_global', remoteUpdatedAt);
      }
      if ((changedHotel || changedGlobal) && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_hotels_updated'));
        window.dispatchEvent(new Event('xenios_module_settings_updated'));
      }
    } catch {}
  },


  // In-Room Services
  getDefaultInRoomServices(): InRoomServiceItem[] {
    return [
      { id: 'roomservice', key: 'roomservice', label: 'Kahvaltı & Yeme-İçme', desc: 'Kahvaltı, yiyecek & içecek menüsü', icon: '/icons/menu/roomservice.png', department: 'Mutfak & Yeme-İçme', enabled: true, hidden: false, order: 1 },
      { id: 'dnd', key: 'dnd', label: 'Rahatsız Etmeyin', desc: 'Rahatsız edilmek istemiyorum', icon: '/icons/menu/dnd.png', department: 'Housekeeping', enabled: true, hidden: false, order: 2 },
      { id: 'cleaning', key: 'cleaning', label: 'Temizlik Talebi', desc: 'Temizlik ve havalandırma talebi', icon: '/icons/menu/cleaning.png', department: 'Housekeeping', enabled: true, hidden: false, order: 3 },
      { id: 'linens', key: 'linens', label: 'Çarşaf & Nevresim', desc: 'Çarşaf ve nevresim takımı', icon: '/icons/menu/linens.png', department: 'Housekeeping', enabled: true, hidden: false, order: 4 },
      { id: 'toiletries', key: 'toiletries', label: 'Banyo Bukleti', desc: 'Şampuan, duş jeli, sabun', icon: '/icons/menu/toiletries.png', department: 'Housekeeping', enabled: true, hidden: false, order: 5 },
      { id: 'technical', key: 'technical', label: 'Teknik Destek', desc: 'Klima, TV, priz ve aydınlatma', icon: '/icons/menu/technical.png', department: 'Teknik Servis', enabled: true, hidden: false, order: 6 },
      { id: 'lateCheckout', key: 'lateCheckout', label: 'Geç Çıkış Talebi', desc: "Saat 14:00'e kadar geç çıkış", icon: '/icons/menu/lateCheckout.png', department: 'Danışma / Ön Büro', enabled: true, hidden: false, order: 7 },
      { id: 'extendStay', key: 'extendStay', label: 'Konaklama Uzatma', desc: 'Konaklama süresini uzat', icon: '/icons/menu/extendStay.png', department: 'Danışma / Rezervasyon', enabled: true, hidden: false, order: 8 },
      { id: 'towels', key: 'towels', label: 'Temiz Havlu', desc: 'Banyo & el havluları değişimi', icon: '/icons/menu/towels.png', department: 'Housekeeping', enabled: false, hidden: false, order: 9 },
      { id: 'pillows', key: 'pillows', label: 'Ekstra Yastık', desc: 'Ortopedik / ekstra yastık', icon: '/icons/menu/pillows.png', department: 'Housekeeping', enabled: false, hidden: false, order: 10 },
      { id: 'hygiene', key: 'hygiene', label: 'Hijyen & Bakım Seti', desc: 'Diş & tıraş seti, terlik', icon: '/icons/menu/hygiene.png', department: 'Housekeeping', enabled: false, hidden: false, order: 11 },
      { id: 'minibar', key: 'minibar', label: 'Mini Bar Dolumu', desc: 'Mini bar dolumu ve su', icon: '/icons/menu/minibar.png', department: 'Housekeeping', enabled: false, hidden: false, order: 12 },
      { id: 'safe', key: 'safe', label: 'Kasa & Güvenlik', desc: 'Kasa kullanımı & güvenlik', icon: '/icons/menu/safe.png', department: 'Danışma & Güvenlik', enabled: false, hidden: false, order: 13 },
      { id: 'laundry', key: 'laundry', label: 'Çamaşırhane & Ütü', desc: 'Kuru temizleme ve ütü', icon: '/icons/menu/laundry.png', department: 'Housekeeping (Çamaşırhane)', enabled: false, hidden: false, order: 14 },
      { id: 'breakfast', key: 'breakfast', label: 'Kahvaltı Talebi', desc: 'Birime veya açık büfe kahvaltı', icon: '/icons/menu/breakfast.png', department: 'Mutfak & Yeme-İçme', enabled: false, hidden: false, order: 15 },
      { id: 'taxi', key: 'taxi', label: 'Taksi & Ulaşım', desc: 'Taksi ve VIP transfer çağrısı', icon: '/icons/menu/taksi.png', department: 'Concierge & Ulaşım', enabled: false, hidden: false, order: 16 }
    ];
  },

  getInRoomServices(): InRoomServiceItem[] {
    const defaultServices = this.getDefaultInRoomServices();
    const _legacyUnused: InRoomServiceItem[] = [
      { id: 'safe', key: 'safe', label: 'Kasa & G�venlik', desc: 'Kasa kullan�m� & g�venlik', icon: '/icons/menu/safe.png', department: 'Resepsiyon & G�venlik', enabled: false, hidden: true, order: 10 },
      { id: 'technical', key: 'technical', label: 'Teknik Destek', desc: 'Klima, TV, priz ve ayd�nlatma', icon: '/icons/menu/technical.png', department: 'Teknik Servis', enabled: false, hidden: true, order: 11 },
      { id: 'laundry', key: 'laundry', label: '�ama��rhane & �t�', desc: 'Kuru temizleme ve �t�', icon: '/icons/menu/laundry.png', department: 'Housekeeping (�ama��rhane)', enabled: false, hidden: true, order: 12 },
      { id: 'lateCheckout', key: 'lateCheckout', label: 'Ge� ��k�� Talebi', desc: "Saat 14:00'e kadar ge� ��k��", icon: '/icons/menu/lateCheckout.png', department: 'Resepsiyon / �n B�ro', enabled: false, hidden: true, order: 13 },
      { id: 'extendStay', key: 'extendStay', label: 'Konaklama Uzatma', desc: 'Konaklama s�resini uzat', icon: '/icons/menu/extendStay.png', department: 'Resepsiyon / Rezervasyon', enabled: false, hidden: true, order: 14 }
    ];

    const rawInRoom = safeGet(STORAGE_KEYS.IN_ROOM_SERVICES) || '';
    const rawSettings = safeGet(STORAGE_KEYS.MODULE_SETTINGS) || '';
    const activeId = this.getActiveHotelId();
    const activeHotel = this.getHotelById(activeId);
    const hotelModsStamp = activeHotel?.modules?.inRoomServicesUpdatedAt || activeHotel?.updatedAt || '';
    const cacheStamp = `${activeId}:${hotelModsStamp}:${rawInRoom.length}:${rawSettings.length}:${rawInRoom}:${rawSettings}`;
    const cachedInRoom = parsedCache.get('in_room_services');
    if (cachedInRoom && cachedInRoom.stamp === cacheStamp) {
      return (cachedInRoom.value as InRoomServiceItem[]).slice();
    }

    const defaultMap = new Map<string, InRoomServiceItem>(defaultServices.map(s => [s.key, s]));

    let storedList: InRoomServiceItem[] = [];
    try {
      if (rawInRoom) {
        const parsed = JSON.parse(rawInRoom);
        if (Array.isArray(parsed)) {
          storedList = parsed;
        }
      } else if (Array.isArray(activeHotel?.modules?.inRoomServices)) {
        storedList = activeHotel!.modules!.inRoomServices;
      }
    } catch (e) {}

    const storedByKey = new Map<string, InRoomServiceItem>();
    const customItems: InRoomServiceItem[] = [];

    for (const item of storedList) {
      if (!item || !item.key) continue;
      if (defaultMap.has(item.key)) {
        storedByKey.set(item.key, item);
      } else if (item.isCustom) {
        customItems.push(item);
      }
    }

    const mergedDefaults: InRoomServiceItem[] = defaultServices.map(def => {
      const saved = storedByKey.get(def.key);
      if (!saved) return def;
      const shouldUseDefLabel =
        saved.label === 'Oda Servisi' ||
        saved.label === 'Oda Temizliği';
      return {
        ...def,
        ...saved,
        label: shouldUseDefLabel ? def.label : (saved.label || def.label),
        desc: def.desc,
        department: def.department,
        id: def.id,
        key: def.key,
        order: saved.order ?? def.order,
      };
    });

    const items = [...mergedDefaults, ...customItems];
    const moduleSettings = this.getModuleSettings();

    const result = items.map(item => {
      const ms = moduleSettings[item.key];
      const enabled = ms?.enabled !== undefined ? ms.enabled : item.enabled;
      const explicitlyHidden =
        ms?.explicitlyHidden !== undefined
          ? ms.explicitlyHidden
          : item.explicitlyHidden === true;
      // Whenever a module is enabled (active), it is visible on the guest hotel page.
      // Legacy `hidden: true` from older defaults is automatically cleared unless explicitlyHidden is set.
      const hidden = enabled ? false : explicitlyHidden ? true : false;

      return {
        ...item,
        enabled,
        hidden,
        explicitlyHidden,
      };
    }).sort((a, b) => (a.order || 99) - (b.order || 99));

    parsedCache.set('in_room_services', { stamp: cacheStamp, value: result });
    return result.slice();
  },

  syncInRoomServicesToActiveHotel(list: InRoomServiceItem[]) {
    try {
      const updatedAt = new Date().toISOString();
      safeSet('xenios_in_room_services_updated_at', updatedAt);
      const activeId = this.getActiveHotelId();
      const hotels = this.getHotels();
      let targetHotel: Hotel | undefined;
      const nextHotels = hotels.map(h => {
        if (h.id === activeId) {
          targetHotel = {
            ...h,
            modules: {
              ...(h.modules || {}),
              inRoomServices: list,
              inRoomServicesUpdatedAt: updatedAt,
            },
          };
          return targetHotel;
        }
        return h;
      });
      if (targetHotel) {
        this.saveHotels(nextHotels);
        const synced = targetHotel;
        import('./firestore-service').then(({ FirestoreService }) => {
          FirestoreService.upsertHotel(synced).catch(() => {});
        }).catch(() => {});
      }
    } catch (e) {}
  },

  syncInRoomServicesFromRemote(remoteList: InRoomServiceItem[], remoteUpdatedAt?: string) {
    try {
      if (!Array.isArray(remoteList) || remoteList.length === 0) return;
      const localUpdatedAt = safeGet('xenios_in_room_services_updated_at', '');
      if (remoteUpdatedAt && localUpdatedAt && remoteUpdatedAt <= localUpdatedAt) {
        return;
      }
      const changedList = safeSet(STORAGE_KEYS.IN_ROOM_SERVICES, JSON.stringify(remoteList));
      if (remoteUpdatedAt) {
        safeSet('xenios_in_room_services_updated_at', remoteUpdatedAt);
      }
      const allSettings = { ...this.getModuleSettings() };
      remoteList.forEach(item => {
        if (!item?.key) return;
        const enabled = item.enabled !== false;
        const explicitlyHidden = enabled ? false : item.explicitlyHidden === true;
        allSettings[item.key] = {
          ...(allSettings[item.key] || {}),
          enabled,
          hidden: enabled ? false : explicitlyHidden,
          explicitlyHidden,
        };
      });
      const changedSettings = safeSet(STORAGE_KEYS.MODULE_SETTINGS, JSON.stringify(allSettings));
      if (changedList || changedSettings) {
        parsedCache.delete('in_room_services');
        parsedCache.delete('module_settings');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('xenios_in_room_services_updated'));
          window.dispatchEvent(new Event('xenios_module_settings_updated'));
        }
      }
    } catch (e) {}
  },

  saveInRoomService(item: InRoomServiceItem) {
    const list = this.getInRoomServices();
    const enabled = item.enabled !== false;
    const explicitlyHidden = enabled ? false : item.explicitlyHidden === true;
    const normalizedItem: InRoomServiceItem = {
      ...item,
      enabled,
      hidden: enabled ? false : explicitlyHidden,
      explicitlyHidden,
    };

    const idx = list.findIndex(s => s.id === normalizedItem.id || s.key === normalizedItem.key);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...normalizedItem };
    } else {
      list.push({ ...normalizedItem, isCustom: true, order: list.length + 1 });
    }

    try {
      safeSet(STORAGE_KEYS.IN_ROOM_SERVICES, JSON.stringify(list));
      parsedCache.delete('in_room_services');
      this.setModuleSetting(normalizedItem.key, {
        enabled: normalizedItem.enabled,
        hidden: normalizedItem.hidden,
        explicitlyHidden: normalizedItem.explicitlyHidden,
        pricing: normalizedItem.pricingDefaults,
        fieldOptions: normalizedItem.fieldOptions
      });
      this.syncInRoomServicesToActiveHotel(list);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_in_room_services_updated'));
    } catch (e) {}
  },

  deleteInRoomService(idOrKey: string) {
    let list = this.getInRoomServices();
    const item = list.find(s => s.id === idOrKey || s.key === idOrKey);
    if (item?.isCustom) {
      list = list.filter(s => s.id !== idOrKey && s.key !== idOrKey);
    } else if (item) {
      list = list.map(s =>
        s.id === idOrKey || s.key === idOrKey
          ? { ...s, enabled: false, hidden: true, explicitlyHidden: true }
          : s
      );
    }
    try {
      safeSet(STORAGE_KEYS.IN_ROOM_SERVICES, JSON.stringify(list));
      parsedCache.delete('in_room_services');
      if (item) {
        this.setModuleSetting(item.key, {
          enabled: false,
          hidden: true,
          explicitlyHidden: true,
        });
      }
      this.syncInRoomServicesToActiveHotel(list);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_in_room_services_updated'));
    } catch (e) {}
  },

  resetInRoomServicesToDefault() {
    try {
      safeRemove(STORAGE_KEYS.IN_ROOM_SERVICES);
      safeRemove(STORAGE_KEYS.MODULE_SETTINGS);
      parsedCache.delete('in_room_services');
      parsedCache.delete('module_settings');
      const defaults = this.getDefaultInRoomServices();
      this.syncInRoomServicesToActiveHotel(defaults);
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
        allergens: 'Gluten, Süt Ürünleri, Yumurta, Susam',
        calories: 780,
        price: 24,
        currency: 'EUR',
        image: '/images/experiences/rest-3.jpg',
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
        allergens: 'Süt Ürünleri (Tereyağı, Krema)',
        calories: 690,
        price: 34,
        currency: 'EUR',
        image: '/images/experiences/rest-1.jpg',
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
        allergens: 'Gluten, Yumurta, Süt Ürünleri (Krema, Parmesan)',
        calories: 560,
        price: 21,
        currency: 'EUR',
        image: '/images/experiences/rest-9.jpg',
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
        allergens: 'Gluten, Yumurta, Süt Ürünleri, Hardal',
        calories: 620,
        price: 16,
        currency: 'EUR',
        image: '/images/experiences/rest-6.jpg',
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
        allergens: 'Süt Ürünleri, Kuruyemiş (Fındık)',
        calories: 380,
        price: 9,
        currency: 'EUR',
        image: '/images/experiences/rest-11.jpg',
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
        allergens: 'Alerjen İçermez (%100 Doğal)',
        calories: 115,
        price: 7,
        currency: 'EUR',
        image: '/images/experiences/rest-15.jpg',
        available: true,
        preparationTimeMinutes: 5,
        createdAt: new Date().toISOString()
      }
    ];

    const fixFoodImage = (item: any) => {
      let img = item.image;
      if (!img || img.includes('exp-gastro-') || (img.includes('/images/experiences/exp-') && !img.includes('exp-gastro-'))) {
        if (item.name?.includes('Kahvaltı')) return '/images/experiences/rest-3.jpg';
        if (item.name?.includes('Antrikot')) return '/images/experiences/rest-1.jpg';
        if (item.name?.includes('Fettuccine')) return '/images/experiences/rest-9.jpg';
        if (item.name?.includes('Sandviç')) return '/images/experiences/rest-6.jpg';
        if (item.name?.includes('Sütlaç')) return '/images/experiences/rest-11.jpg';
        if (item.name?.includes('Portakal')) return '/images/experiences/rest-15.jpg';
      }
      return img || '/images/experiences/rest-1.jpg';
    };

    try {
      const stored = safeGet(`${STORAGE_KEYS.ROOM_SERVICE_MENU}_${targetHotelId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => {
          const fallback = defaultMenu.find(d => d.id === item.id);
          return {
            ...item,
            allergens: item.allergens ?? fallback?.allergens ?? '',
            calories: item.calories ?? fallback?.calories ?? undefined,
            image: fixFoodImage(item)
          };
        });
      }
    } catch (e) {}
    
    return defaultMenu.map(item => ({
      ...item,
      image: fixFoodImage(item)
    }));
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
        const cached = parsedCache.get('bookings');
        if (cached && cached.stamp === stored) {
          return (cached.value as Booking[]).slice();
        }
        const list: Booking[] = JSON.parse(stored);
        const realList = list.filter(b => !b.isDemo && !b.id?.includes('demo'));
        if (realList.length !== list.length) {
          const nextRaw = JSON.stringify(realList);
          safeSet(STORAGE_KEYS.BOOKINGS, nextRaw);
          parsedCache.set('bookings', { stamp: nextRaw, value: realList });
        } else {
          parsedCache.set('bookings', { stamp: stored, value: realList });
        }
        return realList.slice();
      }
    } catch (e) {}
    return [];
  },

  addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'confirmationCode'>): Booking {
    const list = this.getBookings();
    const confirmationCode = 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newBooking: Booking = {
      ...booking,
      hotelId: booking.hotelId || this.getActiveHotelId(),
      roomNumber: booking.roomNumber || this.getActiveRoomId(),
      id: `book-${Date.now()}`,
      confirmationCode,
      createdAt: new Date().toISOString()
    };
    list.unshift(newBooking);
    try {
      const changed = safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
      parsedCache.delete('bookings');
      if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_bookings_updated'));
    } catch (e) {}
    return newBooking;
  },

  updateBookingStatus(id: string, status: Booking['status']) {
    const list = this.getBookings();
    const idx = list.findIndex(b => b.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status };
      try {
        const changed = safeSet(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
        parsedCache.delete('bookings');
        if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_bookings_updated'));
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
      // Misafir anketi doldurmadan hiçbir tercih/alerji/diyet varsayılmaz.
      interests: [],
      dietaryRestrictions: [],
      kvkkConsent: false
    };
  },

  setGuestProfile(profile: GuestProfile) {
    try {
      safeSet(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      const currentPrefs = this.getUserPreferences();
      const updatedPrefs: UserPreferences = {
        ...currentPrefs,
        guest_profile_survey: profile,
        know_me_profile: {
          ...currentPrefs.know_me_profile,
          budget_tier: profile.budgetLevel === 'economy' ? 'BUDGET' : profile.budgetLevel === 'moderate' ? 'MODERATE' : 'LUXURY',
          interests: {
            ...currentPrefs.know_me_profile?.interests,
            gastronomy: (profile.interests || []).includes('Gastronomi'),
            bosphorus_tours: (profile.interests || []).includes('Boğaz & Deniz'),
            real_estate_investment: (profile.interests || []).includes('Yatırım'),
            aesthetic_and_wellness: currentPrefs.know_me_profile?.interests?.aesthetic_and_wellness || { interested: true, sub_categories: ['HYDRAFACIAL', 'SPA_MASSAGE', 'HAMMAM'] },
            nightlife_pubcrawl: (profile.interests || []).includes('Gece Hayatı')
          }
        }
      };
      safeSet(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
    } catch (e) {}
  },

  clearGuestProfile() {
    const cleared: GuestProfile = { kvkkConsent: false };
    try {
      safeSet(STORAGE_KEYS.PROFILE, JSON.stringify(cleared));
      const currentPrefs = this.getUserPreferences();
      safeSet(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({ ...currentPrefs, guest_profile_survey: cleared }));
    } catch (e) {}
    return cleared;
  },

  // -------------------------------------------------------------
  // Comus AI User Preferences & Viewed Listings State Engine
  // -------------------------------------------------------------
  getUserPreferences(): UserPreferences {
    const surveyProfile = this.getGuestProfile();
    try {
      const stored = safeGet(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          guest_profile_survey: parsed.guest_profile_survey || surveyProfile
        };
      }
    } catch (e) {}

    // Varsayılan boş profil — misafir hakkında bilgi uydurulmaz
    return {
      guest_id: 'guest_anonymous',
      first_name: '',
      last_name: '',
      hotel_info: {
        hotel_id: this.getActiveHotelId(),
        hotel_name: '',
        room_number: this.getActiveRoomId(),
        district: '',
        location: { lat: 0, lng: 0 }
      },
      guest_profile_survey: surveyProfile,
      know_me_profile: {
        travel_purpose: 'LEISURE',
        interests: {
          aesthetic_and_wellness: {
            interested: false,
            sub_categories: []
          },
          gastronomy: false,
          bosphorus_tours: false,
          real_estate_investment: false,
          nightlife_pubcrawl: false
        },
        budget_tier: surveyProfile.budgetLevel === 'economy' ? 'BUDGET' : surveyProfile.budgetLevel === 'luxury' ? 'LUXURY' : 'MODERATE'
      },
      viewed_listings_history: [],
      blacklisted_offers: [],
      booked_itinerary: []
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
        const cached = parsedCache.get('complaints');
        if (cached && cached.stamp === stored) {
          return (cached.value as Complaint[]).slice();
        }
        const list: Complaint[] = JSON.parse(stored);
        const realList = list.filter(c => !c.isDemo && !c.id?.includes('demo'));
        if (realList.length !== list.length) {
          const nextRaw = JSON.stringify(realList);
          safeSet(STORAGE_KEYS.COMPLAINTS, nextRaw);
          parsedCache.set('complaints', { stamp: nextRaw, value: realList });
        } else {
          parsedCache.set('complaints', { stamp: stored, value: realList });
        }
        return realList.slice();
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
      const changed = safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
      parsedCache.delete('complaints');
      if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_complaints_updated'));
    } catch (e) {}
    return newComp;
  },

  updateComplaintStatus(id: string, status: ComplaintStatus, responseNote?: string, isPublicAlert?: boolean) {
    const list = this.getComplaints();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      const item = { ...list[idx], status, updatedAt: new Date().toISOString() };
      if (responseNote !== undefined) item.businessResponse = responseNote;
      if (isPublicAlert !== undefined) item.isPublicAlert = isPublicAlert;
      if (status === 'published_blacklisted') item.isPublicAlert = true;
      list[idx] = item;
      try {
        const changed = safeSet(STORAGE_KEYS.COMPLAINTS, JSON.stringify(list));
        parsedCache.delete('complaints');
        if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event('xenios_complaints_updated'));
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

  getHotelPartnerApplications(): HotelPartnerApplication[] {
    try {
      const stored = safeGet(STORAGE_KEYS.PARTNER_APPLICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        }
      }
    } catch (e) {}
    return [];
  },

  saveHotelPartnerApplications(list: HotelPartnerApplication[]) {
    safeSet(STORAGE_KEYS.PARTNER_APPLICATIONS, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_partner_applications_updated'));
    }
  },

  async syncHotelPartnerApplicationsFromServer(): Promise<HotelPartnerApplication[]> {
    try {
      const res = await fetch('/api/partner-applications', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.applications)) {
        const local = this.getHotelPartnerApplications();
        const mergedMap = new Map<string, HotelPartnerApplication>();
        local.forEach((item) => mergedMap.set(item.id, item));
        data.applications.forEach((item: HotelPartnerApplication) => mergedMap.set(item.id, item));
        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        this.saveHotelPartnerApplications(merged);
        return merged;
      }
    } catch (e) {}
    return this.getHotelPartnerApplications();
  },

  async submitHotelPartnerApplication(
    payload: Omit<HotelPartnerApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<HotelPartnerApplication> {
    const now = new Date().toISOString();
    const newApp: HotelPartnerApplication = {
      ...payload,
      id: `partner-app-${Date.now()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const current = this.getHotelPartnerApplications();
    this.saveHotelPartnerApplications([newApp, ...current]);

    try {
      await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', application: newApp }),
      });
    } catch (e) {}

    return newApp;
  },

  async updateHotelPartnerApplicationStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<void> {
    const now = new Date().toISOString();
    const list = this.getHotelPartnerApplications().map((item) =>
      item.id === id ? { ...item, status, reviewedAt: now, updatedAt: now } : item
    );
    this.saveHotelPartnerApplications(list);

    try {
      await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id, status }),
      });
    } catch (e) {}
  },

  async deleteHotelPartnerApplication(id: string): Promise<void> {
    const list = this.getHotelPartnerApplications().filter((item) => item.id !== id);
    this.saveHotelPartnerApplications(list);

    try {
      await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
    } catch (e) {}
  },

  clearAiChatMessages(): void {
    try {
      safeRemove(STORAGE_KEYS.AI_CHAT_MESSAGES);
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // B2B Ajanlar & Mirofish CRM (20+ Lead + Sistem Parametreleri)
  // -------------------------------------------------------------
  getDeletedB2BLeadIds(): Set<string> {
    return getDeletedIdSet(STORAGE_KEYS.B2B_DELETED_IDS);
  },

  markB2BLeadDeleted(id: string) {
    addDeletedId(STORAGE_KEYS.B2B_DELETED_IDS, id);
  },

  getMirofishParameters(): MirofishSystemParameters {
    const raw = safeGet(STORAGE_KEYS.B2B_MIROFISH_PARAMS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...seedB2BDataset.mirofishSystemParameters, ...parsed };
        }
      } catch {}
    }
    return { ...seedB2BDataset.mirofishSystemParameters };
  },

  saveMirofishParameters(params: MirofishSystemParameters) {
    safeSet(STORAGE_KEYS.B2B_MIROFISH_PARAMS, JSON.stringify(params));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_b2b_leads_updated'));
    }
    import('./firestore-service')
      .then(({ FirestoreService }) => {
        FirestoreService.upsertMirofishParameters(params).catch(() => {});
      })
      .catch(() => {});
  },

  getB2BLeads(): B2BLead[] {
    const stored = safeGet(STORAGE_KEYS.B2B_MIROFISH_LEADS);
    const deletedRaw = safeGet(STORAGE_KEYS.B2B_DELETED_IDS);
    const stamp = `${stored.length}:${deletedRaw}:${stored.slice(0, 64)}:${stored.slice(-64)}`;
    const cached = parsedCache.get('b2b_leads');
    if (cached && cached.stamp === stamp) {
      return (cached.value as B2BLead[]).slice();
    }

    const deletedIds = this.getDeletedB2BLeadIds();
    const seedList = Array.isArray(seedB2BDataset.suppliers) ? seedB2BDataset.suppliers : [];
    const mergedMap = new Map<string, B2BLead>();

    seedList.forEach((lead) => {
      if (lead && lead.id && !deletedIds.has(lead.id)) {
        mergedMap.set(lead.id, { ...lead });
      }
    });

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: B2BLead) => {
            if (!item || !item.id) return;
            if (item.deleted || deletedIds.has(item.id)) {
              mergedMap.delete(item.id);
              return;
            }
            const existing = mergedMap.get(item.id);
            mergedMap.set(item.id, existing ? { ...existing, ...item } : item);
          });
        }
      } catch {}
    }

    const result = Array.from(mergedMap.values());
    parsedCache.set('b2b_leads', { stamp, value: result });
    return result.slice();
  },

  saveB2BLeads(leads: B2BLead[]) {
    const deletedIds = this.getDeletedB2BLeadIds();
    const filtered = leads.filter((l) => l && l.id && !l.deleted && !deletedIds.has(l.id));
    const json = JSON.stringify(filtered);
    const changed = safeSet(STORAGE_KEYS.B2B_MIROFISH_LEADS, json);
    parsedCache.delete('b2b_leads');
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_b2b_leads_updated'));
    }
  },

  addB2BLead(lead: B2BLead) {
    const now = new Date().toISOString();
    const stamped: B2BLead = {
      ...lead,
      verifiedAt: lead.verifiedAt || now.slice(0, 10),
      updatedAt: now,
      deleted: false,
    };
    const current = this.getB2BLeads().filter((x) => x.id !== stamped.id);
    this.saveB2BLeads([stamped, ...current]);
    import('./firestore-service')
      .then(({ FirestoreService }) => {
        FirestoreService.upsertB2BLead(stamped).catch(() => {});
      })
      .catch(() => {});
  },

  updateB2BLead(id: string, patch: Partial<B2BLead>) {
    const now = new Date().toISOString();
    let updatedItem: B2BLead | undefined;
    const next = this.getB2BLeads().map((lead) => {
      if (lead.id === id) {
        updatedItem = { ...lead, ...patch, updatedAt: now };
        return updatedItem;
      }
      return lead;
    });
    this.saveB2BLeads(next);
    if (updatedItem) {
      const synced = updatedItem;
      import('./firestore-service')
        .then(({ FirestoreService }) => {
          FirestoreService.upsertB2BLead(synced).catch(() => {});
        })
        .catch(() => {});
    }
  },

  deleteB2BLead(id: string) {
    this.markB2BLeadDeleted(id);
    const next = this.getB2BLeads().filter((l) => l.id !== id);
    this.saveB2BLeads(next);
    import('./firestore-service')
      .then(({ FirestoreService }) => {
        FirestoreService.deleteB2BLeadRemote(id).catch(() => {});
      })
      .catch(() => {});
  },

  exportB2BMirofishDataset(): B2BMirofishDataset {
    const suppliers = this.getB2BLeads();
    return {
      project: seedB2BDataset.project || 'Purelyistanbul B2B Hospitality SaaS & Curated Marketplace',
      exportedAt: new Date().toISOString(),
      mirofishSystemParameters: this.getMirofishParameters(),
      totalCount: suppliers.length,
      suppliers,
    };
  },

  importB2BMirofishDataset(payload: Partial<B2BMirofishDataset>): { importedCount: number } {
    if (payload.mirofishSystemParameters && typeof payload.mirofishSystemParameters === 'object') {
      this.saveMirofishParameters({
        ...this.getMirofishParameters(),
        ...payload.mirofishSystemParameters,
      });
    }
    const incoming = Array.isArray(payload.suppliers) ? payload.suppliers : [];
    if (incoming.length === 0) {
      return { importedCount: 0 };
    }
    const now = new Date().toISOString();
    const deletedSet = this.getDeletedB2BLeadIds();
    const currentMap = new Map<string, B2BLead>(this.getB2BLeads().map((l) => [l.id, l]));
    incoming.forEach((item) => {
      if (!item || !item.id || !item.name) return;
      deletedSet.delete(item.id);
      const prev = currentMap.get(item.id);
      currentMap.set(item.id, {
        ...(prev || {}),
        ...item,
        updatedAt: now,
        deleted: false,
      } as B2BLead);
    });
    safeSet(STORAGE_KEYS.B2B_DELETED_IDS, JSON.stringify(Array.from(deletedSet)));
    deletedIdSetCache.delete(STORAGE_KEYS.B2B_DELETED_IDS);
    const merged = Array.from(currentMap.values());
    this.saveB2BLeads(merged);
    import('./firestore-service')
      .then(({ FirestoreService }) => {
        incoming.forEach((item) => {
          if (item && item.id) {
            FirestoreService.upsertB2BLead({ ...item, updatedAt: now, deleted: false }).catch(() => {});
          }
        });
      })
      .catch(() => {});
    return { importedCount: incoming.length };
  },

  resetB2BMirofishToSeed() {
    safeRemove(STORAGE_KEYS.B2B_DELETED_IDS);
    safeRemove(STORAGE_KEYS.B2B_MIROFISH_LEADS);
    safeRemove(STORAGE_KEYS.B2B_MIROFISH_PARAMS);
    parsedCache.delete('b2b_leads');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('xenios_b2b_leads_updated'));
    }
  },

  onboardB2BLeadToLiveInventory(lead: B2BLead): { type: 'hotel' | 'supplier'; id: string } {
    const isAccommodation =
      lead.roleType.includes('Konaklama') ||
      lead.category.toLowerCase().includes('pmc') ||
      lead.category.toLowerCase().includes('otel');

    if (isAccommodation) {
      const hotelId = lead.onboardedToLiveId || `hotel-${lead.id}`;
      const roomCount = Math.min(Math.max(Number(lead.unitCount) || 10, 1), 60);
      const isPmc = lead.category.toLowerCase().includes('pmc') || lead.unitLabel.toLowerCase().includes('daire');
      const rooms: Room[] = Array.from({ length: roomCount }, (_, idx) => ({
        id: `rm_${hotelId}_${101 + idx}`,
        number: isPmc ? `Daire ${101 + idx}` : String(101 + idx),
        type: isPmc ? 'Residence Suite' : idx % 3 === 0 ? 'Suite' : 'Deluxe',
        floor: String(Math.floor(idx / 6) + 1),
        wifiSsid: `${lead.name.split(' ')[0]}_Guest`,
        wifiPass: 'Purely2026!',
        locationAddress: lead.address,
      }));

      const newHotel: Hotel = {
        id: hotelId,
        name: lead.name,
        district: `${lead.neighborhood ? `${lead.neighborhood}, ` : ''}${lead.district}`,
        type: lead.category,
        address: lead.address || `${lead.district}, İstanbul`,
        phone: lead.phone,
        website: lead.website || 'https://',
        ratingStr: '4.9/5',
        targetReason: lead.fieldNotes || lead.pitchAngle,
        coords: { lat: 41.0082, lng: 28.9784 },
        rooms,
        breakfastHours: '08:00 - 11:00',
        checkoutTime: '11:30',
        receptionExt: '0',
        status: 'active',
        commissionRate: 4,
        contactEmail: lead.email,
        managerName: lead.decisionMakerName || lead.decisionMakerRole,
        managerPhone: lead.phone,
        whatsappPhone: lead.phone,
        publishToWeb: true,
        publishToMobile: true,
        updatedAt: new Date().toISOString(),
      };

      const existing = this.getHotels().some((h) => h.id === hotelId);
      if (existing) {
        this.updateHotel(hotelId, newHotel);
      } else {
        this.addHotel(newHotel);
      }
      this.updateB2BLead(lead.id, {
        stage: 'Pilot Sözleşme',
        onboardedToLiveId: hotelId,
      });
      return { type: 'hotel', id: hotelId };
    } else {
      const supId = lead.onboardedToLiveId || `sup-${lead.id}`;
      const now = new Date().toISOString();
      const newSup: SupplierPartner = {
        id: supId,
        name: lead.name,
        legalName: `${lead.name} (${lead.legalShieldStatus})`,
        type: inferSupplierType(lead.category),
        category: lead.category,
        contactPerson: lead.decisionMakerName || lead.decisionMakerRole || 'Operasyon Direktörü',
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        district: `${lead.neighborhood ? `${lead.neighborhood}, ` : ''}${lead.district}`,
        address: lead.address,
        commissionRate: 15,
        contractStatus: 'active',
        contractStartDate: now.slice(0, 10),
        contractNotes: `${lead.fieldNotes} | Yasal Kalkan: ${lead.legalShieldStatus}`,
        publishToWeb: true,
        publishToMobile: true,
        createdAt: now,
        updatedAt: now,
      };

      const existing = this.getSuppliers().some((s) => s.id === supId);
      if (existing) {
        this.updateSupplier(supId, newSup);
      } else {
        this.addSupplier(newSup);
      }
      this.updateB2BLead(lead.id, {
        stage: 'Pilot Sözleşme',
        onboardedToLiveId: supId,
      });
      return { type: 'supplier', id: supId };
    }
  }
};
