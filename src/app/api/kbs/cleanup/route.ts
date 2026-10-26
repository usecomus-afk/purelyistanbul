import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/api-auth';
import { KbsService } from '@/services/kbsService';

export async function POST(req: Request) {
  const staff = await requireStaff(req);
  if (staff.denied) return staff.denied;

  try {
    const result = KbsService.purgeExpiredKbsRecords(30);
    return NextResponse.json({
      success: true,
      purgedCount: result.purgedCount,
      purgedRecordIds: result.purgedRecordIds,
      message: '30 günü geçen KBS misafir kayıtları ve pasaport görselleri KVKK uyarınca imha edildi.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // GET ile yıkıcı işlem tetiklenemez (prefetch/CSRF riski); yalnızca POST kabul edilir.
  return NextResponse.json({ success: false, error: 'Method not allowed. POST kullanın.' }, { status: 405 });
}
