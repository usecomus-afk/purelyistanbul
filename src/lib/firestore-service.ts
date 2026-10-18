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

const seenRemoteRequestIds = new Set<string>();
let initialSnapshotSeeded = false;

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
      await setDoc(doc(db, COLLECTIONS.EXPERIENCES, id), {
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: new Date().toISOString()
      });
      await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE_LISTINGS, id)).catch(() => {});
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
            const remoteDeletedIds: string[] = [];
            snap.forEach((d) => {
              const data = d.data() as Experience & { deleted?: boolean };
              if (data.deleted === true) {
                remoteDeletedIds.push(d.id);
              } else {
                remoteMap.set(d.id, { ...data, id: d.id });
              }
            });
            if (remoteDeletedIds.length > 0 && typeof window !== 'undefined') {
              try {
                const rawDel = localStorage.getItem('xenios_deleted_experience_ids');
                const arr: string[] = rawDel ? JSON.parse(rawDel) : [];
                let updatedDel = false;
                remoteDeletedIds.forEach((delId) => {
                  if (!arr.includes(delId)) {
                    arr.push(delId);
                    updatedDel = true;
                  }
                });
                if (updatedDel) {
                  localStorage.setItem('xenios_deleted_experience_ids', JSON.stringify(arr));
                }
              } catch {}
            }
            const current = XeniosStore.getExperiences();
            const mergedMap = new Map<string, Experience>();
            remoteMap.forEach((v, k) => mergedMap.set(k, v));
            current.forEach((item) => {
              if (!mergedMap.has(item.id) && !remoteDeletedIds.includes(item.id)) {
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

            const activeHotelId = XeniosStore.getActiveHotelId();
            const activeRemote = remoteMap.get(activeHotelId) || Array.from(remoteMap.values()).find(h => Array.isArray(h.modules?.inRoomServices));
            if (activeRemote?.modules?.inRoomServices) {
              XeniosStore.syncInRoomServicesFromRemote(
                activeRemote.modules.inRoomServices,
                activeRemote.modules.inRoomServicesUpdatedAt
              );
            }
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

  // 🛎️ LIVE ROOM REQUESTS WITH REALTIME FIRESTORE LISTENER + 3s REST POLLER
  subscribeToLiveRequests(
    hotelId: string | null,
    onUpdate: (requests: ServiceRequest[]) => void
  ): Unsubscribe {
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
        ? list.filter((r) => !r.hotelId || r.hotelId === hotelId)
        : list;

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (typeof window !== 'undefined') {
        const allowStaffAlert = shouldReceiveStaffRequestAlerts();
        if (allowStaffAlert) {
          const nowMs = Date.now();
          const alreadyInitialized = HotelAudioNotification.isNotifiedStorageInitialized();

          if (!alreadyInitialized) {
            HotelAudioNotification.ensureNotifiedStorageInitialized();
            // Sort oldest-first when firing alerts so newest shows on top
            const chronological = [...list].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            for (const item of chronological) {
              const createdMs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
              const isRecentOnFirstBoot = createdMs > 0 && nowMs - createdMs < 180_000;
              seenRemoteRequestIds.add(item.id);
              if (isRecentOnFirstBoot && item.status === 'pending' && !HotelAudioNotification.hasNotified(item.id)) {
                if (!hotelId || !item.hotelId || item.hotelId === hotelId) {
                  HotelAudioNotification.triggerGuestRequestAlert(item);
                }
              } else {
                HotelAudioNotification.markNotified(item.id);
              }
            }
          } else {
            const chronological = [...list].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            for (const item of chronological) {
              seenRemoteRequestIds.add(item.id);
              if (!HotelAudioNotification.hasNotified(item.id)) {
                const createdMs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
                const isWithinActiveWindow = createdMs > 0 && nowMs - createdMs < 30 * 60 * 1000;
                if (isWithinActiveWindow && item.status === 'pending') {
                  if (!hotelId || !item.hotelId || item.hotelId === hotelId) {
                    HotelAudioNotification.triggerGuestRequestAlert(item);
                  }
                } else if (!isWithinActiveWindow || item.status === 'completed' || item.status === 'cancelled') {
                  HotelAudioNotification.markNotified(item.id);
                }
              }
            }
          }
        }

        XeniosStore.syncRequestsFromRemote(filtered);
      }

      onUpdate(filtered);
    };

    let isRestPolling = false;
    const pollViaRest = async () => {
      if (isRestPolling) return;
      isRestPolling = true;
      try {
        const res = await fetch(
          'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents:runQuery',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: COLLECTIONS.REQUESTS }],
                orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
                limit: 60,
              },
            }),
          }
        );
        if (!res.ok) return;
        const rows = await res.json();
        if (!Array.isArray(rows)) return;
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
        processRawList(parsed);
      } catch {
        // Ignore transient network errors during background/foreground transitions
      } finally {
        isRestPolling = false;
      }
    };

    const unsubs: Array<() => void> = [];

    if (typeof window !== 'undefined') {
      pollViaRest();
      const pollInterval = window.setInterval(pollViaRest, 3000);
      const onWake = () => {
        pollViaRest();
      };
      window.addEventListener('focus', onWake);
      window.addEventListener('pageshow', onWake);
      window.addEventListener('online', onWake);
      const onVis = () => {
        if (document.visibilityState === 'visible') {
          pollViaRest();
        }
      };
      document.addEventListener('visibilitychange', onVis);

      unsubs.push(() => {
        window.clearInterval(pollInterval);
        window.removeEventListener('focus', onWake);
        window.removeEventListener('pageshow', onWake);
        window.removeEventListener('online', onWake);
        document.removeEventListener('visibilitychange', onVis);
      });
    }

    if (!db || !isFirebaseConfigured) {
      const handler = () => {
        const reqs = XeniosStore.getRequests();
        const filtered = hotelId ? reqs.filter((r) => !r.hotelId || r.hotelId === hotelId) : reqs;
        onUpdate(filtered);
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('xenios_requests_updated', handler);
        unsubs.push(() => window.removeEventListener('xenios_requests_updated', handler));
      }
      handler();
      return () => unsubs.forEach((u) => u());
    }

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      const q = query(colRef, limit(200));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items: ServiceRequest[] = [];
          snapshot.forEach((d) => {
            const rawData = d.data() as any;
            items.push({ id: d.id, ...rawData });
          });
          processRawList(items);
        },
        (err) => {
          console.error('Firestore onSnapshot error:', err);
          pollViaRest();
        }
      );
      unsubs.push(unsubSnapshot);
    } catch (e) {
      console.error('Firestore subscription failed, relying on REST poller:', e);
    }

    return () => {
      unsubs.forEach((u) => u());
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

    // Fire REST PATCH (with keepalive: true) immediately in parallel with Firebase SDK setDoc
    // so orders from a Home Screen QR PWA reach Firestore in <150ms even if the user switches apps immediately.
    const restPromise = saveViaRest();

    if (!db || !isFirebaseConfigured) {
      await restPromise;
      return local;
    }

    try {
      const colRef = collection(db, COLLECTIONS.REQUESTS);
      await Promise.race([
        setDoc(doc(colRef, local.id), payload),
        restPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('setDoc timeout')), 2500)),
      ]);
    } catch {
      await restPromise;
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

    const restPromise = patchViaRest();

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
        await restPromise;
      }
    } else {
      await restPromise;
    }
    return updatedLocal;
  },

  async updateRequestStatus(id: string, status: ServiceRequest['status']): Promise<void> {
    XeniosStore.updateRequestStatus(id, status);
    const updatedAt = new Date().toISOString();

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

