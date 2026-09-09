/**
 * Marketplace modülü için Firestore erişim yardımcıları.
 * Mevcut src/lib/firebase.ts'teki tekil app/db örneğini kullanır — ayrı bir
 * Firebase init'i YOKTUR.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MARKETPLACE_COLLECTIONS } from './collections';
import type {
  CommissionRate,
  ContactMessage,
  HostApplication,
  LegalConsentRecord,
  UserProfile
} from './types';

function requireDb() {
  if (!db) throw new Error('Firestore henüz başlatılmadı.');
  return db;
}

/** Yeni misafir kullanıcı kaydında users/{uid} belgesini oluşturur. */
export async function ensureUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
}): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.USERS, params.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    ...(params.phone ? { phone: params.phone } : {}),
    roles: { guest: true, host: false },
    activeRole: 'guest',
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(ref, profile);
}

export function watchUserProfile(uid: string, cb: (profile: UserProfile | null) => void): Unsubscribe {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.USERS, uid);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null));
}

export async function touchLastActive(uid: string): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.USERS, uid);
  await updateDoc(ref, { lastActiveAt: new Date().toISOString() });
}

/**
 * Misafir kullanıcının "İlan Sahibi Moduna Geç" isteği: host rolü HENÜZ verilmez.
 * Bir host_applications kaydı oluşturur; komisyon oranı admin onayında belirlenir.
 */
export async function submitHostApplication(params: {
  uid: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  businessType: 'individual' | 'company';
  taxId?: string;
  about: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const payload: Omit<HostApplication, 'id'> = {
    uid: params.uid,
    applicantName: params.applicantName,
    applicantEmail: params.applicantEmail,
    applicantPhone: params.applicantPhone,
    businessType: params.businessType,
    taxId: params.taxId,
    about: params.about,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };
  const ref = await addDoc(collection(requireDb(), MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS), payload);
  return ref.id;
}

export function watchOwnHostApplication(uid: string, cb: (app: HostApplication | null) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS), where('uid', '==', uid));
  return onSnapshot(q, (snap) => {
    if (snap.empty) return cb(null);
    // En güncel başvuru: updatedAt'e göre client-side seç (index gerektirmez).
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HostApplication, 'id'>) }));
    docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    cb(docs[0] ?? null);
  });
}

/**
 * SADECE ADMIN: başvuruyu onaylar, komisyon oranını belirler ve kullanıcıya
 * host rolünü açar. Bu, gerçek uygulamada bir Cloud Function / admin API route
 * içinde çalışmalıdır (custom claim + rules ile korunur); burada admin
 * panelinden çağrılacak istemci tarafı fonksiyon olarak tanımlanmıştır.
 */
export async function approveHostApplication(params: {
  applicationId: string;
  adminUid: string;
  hostRate: number;
  platformRate: number;
  note?: string;
}): Promise<void> {
  const database = requireDb();
  const appRef = doc(database, MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS, params.applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) throw new Error('Başvuru bulunamadı.');
  const application = appSnap.data() as HostApplication;

  const now = new Date().toISOString();
  const commissionRate: CommissionRate = {
    hostRate: params.hostRate,
    platformRate: params.platformRate,
    note: params.note,
    setBy: params.adminUid,
    setAt: now
  };

  await updateDoc(appRef, {
    status: 'approved',
    commissionRate,
    reviewedBy: params.adminUid,
    reviewedAt: now,
    updatedAt: now
  });

  const userRef = doc(database, MARKETPLACE_COLLECTIONS.USERS, application.uid);
  await updateDoc(userRef, {
    'roles.host': true,
    hostProfile: {
      applicationId: params.applicationId,
      commissionRate,
      approvedAt: now
    },
    updatedAt: now
  });
}

export async function rejectHostApplication(params: {
  applicationId: string;
  adminUid: string;
  note?: string;
}): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.HOST_APPLICATIONS, params.applicationId);
  await updateDoc(ref, {
    status: 'rejected',
    adminNote: params.note,
    reviewedBy: params.adminUid,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

/** Kullanıcı, onaylanmış host rolü ile misafir/host arayüzü arasında geçiş yapar. */
export async function switchActiveRole(uid: string, role: 'guest' | 'host'): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.USERS, uid);
  await updateDoc(ref, { activeRole: role, updatedAt: new Date().toISOString() });
}

/** Kayıt / rezervasyon sırasında zorunlu sözleşme onaylarının ispat kaydı (KVKK/GDPR). */
export async function recordLegalConsent(record: Omit<LegalConsentRecord, 'id' | 'acceptedAt'>): Promise<void> {
  await addDoc(collection(requireDb(), MARKETPLACE_COLLECTIONS.LEGAL_CONSENTS), {
    ...record,
    acceptedAt: new Date().toISOString()
  });
}

/** İletişim formu gönderimini kaydeder — herkese açık, giriş gerektirmez. */
export async function submitContactMessage(params: {
  name: string;
  email: string;
  message: string;
  uid?: string;
}): Promise<void> {
  const payload: Omit<ContactMessage, 'id'> = {
    name: params.name,
    email: params.email,
    message: params.message,
    ...(params.uid ? { uid: params.uid } : {}),
    createdAt: new Date().toISOString()
  };
  await addDoc(collection(requireDb(), MARKETPLACE_COLLECTIONS.CONTACT_MESSAGES), payload);
}

/** İlan tıklama/favori sayaçlarını atomik olarak artırır (analitik için). */
export async function incrementListingStat(
  listingId: string,
  stat: 'viewCount' | 'clickCount' | 'favoriteCount' | 'bookingCount',
  delta = 1
): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, listingId);
  await updateDoc(ref, { [`stats.${stat}`]: increment(delta) });
}

export { serverTimestamp };
