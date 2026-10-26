import { rateLimit } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { KbsService, parsePassportMRZ } from '@/services/kbsService';

export async function POST(req: Request) {
  const limited = rateLimit(req, 'kbs-ocr', 20, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { image, base64Image, mimeType = 'image/jpeg', mrzText } = body;
    const rawImage = image || base64Image;

    if (!rawImage && !mrzText) {
      return NextResponse.json(
        { success: false, error: 'Pasaport görseli (image/base64Image) veya MRZ metni zorunludur.' },
        { status: 400 }
      );
    }

    let parsedData;
    if (mrzText) {
      parsedData = parsePassportMRZ(mrzText);
    }
    
    if (!parsedData && rawImage) {
      parsedData = await KbsService.processPassportWithDocumentAI(rawImage, mimeType);
    }

    return NextResponse.json({
      success: true,
      parsedData,
      record: parsedData, // Compatible with both DTO shapes
      message: 'Pasaport Google Document AI OCR ile başarıyla okundu.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
