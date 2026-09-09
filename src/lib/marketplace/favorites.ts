/**
 * favorites koleksiyonu — doküman id'si `${uid}_${listingId}` formatındadır,
 * bu sayede tek bir get/delete ile favori durumu değiştirilebilir.
 */
import { deleteDoc, doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MARKETPLACE_COLLECTIONS } from './collections';
import { bumpListingStat } from './listings';

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
