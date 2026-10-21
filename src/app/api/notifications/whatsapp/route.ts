import { NextResponse } from 'next/server';
import {
  WhatsAppService,
  WhatsAppBookingDetailsDTO,
  WhatsAppGuestRequestAlertDTO,
} from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action = 'CONFIRMATION',
      phone,
      bookingDetails,
      requestAlert,
      location,
    } = body as {
      action?: 'CONFIRMATION' | 'LOCATION_PIN' | 'GUEST_REQUEST_ALERT' | 'TEST_ALERT';
      phone?: string | string[];
      bookingDetails?: WhatsAppBookingDetailsDTO;
      requestAlert?: WhatsAppGuestRequestAlertDTO;
      location?: {
        latitude: number;
        longitude: number;
        name: string;
        address?: string;
      };
    };

    if (action === 'GUEST_REQUEST_ALERT' || action === 'TEST_ALERT') {
      const alertData: WhatsAppGuestRequestAlertDTO = requestAlert || {
        requestId: `test-${Date.now()}`,
        hotelId: 'hotel-heritage-1',
        hotelName: 'Old City Comus',
        roomNumber: '101',
        serviceKey: 'test',
        serviceTitle: 'WhatsApp 0850 Bildirim Hattı Testi',
        notes: 'Comus +90 850 308 59 06 hattından misafir sipariş ve talep bildirimleri aktif olarak iletilmektedir.',
        department: 'Resepsiyon & Concierge',
        priority: 'standart',
      };
      const recipients = await WhatsAppService.resolveHotelRecipients(
        alertData.hotelId || 'hotel-heritage-1',
        phone
      );
      const res = await WhatsAppService.sendGuestRequestAlertWhatsApp(
        recipients,
        alertData
      );
      return NextResponse.json(res);
    }

    const singlePhone = Array.isArray(phone) ? phone[0] : phone;
    if (!singlePhone) {
      return NextResponse.json({ success: false, error: 'Telefon numarası zorunludur.' }, { status: 400 });
    }

    if (action === 'LOCATION_PIN' && location) {
      const res = await WhatsAppService.sendLocationPinWhatsApp(
        singlePhone,
        location.latitude,
        location.longitude,
        location.name,
        location.address
      );
      return NextResponse.json(res);
    }

    if (!bookingDetails) {
      return NextResponse.json({ success: false, error: 'Rezervasyon detayları eksik.' }, { status: 400 });
    }

    const res = await WhatsAppService.sendBookingConfirmationWhatsApp(singlePhone, bookingDetails);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

