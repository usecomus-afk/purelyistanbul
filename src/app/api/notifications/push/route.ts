import { NextResponse } from 'next/server';
import { NotificationDispatcher, SmartNotificationRequest } from '@/services/notificationDispatcher';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SmartNotificationRequest;

    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: 'title ve body parametreleri zorunludur.' },
        { status: 400 }
      );
    }

    const result = await NotificationDispatcher.dispatchSmartNotification(body);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
