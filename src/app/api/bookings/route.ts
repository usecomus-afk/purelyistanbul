import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      experienceId,
      experienceTitle,
      hotelId = 'hotel-heritage-1',
      hotelName = 'Old City Comus',
      roomNumber = '101',
      guestName = 'Misafir',
      guestPhone,
      guestEmail,
      guestCount = 1,
      bookingDate = 'Bugün',
      bookingTime = 'Şimdi',
      amount = 0,
      currency = 'EUR',
    } = body;

    const confirmationCode = 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingId = `book-${Date.now()}`;

    const recipients = await WhatsAppService.resolveHotelRecipients(hotelId);
    const whatsappResult = await WhatsAppService.sendGuestRequestAlertWhatsApp(recipients, {
      requestId: bookingId,
      hotelId,
      hotelName,
      roomNumber: String(roomNumber),
      serviceKey: 'experience_booking',
      serviceTitle: `Deneyim Rezervasyonu: ${experienceTitle || experienceId || 'İstanbul Deneyimi'}`,
      notes: `Misafir: ${guestName} (${guestCount} Kişi)${guestPhone ? ` · Tel: ${guestPhone}` : ''}${guestEmail ? ` · ${guestEmail}` : ''} · Tarih: ${bookingDate} ${bookingTime} · Kod: ${confirmationCode}`,
      department: 'Concierge & Rezervasyon',
      priority: 'standart',
      paymentAmount: Number(amount || 0),
      paymentCurrency: currency,
      paymentMethod: 'online_card',
      paymentStatus: 'paid_online',
      paymentReference: confirmationCode,
    });

    if (guestPhone) {
      WhatsAppService.sendBookingConfirmationWhatsApp(guestPhone, {
        bookingId,
        confirmationCode,
        experienceTitle: experienceTitle || experienceId || 'Purely Istanbul Deneyimi',
        providerName: 'Purely Istanbul Concierge',
        guestName,
        guestCount: Number(guestCount || 1),
        bookingDate,
        bookingTime,
        hotelName,
        roomNumber: String(roomNumber),
        amount: Number(amount || 0),
        currency,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      bookingId,
      confirmationCode,
      whatsappResult,
      message: 'Ödeme başarıyla tamamlandı. Sağlayıcıya ve otele WhatsApp bildirimi iletildi.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
