import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { EInvoiceService, EInvoicePayloadDTO } from '@/services/eInvoiceService';

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const payload = await req.json() as EInvoicePayloadDTO;

    if (!payload.bookingId || !payload.customer || !payload.totalAmount) {
      return NextResponse.json({ success: false, error: 'Eksik fatura parametreleri.' }, { status: 400 });
    }

    const invoiceResult = await EInvoiceService.generateEInvoice(payload);

    return NextResponse.json(invoiceResult);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ success: false, error: 'bookingId parametresi zorunludur.' }, { status: 400 });
  }

  const invoice = EInvoiceService.getInvoiceByBooking(bookingId);
  if (!invoice) {
    return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, invoice });
}
