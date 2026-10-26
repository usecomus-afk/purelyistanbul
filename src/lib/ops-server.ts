/**
 * SUNUCU TARAFI operasyon veri katmanı (Admin SDK). Yalnızca route handler'larda kullanın.
 *
 * Rezervasyon, oda talebi, şikayet ve yatırım talebi (lead) verisini Firestore'dan okur,
 * normalize eder, özet (KPI) üretir ve yönetici durum güncellemelerini denetim kaydıyla yazar.
 */
import { getAdminDbOrNull } from '@/lib/firebase-admin';

export type OpsType = 'bookings' | 'requests' | 'complaints' | 'leads';

export const OPS_COLLECTION: Record<OpsType, string> = {
  bookings: 'bookings',
  requests: 'service_requests',
  complaints: 'complaints',
  leads: 'investment_leads',
};

export const BOOKING_STATUSES = ['payment_success', 'provider_pending', 'confirmed', 'cancelled'] as const;
export const REQUEST_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const COMPLAINT_STATUSES = ['under_review', 'contacted_business', 'resolved_refunded', 'published_blacklisted'] as const;
export const AUDIT_COLLECTION = 'ops_audit';

export type OpsDoc = Record<string, any> & { id: string; createdAt?: string };

export interface OpsQuery {
  from?: string; // ISO tarih (dahil)
  to?: string; // ISO tarih (dahil, gün sonu)
  hotelId?: string;
  status?: string;
  limit?: number;
  includeTest?: boolean;
}

/** Firestore Timestamp / iç içe değerleri JSON'a uygun hale getirir. */
export function normalizeValue(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v.toDate === 'function') {
    try {
      return v.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (typeof v === 'object') {
    const o: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) o[k] = normalizeValue(val);
    return o;
  }
  return v;
}

/** Test / demo / sistem kayıtlarını (raporları kirletmesin diye) ayıklar. */
export function isTestOrSystemDoc(d: OpsDoc): boolean {
  const id = String(d.id || '');
  if (id.startsWith('demo-pushsub')) return true; // push abonelik kayıt belgesi, talep değil
  if (d.isDemo === true) return true;
  return /^(req-)?(full)?test|^demo-|-test-|^req-test|^req-fulltest/i.test(id);
}

