import { NextResponse } from 'next/server';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import { rateLimit } from '@/lib/api-auth';
import { InventoryEngine } from '@/services/inventoryEngine';

/**
 * Misafir rezervasyonunu SUNUCUDA kalıcı kaydeder (Firestore `bookings`).
 *
 * İstemci doğrudan yazamaz (firestore.rules: bookings write=false); bu uç nokta alanları doğrular,
 * atomik seans kontenjan denetimi yapar (çifte rezervasyon / overbooking engeli),
 * mevcut kaydın üzerine yazmayı reddeder ve kaydı `verified:false` işaretler.
 */

const str = (v: unknown, max: number, fallback = '') => String(v ?? fallback).trim().slice(0, max);

function bad(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'ops-bookings', 30, 60 * 1000);
  if (limited) return limited;
  const db = getAdminDbOrNull();
  if (!db) return bad('Sunucu veritabanı yapılandırılmamış.', 503);

  try {
    const b = await req.json();
    if (!b || typeof b !== 'object') return bad('Geçersiz gövde.');

    const experienceId = str(b.experienceId, 120);
    const guestName = str(b.guestName, 200);
    const hotelId = str(b.hotelId, 120);
    if (!experienceId || !guestName || !hotelId) return bad('experienceId, guestName ve hotelId zorunludur.');

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return bad('Geçersiz tutar.');
    const guestCount = Math.min(Math.max(Math.floor(Number(b.guestCount) || 1), 1), 500);
    const currency = /^[A-Za-z]{3}$/.test(String(b.currency ?? '')) ? String(b.currency).toUpperCase() : 'EUR';
    const status = ['payment_success', 'provider_pending'].includes(String(b.status)) ? String(b.status) : 'payment_success';

    const id = /^book-\d{10,16}$/.test(String(b.id ?? '')) ? String(b.id) : `book-${Date.now()}`;
    const confirmationCode = /^XEN-[A-Z0-9]{6}$/.test(String(b.confirmationCode ?? ''))
      ? String(b.confirmationCode)
      : 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const bookingDateStr = str(b.bookingDate, 60);
    const bookingTimeStr = str(b.bookingTime, 60);

    // Seans Kontenjan ve Overbooking Denetimi (Tarih belirtilmişse)
    let slotReservation: { slotId?: string; remainingSpots?: number } = {};
    if (bookingDateStr) {
      const slotRes = await InventoryEngine.directBookSlot({
        listingId: experienceId,
        date: bookingDateStr,
        timeSlot: bookingTimeStr || '12:00',
        guestCount,
        listingTitle: str(b.experienceTitle, 300),
      });

      if (!slotRes.success) {
        return NextResponse.json(
          {
            success: false,
            error: slotRes.error || 'INSUFFICIENT_CAPACITY',
            message: slotRes.message || 'Seçilen seans için yeterli kontenjan bulunmamaktadır.',
            remainingSpots: slotRes.remainingSpots,
          },
          { status: 409 }
        );
      }
      slotReservation = { slotId: slotRes.slotId, remainingSpots: slotRes.remainingSpots };
    }

    const doc = {
      id,
      confirmationCode,
      hotelId,
      hotelName: str(b.hotelName, 200),
      roomNumber: str(b.roomNumber, 40),
      experienceId,
      experienceTitle: str(b.experienceTitle, 300),
      providerName: str(b.providerName, 200),
      providerPhone: str(b.providerPhone, 60),
      guestName,
      guestPhone: str(b.guestPhone, 60),
      guestEmail: str(b.guestEmail, 320),
      guestCount,
      bookingDate: bookingDateStr,
      bookingTime: bookingTimeStr,
      slotId: slotReservation.slotId || null,
      amount,
      currency,
      status,
      calendarLink: str(b.calendarLink, 2000) || null,
      createdAt: new Date().toISOString(),
      source: 'guest_app',
      verified: false,
    };

    try {
      await db.collection('bookings').doc(id).create(doc); // var olan kaydın üzerine yazmaz
    } catch (err: any) {
      if (err?.code === 6 || /ALREADY_EXISTS/i.test(String(err?.message))) {
        return NextResponse.json({ success: true, id, confirmationCode, duplicate: true });
      }
      throw err;
    }
    return NextResponse.json({
      success: true,
      id,
      confirmationCode,
      slotId: slotReservation.slotId,
      remainingSpots: slotReservation.remainingSpots,
    });
  } catch (err) {
    console.error('[ops-bookings] error:', err);
    return bad('Rezervasyon kaydedilemedi.', 500);
  }
}
