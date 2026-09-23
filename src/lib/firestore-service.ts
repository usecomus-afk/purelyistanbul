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
import { Hotel, Experience, PropertyListing, Booking, Complaint, ServiceRequest } from './types';
import { XeniosStore } from './store';

// Collection Names
export const COLLECTIONS = {
  HOTELS: 'hotels',
  EXPERIENCES: 'experiences',
  PROPERTIES: 'properties',
  BOOKINGS: 'bookings',
  COMPLAINTS: 'complaints',
  REQUESTS: 'service_requests',
  INVESTMENT_LEADS: 'investment_leads',
  NOTIFICATIONS: 'notifications_log',
  AI_LOGS: 'ai_logs',
  ADMINS: 'admins'
};

export const FirestoreService = {
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
        const list: ServiceRequest[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
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
            if (change.type === 'added') {
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

      // Upload Hotels
      for (const h of hotels) {
        await setDoc(doc(db, COLLECTIONS.HOTELS, h.id), h);
      }

      // Upload Experiences
      for (const exp of experiences) {
        await setDoc(doc(db, COLLECTIONS.EXPERIENCES, exp.id), exp);
      }

      // Upload Properties
      for (const prop of properties) {
        await setDoc(doc(db, COLLECTIONS.PROPERTIES, prop.id), prop);
      }

      return {
        success: true,
        message: `Başarıyla aktarıldı: ${hotels.length} Otel, ${experiences.length} Deneyim/Restoran, ${properties.length} Yatırım Portföyü Cloud Firestore'a yazıldı.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Firestore aktarım hatası: " + (e?.message || String(e))
      };
    }
  }
};
