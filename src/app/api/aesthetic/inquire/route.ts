import { rateLimit } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { AestheticServiceEngine } from '@/services/aestheticService';

export async function POST(req: Request) {
  const limited = rateLimit(req, 'aes-inquire', 20, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { 
      clinic_id, 
      service_id, 
      guest_name, 
      guest_email, 
      guest_phone, 
      preferred_contact_method = 'WHATSAPP', 
      message, 
      hotel_id, 
      room_number 
    } = body;

    if (!clinic_id || !service_id || !guest_name || !guest_phone) {
      return NextResponse.json(
        { success: false, error: 'Lütfen Ad Soyad, Telefon/WhatsApp ve Klinik seçimini eksiksiz doldurunuz.' },
        { status: 400 }
      );
    }

    const result = await AestheticServiceEngine.processInquiryForm({
      clinic_id,
      service_id,
      guest_name,
      guest_email: guest_email || '',
      guest_phone,
      preferred_contact_method,
      message: message || '',
      hotel_id,
      room_number
    });

    return NextResponse.json({
      success: true,
      lead_id: result.lead_id,
      portalTrackingUrl: result.portalTrackingUrl,
      message: 'Talebiniz kliniğe iletildi. Detaylar WhatsApp/SMS ile tarafınıza gönderilmiştir.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const inquiries = AestheticServiceEngine.getInquiries();
  return NextResponse.json({ success: true, count: inquiries.length, inquiries });
}
