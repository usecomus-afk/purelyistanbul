import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsappService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();
    const sendLocationPin = Boolean(body.sendLocationPin);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const locationName = String(body.locationName || 'Purely Istanbul Partner Tesis');
    const locationAddress = String(body.locationAddress || 'İstanbul, Türkiye');

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Misafir telefon numarası ve mesaj metni zorunludur.' },
        { status: 400 }
      );
    }

    const textResult = await WhatsAppService.sendTextMessage(phone, message, true);

    let locationResult = null;
    if (
      textResult.success &&
      sendLocationPin &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude) &&
      latitude !== 0 &&
      longitude !== 0
    ) {
      locationResult = await WhatsAppService.sendLocationPinWhatsApp(
        phone,
        latitude,
        longitude,
        locationName,
        locationAddress
      );
    }

    return NextResponse.json({
      success: textResult.success,
      senderNumber: textResult.sender_number || '+90 850 308 59 06',
      textResult,
      locationResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'WhatsApp gönderim hatası' },
      { status: 500 }
    );
  }
}
