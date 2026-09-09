/**
 * marketplace_listings koleksiyonu için Firestore CRUD ve sorgu yardımcıları.
 */
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MARKETPLACE_COLLECTIONS } from './collections';
import { deleteListingImage } from './storage';
import type { ListingImage, ListingType, MarketplaceListing } from './types';

function requireDb() {
  if (!db) throw new Error('Firestore henüz başlatılmadı.');
  return db;
}

function sortByCreatedAtDesc(items: MarketplaceListing[]): MarketplaceListing[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function toListing(id: string, data: Omit<MarketplaceListing, 'id'>): MarketplaceListing {
  return { id, ...data };
}

/** Yeni bir taslak ilan oluşturur ve id'sini döner (form bu id üzerinden düzenlenir). */
export async function createDraftListing(hostId: string, type: ListingType): Promise<string> {
  const now = new Date().toISOString();
  const payload: Omit<MarketplaceListing, 'id'> = {
    hostId,
    type,
    title: '',
    description: '',
    category: type === 'stay' ? 'Konaklama' : 'Deneyim',
    images: [],
    district: '',
    pricing: { basePrice: 0, currency: 'TRY' },
    capacity: 2,
    amenities: [],
    status: 'draft',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: now,
    updatedAt: now
  };
  const ref = await addDoc(collection(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS), payload);
  return ref.id;
}

export async function getListing(id: string): Promise<MarketplaceListing | null> {
  const snap = await getDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id));
  return snap.exists() ? toListing(snap.id, snap.data() as Omit<MarketplaceListing, 'id'>) : null;
}

export function watchListing(
  id: string,
  cb: (listing: MarketplaceListing | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id),
    (snap) => cb(snap.exists() ? toListing(snap.id, snap.data() as Omit<MarketplaceListing, 'id'>) : null),
    (err) => onError?.(err)
  );
}

export function watchHostListings(hostId: string, cb: (listings: MarketplaceListing[]) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS), where('hostId', '==', hostId));
  return onSnapshot(q, (snap) => {
    cb(sortByCreatedAtDesc(snap.docs.map((d) => toListing(d.id, d.data() as Omit<MarketplaceListing, 'id'>))));
  });
}

/** Ziyaretçi vitrini için yalnızca admin onaylı ilanlar. */
export function watchApprovedListings(cb: (listings: MarketplaceListing[]) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS), where('status', '==', 'approved'));
  return onSnapshot(q, (snap) => {
    cb(sortByCreatedAtDesc(snap.docs.map((d) => toListing(d.id, d.data() as Omit<MarketplaceListing, 'id'>))));
  });
}

/** Admin moderasyon kuyruğu. */
export function watchPendingListings(cb: (listings: MarketplaceListing[]) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS), where('status', '==', 'pending_review'));
  return onSnapshot(q, (snap) => {
    cb(sortByCreatedAtDesc(snap.docs.map((d) => toListing(d.id, d.data() as Omit<MarketplaceListing, 'id'>))));
  });
}

export type ListingFormFields = Pick<
  MarketplaceListing,
  'title' | 'description' | 'category' | 'district' | 'pricing' | 'capacity' | 'amenities'
>;

export async function updateListingFields(id: string, fields: Partial<ListingFormFields>): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    ...fields,
    updatedAt: new Date().toISOString()
  });
}

export async function addListingImage(id: string, image: ListingImage, makeCover: boolean): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id);
  await updateDoc(ref, {
    images: arrayUnion(image),
    ...(makeCover ? { coverImageUrl: image.url } : {}),
    updatedAt: new Date().toISOString()
  });
}

export async function removeListingImage(listing: MarketplaceListing, image: ListingImage): Promise<void> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, listing.id);
  const remaining = listing.images.filter((img) => img.path !== image.path);
  const wasCover = listing.coverImageUrl === image.url;
  await updateDoc(ref, {
    images: arrayRemove(image),
    coverImageUrl: wasCover ? (remaining[0]?.url ?? undefined) : listing.coverImageUrl,
    updatedAt: new Date().toISOString()
  });
  await deleteListingImage(image);
}

export async function setCoverImage(id: string, url: string): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    coverImageUrl: url,
    updatedAt: new Date().toISOString()
  });
}

export async function submitListingForReview(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    status: 'pending_review',
    updatedAt: new Date().toISOString()
  });
}

export async function withdrawListingToDraft(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    status: 'draft',
    updatedAt: new Date().toISOString()
  });
}

export async function unpublishListing(id: string): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    status: 'suspended',
    updatedAt: new Date().toISOString()
  });
}

export async function deleteDraftListing(listing: MarketplaceListing): Promise<void> {
  await Promise.all(listing.images.map((img) => deleteListingImage(img)));
  await deleteDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, listing.id));
}

/** SADECE ADMIN (cockpit /listing-approvals ekranından çağrılır). */
export async function approveListing(id: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    status: 'approved',
    approvedAt: now,
    updatedAt: now
  });
}

export async function rejectListing(id: string, reason: string): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), {
    status: 'rejected',
    rejectedReason: reason,
    updatedAt: new Date().toISOString()
  });
}

export async function bumpListingStat(
  id: string,
  stat: 'viewCount' | 'clickCount' | 'favoriteCount' | 'bookingCount',
  delta = 1
): Promise<void> {
  await updateDoc(doc(requireDb(), MARKETPLACE_COLLECTIONS.LISTINGS, id), { [`stats.${stat}`]: increment(delta) });
}
