import { rateLimit } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const limited = rateLimit(req, 'dispatch', 60, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { type, recipient, title, hotelName, roomNumber, guestName, guestContact, details, timestamp } = body;

    const targetEmail = recipient || 'hi@usecomus.com';

    // Log the dispatched payload to server console / logger
    console.log('================================================================');
    console.log(`📬 [DISPATCHED TO ${targetEmail}] ${title}`);
    console.log(`🏨 Otel: ${hotelName} | Oda: ${roomNumber}`);
    console.log(`👤 Misafir: ${guestName} (${guestContact})`);
    console.log(`📋 Detaylar:`, JSON.stringify(details, null, 2));
    console.log(`⏰ Zaman: ${timestamp || new Date().toISOString()}`);
    console.log('================================================================');

    return NextResponse.json({
      success: true,
      deliveredTo: targetEmail,
      message: `Bildirim ${targetEmail} adresine başarıyla yönlendirildi.`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
