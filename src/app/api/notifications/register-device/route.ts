import { NextResponse } from 'next/server';
import { NotificationDispatcher, UserDeviceDTO } from '@/services/notificationDispatcher';
import { VAPID_PUBLIC_KEY } from '@/lib/vapid-keys';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<UserDeviceDTO>;
    const token = body.webPushSubscription?.endpoint || body.deviceToken;

    if (!token || !body.platform) {
      return NextResponse.json(
        { success: false, error: 'deviceToken (veya webPushSubscription) ve platform parametreleri zorunludur.' },
        { status: 400 }
      );
    }

    const result = await NotificationDispatcher.registerDevice({
      deviceToken: token,
      platform: body.platform,
      userId: body.userId,
      role: body.role || 'guest',
      hotelId: body.hotelId,
      roomNumber: body.roomNumber,
      phone: body.phone,
      webPushSubscription: body.webPushSubscription,
      lastActive: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cihaz başarıyla Web Push / FCM / APNs bildirim servisine kaydedildi.',
      totalRegisteredDevices: result.deviceCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const devices = await NotificationDispatcher.getRegisteredDevices();
  return NextResponse.json({
    success: true,
    vapidPublicKey: VAPID_PUBLIC_KEY,
    count: devices.length,
    devices,
  });
}
