import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { InventoryEngine } from '@/services/inventoryEngine';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import type { ListingSlot } from '@/types/inventory';

/**
 * GET /api/admin/inventory/slots?listingId=...
 * Bir ilana ait tüm seansları ve canlı kontenjan doluluklarını listeler.
 */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return NextResponse.json({ success: false, error: 'listingId parametresi zorunludur.' }, { status: 400 });
  }

  try {
    const slots = await InventoryEngine.getSlotsByListing(listingId);
    return NextResponse.json({ success: true, listingId, slots });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/inventory/slots
 * Toplu seans üretimi (Örn: Seçili tarih aralığı, saatler ve kontenjan kapasitesi).
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { listingId, dates, timeSlots, capacity = 10 } = body as {
      listingId: string;
      dates: string[];
      timeSlots: string[];
      capacity: number;
    };

    if (!listingId || !Array.isArray(dates) || dates.length === 0 || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'listingId, dates (dizi) ve timeSlots (dizi) zorunludur.'
      }, { status: 400 });
    }

    const created = await InventoryEngine.bulkCreateSlots({
      listingId,
      dates,
      timeSlots,
      capacity: Math.max(1, Number(capacity) || 10)
    });

    return NextResponse.json({
      success: true,
      message: `${created.length} adet seans başarıyla oluşturuldu.`,
      count: created.length,
      slots: created
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/inventory/slots
 * Tek bir seansı güncelleme (Kapatma/Bloke, Yeniden Açma, Kapasite Değiştirme).
 */
export async function PATCH(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { slotId, status, closedReason, capacity } = body as {
      slotId: string;
      status?: 'open' | 'closed';
      closedReason?: string;
      capacity?: number;
    };

    if (!slotId) {
      return NextResponse.json({ success: false, error: 'slotId zorunludur.' }, { status: 400 });
    }

    const db = getAdminDbOrNull();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Veritabanı erişimi yok.' }, { status: 503 });
    }

    const slotRef = db.collection('listing_slots').doc(slotId);
    const snap = await slotRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Seans bulunamadı.' }, { status: 404 });
    }

    const current = snap.data() as ListingSlot;
    const updates: Partial<ListingSlot> = {
      updated_at: new Date().toISOString(),
      version: (current.version || 1) + 1
    };

    if (status) {
      updates.status = status;
      if (status === 'closed') {
        updates.closed_reason = closedReason || 'Yönetici tarafından kapatıldı';
      } else {
        updates.closed_reason = undefined;
      }
    }

    if (capacity !== undefined) {
      const capNum = Math.max(1, Number(capacity) || 1);
      updates.capacity = capNum;
      updates.available_spots = Math.max(0, capNum - ((current.booked_count || 0) + (current.locked_count || 0)));
      if (updates.available_spots === 0 && updates.status !== 'closed') {
        updates.status = 'sold_out';
      }
    }

    await slotRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Seans güncellendi.',
      slotId,
      updates
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
