import { db, isFirebaseConfigured } from './firebase';
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
import { Hotel, Experience, PropertyListing, Booking, Complaint, ServiceRequest, SupplierPartner } from './types';
import { XeniosStore } from './store';
import { normalizeCategoryLabel, type CategoryConfig } from './marketplace/categories';
import {
  experienceToMarketplaceListing,
  hotelToMarketplaceListing,
  propertyToMarketplaceListing
} from './marketplace/seed-listings';

// Collection Names
export const COLLECTIONS = {
  HOTELS: 'hotels',
  EXPERIENCES: 'experiences',
  PROPERTIES: 'properties',
  SUPPLIERS: 'suppliers',
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

export const FirestoreService = {
  // 🌐 CATALOG REALTIME SYNC (Experiences, Hotels, Properties, Suppliers -> Web Marketplace + Mobile App)
  async upsertExperience(exp: Experience): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTIONS.EXPERIENCES, exp.id), stripUndefined({
        ...exp,
        updatedAt: new Date().toISOString()
      }));

      // Mirror to marketplace_listings so Web Marketplace updates live alongside Mobile Concierge
      const mpListing = experienceToMarketplaceListing(exp, 0);
      const mpStatus = exp.status === 'suspended' || exp.publishToWeb === false ? 'suspended' : 'approved';
      await setDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, exp.id), stripUndefined({
        ...mpListing,
        status: mpStatus,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      reportSyncError('upsertExperience', e);
    }
  },

  async deleteExperienceRemote(id: string): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXPERIENCES, id));
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id));
    } catch (e) {
      reportSyncError('deleteExperienceRemote', e);
    }
  },

  async upsertHotel(hotel: Hotel): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTIONS.HOTELS, hotel.id), stripUndefined({
        ...hotel,
        updatedAt: new Date().toISOString()
      }));

      if (hotel.publishToWeb) {
        const mpListing = hotelToMarketplaceListing(hotel, 0);
        await setDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, hotel.id), stripUndefined({
          ...mpListing,
          status: hotel.status === 'suspended' ? 'suspended' : 'approved',
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (e) {
      reportSyncError('upsertHotel', e);
    }
  },

  async deleteHotelRemote(id: string): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.HOTELS, id));
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
    } catch (e) {
      reportSyncError('deleteHotelRemote', e);
    }
  },

  async upsertProperty(prop: PropertyListing): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, prop.id), stripUndefined({
        ...prop,
        updatedAt: new Date().toISOString()
      }));

      if (prop.publishToWeb) {
        const mpListing = propertyToMarketplaceListing(prop);
        await setDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, prop.id), stripUndefined({
          ...mpListing,
          status: prop.status === 'suspended' ? 'suspended' : 'approved',
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (e) {
      reportSyncError('upsertProperty', e);
    }
  },

  async deletePropertyRemote(id: string): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, id));
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
    } catch (e) {
      reportSyncError('deletePropertyRemote', e);
    }
  },

  async upsertSupplier(supplier: SupplierPartner): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTIONS.SUPPLIERS, supplier.id), stripUndefined({
        ...supplier,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      reportSyncError('upsertSupplier', e);
    }
  },

  async deleteSupplierRemote(id: string): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.SUPPLIERS, id));
    } catch (e) {
      reportSyncError('deleteSupplierRemote', e);
    }
  },

  /** Panelden düzenlenen kategori kaydını (ad, ikon, sıra, gizli/açık) tüm cihazlara yansıtır. */
  async upsertCategory(cfg: CategoryConfig): Promise<void> {
    if (!db || !isFirebaseConfigured) return;
    try {
      const normalizedLabel = normalizeCategoryLabel(cfg.label, cfg.label);
      await setDoc(doc(db, COLLECTIONS.SITE_CATEGORIES, cfg.key), stripUndefined({
        ...cfg,
        label: normalizedLabel,
        labelEn: normalizeCategoryLabel(cfg.labelEn, normalizedLabel),
        updatedAt: cfg.updatedAt || new Date().toISOString()
      }));
    } catch (e) {
      reportSyncError('upsertCategory', e);
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
        query(collection(db, COLLECTIONS.SITE_CATEGORIES), limit(100)),
        (snap) => {
          if (snap.empty) return;
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
   */
  subscribeToCatalogSync(): Unsubscribe {
    if (!db || !isFirebaseConfigured || typeof window === 'undefined') {
      return () => {};
    }

    const unsubs: Unsubscribe[] = [];

    try {
      // 1. Experiences listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.EXPERIENCES), limit(250)),
          (snap) => {
            if (snap.empty) return;
            const remoteMap = new Map<string, Experience>();
            snap.forEach((d) => remoteMap.set(d.id, { ...(d.data() as Experience), id: d.id }));
            const current = XeniosStore.getExperiences();
            const mergedMap = new Map<string, Experience>();
            remoteMap.forEach((v, k) => mergedMap.set(k, v));
            current.forEach((item) => {
              if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
            });
            XeniosStore.saveExperiences(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 2. Hotels listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.HOTELS), limit(200)),
          (snap) => {
            if (snap.empty) return;
            const remoteMap = new Map<string, Hotel>();
            snap.forEach((d) => remoteMap.set(d.id, { ...(d.data() as Hotel), id: d.id }));
            const current = XeniosStore.getHotels();
            const mergedMap = new Map<string, Hotel>();
            remoteMap.forEach((v, k) => mergedMap.set(k, v));
            current.forEach((item) => {
              if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
            });
            XeniosStore.saveHotels(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 3. Properties listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.PROPERTIES), limit(200)),
          (snap) => {
            if (snap.empty) return;
            const remoteMap = new Map<string, PropertyListing>();
            snap.forEach((d) => remoteMap.set(d.id, { ...(d.data() as PropertyListing), id: d.id }));
            const current = XeniosStore.getPropertyListings();
            const mergedMap = new Map<string, PropertyListing>();
            remoteMap.forEach((v, k) => mergedMap.set(k, v));
            current.forEach((item) => {
              if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
            });
            XeniosStore.savePropertyListings(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 4. Suppliers listener
      unsubs.push(
        onSnapshot(
          query(collection(db, COLLECTIONS.SUPPLIERS), limit(250)),
          (snap) => {
            if (snap.empty) return;
            const remoteMap = new Map<string, SupplierPartner>();
            snap.forEach((d) => remoteMap.set(d.id, { ...(d.data() as SupplierPartner), id: d.id }));
            const current = XeniosStore.getSuppliers();
            const mergedMap = new Map<string, SupplierPartner>();
            remoteMap.forEach((v, k) => mergedMap.set(k, v));
            current.forEach((item) => {
              if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
            });
            XeniosStore.saveSuppliers(Array.from(mergedMap.values()));
          },
          () => {}
        )
      );

      // 5. Site categories listener (panelden düzenlenen kategori adı/ikon/sıra/gizlilik)
      unsubs.push(FirestoreService.subscribeToCategoryConfigs());
    } catch (e) {
      console.warn('Catalog realtime subscription error:', e);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  },

  // 🛎️ LIVE ROOM REQUESTS WITH REALTIME FIRESTORE LISTENER
  subscribeToLiveRequests(
    hotelId: string | null,
    onUpdate: (requests: ServiceRequest[]) => void
  ): Unsubscribe {
    if (!db || !isFirebaseConfigured) {
      // Fallback: poll local store and return unbind
      const handler = () => {
        const reqs = XeniosStore.getRequests();
        const filtered = hotelId ? reqs.filter(r => !r.hotelId || r.hotelId === hotelId) : reqs;
        onUpdate(filtered);
      };
      window.addEventListener('xenios_requests_updated', handler);
      handler();
      return () => window.removeEventListener('xenios_requests_updated', handler);
    }

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      // Query without composite index requirement so it never throws missing index error
      const q = query(colRef, limit(150));

      return onSnapshot(q, (snapshot) => {
        const deletedIds = typeof window !== 'undefined' ? XeniosStore.getDeletedRequestIds() : new Set<string>();
        const statusOverrides = typeof window !== 'undefined' ? XeniosStore.getRequestStatusOverrides() : {};
        const list: ServiceRequest[] = [];
        snapshot.forEach((d) => {
          if (deletedIds.has(d.id)) return;
          const rawData = d.data() as any;
          if (!rawData?.serviceTitle && !rawData?.serviceKey) return;
          const item: ServiceRequest = { id: d.id, ...rawData };
          if (statusOverrides[d.id]) {
            item.status = statusOverrides[d.id];
          }
          list.push(item);
        });

        // Filter by hotelId if specified
        const filtered = hotelId
          ? list.filter((r) => !r.hotelId || r.hotelId === hotelId)
          : list;

        // Sort descending by createdAt
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Detect newly arrived remote requests
        if (typeof window !== 'undefined') {
          const currentLocal = XeniosStore.getRequests();
          const existingIds = new Set(currentLocal.map((r) => r.id));

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && !deletedIds.has(change.doc.id)) {
              const newReq = { id: change.doc.id, ...(change.doc.data() as any) } as ServiceRequest;
              if (!existingIds.has(newReq.id) && newReq.status === 'pending') {
                if (!hotelId || !newReq.hotelId || newReq.hotelId === hotelId) {
                  window.dispatchEvent(new CustomEvent('xenios_request_created', { detail: newReq }));
                }
              }
            }
          });

          XeniosStore.syncRequestsFromRemote(filtered);
        }

        onUpdate(filtered);
      }, (err) => {
        console.error("Firestore onSnapshot error:", err);
        const reqs = XeniosStore.getRequests();
        const filtered = hotelId ? reqs.filter(r => !r.hotelId || r.hotelId === hotelId) : reqs;
        onUpdate(filtered);
      });
    } catch (e) {
      console.error("Firestore subscription failed, using local store:", e);
      const reqs = XeniosStore.getRequests();
      const filtered = hotelId ? reqs.filter(r => !r.hotelId || r.hotelId === hotelId) : reqs;
      onUpdate(filtered);
      return () => {};
    }
  },

  async addRequest(req: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest> {
    const local = XeniosStore.addRequest(req);
    if (!db || !isFirebaseConfigured) return local;

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      await setDoc(doc(colRef, local.id), {
        ...local,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore save error:", e);
    }
    return local;
  },

  async updateRequestStatus(id: string, status: ServiceRequest['status']): Promise<void> {
    XeniosStore.updateRequestStatus(id, status);
    if (!db || !isFirebaseConfigured) return;

    try {
      const docRef = doc(db, COLLECTIONS.REQUESTS, id);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  },

  async deleteRequest(id: string): Promise<void> {
    XeniosStore.deleteRequest(id);
    if (!db || !isFirebaseConfigured) return;

    try {
      const docRef = doc(db, COLLECTIONS.REQUESTS, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error:", e);
    }
  },

  // 💳 BOOKINGS
  async addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'confirmationCode'>): Promise<Booking> {
    const local = XeniosStore.addBooking(booking);
    if (!db || !isFirebaseConfigured) return local;

    try {
      const colRef = collection(db, COLLECTIONS.BOOKINGS);
      await setDoc(doc(colRef, local.id), local);
    } catch (e) {
      console.warn("Firestore add booking error:", e);
    }
    return local;
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