function endOfDay(iso: string): string {
  // YYYY-MM-DD verilirse gün sonuna çek.
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T23:59:59.999Z` : iso;
}

export async function queryOps(type: OpsType, q: OpsQuery = {}): Promise<{ items: OpsDoc[]; truncated: boolean }> {
  const db = getAdminDbOrNull();
  if (!db) throw new Error('admin_db_unavailable');
  const cap = Math.min(Math.max(Number(q.limit) || 1000, 1), 2000);

  const col = db.collection(OPS_COLLECTION[type]);
  let docs: FirebaseFirestore.QueryDocumentSnapshot[];
  try {
    const snap = await col.orderBy('createdAt', 'desc').limit(cap + 1).get();
    docs = snap.docs;
  } catch {
    // createdAt alanı olmayan / dizinsiz durumlarda sırasız oku, bellekte sırala.
    const snap = await col.limit(cap + 1).get();
    docs = snap.docs;
  }
  const truncated = docs.length > cap;

  let items: OpsDoc[] = docs.slice(0, cap).map((d) => ({ id: d.id, ...(normalizeValue(d.data()) as object) } as OpsDoc));

  if (!q.includeTest) items = items.filter((d) => !isTestOrSystemDoc(d));
  if (q.hotelId) items = items.filter((d) => d.hotelId === q.hotelId);
  if (q.status) items = items.filter((d) => d.status === q.status);
  if (q.from) items = items.filter((d) => (d.createdAt || '') >= q.from!);
  if (q.to) {
    const to = endOfDay(q.to);
    items = items.filter((d) => (d.createdAt || '') <= to);
  }
  items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return { items, truncated };
}

// ---------------------------------------------------------------------------
// ÖZET (KPI)
// ---------------------------------------------------------------------------
function inc(map: Record<string, number>, key: string, by = 1) {
  map[key] = (map[key] || 0) + by;
}
const day = (iso?: string) => (iso || '').slice(0, 10);

export function buildSummary(data: {
  bookings: OpsDoc[];
  requests: OpsDoc[];
  complaints: OpsDoc[];
  leads: OpsDoc[];
}) {
  const { bookings, requests, complaints, leads } = data;

  // --- Rezervasyonlar
  const bByStatus: Record<string, number> = {};
  const revenue: Record<string, number> = {};
  const bHotel: Record<string, { hotelId: string; hotelName: string; count: number; revenue: number }> = {};
  const bDay: Record<string, { date: string; count: number; revenue: number }> = {};
  const bExp: Record<string, { id: string; title: string; count: number; revenue: number }> = {};
  for (const b of bookings) {
    inc(bByStatus, String(b.status || 'unknown'));
    const counted = b.status !== 'cancelled';
    const amt = counted ? Number(b.amount) || 0 : 0;
    const cur = String(b.currency || 'EUR');
    if (counted) revenue[cur] = (revenue[cur] || 0) + amt;
    const hk = String(b.hotelId || '-');
    bHotel[hk] ||= { hotelId: hk, hotelName: String(b.hotelName || hk), count: 0, revenue: 0 };
    bHotel[hk].count += 1;
    bHotel[hk].revenue += amt;
    const dk = day(b.createdAt) || '-';
    bDay[dk] ||= { date: dk, count: 0, revenue: 0 };
    bDay[dk].count += 1;
    bDay[dk].revenue += amt;
    const ek = String(b.experienceId || b.experienceTitle || '-');
    bExp[ek] ||= { id: ek, title: String(b.experienceTitle || ek), count: 0, revenue: 0 };
    bExp[ek].count += 1;
    bExp[ek].revenue += amt;
  }

  // --- Oda talepleri
  const rByStatus: Record<string, number> = {};
  const rService: Record<string, { key: string; title: string; count: number }> = {};
  const rHotel: Record<string, { hotelId: string; hotelName: string; count: number }> = {};
  const rDay: Record<string, { date: string; count: number }> = {};
  let resolvedMs = 0;
  let resolvedN = 0;
  for (const r of requests) {
    inc(rByStatus, String(r.status || 'unknown'));
    const sk = String(r.serviceKey || '-');
    rService[sk] ||= { key: sk, title: String(r.serviceTitle || sk), count: 0 };
    rService[sk].count += 1;
    const hk = String(r.hotelId || '-');
    rHotel[hk] ||= { hotelId: hk, hotelName: String(r.hotelName || hk), count: 0 };
    rHotel[hk].count += 1;
    const dk = day(r.createdAt) || '-';
    rDay[dk] ||= { date: dk, count: 0 };
    rDay[dk].count += 1;
    if (r.status === 'completed' && r.createdAt && r.updatedAt) {
      const ms = Date.parse(r.updatedAt) - Date.parse(r.createdAt);
      if (Number.isFinite(ms) && ms >= 0) {
        resolvedMs += ms;
        resolvedN += 1;
      }
    }
  }

  // --- Şikayetler
  const cByStatus: Record<string, number> = {};
  const cCat: Record<string, number> = {};
  const discrepancy: Record<string, number> = {};
  for (const c of complaints) {
    inc(cByStatus, String(c.status || 'unknown'));
    inc(cCat, String(c.businessCategory || '-'));
    const cur = String(c.currency || 'TRY');
    discrepancy[cur] = (discrepancy[cur] || 0) + (Number(c.discrepancyAmount) || 0);
  }
  const closedComplaintStates = new Set(['resolved_refunded', 'published_blacklisted']);
  const openComplaints = complaints.filter((c) => !closedComplaintStates.has(String(c.status))).length;

  // --- Lead'ler
  const lProp: Record<string, { propertyId: string; title: string; count: number }> = {};
  for (const l of leads) {
    const pk = String(l.propertyId || '-');
    lProp[pk] ||= { propertyId: pk, title: String(l.propertyTitle || pk), count: 0 };
    lProp[pk].count += 1;
  }

  const byCountDesc = <T extends { count: number }>(o: Record<string, T>, n = 10) =>
    Object.values(o).sort((a, b) => b.count - a.count).slice(0, n);
  const byDateAsc = <T extends { date: string }>(o: Record<string, T>) =>
    Object.values(o).sort((a, b) => a.date.localeCompare(b.date));

  return {
    generatedAt: new Date().toISOString(),
    bookings: {
      total: bookings.length,
      byStatus: bByStatus,
      revenueByCurrency: revenue,
      byHotel: byCountDesc(bHotel),
      byDay: byDateAsc(bDay),
      topExperiences: byCountDesc(bExp),
    },
    requests: {
      total: requests.length,
      byStatus: rByStatus,
      open: (rByStatus.pending || 0) + (rByStatus.in_progress || 0),
      byService: byCountDesc(rService),
      byHotel: byCountDesc(rHotel),
      byDay: byDateAsc(rDay),
      avgResolutionMinutes: resolvedN ? Math.round(resolvedMs / resolvedN / 60000) : null,
    },
    complaints: {
      total: complaints.length,
      open: openComplaints,
      byStatus: cByStatus,
      byCategory: cCat,
      discrepancyByCurrency: discrepancy,
    },
    leads: { total: leads.length, byProperty: byCountDesc(lProp) },
  };
}

// ---------------------------------------------------------------------------
// DENETİM KAYDI
// ---------------------------------------------------------------------------
export async function writeAudit(entry: {
  actor: string;
  actorRole: string;
  action: string;
  type: string;
  id: string;
  from?: unknown;
  to?: unknown;
  note?: string;
}) {
  const db = getAdminDbOrNull();
  if (!db) return;
  try {
    // Firestore `undefined` değerleri reddeder: tanımsız alanları ayıkla.
    const clean = Object.fromEntries(
      Object.entries({ ...entry, at: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    );
    await db.collection(AUDIT_COLLECTION).add(clean);
  } catch (err) {
    console.error('[ops-audit] yazılamadı:', err);
  }
}
