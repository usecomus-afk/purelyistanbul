/**
 * favorites koleksiyonu — doküman id'si `${uid}_${listingId}` formatındadır,
 * bu sayede tek bir get/delete ile favori durumu değiştirilebilir.
 */
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, where, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MARKETPLACE_COLLECTIONS } from './collections';
import { bumpListingStat, getListing } from './listings';
import type { MarketplaceListing } from './types';

function requireDb() {
  if (!db) throw new Error('Firestore henüz başlatılmadı.');
  return db;
}

function favoriteId(uid: string, listingId: string) {
  return `${uid}_${listingId}`;
}

export function watchIsFavorite(uid: string, listingId: string, cb: (isFavorite: boolean) => void): Unsubscribe {
  const q = query(
    collection(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES),
    where('uid', '==', uid),
    where('listingId', '==', listingId)
  );
  return onSnapshot(q, (snap) => cb(!snap.empty), () => cb(false));
}

export function watchUserFavoriteIds(uid: string, cb: (ids: Set<string>) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      cb(new Set(snap.docs.map((d) => d.data().listingId as string)));
    },
    () => cb(new Set())
  );
}

export async function toggleFavorite(
  uid: string,
  listingId: string,
  currentlyFavorite?: boolean
): Promise<boolean> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES, favoriteId(uid, listingId));
  let isFav = currentlyFavorite;
  if (typeof isFav !== 'boolean') {
    try {
      const existing = await getDoc(ref);
      isFav = existing.exists();
    } catch {
      // Firestore rules deny getDoc when resource is null (document does not exist yet)
      isFav = false;
    }
  }
  if (isFav) {
    await deleteDoc(ref);
    await bumpListingStat(listingId, 'favoriteCount', -1).catch(() => {});
    return false;
  }
  await setDoc(ref, { uid, listingId, createdAt: new Date().toISOString() });
  await bumpListingStat(listingId, 'favoriteCount', 1).catch(() => {});
  return true;
}

/** Kullanıcının favori listesi ("Wishlist") sayfası için. */
export function watchUserFavoriteListings(uid: string, cb: (listings: MarketplaceListing[]) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES), where('uid', '==', uid));
  return onSnapshot(
    q,
    async (snap) => {
      const listingIds = snap.docs.map((d) => d.data().listingId as string);
      const listings = await Promise.all(listingIds.map((id) => getListing(id).catch(() => null)));
      cb(listings.filter((l): l is MarketplaceListing => l !== null));
    },
    () => cb([])
  );
}
