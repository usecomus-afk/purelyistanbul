import { NextResponse } from 'next/server';
import { KbsService } from '@/services/kbsService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xml';
    const hotelId = searchParams.get('hotelId') || 'hotel_pera';
    const facilityCode = searchParams.get('facilityCode') || 'EGM_34_PERA';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvData = KbsService.exportKbsBatchCsv(hotelId);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="kbs-egm-export-${date}.csv"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const xmlData = KbsService.exportKbsBatchXml(hotelId, facilityCode, date);
    return new NextResponse(xmlData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="kbs-egm-export-${date}.xml"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
