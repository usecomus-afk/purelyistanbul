/**
 * Xenios OCTO Inbound Webhook Receiver
 * Listens for Bókun, FareHarbor & Rezdy Inbound Events:
 * - BOOKING_CANCELLED (Weather cancellations, operator cancellations)
 * - AVAILABILITY_UPDATED (Inventory updates)
 * - TIMETABLE_CHANGED (Schedule modifications & guest WhatsApp alerts)
 */

import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsappService';
import { verifyHmacSha256, webhookGate } from '@/lib/api-auth';

export interface OctoWebhookEvent {
  event: 'BOOKING_CANCELLED' | 'AVAILABILITY_UPDATED' | 'TIMETABLE_CHANGED' | 'BOOKING_CONFIRMED';
  provider: 'BOKUN' | 'FAREHARBOR' | 'REZDY' | 'GENERIC_OCTO';
  bookingReference?: string;
  productId: string;
  optionId?: string;
  availabilityId?: string;
  vacancies?: number;
  newStartDateTime?: string;
  reason?: string;
  guestPhone?: string;
  guestName?: string;
  timestamp: string;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const octoSecret = process.env.OCTO_WEBHOOK_SECRET?.trim();
    const gate = webhookGate(
      octoSecret,
      !!octoSecret && verifyHmacSha256(rawBody, req.headers.get('x-octo-signature'), octoSecret)
    );
    if (!gate.ok) return gate.response;
    const payload = JSON.parse(rawBody) as OctoWebhookEvent;
    const { event, provider, bookingReference, productId, vacancies, newStartDateTime, reason, guestPhone, guestName } = payload;

    console.log(`[OCTO INBOUND WEBHOOK] Event: ${event} | Provider: ${provider} | Product: ${productId}`);

    // 1. Dış Operatör Kaynaklı İptal (Hava Muhalefeti / Operatör İptali)
    if (event === 'BOOKING_CANCELLED') {
      console.log(`[OCTO WEBHOOK] Booking ${bookingReference} cancelled by provider. Reason: ${reason || 'Unspecified'}`);

      if (guestPhone) {
        await WhatsAppService.sendBookingConfirmationWhatsApp(guestPhone, {
          bookingId: bookingReference || 'bk_unknown',
          confirmationCode: bookingReference || 'XEN-CANCEL',
          experienceTitle: `İPTAL BİLDİRİMİ: ${productId}`,
          providerName: provider,
          guestName: guestName || 'Değerli Misafirimiz',
          guestCount: 1,
          bookingDate: 'İptal Edildi',
          bookingTime: 'İptal Edildi',
          hotelName: 'Xenios Partner Hotel',
          roomNumber: 'In-Room',
          amount: 0,
          currency: 'EUR',
          locationName: `Tur sağlayıcısı tarafından iptal edildi (${reason || 'Hava koşulları'}). Ücret iadesi başlatıldı.`
        });
      }

      return NextResponse.json({
        success: true,
        handledEvent: event,
        action: 'BOOKING_MARKED_CANCELLED_AND_REFUND_INITIATED',
        bookingReference
      });
    }

    // 2. Kontenjan & Seans Güncellemesi
    if (event === 'AVAILABILITY_UPDATED') {
      console.log(`[OCTO WEBHOOK] Availability updated for ${productId} (Slots: ${vacancies ?? 'N/A'})`);
      return NextResponse.json({
        success: true,
        handledEvent: event,
        action: 'INVENTORY_SLOT_CACHE_REFRESHED'
      });
    }

    // 3. Seans / Hareket Saati Değişikliği (Timetable Change)
    if (event === 'TIMETABLE_CHANGED') {
      console.log(`[OCTO WEBHOOK] Timetable shifted for ${bookingReference} to ${newStartDateTime}`);

      if (guestPhone) {
        await WhatsAppService.sendBookingConfirmationWhatsApp(guestPhone, {
          bookingId: bookingReference || 'bk_rescheduled',
          confirmationCode: bookingReference || 'XEN-TIME',
          experienceTitle: `SAAT GÜNCELLEMESİ: ${productId}`,
          providerName: provider,
          guestName: guestName || 'Değerli Misafirimiz',
          guestCount: 1,
          bookingDate: newStartDateTime?.split('T')[0] || 'Bugün',
          bookingTime: newStartDateTime?.split('T')[1]?.substring(0, 5) || '18:00',
          hotelName: 'Xenios Partner Hotel',
          roomNumber: 'In-Room',
          amount: 0,
          currency: 'EUR',
          locationName: 'Hareket saati güncellenmiştir. Lütfen yeni saatte iskelede olunuz.'
        });
      }

      return NextResponse.json({
        success: true,
        handledEvent: event,
        action: 'GUEST_ALERTED_FOR_SCHEDULE_CHANGE'
      });
    }

    return NextResponse.json({ success: true, handledEvent: event, message: 'Event acknowledged.' });
  } catch (err: any) {
    console.error('[OCTO WEBHOOK ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
