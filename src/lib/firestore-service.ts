import { db, isFirebaseConfigured } from './firebase';
import { authFetch } from './auth-fetch';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';
import { Hotel, Experience, PropertyListing, Booking, Complaint, ServiceRequest, SupplierPartner, B2BLead, MirofishSystemParameters } from './types';
import { XeniosStore } from './store';
import { HotelAudioNotification, shouldReceiveStaffRequestAlerts } from './hotel-audio-notification';
import { normalizeCategoryLabel, type CategoryConfig } from './marketplace/categories';
import {
  experienceToMarketplaceListing,
  hotelToMarketplaceListing,
} from './marketplace/seed-listings';

// Collection Names
export const COLLECTIONS = {
  HOTELS: 'hotels',
  EXPERIENCES: 'experiences',
  PROPERTIES: 'properties',
  SUPPLIERS: 'suppliers',
  B2B_LEADS: 'b2b_mirofish_leads',
  B2B_PARAMS: 'b2b_mirofish_settings',
  SITE_CATEGORIES: 'site_categories',
  MARKETPLACE_LISTINGS: 'marketplace_listings',
  BOOKINGS: 'bookings',
  COMPLAINTS: 'complaints',
  REQUESTS: 'service_requests',
  INVESTMENT_LEADS: 'investment_leads',
  NOTIFICATIONS: 'notifications_log',
  AI_LOGS: 'ai_logs',
  ADMINS: 'admins'
};

/** Yazma hatasını konsola yazar ve arayüzün kullanıcıya gösterebilmesi için olay yayınlar. */
function reportSyncError(scope: string, e: unknown) {
  console.warn(`Firestore ${scope} error:`, e);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('xenios_sync_error', { detail: { scope, code: (e as { code?: string })?.code || '' } })
    );
  }
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean as T;
}

async function postAdminCatalog(action: string, payload: Record<string, any>): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await authFetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}

const seenRemoteRequestIds = new Set<string>();
let catalogSyncRefCount = 0;
let catalogSyncCoreUnsub: Unsubscribe | null = null;

interface LiveRequestChannel {
  subscribers: Set<(requests: ServiceRequest[]) => void>;
  lastList: ServiceRequest[] | null;
  lastSignature: string;
  teardown: () => void;
}
const liveRequestChannels = new Map<string, LiveRequestChannel>();

const DEFAULT_HOTEL_ALIASES = ['hotel-heritage-1', 'hotel-1', 'hotel_1'];
const REST_FALLBACK_INTERVAL_MS = 15_000;
const REST_MIN_COOLDOWN_MS = 5_000;
const SNAPSHOT_BOOT_TIMEOUT_MS = 4_000;

function resolveHotelIdFilterList(hotelId: string | null): string[] {
  if (hotelId && hotelId.trim()) {
    const trimmed = hotelId.trim();
    return DEFAULT_HOTEL_ALIASES.includes(trimmed) ? DEFAULT_HOTEL_ALIASES : [trimmed];
  }
  const active = (typeof window !== 'undefined' ? XeniosStore.getActiveHotelId() : '') || 'hotel-heritage-1';
  return DEFAULT_HOTEL_ALIASES.includes(active) ? DEFAULT_HOTEL_ALIASES : [active];
}

function buildRequestListSignature(list: ServiceRequest[]): string {
  let sig = `${list.length}`;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    sig += `|${r.id}:${r.status}:${r.stage || ''}:${r.updatedAt || ''}:${r.paymentStatus || ''}:${r.notes || ''}`;
  }
  return sig;
}

