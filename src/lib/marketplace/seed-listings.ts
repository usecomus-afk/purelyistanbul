import type { GroupType, MarketplaceListing } from './types';
import rawExperiences from '@/data/experiences.json';

const now = new Date().toISOString();

function getCategoryCode(categoryStr: string): string {
  const lower = categoryStr.toLowerCase();
  if (lower.includes('boğaz') || lower.includes('yat')) return "cat-1";
  if (lower.includes('tarih') || lower.includes('müze')) return "cat-2";
  if (lower.includes('gastro') || lower.includes('gurme')) return "cat-3";
  if (lower.includes('hamam') || lower.includes('spa') || lower.includes('geleneksel')) return "cat-4";
  if (lower.includes('günübirlik') || lower.includes('şehir dışı')) return "cat-5";
  if (lower.includes('transfer') || lower.includes('vip')) return "cat-6";
  if (lower.includes('fotoğraf') || lower.includes('kostüm')) return "cat-7";
  if (lower.includes('gece hayatı') || lower.includes('pub crawl')) return "cat-8";
  if (lower.includes('alışveriş') || lower.includes('çarşı')) return "cat-9";
  if (lower.includes('aile') || lower.includes('çocuk') || lower.includes('eğlence')) return "cat-10";
  if (lower.includes('semazen') || lower.includes('sanat') || lower.includes('tasarım')) return "cat-11";
  if (lower.includes('kültür') || lower.includes('miras') || lower.includes('inanç')) return "cat-12";
  if (lower.includes('macera') || lower.includes('doğa')) return "cat-13";
  if (lower.includes('restoran')) return "cat-14";
  if (lower.includes('estetik') || lower.includes('güzellik')) return "cat-15";
  return "cat-1"; // fallback
}

export const SEED_LISTINGS: MarketplaceListing[] = rawExperiences.map((exp: any, index: number) => {
  const coverImageUrl = `/images/experiences/${exp.id}.jpg`;
  
  // Calculate a stable fake createdAt date for sorting
  const fakeDate = new Date();
  fakeDate.setMinutes(fakeDate.getMinutes() - index * 60);
  
  return {
    id: exp.id,
    hostId: 'purely-host',
    type: 'experience',
    title: exp.title,
    description: exp.desc || exp.title,
    category: getCategoryCode(exp.category),
    district: exp.location || 'İstanbul',
    pricing: { basePrice: exp.price || 0, currency: exp.currency || 'EUR' },
    capacity: 10,
    amenities: exp.features || [],
    images: [{ url: coverImageUrl, path: coverImageUrl }],
    coverImageUrl,
    status: 'approved' as const,
    stats: { viewCount: 0, clickCount: 0, favoriteCount: 0, bookingCount: 0 },
    createdAt: fakeDate.toISOString(),
    updatedAt: now,
  };
});

export function getSeedListing(id: string) { return SEED_LISTINGS.find(l => l.id === id); }
export function isSeedListingId(id: string) {
  return id.startsWith('exp-') || id.startsWith('hotel-') || id.startsWith('rest-');
}
