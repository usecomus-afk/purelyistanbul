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
  return onSnapshot(doc(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES, favoriteId(uid, listingId)), (snap) =>
    cb(snap.exists())
  );
}

export async function toggleFavorite(uid: string, listingId: string): Promise<boolean> {
  const ref = doc(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES, favoriteId(uid, listingId));
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    await bumpListingStat(listingId, 'favoriteCount', -1);
    return false;
  }
  await setDoc(ref, { uid, listingId, createdAt: new Date().toISOString() });
  await bumpListingStat(listingId, 'favoriteCount', 1);
  return true;
}

/** Kullanıcının favori listesi ("Wishlist") sayfası için. */
export function watchUserFavoriteListings(uid: string, cb: (listings: MarketplaceListing[]) => void): Unsubscribe {
  const q = query(collection(requireDb(), MARKETPLACE_COLLECTIONS.FAVORITES), where('uid', '==', uid));
  return onSnapshot(q, async (snap) => {
    const listingIds = snap.docs.map((d) => d.data().listingId as string);
    const listings = await Promise.all(listingIds.map((id) => getListing(id)));
    cb(listings.filter((l): l is MarketplaceListing => l !== null));
  });
}