export const FirestoreService = {
  // 🌐 CATALOG REALTIME SYNC (Experiences, Hotels, Properties, Suppliers -> Web Marketplace + Mobile App)
  async upsertExperience(exp: Experience): Promise<void> {
    const now = exp.updatedAt || new Date().toISOString();
    const stamped = { ...exp, deleted: false, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_experience', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.EXPERIENCES, exp.id), stripUndefined(stamped));

      // Mirror to marketplace_listings so Web Marketplace updates live alongside Mobile Concierge
      const mpListing = experienceToMarketplaceListing(exp, 0);
      const mpStatus = exp.status === 'suspended' || exp.publishToWeb === false ? 'suspended' : 'approved';
      await setDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, exp.id), stripUndefined({
        ...mpListing,
        status: mpStatus,
        updatedAt: now
      }));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertExperience', e);
    }
  },

  async deleteExperienceRemote(id: string): Promise<void> {
    const now = new Date().toISOString();
    const serverOkPromise = postAdminCatalog('delete_experience', { id });

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.EXPERIENCES, id), {
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now
      });
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('deleteExperienceRemote', e);
    }
  },

  async upsertHotel(hotel: Hotel): Promise<void> {
    const now = hotel.updatedAt || new Date().toISOString();
    const stamped = { ...hotel, deleted: false, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_hotel', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.HOTELS, hotel.id), stripUndefined(stamped));

      if (hotel.publishToWeb && hotel.status !== 'suspended') {
        const mpListing = hotelToMarketplaceListing(hotel, 0);
        await setDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, hotel.id), stripUndefined({
          ...mpListing,
          status: 'approved',
          updatedAt: now
        }));
      } else {
        await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, hotel.id)).catch(() => {});
      }
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertHotel', e);
    }
  },

  async deleteHotelRemote(id: string): Promise<void> {
    const now = new Date().toISOString();
    const serverOkPromise = postAdminCatalog('delete_hotel', { id });

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.HOTELS, id), {
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now
      });
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('deleteHotelRemote', e);
    }
  },

  async upsertProperty(prop: PropertyListing): Promise<void> {
    const now = prop.updatedAt || new Date().toISOString();
    const stamped = { ...prop, deleted: false, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_property', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, prop.id), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertProperty', e);
    }
  },

  async deletePropertyRemote(id: string): Promise<void> {
    const now = new Date().toISOString();
    const serverOkPromise = postAdminCatalog('delete_property', { id });

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, id), {
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now
      });
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('deletePropertyRemote', e);
    }
  },

  async upsertSupplier(supplier: SupplierPartner): Promise<void> {
    const now = supplier.updatedAt || new Date().toISOString();
    const stamped = { ...supplier, deleted: false, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_supplier', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.SUPPLIERS, supplier.id), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertSupplier', e);
    }
  },

  async deleteSupplierRemote(id: string): Promise<void> {
    const now = new Date().toISOString();
    const serverOkPromise = postAdminCatalog('delete_supplier', { id });

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.SUPPLIERS, id), {
        id,
        deleted: true,
        contractStatus: 'suspended',
        updatedAt: now
      });
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('deleteSupplierRemote', e);
    }
  },

  async upsertB2BLead(lead: B2BLead): Promise<void> {
    const now = lead.updatedAt || new Date().toISOString();
    const stamped = { ...lead, deleted: false, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_b2b_lead', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.B2B_LEADS, lead.id), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertB2BLead', e);
    }
  },

  async deleteB2BLeadRemote(id: string): Promise<void> {
    const now = new Date().toISOString();
    const serverOkPromise = postAdminCatalog('delete_b2b_lead', { id });

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.B2B_LEADS, id), {
        id,
        deleted: true,
        updatedAt: now
      });
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('deleteB2BLeadRemote', e);
    }
  },

  async upsertMirofishParameters(params: MirofishSystemParameters): Promise<void> {
    const now = new Date().toISOString();
    const stamped = { ...params, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_mirofish_params', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.B2B_PARAMS, 'system_parameters'), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertMirofishParameters', e);
    }
  },

  async upsertPlatformModules(disabledModules: string[]): Promise<void> {
    const now = new Date().toISOString();
    const stamped = { disabledModules, updatedAt: now };
    const serverOkPromise = postAdminCatalog('upsert_platform_modules', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.B2B_PARAMS, 'platform_modules'), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertPlatformModules', e);
    }
  },

  /** Panelden düzenlenen kategori kaydını (ad, ikon, sıra, gizli/açık) tüm cihazlara yansıtır. */
  async upsertCategory(cfg: CategoryConfig): Promise<void> {
    const normalizedLabel = normalizeCategoryLabel(cfg.label, cfg.label);
    const stamped = {
      ...cfg,
      label: normalizedLabel,
      labelEn: normalizeCategoryLabel(cfg.labelEn, normalizedLabel),
      updatedAt: cfg.updatedAt || new Date().toISOString()
    };
    const serverOkPromise = postAdminCatalog('upsert_category', stamped);

    if (!db || !isFirebaseConfigured) {
      await serverOkPromise;
      return;
    }
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_CATEGORIES, cfg.key), stripUndefined(stamped));
    } catch (e) {
      const serverOk = await serverOkPromise;
      if (!serverOk) reportSyncError('upsertCategory', e);
    }
  },

  /** Yerelde kalmış (henüz buluta gitmemiş) kategori düzenlemelerini Firestore'a gönderir. */
  async pushLocalCategoryConfigs(): Promise<void> {
    const list = XeniosStore.getCategoryOverrides().filter(
      (o) =>
        !!o.key &&
        !!o.label &&
        typeof o.order === 'number' &&
        typeof o.hidden === 'boolean'
    );
    await Promise.all(list.map((o) => FirestoreService.upsertCategory(o as CategoryConfig)));
  },

  /**
   * Yalnızca kategori yapılandırmasına (ad, ikon, sıra, gizli/açık) abone olur.
   * Uzak kayıt, yerelden daha yeni (updatedAt) ise yerelin yerine geçer.
   */
  subscribeToCategoryConfigs(): Unsubscribe {
    if (!db || !isFirebaseConfigured || typeof window === 'undefined') {
      return () => {};
    }
    try {
      return onSnapshot(
        query(collection(db, COLLECTIONS.SITE_CATEGORIES), limit(50)),
        (snap) => {
          if (snap.empty || snap.docChanges().length === 0) return;
          const localMap = new Map(
            XeniosStore.getCategoryOverrides().map((o) => [o.key as string, o])
          );
          let changed = false;
          snap.forEach((d) => {
            const remote = { ...(d.data() as Partial<CategoryConfig>), key: d.id };
            const mine = localMap.get(d.id);
            if (!mine || (remote.updatedAt || '') > (mine.updatedAt || '')) {
              localMap.set(d.id, remote);
              changed = true;
            }
          });
          if (changed) XeniosStore.saveCategoryOverrides(Array.from(localMap.values()));
        },
        () => {}
      );
    } catch (e) {
      console.warn('Category realtime subscription error:', e);
      return () => {};
    }
  },

  /**
   * Subscribes to remote Firestore catalog collections (experiences, hotels, properties, suppliers)
   * and merges remote docs into XeniosStore so both Web and Mobile App stay in real-time sync.
   * Multiplexed so multiple mounted components share a single underlying set of listeners.
   */
  subscribeToCatalogSync(): Unsubscribe {
    if (!db || !isFirebaseConfigured || typeof window === 'undefined') {
      return () => {};
    }

    catalogSyncRefCount += 1;
    if (catalogSyncCoreUnsub) {
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        catalogSyncRefCount = Math.max(0, catalogSyncRefCount - 1);
        if (catalogSyncRefCount === 0 && catalogSyncCoreUnsub) {
          catalogSyncCoreUnsub();
          catalogSyncCoreUnsub = null;
        }
      };
    }

    const unsubs: Unsubscribe[] = [];

    try {
      // 1. Experiences listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.EXPERIENCES), limit(120)),
          (snap) => {
            if (snap.empty || snap.docChanges().length === 0) return;
            const remoteMap = new Map<string, Experience>();
            const remoteDeletedIds = new Set<string>();
            snap.forEach((d) => {
              const data = d.data() as Experience & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.add(d.id);
                XeniosStore.markExperienceDeleted(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            const localDeletedIds = XeniosStore.getDeletedExperienceIds();
            const current = XeniosStore.getExperiences();
            const currentMap = new Map<string, Experience>(current.map((item) => [item.id, item]));
            const mergedMap = new Map<string, Experience>();

            remoteMap.forEach((remoteItem, id) => {
              if (localDeletedIds.has(id) || remoteDeletedIds.has(id)) return;
              const localItem = currentMap.get(id);
              if (localItem && (localItem.updatedAt || '') > (remoteItem.updatedAt || '')) {
                mergedMap.set(id, localItem);
              } else {
                mergedMap.set(id, remoteItem);
              }
            });

            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !localDeletedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });
            XeniosStore.saveExperiences(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 2. Hotels listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.HOTELS), limit(50)),
          (snap) => {
            if (snap.empty || snap.docChanges().length === 0) return;
            const remoteMap = new Map<string, Hotel>();
            const remoteDeletedIds = new Set<string>();
            snap.forEach((d) => {
              const data = d.data() as Hotel & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.add(d.id);
                XeniosStore.markHotelDeleted(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            const localDeletedIds = XeniosStore.getDeletedHotelIds();
            const current = XeniosStore.getHotels();
            const currentMap = new Map<string, Hotel>(current.map((item) => [item.id, item]));
            const mergedMap = new Map<string, Hotel>();

            remoteMap.forEach((remoteItem, id) => {
              if (localDeletedIds.has(id) || remoteDeletedIds.has(id)) return;
              const localItem = currentMap.get(id);
              const baseItem =
                localItem && (localItem.updatedAt || '') > (remoteItem.updatedAt || '')
                  ? localItem
                  : remoteItem;

              if (localItem && Array.isArray(baseItem.rooms) && Array.isArray(localItem.rooms)) {
                const localRoomMap = new Map(localItem.rooms.map((r) => [r.number, r]));
                baseItem.rooms = baseItem.rooms.map((rm) => {
                  const locRm = localRoomMap.get(rm.number);
                  if (locRm && locRm.status && (!rm.status || (locRm.updatedAt || '') >= (rm.updatedAt || ''))) {
                    const isVacant = locRm.status === 'clean' || locRm.status === 'cleaning';
                    return {
                      ...rm,
                      status: locRm.status,
                      guest: isVacant ? '' : locRm.guest,
                      guestPhone: isVacant ? '' : locRm.guestPhone,
                      checkout: isVacant ? '' : locRm.checkout,
                      whatsappConfirmedAt: isVacant ? '' : locRm.whatsappConfirmedAt,
                      updatedAt: locRm.updatedAt,
                    };
                  }
                  return rm;
                });
              }

              mergedMap.set(id, baseItem);
            });

            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !localDeletedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });
            XeniosStore.saveHotels(Array.from(mergedMap.values()));

            const activeHotelId = XeniosStore.getActiveHotelId();
            const activeRemote = remoteMap.get(activeHotelId) || Array.from(remoteMap.values()).find(h => Array.isArray(h.modules?.inRoomServices));
            if (activeRemote?.modules?.inRoomServices) {
              XeniosStore.syncInRoomServicesFromRemote(
                activeRemote.modules.inRoomServices,
                activeRemote.modules.inRoomServicesUpdatedAt
              );
            }
            const kbsRemote =
              remoteMap.get(activeHotelId) ||
              Array.from(remoteMap.values()).find(h => typeof h.modules?.enable_guest_self_kbs === 'boolean');
            if (kbsRemote && typeof kbsRemote.modules?.enable_guest_self_kbs === 'boolean') {
              XeniosStore.syncGuestSelfKbsFromRemote(
                kbsRemote.id,
                kbsRemote.modules.enable_guest_self_kbs,
                kbsRemote.updatedAt
              );
            }
          },
          () => {}
        )
      );

      // 3. Properties listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.PROPERTIES), limit(100)),
          (snap) => {
            if (snap.empty || snap.docChanges().length === 0) return;
            const remoteMap = new Map<string, PropertyListing>();
            const remoteDeletedIds = new Set<string>();
            snap.forEach((d) => {
              const data = d.data() as PropertyListing & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.add(d.id);
                XeniosStore.markPropertyDeleted(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            const localDeletedIds = XeniosStore.getDeletedPropertyIds();
            const current = XeniosStore.getPropertyListings();
            const currentMap = new Map<string, PropertyListing>(current.map((item) => [item.id, item]));
            const mergedMap = new Map<string, PropertyListing>();

            remoteMap.forEach((remoteItem, id) => {
              if (localDeletedIds.has(id) || remoteDeletedIds.has(id)) return;
              const localItem = currentMap.get(id);
              if (localItem && (localItem.updatedAt || '') > (remoteItem.updatedAt || '')) {
                mergedMap.set(id, localItem);
              } else {
                mergedMap.set(id, remoteItem);
              }
            });

            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !localDeletedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });
            XeniosStore.savePropertyListings(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 4. Suppliers listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.SUPPLIERS), limit(120)),
          (snap) => {
            if (snap.empty || snap.docChanges().length === 0) return;
            const remoteMap = new Map<string, SupplierPartner>();
            const remoteDeletedIds = new Set<string>();
            snap.forEach((d) => {
              const data = d.data() as SupplierPartner & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.add(d.id);
                XeniosStore.markSupplierDeleted(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            const localDeletedIds = XeniosStore.getDeletedSupplierIds();
            const current = XeniosStore.getSuppliers();
            const currentMap = new Map<string, SupplierPartner>(current.map((item) => [item.id, item]));
            const mergedMap = new Map<string, SupplierPartner>();

            remoteMap.forEach((remoteItem, id) => {
              if (localDeletedIds.has(id) || remoteDeletedIds.has(id)) return;
              const localItem = currentMap.get(id);
              if (localItem && (localItem.updatedAt || '') > (remoteItem.updatedAt || '')) {
                mergedMap.set(id, localItem);
              } else {
                mergedMap.set(id, remoteItem);
              }
            });

            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !localDeletedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });
            XeniosStore.saveSuppliers(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 5. Site categories listener (panelden düzenlenen kategori adı/ikon/sıra/gizlilik)
      unsubs.push(FirestoreService.subscribeToCategoryConfigs());

      // 6. B2B Mirofish Leads listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.B2B_LEADS), limit(150)),
          (snap) => {
            if (snap.empty || snap.docChanges().length === 0) return;
            const remoteMap = new Map<string, B2BLead>();
            const remoteDeletedIds = new Set<string>();
            snap.forEach((d) => {
              const data = d.data() as B2BLead & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.add(d.id);
                XeniosStore.markB2BLeadDeleted(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            const localDeletedIds = XeniosStore.getDeletedB2BLeadIds();
            const current = XeniosStore.getB2BLeads();
            const currentMap = new Map<string, B2BLead>(current.map((item) => [item.id, item]));
            const mergedMap = new Map<string, B2BLead>();

            remoteMap.forEach((remoteItem, id) => {
              if (localDeletedIds.has(id) || remoteDeletedIds.has(id)) return;
              const localItem = currentMap.get(id);
              if (localItem && (localItem.updatedAt || '') > (remoteItem.updatedAt || '')) {
                mergedMap.set(id, localItem);
              } else {
                mergedMap.set(id, remoteItem);
              }
            });

            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !localDeletedIds.has(item.id) && !remoteDeletedIds.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });
            XeniosStore.saveB2BLeads(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 7. Platform Modules listener (PurelyAdmin -> PurelyIstanbul App, PWA & Web)
      unsubs.push(
        onSnapshot(
          doc(db, COLLECTIONS.B2B_PARAMS, 'platform_modules'),
          (snap) => {
            if (!snap.exists()) return;
            const data = snap.data() as { disabledModules?: string[] };
            if (Array.isArray(data?.disabledModules)) {
              try {
                localStorage.setItem('purely_disabled_modules', JSON.stringify(data.disabledModules));
                window.dispatchEvent(
                  new CustomEvent('purely_modules_updated', { detail: { disabledModules: data.disabledModules } })
                );
              } catch {}
            }
          },
          () => {}
        )
      );
    } catch (e) {
      console.warn('Catalog realtime subscription error:', e);
    }

    catalogSyncCoreUnsub = () => {
      unsubs.forEach((u) => u());
    };

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      catalogSyncRefCount = Math.max(0, catalogSyncRefCount - 1);
      if (catalogSyncRefCount === 0 && catalogSyncCoreUnsub) {
        catalogSyncCoreUnsub();
        catalogSyncCoreUnsub = null;
      }
    };
  },

  // 🛎️ LIVE ROOM REQUESTS WITH REALTIME FIRESTORE LISTENER + SMART REST FALLBACK
  subscribeToLiveRequests(
    hotelId: string | null,
    onUpdate: (requests: ServiceRequest[]) => void
  ): Unsubscribe {
    const targetHotelIds = resolveHotelIdFilterList(hotelId);
    const channelKey = hotelId ? `explicit:${hotelId}` : `active:${targetHotelIds.join(',')}`;

    const existingChannel = liveRequestChannels.get(channelKey);
    if (existingChannel) {
      existingChannel.subscribers.add(onUpdate);
      if (existingChannel.lastList) {
        onUpdate(existingChannel.lastList);
      }
      return () => {
        existingChannel.subscribers.delete(onUpdate);
        if (existingChannel.subscribers.size === 0) {
          existingChannel.teardown();
          liveRequestChannels.delete(channelKey);
        }
      };
    }

    const subscribers = new Set<(requests: ServiceRequest[]) => void>([onUpdate]);
    const targetHotelSet = new Set<string>(targetHotelIds);

    const channel: LiveRequestChannel = {
      subscribers,
      lastList: null,
      lastSignature: '',
      teardown: () => {},
    };
    liveRequestChannels.set(channelKey, channel);

    const notifySubscribers = (filtered: ServiceRequest[]) => {
      channel.lastList = filtered;
      channel.subscribers.forEach((cb) => {
        try {
          cb(filtered);
        } catch {}
      });
    };

    const processRawList = (rawItems: ServiceRequest[]) => {
      const deletedIds = typeof window !== 'undefined' ? XeniosStore.getDeletedRequestIds() : new Set<string>();
      const statusOverrides = typeof window !== 'undefined' ? XeniosStore.getRequestStatusOverrides() : {};
      const list: ServiceRequest[] = [];

      for (const rawData of rawItems) {
        const docId = rawData?.id;
        if (!docId || deletedIds.has(docId) || docId.includes('test') || docId.includes('demo')) continue;
        if (!rawData?.serviceTitle && !rawData?.serviceKey) continue;
        const item: ServiceRequest = { ...rawData, id: docId };
        if (statusOverrides[docId]) {
          item.status = statusOverrides[docId];
        }
        list.push(item);
      }

      const filtered = hotelId
        ? list.filter((r) => !r.hotelId || r.hotelId === hotelId || targetHotelSet.has(r.hotelId))
        : list.filter((r) => !r.hotelId || targetHotelSet.has(r.hotelId));

      filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (typeof window !== 'undefined') {
        const allowStaffAlert = shouldReceiveStaffRequestAlerts();
        if (allowStaffAlert && filtered.length > 0) {
          const unseenItems = filtered.filter((item) => !seenRemoteRequestIds.has(item.id));
          if (unseenItems.length > 0) {
            const nowMs = Date.now();
            const alreadyInitialized = HotelAudioNotification.isNotifiedStorageInitialized();
            if (!alreadyInitialized) {
              HotelAudioNotification.ensureNotifiedStorageInitialized();
            }
            const windowMs = alreadyInitialized ? 30 * 60 * 1000 : 180_000;
            // Oldest-first when firing alerts so newest shows on top
            const chronological = [...unseenItems].reverse();
            for (const item of chronological) {
              seenRemoteRequestIds.add(item.id);
              if (HotelAudioNotification.hasNotified(item.id)) continue;
              const createdMs = item.createdAt ? Date.parse(item.createdAt) : 0;
              const ageMs = nowMs - createdMs;
              const isWithinWindow = createdMs > 0 && ageMs > -300_000 && ageMs < windowMs;
              if (isWithinWindow && item.status === 'pending') {
                HotelAudioNotification.triggerGuestRequestAlert(item);
              } else if (!alreadyInitialized || !isWithinWindow || item.status === 'completed' || item.status === 'cancelled') {
                HotelAudioNotification.markNotified(item.id);
              }
            }
          }
        }
      }

      const nextSignature = buildRequestListSignature(filtered);
      if (nextSignature === channel.lastSignature && channel.lastList !== null) {
        return;
      }
      channel.lastSignature = nextSignature;

      if (typeof window !== 'undefined') {
        XeniosStore.syncRequestsFromRemote(filtered);
      }
      notifySubscribers(filtered);
    };

    let isRestPolling = false;
    let isSnapshotHealthy = false;
    let lastRestPollMs = 0;
    let fallbackPollInterval: number | null = null;
    let bootTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const parseRestRows = (rows: any[]): ServiceRequest[] => {
      const parsed: ServiceRequest[] = [];
      for (const row of rows) {
        const docObj = row?.document;
        const fields = docObj?.fields;
        if (!fields) continue;
        const docName = String(docObj.name || '');
        const fallbackId = docName.split('/').pop() || '';
        const id = fields.id?.stringValue || fallbackId;
        if (!id) continue;
        const rawAmt = fields.paymentAmount?.doubleValue ?? fields.paymentAmount?.integerValue;
        parsed.push({
          id,
          hotelId: fields.hotelId?.stringValue || 'hotel-heritage-1',
          hotelName: fields.hotelName?.stringValue || 'Purely Istanbul Partner Hotel',
          roomNumber: fields.roomNumber?.stringValue || '101',
          serviceKey: fields.serviceKey?.stringValue || 'service',
          serviceTitle: fields.serviceTitle?.stringValue || 'Oda Hizmeti',
          notes: fields.notes?.stringValue || '',
          status: (fields.status?.stringValue as ServiceRequest['status']) || 'pending',
          department: (fields.department?.stringValue as ServiceRequest['department']) || 'Housekeeping',
          stage: (fields.stage?.stringValue as ServiceRequest['stage']) || 'pending',
          priority: (fields.priority?.stringValue as ServiceRequest['priority']) || 'standart',
          createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
          updatedAt: fields.updatedAt?.stringValue || fields.createdAt?.stringValue || new Date().toISOString(),
          paymentMethod: (fields.paymentMethod?.stringValue as ServiceRequest['paymentMethod']) || undefined,
          paymentStatus: (fields.paymentStatus?.stringValue as ServiceRequest['paymentStatus']) || undefined,
          paymentAmount: rawAmt !== undefined ? Number(rawAmt) : undefined,
          paymentCurrency: fields.paymentCurrency?.stringValue || undefined,
          paymentReference: fields.paymentReference?.stringValue || undefined,
        });
      }
      return parsed;
    };

    const pollViaRest = async (force = false) => {
      if (isSnapshotHealthy && !force) return;
      if (isRestPolling) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const now = Date.now();
      if (!force && now - lastRestPollMs < REST_MIN_COOLDOWN_MS) return;

      isRestPolling = true;
      lastRestPollMs = now;
      try {
        const whereClause =
          targetHotelIds.length === 1
            ? {
                fieldFilter: {
                  field: { fieldPath: 'hotelId' },
                  op: 'EQUAL',
                  value: { stringValue: targetHotelIds[0] },
                },
              }
            : {
                fieldFilter: {
                  field: { fieldPath: 'hotelId' },
                  op: 'IN',
                  value: {
                    arrayValue: {
                      values: targetHotelIds.map((hid) => ({ stringValue: hid })),
                    },
                  },
                },
              };

        let res = await fetch(
          'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: COLLECTIONS.REQUESTS }],
                where: whereClause,
                limit: 35,
              },
            }),
          }
        );

        if (!res.ok) {
          res = await fetch(
            'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({
                structuredQuery: {
                  from: [{ collectionId: COLLECTIONS.REQUESTS }],
                  orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
                  limit: 35,
                },
              }),
            }
          );
        }

        if (!res.ok) return;
        const rows = await res.json();
        if (!Array.isArray(rows)) return;
        processRawList(parseRestRows(rows));
      } catch {
        // Ignore transient network errors during background/foreground transitions
      } finally {
        isRestPolling = false;
      }
    };

    const stopRestFallback = () => {
      if (bootTimeoutId !== null) {
        clearTimeout(bootTimeoutId);
        bootTimeoutId = null;
      }
      if (fallbackPollInterval !== null && typeof window !== 'undefined') {
        window.clearInterval(fallbackPollInterval);
        fallbackPollInterval = null;
      }
    };

    const startRestFallback = () => {
      if (isSnapshotHealthy || typeof window === 'undefined') return;
      pollViaRest();
      if (fallbackPollInterval === null) {
        fallbackPollInterval = window.setInterval(() => {
          if (!isSnapshotHealthy) {
            pollViaRest();
          }
        }, REST_FALLBACK_INTERVAL_MS);
      }
    };

    const unsubs: Array<() => void> = [stopRestFallback];

    if (typeof window !== 'undefined') {
      const localInitial = XeniosStore.getRequests();
      if (localInitial.length > 0) {
        const filteredLocal = hotelId
          ? localInitial.filter((r) => !r.hotelId || r.hotelId === hotelId || targetHotelSet.has(r.hotelId))
          : localInitial.filter((r) => !r.hotelId || targetHotelSet.has(r.hotelId));
        channel.lastList = filteredLocal;
        channel.lastSignature = buildRequestListSignature(filteredLocal);
        notifySubscribers(filteredLocal);
      }

      const handleLocalUpdate = () => {
        const reqs = XeniosStore.getRequests();
        const filtered = hotelId
          ? reqs.filter((r) => !r.hotelId || r.hotelId === hotelId || targetHotelSet.has(r.hotelId))
          : reqs.filter((r) => !r.hotelId || targetHotelSet.has(r.hotelId));
        const sig = buildRequestListSignature(filtered);
        if (sig !== channel.lastSignature) {
          channel.lastSignature = sig;
          notifySubscribers(filtered);
        }
      };
      window.addEventListener('xenios_requests_updated', handleLocalUpdate);
      unsubs.push(() => window.removeEventListener('xenios_requests_updated', handleLocalUpdate));

      const onWake = () => {
        if (!isSnapshotHealthy) {
          pollViaRest();
        }
      };
      const onVis = () => {
        if (document.visibilityState === 'visible' && !isSnapshotHealthy) {
          pollViaRest();
        }
      };
      window.addEventListener('focus', onWake);
      window.addEventListener('online', onWake);
      document.addEventListener('visibilitychange', onVis);

      unsubs.push(() => {
        window.removeEventListener('focus', onWake);
        window.removeEventListener('online', onWake);
        document.removeEventListener('visibilitychange', onVis);
      });
    }

    if (!db || !isFirebaseConfigured) {
      startRestFallback();
      channel.teardown = () => unsubs.forEach((u) => u());
      return () => {
        channel.subscribers.delete(onUpdate);
        if (channel.subscribers.size === 0) {
          channel.teardown();
          liveRequestChannels.delete(channelKey);
        }
      };
    }

    // Only activate REST fallback if Firestore onSnapshot doesn't deliver within boot timeout
    bootTimeoutId = setTimeout(() => {
      if (!isSnapshotHealthy) {
        startRestFallback();
      }
    }, SNAPSHOT_BOOT_TIMEOUT_MS);

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      const q =
        targetHotelIds.length === 1
          ? query(colRef, where('hotelId', '==', targetHotelIds[0]), limit(40))
          : query(colRef, where('hotelId', 'in', targetHotelIds), limit(40));

      const handleSnapshotDocs = (snapshot: any) => {
        isSnapshotHealthy = true;
        stopRestFallback();
        const items: ServiceRequest[] = [];
        snapshot.forEach((d: any) => {
          const rawData = d.data() as any;
          items.push({ id: d.id, ...rawData });
        });
        processRawList(items);
      };

      let fallbackSnapshotUnsub: Unsubscribe | null = null;
      const unsubSnapshot = onSnapshot(
        q,
        handleSnapshotDocs,
        (err) => {
          console.warn('Scoped Firestore onSnapshot fallback:', err?.code || err);
          if (!fallbackSnapshotUnsub && db) {
            try {
              fallbackSnapshotUnsub = onSnapshot(
                query(colRef, orderBy('createdAt', 'desc'), limit(40)),
                handleSnapshotDocs,
                () => {
                  isSnapshotHealthy = false;
                  startRestFallback();
                }
              );
              return;
            } catch {}
          }
          isSnapshotHealthy = false;
          startRestFallback();
        }
      );
      unsubs.push(() => {
        unsubSnapshot();
        if (fallbackSnapshotUnsub) fallbackSnapshotUnsub();
      });
    } catch (e) {
      console.warn('Firestore subscription failed, relying on REST fallback:', e);
      isSnapshotHealthy = false;
      startRestFallback();
    }

    channel.teardown = () => {
      unsubs.forEach((u) => u());
    };

    return () => {
      channel.subscribers.delete(onUpdate);
      if (channel.subscribers.size === 0) {
        channel.teardown();
        liveRequestChannels.delete(channelKey);
      }
    };
  },

  async addRequest(req: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest> {
    const local = XeniosStore.addRequest({
      ...req,
      status: req.status || 'pending',
    });
    seenRemoteRequestIds.add(local.id);

    const nowIso = new Date().toISOString();
    const payload = stripUndefined({
      ...local,
      status: local.status || 'pending',
      updatedAt: nowIso,
    });

    const saveViaRest = async () => {
      try {
        const restFields: Record<string, any> = {
          id: { stringValue: String(local.id) },
          hotelId: { stringValue: String(local.hotelId || 'hotel-heritage-1') },
          hotelName: { stringValue: String(local.hotelName || 'Purely Istanbul Partner Hotel') },
          roomNumber: { stringValue: String(local.roomNumber || '101') },
          serviceKey: { stringValue: String(local.serviceKey || 'service') },
          serviceTitle: { stringValue: String(local.serviceTitle || 'Oda Hizmeti') },
          notes: { stringValue: String(local.notes || '') },
          status: { stringValue: String(local.status || 'pending') },
          department: { stringValue: String(local.department || 'Housekeeping') },
          stage: { stringValue: String(local.stage || 'pending') },
          priority: { stringValue: String(local.priority || 'standart') },
          createdAt: { stringValue: String(local.createdAt) },
          updatedAt: { stringValue: nowIso },
        };
        if (local.paymentMethod) {
          restFields.paymentMethod = { stringValue: String(local.paymentMethod) };
        }
        if (local.paymentStatus) {
          restFields.paymentStatus = { stringValue: String(local.paymentStatus) };
        }
        if (local.paymentAmount !== undefined) {
          restFields.paymentAmount = { doubleValue: Number(local.paymentAmount) };
        }
        if (local.paymentCurrency) {
          restFields.paymentCurrency = { stringValue: String(local.paymentCurrency) };
        }
        if (local.paymentReference) {
          restFields.paymentReference = { stringValue: String(local.paymentReference) };
        }

        await fetch(
          `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests/${encodeURIComponent(local.id)}`,
          {
            method: 'PATCH',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: restFields }),
          }
        );
      } catch (restErr) {
        console.warn('Firestore REST upsert error:', restErr);
      }
    };

    // Fire server-side 0850 WhatsApp + APNs + FCM + Web Push immediately so partner devices
    // receive instant WhatsApp messages and push notifications when a guest submits an order or request.
    const notifyApiPromise = (async () => {
      if (typeof window === 'undefined') return;
      try {
        const isUrgent = local.priority === 'acil';
        const pushTitle = isUrgent ? '🚨 Acil Misafir Talebi! 🛎️' : 'Yeni Misafir Talebi! 🛎️';
        const cleanNotes = local.notes ? local.notes.replace(/\s+/g, ' ').trim() : '';
        const unitNum = String(local.roomNumber || '101').trim();
        const unitPrefix = /^(Daire|Birim|Suite|Oda)/i.test(unitNum) ? unitNum : `Birim ${unitNum}`;
        const pushBody = `${unitPrefix} - ${local.serviceTitle}${cleanNotes ? ` (${cleanNotes})` : ''} Siparişi Verildi.`;

        const targetHotelId = local.hotelId || 'hotel-heritage-1';
        const hotelObj = XeniosStore.getHotelById(targetHotelId);
        const managerProf = XeniosStore.getHotelManagerProfile(targetHotelId);
        const whatsappPhone =
          hotelObj?.whatsappPhone ||
          managerProf?.whatsappPhone ||
          hotelObj?.managerPhone ||
          managerProf?.managerPhone ||
          '+905325809676';

        const reqBody = JSON.stringify({
          id: local.id,
          persistToFirestore: true,
          hotelId: targetHotelId,
          hotelName: local.hotelName || hotelObj?.name || 'Old City Comus',
          roomNumber: unitNum,
          serviceKey: local.serviceKey,
          serviceTitle: local.serviceTitle,
          notes: local.notes || '',
          department: local.department || 'Housekeeping',
          stage: local.stage || 'pending',
          priority: local.priority || 'standart',
          createdAt: local.createdAt,
          paymentMethod: local.paymentMethod,
          paymentStatus: local.paymentStatus,
          paymentAmount: local.paymentAmount,
          paymentCurrency: local.paymentCurrency,
          paymentReference: local.paymentReference,
          whatsappPhone,
          title: pushTitle,
          body: pushBody,
        });

        const res = await fetch('/api/requests', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: reqBody,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        // Fallback to hosted API origin if relative fetch fails (e.g. inside native WebView)
        try {
          const targetHotelId = local.hotelId || 'hotel-heritage-1';
          const hotelObj = XeniosStore.getHotelById(targetHotelId);
          await fetch('https://purelyistanbul--xenios-prod-c55cd.us-central1.hosted.app/api/requests', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: local.id,
              persistToFirestore: true,
              hotelId: targetHotelId,
              hotelName: local.hotelName || hotelObj?.name || 'Old City Comus',
              roomNumber: String(local.roomNumber || '101').trim(),
              serviceKey: local.serviceKey,
              serviceTitle: local.serviceTitle,
              notes: local.notes || '',
              department: local.department || 'Housekeeping',
              stage: local.stage || 'pending',
              priority: local.priority || 'standart',
              createdAt: local.createdAt,
              paymentMethod: local.paymentMethod,
              paymentStatus: local.paymentStatus,
              paymentAmount: local.paymentAmount,
              paymentCurrency: local.paymentCurrency,
              paymentReference: local.paymentReference,
              whatsappPhone: '+905325809676',
            }),
          });
        } catch {
          // Ignore network errors
        }
      }
    })();

    // Ensure both Firestore persistence and WhatsApp / Push API dispatch complete reliably
    if (!db || !isFirebaseConfigured) {
      await Promise.all([saveViaRest(), notifyApiPromise]);
      return local;
    }

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      await Promise.all([
        Promise.race([
          setDoc(doc(colRef, local.id), payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('setDoc timeout')), 2500)),
        ]).catch(() => saveViaRest()),
        notifyApiPromise,
      ]);
    } catch {
      await Promise.all([saveViaRest(), notifyApiPromise]);
    }
    return local;
  },

  async updateRequestPayment(
    id: string,
    payment: Pick<ServiceRequest, 'paymentMethod' | 'paymentStatus' | 'paymentAmount' | 'paymentCurrency' | 'paymentReference'>
  ): Promise<ServiceRequest | null> {
    const updatedLocal = XeniosStore.updateRequestPayment(id, payment);
    const updatedAt = new Date().toISOString();

    const patchViaRest = async () => {
      try {
        const mask = [
          'updateMask.fieldPaths=paymentMethod',
          'updateMask.fieldPaths=paymentStatus',
          'updateMask.fieldPaths=paymentAmount',
          'updateMask.fieldPaths=paymentCurrency',
          'updateMask.fieldPaths=paymentReference',
          'updateMask.fieldPaths=notes',
          'updateMask.fieldPaths=updatedAt',
        ].join('&');
        await fetch(
          `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests/${encodeURIComponent(id)}?${mask}`,
          {
            method: 'PATCH',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                paymentMethod: { stringValue: String(payment.paymentMethod || 'online_card') },
                paymentStatus: { stringValue: String(payment.paymentStatus || 'paid_online') },
                paymentAmount: { doubleValue: Number(payment.paymentAmount || 0) },
                paymentCurrency: { stringValue: String(payment.paymentCurrency || 'TRY') },
                paymentReference: { stringValue: String(payment.paymentReference || '') },
                notes: { stringValue: String(updatedLocal?.notes || '') },
                updatedAt: { stringValue: updatedAt },
              },
            }),
          }
        );
      } catch (e) {
        console.warn('Firestore REST payment update error:', e);
      }
    };

    if (db && isFirebaseConfigured) {
      try {
        const docRef = doc(db, COLLECTIONS.REQUESTS, id);
        await updateDoc(
          docRef,
          stripUndefined({
            ...payment,
            notes: updatedLocal?.notes,
            updatedAt,
          })
        );
      } catch {
        await patchViaRest();
      }
    } else {
      await patchViaRest();
    }
    return updatedLocal;
  },

  async updateRequestStatus(id: string, status: ServiceRequest['status']): Promise<void> {
    const existingReq = XeniosStore.getRequests().find((r) => r.id === id);
    XeniosStore.updateRequestStatus(id, status);
    const updatedAt = new Date().toISOString();

    if (typeof window !== 'undefined' && existingReq && (status === 'in_progress' || status === 'completed')) {
      const guestTitle =
        status === 'completed'
          ? `✅ Talebiniz Tamamlandı (Birim ${existingReq.roomNumber})`
          : `🛎️ Talebiniz Hazırlanıyor (Birim ${existingReq.roomNumber})`;
      const guestBody =
        status === 'completed'
          ? `"${existingReq.serviceTitle}" talebiniz tamamlanmıştır. Keyifli konaklamalar dileriz.`
          : `"${existingReq.serviceTitle}" talebiniz ekibimiz tarafından işleme alındı.`;

      fetch('/api/notifications/push', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: 'guest',
          hotelId: existingReq.hotelId || 'hotel-heritage-1',
          roomNumber: existingReq.roomNumber || '101',
          requestId: `${id}-${status}`,
          priority: 'standart',
          urgency: 'HIGH',
          title: guestTitle,
          subtitle: existingReq.hotelName || 'Purely Istanbul',
          body: guestBody,
          url: `/stay/${encodeURIComponent(existingReq.hotelId || 'hotel-1')}/${encodeURIComponent(existingReq.roomNumber || '101')}`,
        }),
      }).catch(() => {});
    }

    const patchViaRest = async () => {
      try {
        await fetch(
          `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests/${encodeURIComponent(id)}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: String(status) },
                updatedAt: { stringValue: updatedAt },
              },
            }),
          }
        );
      } catch (e) {
        console.warn("Firestore REST update error:", e);
      }
    };

    if (!db || !isFirebaseConfigured) {
      await patchViaRest();
      return;
    }

    try {
      const docRef = doc(db, COLLECTIONS.REQUESTS, id);
      await updateDoc(docRef, { status, updatedAt });
    } catch (e) {
      console.warn("Firestore update error, using REST fallback:", e);
      await patchViaRest();
    }
  },

  async deleteRequest(id: string): Promise<void> {
    XeniosStore.deleteRequest(id);

    const deleteViaRest = async () => {
      try {
        await fetch(
          `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests/${encodeURIComponent(id)}`,
          { method: 'DELETE' }
        );
      } catch (e) {
        console.warn("Firestore REST delete error:", e);
      }
    };

    if (!db || !isFirebaseConfigured) {
      await deleteViaRest();
      return;
    }

    try {
      const docRef = doc(db, COLLECTIONS.REQUESTS, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error, using REST fallback:", e);
      await deleteViaRest();
    }
  },

  // 💳 BOOKINGS
  async addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'confirmationCode'> | Booking): Promise<Booking> {
    // Çift kayıt önlemi: çağıran taraf zaten XeniosStore.addBooking ile oluşturduysa yeniden ekleme.
    const existing = booking as Partial<Booking>;
    const local: Booking = existing.id && existing.confirmationCode ? (existing as Booking) : XeniosStore.addBooking(booking as Omit<Booking, 'id' | 'createdAt' | 'confirmationCode'>);

    // Kalıcı kayıt SUNUCUDA yapılır (firestore.rules: bookings istemci yazmasına kapalı).
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/ops/bookings', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(local),
        });
        if (!res.ok) reportSyncError('booking', { code: 'http-' + res.status });
      } catch (e) {
        reportSyncError('booking', e);
      }
    }
    return local;
  },

  subscribeToBookings(onUpdate: (bookings: Booking[]) => void): () => void {
    const localList = XeniosStore.getBookings();
    onUpdate(localList);

    if (!db || !isFirebaseConfigured) {
      const handler = () => onUpdate(XeniosStore.getBookings());
      if (typeof window !== 'undefined') {
        window.addEventListener('xenios_bookings_updated', handler);
        return () => window.removeEventListener('xenios_bookings_updated', handler);
      }
      return () => {};
    }

    try {
      const colRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(colRef, limit(50));
      let lastBookingSig = '';
      return onSnapshot(
        q,
        (snapshot) => {
          const remote: Booking[] = [];
          snapshot.forEach((d) => {
            remote.push({ id: d.id, ...(d.data() as any) });
          });
          const mergedMap = new Map<string, Booking>();
          for (const b of XeniosStore.getBookings()) mergedMap.set(b.id, b);
          for (const b of remote) mergedMap.set(b.id, b);
          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')
          );
          const nextSig = merged.map((b) => `${b.id}:${b.status}:${b.createdAt || ''}`).join('|');
          if (nextSig === lastBookingSig) return;
          lastBookingSig = nextSig;
          onUpdate(merged);
        },
        () => {
          onUpdate(XeniosStore.getBookings());
        }
      );
    } catch {
      return () => {};
    }
  },


  // 🏢 INVESTMENT LEADS
  async addInvestmentLead(lead: any): Promise<any> {
    const local = XeniosStore.addInvestmentLead(lead);
    if (!db || !isFirebaseConfigured) return local;

    try {
      const colRef = collection(db, COLLECTIONS.INVESTMENT_LEADS);
      await setDoc(doc(colRef, local.id), {
        ...local,
        notifiedTo: 'hi@usecomus.com',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore add investment lead error:", e);
    }
    return local;
  },

  // 📬 NOTIFICATIONS LOG QUEUE
  async addNotificationLog(logData: any): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      const colRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(colRef, logId), logData);
    } catch (e) {
      console.warn("Firestore notification log error:", e);
    }
  },

  // 🤖 AI CONCIERGE LOGS
  async addAiLog(logData: any): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      const colRef = collection(db, COLLECTIONS.AI_LOGS);
      const logId = `ai-${Date.now()}`;
      await setDoc(doc(colRef, logId), {
        ...logData,
        notifiedTo: 'hi@usecomus.com',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore AI log error:", e);
    }
  },

  // 👑 MASTER PROJECT ADMIN / FOUNDER PROFILE
  async saveAdminProfile(adminData: any): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      const colRef = collection(db, COLLECTIONS.ADMINS);
      await setDoc(doc(colRef, 'anilaslan_usecomus_com'), {
        ...adminData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore save admin profile error:", e);
    }
  },

  // ⚖️ COMPLAINTS / DISPUTE DESK
  async addComplaint(complaint: any): Promise<Complaint> {
    const local = XeniosStore.addComplaint(complaint);
    if (!db || !isFirebaseConfigured) return local;

    try {
      const colRef = collection(db, COLLECTIONS.COMPLAINTS);
      await setDoc(doc(colRef, local.id), local);
    } catch (e) {
      console.warn("Firestore add complaint error:", e);
    }
    return local;
  },

  async updateComplaintStatus(id: string, status: Complaint['status'], responseNote?: string, isPublicAlert?: boolean) {
    XeniosStore.updateComplaintStatus(id, status, responseNote, isPublicAlert);
    if (!db || !isFirebaseConfigured) return;

    try {
      const docRef = doc(db, COLLECTIONS.COMPLAINTS, id);
      await updateDoc(docRef, {
        status,
        ...(responseNote !== undefined ? { businessResponse: responseNote } : {}),
        ...(isPublicAlert !== undefined ? { isPublicAlert } : {}),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore update complaint error:", e);
    }
  },

  // 🚀 SYNC ALL SEED DATA TO FIRESTORE (One-Click Migration)
  async syncAllLocalDataToFirestore(): Promise<{ success: boolean; message: string }> {
    if (!db || !isFirebaseConfigured) {
      return {
        success: false,
        message: "Firebase henüz yapılandırılmamış. Lütfen .env.local dosyasına Firebase proje anahtarlarınızı ekleyiniz."
      };
    }

    try {
      const hotels = XeniosStore.getHotels();
      const experiences = XeniosStore.getExperiences();
      const properties = XeniosStore.getPropertyListings();
      const suppliers = XeniosStore.getSuppliers();

      // Upload Hotels
      for (const h of hotels) {
        await this.upsertHotel(h);
      }

      // Upload Experiences + Marketplace Mirror
      for (const exp of experiences) {
        await this.upsertExperience(exp);
      }

      // Upload Properties
      for (const prop of properties) {
        await this.upsertProperty(prop);
      }

      // Upload Suppliers
      for (const sup of suppliers) {
        await this.upsertSupplier(sup);
      }

      return {
        success: true,
        message: `Başarıyla aktarıldı: ${hotels.length} Otel, ${experiences.length} İlan/Deneyim, ${properties.length} Mülk Portföyü ve ${suppliers.length} Anlaşmalı İşletme Cloud Firestore'a ve Web/Mobil vitrine senkronize edildi.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Firestore aktarım hatası: " + (e?.message || String(e))
      };
    }
  }
};

