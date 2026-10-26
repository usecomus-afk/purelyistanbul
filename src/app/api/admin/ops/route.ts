import { NextResponse } from 'next/server';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import { rateLimit, requireAdmin, verifyIdToken } from '@/lib/api-auth';
import {
  BOOKING_STATUSES,
  COMPLAINT_STATUSES,
  OPS_COLLECTION,
  REQUEST_STATUSES,
  buildSummary,
  queryOps,
  writeAudit,
  type OpsDoc,
  type OpsType,
} from '@/lib/ops-server';

/**
 * Yönetici operasyon API'si (YALNIZCA admin).
 *
 *  GET   /api/admin/ops?type=all|bookings|requests|complaints|leads|summary
 *        &from=YYYY-MM-DD&to=YYYY-MM-DD&hotelId=&status=&limit=&includeTest=1&format=csv
 *  PATCH /api/admin/ops  { kind: 'booking'|'request'|'complaint', id, status, note?, isPublicAlert? }
 *
 * Veri Firestore'dan (Admin SDK) okunur; tarayıcı yerel verisine bağımlı DEĞİLDİR.
 * Her durum değişikliği `ops_audit` koleksiyonuna denetim kaydı olarak yazılır.
 */

const LISTS: OpsType[] = ['bookings', 'requests', 'complaints', 'leads'];

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

// ---- CSV ---------------------------------------------------------------
const CSV_COLUMNS: Record<OpsType, Array<[string, string]>> = {
  bookings: [
    ['id', 'ID'], ['confirmationCode', 'Onay Kodu'], ['createdAt', 'Olusturma'], ['hotelName', 'Otel'], ['roomNumber', 'Oda'],
    ['experienceTitle', 'Deneyim'], ['providerName', 'Saglayici'], ['guestName', 'Misafir'], ['guestPhone', 'Telefon'],
    ['guestEmail', 'E-posta'], ['guestCount', 'Kisi'], ['bookingDate', 'Tarih'], ['bookingTime', 'Saat'],
    ['amount', 'Tutar'], ['currency', 'Para Birimi'], ['status', 'Durum'],
  ],
  requests: [
    ['id', 'ID'], ['createdAt', 'Olusturma'], ['updatedAt', 'Guncelleme'], ['hotelName', 'Otel'], ['roomNumber', 'Oda'],
    ['serviceTitle', 'Hizmet'], ['department', 'Departman'], ['priority', 'Oncelik'], ['status', 'Durum'],
    ['paymentMethod', 'Odeme Yontemi'], ['paymentStatus', 'Odeme Durumu'], ['paymentAmount', 'Tutar'], ['paymentCurrency', 'Para Birimi'],
    ['notes', 'Not'],
  ],
  complaints: [
    ['id', 'ID'], ['trackingCode', 'Takip Kodu'], ['createdAt', 'Olusturma'], ['businessName', 'Isletme'], ['businessCategory', 'Kategori'],
    ['amountPaid', 'Odenen'], ['amountExpected', 'Beklenen'], ['discrepancyAmount', 'Fark'], ['currency', 'Para Birimi'],
    ['guestName', 'Misafir'], ['hotelName', 'Otel'], ['status', 'Durum'], ['description', 'Aciklama'],
  ],
  leads: [
    ['id', 'ID'], ['createdAt', 'Olusturma'], ['propertyTitle', 'Gayrimenkul'], ['hotelName', 'Otel'], ['roomNumber', 'Oda'],
    ['guestName', 'Ad'], ['guestContact', 'Iletisim'], ['note', 'Not'],
  ],
};

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  // CSV / formül enjeksiyonuna karşı (Excel): tehlikeli önekleri etkisiz kıl.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(type: OpsType, items: OpsDoc[]): string {
  const cols = CSV_COLUMNS[type];
  const head = cols.map(([, label]) => csvCell(label)).join(';');
  const rows = items.map((d) => cols.map(([k]) => csvCell(d[k])).join(';'));
  return '\uFEFF' + [head, ...rows].join('\r\n');
}

