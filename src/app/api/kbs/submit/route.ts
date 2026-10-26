import { rateLimit, requireStaff } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { KbsService } from '@/services/kbsService';
import { KbsGuestRecord } from '@/types/kbs';

export async function POST(req: Request) {
  const limited = rateLimit(req, 'kbs-submit', 20, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json() as Partial<KbsGuestRecord>;

    if (!body.first_name || !body.last_name || !body.document_number) {
      return NextResponse.json(
        { success: false, error: 'Eksik kimlik bilgileri (Ad, Soyad, Belge No zorunludur).' },
        { status: 400 }
      );
    }

    const newRecord: KbsGuestRecord = {
      id: `kbs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hotel_id: body.hotel_id || 'hotel_pera',
      hotel_name: body.hotel_name || 'Pera Palace Hotel',
      room_number: body.room_number || '304',
      first_name: body.first_name.toUpperCase(),
      last_name: body.last_name.toUpperCase(),
      document_type: body.document_type || 'PASSPORT',
      document_number: body.document_number.toUpperCase(),
      nationality: body.nationality || 'TUR',
      birth_date: body.birth_date || '1990-01-01',
      gender: body.gender || 'UNKNOWN',
      check_in_date: body.check_in_date || new Date().toISOString().split('T')[0],
      check_out_date: body.check_out_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      created_source: 'GUEST_PWA',
      status: 'VERIFIED',
      document_image_url: body.document_image_url,
      created_at: new Date().toISOString()
    };

    const saved = KbsService.saveKbsRecord(newRecord);

    return NextResponse.json({
      success: true,
      record: saved,
      message: 'Online check-in ve kimlik bildirimi başarıyla tamamlandı.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Misafir kimlik kayıtları kişisel veridir: yalnızca otel personeli / yönetici.
  // Otel yöneticisi yalnızca kendi otelinin kayıtlarını görebilir.
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get('hotelId') || undefined;
  const staff = await requireStaff(req, requested);
  if (staff.denied) return staff.denied;
  const hotelId = staff.claims.role === 'hotel_manager' ? staff.claims.hotelId : requested;
  const records = KbsService.getKbsRecords(hotelId);
  return NextResponse.json({ success: true, count: records.length, records });
}
