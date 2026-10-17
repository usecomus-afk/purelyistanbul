import type { GroupType, MarketplaceListing } from './types';
import rawExperiences from '@/data/experiences.json';
import { XeniosStore } from '@/lib/store';
import type { Experience, Hotel, PropertyListing } from '@/lib/types';

const now = new Date().toISOString();

export function getCategoryCode(categoryStr: string): string {
  const lower = (categoryStr || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  if (lower.includes('cat-')) return categoryStr;
  if (lower.includes('konaklama') || lower.includes('otel') || lower.includes('stay')) return "konaklama";
  // "yatırım" içinde "yat" geçtiği için yatırım kontrolü Boğaz/Yat kontrolünden ÖNCE yapılmalı
  if (lower.includes('yatırım') || lower.includes('invest') || lower.includes('mülk') || lower.includes('gayrimenkul')) return "cat-12";
  if (lower.includes('tarih') || lower.includes('müze')) return "cat-1";
  if (lower.includes('gastro') || lower.includes('gurme')) return "cat-2";
  if (lower.includes('semazen') || lower.includes('sanat') || lower.includes('tasarım')) return "cat-3";
  if (lower.includes('alışveriş') || lower.includes('çarşı')) return "cat-4";
  if (lower.includes('boğaz') || lower.includes('yat')) return "cat-5";
  if (lower.includes('kültür') || lower.includes('miras') || lower.includes('inanç')) return "cat-6";
  if (lower.includes('hamam') || lower.includes('spa') || lower.includes('geleneksel')) return "cat-7";
  if (lower.includes('fotoğraf') || lower.includes('kostüm')) return "cat-8";
  if (lower.includes('transfer') || lower.includes('vip')) return "cat-9";
  if (lower.includes('restoran')) return "cat-10";
  if (lower.includes('estetik') || lower.includes('güzellik')) return "cat-11";
  return "cat-5"; // fallback
}

/**
 * Bir deneyimin kategori anahtarı: panelde açıkça atanmış `categoryKey` varsa o,
 * yoksa eski kayıtlar için `category` metninden tahmin edilen anahtar.
 */
export function getExperienceCategoryKey(exp: Pick<Experience, 'category' | 'categoryKey'>): string {
  return exp.categoryKey || getCategoryCode(exp.category);
}

export function experienceToMarketplaceListing(exp: Experience, index = 0): MarketplaceListing {
  const isDefaultSeed = rawExperiences.some((r: any) => r.id === exp.id);
  const coverImageUrl =
    exp.image && exp.image.trim().length > 0
      ? exp.image
      : isDefaultSeed
        ? `/images/experiences/${exp.id}.jpg`
        : '/images/istanbul/il_1588xN.6201904451_eqr3.webp';

  const fakeDate = new Date();
  fakeDate.setMinutes(fakeDate.getMinutes() - index * 60);

  return {
    id: exp.id,
    hostId: exp.supplierId || 'purely-host',
    type: exp.listingType === 'stay' ? 'stay' : 'experience',
    title: exp.title,
    description: exp.desc || exp.agentNote || exp.title,
    category: getExperienceCategoryKey(exp),
    district: exp.location || 'İstanbul',
    pricing: {
      basePrice: Number(exp.price) || 0,
      currency: (exp.currency === '₺' ? 'TRY' : exp.currency === '€' ? 'EUR' : exp.currency === '$' ? 'USD' : exp.currency || 'EUR') as any
    },
    capacity: exp.capacity || exp.availableSlots || 10,
    amenities: exp.features || exp.specialties || [],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: exp.status === 'suspended' ? 'suspended' : 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: fakeDate.toISOString(),
    updatedAt: now,
  };
}

export function hotelToMarketplaceListing(hotel: Hotel, index = 0): MarketplaceListing {
  const coverImageUrl = '/images/istanbul/il_1588xN.6201904451_eqr3.webp';
  return {
    id: hotel.id,
    hostId: hotel.supplierId || 'purely-host',
    type: 'stay',
    title: hotel.name,
    description: `${hotel.type} • ${hotel.address}. ${hotel.targetReason || ''}`,
    category: 'konaklama',
    district: hotel.district || 'İstanbul',
    pricing: { basePrice: 180, currency: 'EUR' },
    capacity: Math.max(2, (hotel.rooms?.length || 1) * 2),
    amenities: ['Wi-Fi', `Kahvaltı (${hotel.breakfastHours})`, '7/24 Concierge'],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: hotel.status === 'suspended' ? 'suspended' : 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export function propertyToMarketplaceListing(prop: PropertyListing): MarketplaceListing {
  const coverImageUrl = prop.image || '/images/istanbul/il_1588xN.6201904451_eqr3.webp';
  return {
    id: prop.id,
    hostId: prop.supplierId || 'purely-host',
    type: 'stay',
    title: prop.title,
    description: prop.description || `${prop.propertyType} • ${prop.district}`,
    category: 'cat-12',
    district: prop.district || 'İstanbul',
    pricing: { basePrice: Number(prop.priceUSD) || 0, currency: 'USD' },
    capacity: Math.max(2, (prop.bedrooms || 1) * 2),
    amenities: prop.highlights || [],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: prop.status === 'suspended' ? 'suspended' : 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export const SEED_LISTINGS: MarketplaceListing[] = (rawExperiences as any[])
  .filter((exp) => exp.status !== 'suspended' && exp.publishToWeb !== false)
  .map((exp, index) => experienceToMarketplaceListing(exp as Experience, index));

/**
 * Returns live catalog listings from XeniosStore (reflecting Admin additions, edits, and suspensions).
 */
export function getLiveCatalogListings(): MarketplaceListing[] {
  if (typeof window === 'undefined') return SEED_LISTINGS;
  try {
    // Panelden "gizli" işaretlenen kategorilerin ilanları web vitrininde görünmez.
    const hiddenKeys = new Set(
      XeniosStore.getCategoryConfigs().filter((c) => c.hidden).map((c) => c.key)
    );

    const exps = XeniosStore.getExperiences().filter(
      (e) =>
        e.status !== 'suspended' &&
        e.publishToWeb !== false &&
        !hiddenKeys.has(getExperienceCategoryKey(e))
    );
    const expListings = exps.map((e, i) => experienceToMarketplaceListing(e, i));

    const props = hiddenKeys.has('cat-12')
      ? []
      : XeniosStore.getPropertyListings().filter(
          (p) => p.status !== 'suspended' && p.publishToWeb === true
        );
    const propListings = props.map((p) => propertyToMarketplaceListing(p));

    return [...expListings, ...propListings];
  } catch {
    return SEED_LISTINGS;
  }
}

export function getSeedListing(id: string): MarketplaceListing | undefined {
  if (typeof window !== 'undefined') {
    const exp = XeniosStore.getExperiences().find((e) => e.id === id);
    if (exp) return experienceToMarketplaceListing(exp, 0);
    const prop = XeniosStore.getPropertyListings().find((p) => p.id === id);
    if (prop) return propertyToMarketplaceListing(prop);
    const hotel = XeniosStore.getHotels().find((h) => h.id === id);
    if (hotel) return hotelToMarketplaceListing(hotel, 0);
  }
  return SEED_LISTINGS.find((l) => l.id === id);
}

export function isSeedListingId(id: string) {
  return (
    id.startsWith('exp-') ||
    id.startsWith('exp_') ||
    id.startsWith('hotel-') ||
    id.startsWith('hotel_') ||
    id.startsWith('rest-') ||
    id.startsWith('prop-') ||
    id.startsWith('invest-')
  );
}

