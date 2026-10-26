import { NextResponse } from 'next/server';
import { ICalSyncService } from '@/services/icalSyncService';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import { InventoryEngine } from '@/services/inventoryEngine';
import type { ListingSlot } from '@/types/inventory';

function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(parseFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = parseFirestoreValue(v);
    }
    return out;
  }
  return val;
}

export async function GET(
  req: Request,
  props: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await props.params;
    const events: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      guestCount?: number;
      description?: string;
    }> = [];

    // Check if listingId is room-{hotelId}-{roomNumber}
    const roomMatch = listingId.match(/^room-(.+)-([^-]+)$/);
    if (roomMatch) {
      const hotelId = decodeURIComponent(roomMatch[1]);
      const roomNumber = decodeURIComponent(roomMatch[2]);

      try {
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/hotels/${encodeURIComponent(hotelId)}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const json = await res.json();
          if (json?.fields) {
            const hotelData = parseFirestoreValue({ mapValue: { fields: json.fields } });
            const rooms: any[] = Array.isArray(hotelData?.rooms) ? hotelData.rooms : [];
            const room = rooms.find((r) => String(r.number) === String(roomNumber));
            if (room) {
              // 1. Add calendarOverrides (booked or blocked dates)
              if (room.calendarOverrides && typeof room.calendarOverrides === 'object') {
                for (const [dateStr, ov] of Object.entries<any>(room.calendarOverrides)) {
                  if (ov && (ov.status === 'booked' || ov.status === 'blocked')) {
                    const startIso = `${dateStr}T14:00:00Z`;
                    const nextDay = new Date(`${dateStr}T00:00:00Z`);
                    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                    const endDateStr = nextDay.toISOString().slice(0, 10);
                    const endIso = `${endDateStr}T11:00:00Z`;
                    events.push({
                      id: `${hotelId}-${roomNumber}-${dateStr}`,
                      title:
                        ov.status === 'blocked'
                          ? `CLOSED - Birim ${roomNumber} (${ov.channel || 'Bloke'})`
                          : `RESERVED - ${ov.guestName || ov.channel || 'Purely Istanbul'} (Birim ${roomNumber})`,
                      startTime: startIso,
                      endTime: endIso,
                      description: `Purely Istanbul PMS Sync | Kanal: ${ov.channel || 'Direkt'}`,
                    });
                  }
                }
              }

              // 2. If room is currently occupied or reserved today, ensure today is in the feed
              if (room.status === 'occupied' || room.status === 'reserved') {
                const todayStr = new Date().toISOString().slice(0, 10);
                const alreadyHasToday = events.some((e) => e.startTime.startsWith(todayStr));
                if (!alreadyHasToday) {
                  const tomorrow = new Date();
                  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                  events.push({
                    id: `${hotelId}-${roomNumber}-live-${todayStr}`,
                    title: `RESERVED - ${room.guest || 'Active Guest'} (Birim ${roomNumber})`,
                    startTime: `${todayStr}T14:00:00Z`,
                    endTime: `${tomorrowStr}T11:00:00Z`,
                    description: 'Purely Istanbul Live PMS Occupancy',
                  });
                }
              }
            }
          }
        }
      } catch {}
    } else {
      // 2. Deneyim / Tur / İlan Entegrasyonu (experienceId / listingId)
      const db = getAdminDbOrNull();
      if (db) {
        try {
          // Kesinleşmiş rezervasyonları al
          const bookingsSnap = await db
            .collection('bookings')
            .where('experienceId', '==', listingId)
            .limit(100)
            .get();

          for (const doc of bookingsSnap.docs) {
            const b = doc.data();
            if (b.status === 'cancelled') continue;
            const dateStr = String(b.bookingDate || '').slice(0, 10);
            const timeStr = String(b.bookingTime || '12:00').slice(0, 5);
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              const startIso = `${dateStr}T${timeStr}:00Z`;
              const endIso = `${dateStr}T${timeStr}:00Z`;
              events.push({
                id: `xenios-bk-${doc.id}`,
                title: `RESERVED - ${b.guestName || 'Misafir'} (${b.guestCount || 1} Kişi)`,
                startTime: startIso,
                endTime: endIso,
                guestCount: Number(b.guestCount) || 1,
                description: `Purely Istanbul Rezervasyonu | Onay Kodu: ${b.confirmationCode} | Otel: ${b.hotelName || 'Partner Otel'}`,
              });
            }
          }

          // Bloke edilmiş veya dolmuş seansları al
          const slotsSnap = await db
            .collection('listing_slots')
            .where('listing_id', '==', listingId)
            .limit(100)
            .get();

          for (const doc of slotsSnap.docs) {
            const s = doc.data() as ListingSlot;
            if (s.status === 'closed' || s.status === 'sold_out') {
              events.push({
                id: `xenios-slot-${s.slot_id}`,
                title: s.status === 'closed' ? `BLOCKED - Kapalı (${s.closed_reason || 'Bloke'})` : 'SOLD OUT - Seans Dolu',
                startTime: s.start_time,
                endTime: s.end_time || s.start_time,
                description: `Purely Istanbul Envanter Durumu: ${s.status === 'closed' ? 'Kapatıldı' : 'Kontenjan Tükendi'}`,
              });
            }
          }
        } catch (e) {
          console.error('[export.ics] listing query error:', e);
        }
      }
    }

    const icsContent = ICalSyncService.generateICalFeed({
      listingId,
      listingTitle: `Purely Istanbul PMS #${listingId}`,
      events,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="purelyistanbul-${listingId}.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/channels/ical/[listingId]/export.ics
 * Fetches and parses an external OTA .ics URL (Airbnb, Booking.com, Expedia, VRBO)
 * and returns the list of blocked/booked YYYY-MM-DD date strings for self-service calendar sync.
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await props.params;
    const body = await req.json().catch(() => ({}));
    const feedUrl = String(body.feedUrl || '').trim();
    if (!feedUrl) {
      return NextResponse.json({ success: false, error: 'feedUrl gerekli' }, { status: 400 });
    }

    const importRes = await ICalSyncService.parseAndImportICalFeed(feedUrl, listingId);
    const blockedDates: string[] = [];

    for (const r of importRes.blockedRanges) {
      const startDate = new Date(r.start);
      const endDate = new Date(r.end);
      if (!Number.isNaN(startDate.getTime())) {
        const cur = new Date(startDate);
        let guard = 0;
        while (cur < endDate && guard < 60) {
          blockedDates.push(cur.toISOString().slice(0, 10));
          cur.setUTCDate(cur.getUTCDate() + 1);
          guard++;
        }
      }
    }

    const uniqueBlockedDates = Array.from(new Set(blockedDates));

    // Dış takvimden gelen dolu tarihleri Firestore listing_slots üzerinde bloke et
    if (listingId && uniqueBlockedDates.length > 0) {
      const db = getAdminDbOrNull();
      if (db) {
        try {
          const batch = db.batch();
          for (const dateStr of uniqueBlockedDates) {
            const slotId = InventoryEngine.formatSlotId(listingId, dateStr, '1200');
            const slotRef = db.collection('listing_slots').doc(slotId);
            batch.set(
              slotRef,
              {
                slot_id: slotId,
                listing_id: listingId,
                date: dateStr,
                time_slot: '12:00',
                start_time: `${dateStr}T00:00:00Z`,
                end_time: `${dateStr}T23:59:59Z`,
                capacity: 0,
                booked_count: 0,
                locked_count: 0,
                available_spots: 0,
                status: 'closed',
                closed_reason: 'OTA Dış Takvim Senkronizasyonu (Airbnb / Booking.com)',
                external_source: 'airbnb',
                version: 1,
                updated_at: new Date().toISOString(),
              },
              { merge: true }
            );
          }
          await batch.commit();
        } catch (e) {
          console.error('[export.ics] auto-block slots error:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      eventsCount: importRes.importedEventsCount,
      blockedDates: uniqueBlockedDates,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
