/**
 * Marketplace ilan fotoğrafları için Firebase Cloud Storage yardımcıları.
 * Yol: marketplace_listings/{hostId}/{listingId}/{uuid}-{fileName}
 */
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { ListingImage } from './types';

function requireStorage() {
  if (!storage) throw new Error('Firebase Storage henüz başlatılmadı.');
  return storage;
}

export async function uploadListingImage(hostId: string, listingId: string, file: File): Promise<ListingImage> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `marketplace_listings/${hostId}/${listingId}/${Date.now()}-${safeName}`;
  const storageRef = ref(requireStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteListingImage(image: ListingImage): Promise<void> {
  try {
    await deleteObject(ref(requireStorage(), image.path));
  } catch (err) {
    // Depoda zaten yoksa (örn. önceden silinmiş) sessizce geç.
    console.warn('Görsel silinemedi (muhtemelen zaten yok):', err);
  }
}
