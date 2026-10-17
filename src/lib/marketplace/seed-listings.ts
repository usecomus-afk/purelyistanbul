import type { MarketplaceListing } from './types';
import rawExperiences from '@/data/experiences.json';
import { XeniosStore } from '@/lib/store';
import { isRemovedCategory } from './categories';
import { getLocalizedExperience } from '@/lib/experience-i18n';
import type { Experience, Hotel } from '@/lib/types';

const now = new Date().toISOString();

export function getCategoryCode(categoryStr: string): string {
  const lower = (categoryStr || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  if (lower.includes('cat-11') || lower.includes('cat-12')) return 'removed';
  if (lower.includes('cat-')) return categoryStr;
  if (lower.includes('konaklama') || lower.includes('otel') || lower.includes('stay')) return 'konaklama';
  if (
    lower.includes('yatırım') ||
    lower.includes('invest') ||
    lower.includes('mülk') ||
    lower.includes('gayrimenkul') ||
    lower.includes('estetik') ||
    lower.includes('güzellik') ||
    lower.includes('aesthetic') ||
    lower.includes('beauty') ||
    lower.includes('clinic')
  ) {
    return 'removed';
  }
  if (lower.includes('laundry') || lower.includes('garment') || lower.includes('dry clean') || lower.includes('çamaşır') || lower.includes('ütü')) return 'cat-10';
  if (lower.includes('breakfast') || lower.includes('catering') || lower.includes('kahvaltı') || lower.includes('in-stay')) return 'cat-9';
  if (lower.includes('boğaz') || lower.includes('yat') || lower.includes('bosphorus') || lower.includes('yacht') || lower.includes('cruise') || lower.includes('boat')) return 'cat-1';
  if (lower.includes('tarih') || lower.includes('müze') || lower.includes('history') || lower.includes('historic') || lower.includes('museum') || lower.includes('kültür') || lower.includes('miras') || lower.includes('cultur') || lower.includes('heritage') || lower.includes('fast-track')) return 'cat-2';
  if (lower.includes('gastro') || lower.includes('gurme') || lower.includes('food') || lower.includes('culinary') || lower.includes('restoran') || lower.includes('restaurant')) return 'cat-3';
  if (lower.includes('hamam') || lower.includes('hammam') || lower.includes('spa') || lower.includes('geleneksel') || lower.includes('bath')) return 'cat-4';
  if (lower.includes('semazen') || lower.includes('sanat') || lower.includes('tasarım') || lower.includes('art') || lower.includes('dervish')) return 'cat-5';
  if (lower.includes('fotoğraf') || lower.includes('kostüm') || lower.includes('photo') || lower.includes('costume') || lower.includes('rooftop')) return 'cat-6';
  if (lower.includes('transfer') || lower.includes('vip') || lower.includes('airport') || lower.includes('fleet')) return 'cat-7';
  if (lower.includes('alışveriş') || lower.includes('çarşı') || lower.includes('shopping') || lower.includes('bazaar') || lower.includes('artisan')) return 'cat-8';
  return 'cat-1';
}

export function getExperienceCategoryKey(exp: Pick<Experience, 'category' | 'categoryKey'>): string {
  if (exp.categoryKey && !isRemovedCategory(exp.categoryKey)) {
    return exp.categoryKey;
  }
  return getCategoryCode(exp.category);
}

export function experienceToMarketplaceListing(exp: Experience, index = 0): MarketplaceListing {
  const loc = getLocalizedExperience(exp, 'en');
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
    hostId: exp.supplierId || 'purely-partner',
    type: exp.listingType === 'stay' ? 'stay' : 'experience',
    title: loc.title,
    description: loc.agentNote || loc.desc || loc.title,
    category: getExperienceCategoryKey(exp),
    district: (loc.location || 'Istanbul').replace(/İstanbul Genel/gi, 'Istanbul-Wide'),
    pricing: {
      basePrice: Number(exp.price) || 0,
      currency: (exp.currency === '₺' ? 'TRY' : exp.currency === '€' ? 'EUR' : exp.currency === '$' ? 'USD' : exp.currency || 'EUR') as any
    },
    capacity: exp.capacity || exp.availableSlots || 10,
    amenities: loc.specialties || exp.features || [],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: exp.status === 'suspended' ? 'suspended' : 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: fakeDate.toISOString(),
    updatedAt: now,
  };
}

export function hotelToMarketplaceListing(hotel: Hotel, _index: number = 0): MarketplaceListing {
  const coverImageUrl = '/images/istanbul/il_1588xN.6201904451_eqr3.webp';
  return {
    id: hotel.id,
    hostId: hotel.supplierId || 'purely-partner',
    type: 'stay',
    title: hotel.name,
    description: `${hotel.type} • ${hotel.address}. ${hotel.targetReason || ''}`,
    category: 'konaklama',
    district: hotel.district || 'Istanbul',
    pricing: { basePrice: 180, currency: 'EUR' },
    capacity: Math.max(2, (hotel.rooms?.length || 1) * 2),
    amenities: ['Wi-Fi', `Breakfast (${hotel.breakfastHours})`, '24/7 Digital Concierge'],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: hotel.status === 'suspended' ? 'suspended' : 'approved',
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export const SEED_LISTINGS: MarketplaceListing[] = (rawExperiences as any[])
  .filter(
    (exp) =>
      exp.status !== 'suspended' &&
      exp.publishToWeb !== false &&
      !isRemovedCategory(exp.category) &&
      !isRemovedCategory(exp.categoryKey) &&
      getExperienceCategoryKey(exp as Experience) !== 'removed'
  )
  .map((exp, index) => experienceToMarketplaceListing(exp as Experience, index));

export function getLiveCatalogListings(): MarketplaceListing[] {
  if (typeof window === 'undefined') return SEED_LISTINGS;
  try {
    const hiddenKeys = new Set(
      XeniosStore.getCategoryConfigs().filter((c) => c.hidden).map((c) => c.key)
    );

    const exps = XeniosStore.getExperiences().filter((e) => {
      const catKey = getExperienceCategoryKey(e);
      return (
        e.status !== 'suspended' &&
        e.publishToWeb !== false &&
        catKey !== 'removed' &&
        !isRemovedCategory(e.category) &&
        !isRemovedCategory(e.categoryKey) &&
        !hiddenKeys.has(catKey)
      );
    });
    return exps.map((e, i) => experienceToMarketplaceListing(e, i));
  } catch {
    return SEED_LISTINGS;
  }
}

export function getSeedListing(id: string): MarketplaceListing | undefined {
  if (typeof window !== 'undefined') {
    const exp = XeniosStore.getExperiences().find((e) => e.id === id);
    if (exp && getExperienceCategoryKey(exp) !== 'removed') {
      return experienceToMarketplaceListing(exp, 0);
    }
    const hotel = XeniosStore.getHotels().find((h) => h.id === id);
    if (hotel) return hotelToMarketplaceListing(hotel);
  }
  return SEED_LISTINGS.find((l) => l.id === id);
}

export function isSeedListingId(id: string) {
  return (
    id.startsWith('exp-') ||
    id.startsWith('exp_') ||
    id.startsWith('hotel-') ||
    id.startsWith('hotel_') ||
    id.startsWith('rest-')
  );
}
