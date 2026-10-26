import { NextResponse } from 'next/server';
import { requireAdminOrCron } from '@/lib/api-auth';
import { InventoryEngine } from '@/services/inventoryEngine';

// Süresi dolan envanter kilitlerini serbest bırakır. Yalnızca zamanlanmış görev
// (Authorization: Bearer CRON_SECRET) veya yönetici çağırabilir.
export async function POST(req: Request) {
  const denied = await requireAdminOrCron(req);
  if (denied) return denied;

  try {
    const result = await InventoryEngine.releaseExpiredLocks();
    return NextResponse.json({
      success: true,
      releasedCount: result.releasedCount,
      expiredLockIds: result.expiredLockIds,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