// ---- GET ---------------------------------------------------------------
export async function GET(req: Request) {
  const limited = rateLimit(req, 'admin-ops', 120, 60 * 1000);
  if (limited) return limited;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!getAdminDbOrNull()) return fail('Sunucu veritabanı yapılandırılmamış.', 503);

  try {
    const sp = new URL(req.url).searchParams;
    const type = (sp.get('type') || 'all') as OpsType | 'all' | 'summary';
    const query = {
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      hotelId: sp.get('hotelId') || undefined,
      status: sp.get('status') || undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      includeTest: sp.get('includeTest') === '1',
    };

    if (sp.get('format') === 'csv') {
      if (!LISTS.includes(type as OpsType)) return fail('CSV için type=bookings|requests|complaints|leads gerekli.');
      const { items } = await queryOps(type as OpsType, query);
      return new NextResponse(toCsv(type as OpsType, items), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="purelyistanbul-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (LISTS.includes(type as OpsType)) {
      const { items, truncated } = await queryOps(type as OpsType, query);
      return NextResponse.json({ success: true, type, count: items.length, truncated, items });
    }

    // all | summary: dört listeyi paralel çek
    const [b, r, c, l] = await Promise.all(LISTS.map((t) => queryOps(t, query)));
    const data = { bookings: b.items, requests: r.items, complaints: c.items, leads: l.items };
    const summary = buildSummary(data);
    if (type === 'summary') return NextResponse.json({ success: true, summary });
    return NextResponse.json({
      success: true,
      ...data,
      summary,
      truncated: { bookings: b.truncated, requests: r.truncated, complaints: c.truncated, leads: l.truncated },
    });
  } catch (err: any) {
    console.error('[admin-ops] GET error:', err);
    return fail('Operasyon verisi okunamadı.', 500);
  }
}

// ---- PATCH -------------------------------------------------------------
export async function PATCH(req: Request) {
  const limited = rateLimit(req, 'admin-ops-write', 60, 60 * 1000);
  if (limited) return limited;
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = getAdminDbOrNull();
  if (!db) return fail('Sunucu veritabanı yapılandırılmamış.', 503);

  try {
    const body = await req.json();
    const kind = String(body.kind || '') as 'booking' | 'request' | 'complaint';
    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    const note = body.note !== undefined ? String(body.note).slice(0, 2000) : undefined;

    const map = {
      booking: { type: 'bookings' as OpsType, allowed: BOOKING_STATUSES as readonly string[] },
      request: { type: 'requests' as OpsType, allowed: REQUEST_STATUSES as readonly string[] },
      complaint: { type: 'complaints' as OpsType, allowed: COMPLAINT_STATUSES as readonly string[] },
    }[kind];
    if (!map) return fail('Geçersiz kind (booking | request | complaint).');
    if (!id || id.length > 200 || id.includes('/')) return fail('Geçersiz id.');
    if (!map.allowed.includes(status)) return fail(`Geçersiz durum. İzinli: ${map.allowed.join(', ')}`);

    const ref = db.collection(OPS_COLLECTION[map.type]).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return fail('Kayıt bulunamadı.', 404);
    const before = snap.data() as Record<string, any>;

    const patch: Record<string, any> = { status, updatedAt: new Date().toISOString() };
    if (kind === 'request') patch.stage = status; // oda talebi aşaması durumla eşit tutulur
    if (kind === 'complaint') {
      if (note !== undefined) patch.businessResponse = note;
      if (typeof body.isPublicAlert === 'boolean') patch.isPublicAlert = body.isPublicAlert;
    }
    await ref.update(patch);

    const decoded = await verifyIdToken(req);
    await writeAudit({
      actor: decoded?.email || decoded?.uid || 'admin',
      actorRole: String(decoded?.role || 'admin'),
      action: 'status_change',
      type: kind,
      id,
      from: before.status ?? null,
      to: status,
      note,
    });

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    console.error('[admin-ops] PATCH error:', err);
    return fail('Durum güncellenemedi.', 500);
  }
}
