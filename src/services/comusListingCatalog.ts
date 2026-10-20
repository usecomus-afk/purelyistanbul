/**
 * Comus Canlı İlan Kataloğu
 *
 * Comus'un ilanlar hakkındaki TEK bilgi kaynağıdır. Kod içinde sabit/demo ilan tutulmaz;
 * her istekte Firestore'dan yalnızca o an YAYINDA olan ilanlar okunur:
 *  - `experiences`          → status !== 'suspended', deleted !== true, publishToWeb !== false
 *  - `marketplace_listings` → status === 'approved' (admin onaylı host ilanları)
 *
 * Bir ilan yayından kaldırıldığında / askıya alındığında / silindiğinde, en geç önbellek süresi
 * (CACHE_TTL_MS) sonunda Comus'un bilgisinden de düşer.
 */

const FIRESTORE_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents';

const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 3_000;

export interface ComusCatalogListing {
  id: string;
  source: 'experience' | 'marketplace';
  title: string;
  category: string;
  district: string;
  provider?: string;
  summary?: string;
  price?: number;
  currency?: string;
  duration?: string;
  cuisine?: string;
}

let cache: { at: number; items: ComusCatalogListing[] } | null = null;

function parseValue(v: any): any {
  if (!v || typeof v !== 'object') return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(parseValue);
  if ('mapValue' in v) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v.mapValue?.fields || {})) out[k] = parseValue(val);
    return out;
  }
  return undefined;
}

function parseDoc(doc: any): Record<string, any> & { id: string } {
  const fields: Record<string, any> = {};
  for (const [k, val] of Object.entries(doc?.fields || {})) fields[k] = parseValue(val);
  return { ...fields, id: String(doc?.name || '').split('/').pop() || '' };
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function shorten(text: unknown, max = 220): string | undefined {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return undefined;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function fetchPublishedExperiences(): Promise<ComusCatalogListing[]> {
  const items: ComusCatalogListing[] = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const url = `${FIRESTORE_BASE_URL}/experiences?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetchWithTimeout(url);
    if (!res?.ok) break;
    const json = await res.json().catch(() => ({}));
    for (const raw of json?.documents || []) {
      const e = parseDoc(raw);
      const isPublished =
        e.status !== 'suspended' &&
        e.deleted !== true &&
        e.publishToWeb !== false &&
        e.categoryKey !== 'removed' &&
        String(e.title || '').trim() !== '';
      if (!isPublished) continue;
      items.push({
        id: e.id,
        source: 'experience',
        title: String(e.title).trim(),
        category: String(e.category || e.categoryTag || '').trim(),
        district: String(e.location || '').trim(),
        provider: shorten(e.provider, 80),
        summary: shorten(e.desc || e.agentNote),
        price: typeof e.price === 'number' && e.price > 0 ? e.price : undefined,
        currency: e.currency || undefined,
        duration: shorten(e.duration, 40),
        cuisine: shorten(e.cuisine, 60),
      });
    }
    pageToken = json?.nextPageToken || '';
    if (!pageToken) break;
  }
  return items;
}

async function fetchApprovedMarketplaceListings(): Promise<ComusCatalogListing[]> {
  const res = await fetchWithTimeout(`${FIRESTORE_BASE_URL}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'marketplace_listings' }],
        where: {
          fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } },
        },
        limit: 300,
      },
    }),
  });
  if (!res?.ok) return [];
  const rows = await res.json().catch(() => []);
  const items: ComusCatalogListing[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.document) continue;
    const l = parseDoc(row.document);
    if (l.status !== 'approved' || !String(l.title || '').trim()) continue;
    items.push({
      id: l.id,
      source: 'marketplace',
      title: String(l.title).trim(),
      category: String(l.category || l.type || '').trim(),
      district: String(l.district || '').trim(),
      provider: shorten(l.providerLabel, 80),
      summary: shorten(l.description),
      price: l.pricing?.basePrice > 0 ? l.pricing.basePrice : undefined,
      currency: l.pricing?.currency || undefined,
      duration: l.durationMinutes ? `${l.durationMinutes} dk` : undefined,
      cuisine: shorten(l.cuisine, 60),
    });
  }
  return items;
}

/** Yayındaki tüm ilanları döner (60 sn önbellekli). Hata durumunda boş liste — asla demo veriye düşmez. */
export async function getPublishedListings(): Promise<ComusCatalogListing[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.items;
  const [exps, market] = await Promise.all([
    fetchPublishedExperiences().catch(() => []),
    fetchApprovedMarketplaceListings().catch(() => []),
  ]);
  const items = [...exps, ...market];
  cache = { at: Date.now(), items };
  return items;
}

const norm = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');

/**
 * Yayındaki ilanlarda arama yapar. Eşleşme yoksa boş döner (rastgele ilan önermez).
 */
export async function searchPublishedListings({
  query,
  category,
  district,
  limit = 5,
}: {
  query?: string;
  category?: string;
  district?: string;
  limit?: number;
}): Promise<{ totalPublished: number; matches: ComusCatalogListing[]; note: string }> {
  const all = await getPublishedListings();
  const terms = norm(query || '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  const cat = norm(category || '');
  const dist = norm(district || '');

  const scored = all
    .map((l) => {
      const hay = norm([l.title, l.category, l.district, l.summary, l.cuisine, l.provider].filter(Boolean).join(' '));
      let score = 0;
      if (cat && norm(l.category).includes(cat)) score += 3;
      if (dist && norm(l.district).includes(dist)) score += 2;
      for (const t of terms) if (hay.includes(t)) score += 1;
      return { l, score };
    })
    .filter(({ score }) => score > 0 || (!cat && !dist && terms.length === 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ l }) => l);

  const note =
    all.length === 0
      ? 'Platformda şu an yayında olan hiçbir ilan yok. Misafire platform üzerinden rezervasyon yapılabilecek bir ilan önerme; bunu dürüstçe belirt.'
      : scored.length === 0
        ? 'Bu talebe uygun yayında ilan bulunamadı. İlan uydurma; dürüstçe belirt ve gerekirse genel yerel bilgi ver (rezervasyon teklif etmeden).'
        : 'Yalnızca bu listedeki ilanları platform ilanı olarak sun. Listede olmayan bilgi (fiyat, saat vb.) uydurma.';

  return { totalPublished: all.length, matches: scored, note };
}

/** Sistem talimatına eklenecek kısa canlı katalog özeti. */
export function formatCatalogForPrompt(items: ComusCatalogListing[], maxItems = 40): string {
  if (items.length === 0) {
    return 'Şu an platformda YAYINDA OLAN İLAN YOK. Hiçbir platform ilanı, tur, deneyim veya rezervasyon önerme; sorulursa şu an yayında ilan bulunmadığını dürüstçe söyle.';
  }
  const lines = items.slice(0, maxItems).map((l) => {
    const meta = [l.category, l.district].filter(Boolean).join(' – ');
    const price = l.price ? ` · ${l.price} ${l.currency || ''}`.trimEnd() : '';
    const dur = l.duration ? ` · ${l.duration}` : '';
    return `• ${l.title}${meta ? ` (${meta})` : ''}${price}${dur} [id:${l.id}]`;
  });
  const more = items.length > maxItems ? `\n(+${items.length - maxItems} ilan daha — ayrıntı için searchPublishedListings aracını kullan)` : '';
  return lines.join('\n') + more;
}
