import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/api-auth';
import { KbsService } from '@/services/kbsService';

export async function POST(req: Request) {
  const staff = await requireStaff(req);
  if (staff.denied) return staff.denied;

  try {
    let retentionDays = 30;
    try {
      const body = await req.json();
      if (body && typeof body.retentionDays === 'number' && body.retentionDays > 0) {
        retentionDays = body.retentionDays;
      }
    } catch {
      /* body yoksa varsayılan 30 gün */
    }

    const result = KbsService.purgeExpiredKbsRecords(retentionDays);
    return NextResponse.json({
      success: true,
      purgedCount: result.purgedCount,
      purgedRecordIds: result.purgedRecordIds,
      message: `${retentionDays} günü geçen KBS misafir kayıtları ve pasaport görselleri KVKK uyarınca imha edildi.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // GET ile yıkıcı işlem tetiklenemez (prefetch/CSRF riski); yalnızca POST kabul edilir.
  return NextResponse.json({ success: false, error: 'Method not allowed. POST kullanın.' }, { status: 405 });
}
