import { NextResponse } from 'next/server';

const FIRESTORE_REQUESTS_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents/service_requests';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  const action = (searchParams.get('action') || 'complete').toLowerCase();

  if (!id) {
    return new NextResponse('Geçersiz talep bağlantısı.', { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const newStatus = action === 'cancel' ? 'cancelled' : 'completed';
  const statusTitle = newStatus === 'completed' ? 'Tamamlandı Olarak İşaretlendi' : 'İptal Edildi';
  const badgeColor = newStatus === 'completed' ? '#10b981' : '#ef4444';
  const icon = newStatus === 'completed' ? '✅' : '❌';

  let roomNumber = '';
  let serviceTitle = '';
  let hotelName = 'Purely Istanbul';

  try {
    const existingRes = await fetch(`${FIRESTORE_REQUESTS_BASE_URL}/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (existingRes.ok) {
      const existingDoc = await existingRes.json();
      const fields = existingDoc?.fields || {};
      roomNumber = fields.roomNumber?.stringValue || '';
      serviceTitle = fields.serviceTitle?.stringValue || '';
      hotelName = fields.hotelName?.stringValue || 'Purely Istanbul';

      fields.status = { stringValue: newStatus };
      fields.stage = { stringValue: newStatus };
      fields.updatedAt = { stringValue: nowIso };

      await fetch(
        `${FIRESTORE_REQUESTS_BASE_URL}/${encodeURIComponent(id)}?updateMask.fieldPaths=status&updateMask.fieldPaths=stage&updateMask.fieldPaths=updatedAt`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        }
      );
    }
  } catch (e) {
    console.warn('[QuickAction] Firestore update warning:', e);
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Talep Güncellendi | ${hotelName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(245, 215, 130, 0.14);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(230, 185, 75, 0.5);
      border-radius: 20px;
      max-width: 420px;
      width: 100%;
      padding: 28px 22px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 18px;
      font-size: 32px;
      background: ${badgeColor}22;
      border: 1px solid ${badgeColor}66;
      margin-bottom: 16px;
    }
    h2 { margin: 0 0 8px; font-size: 20px; color: #fef3c7; }
    p { margin: 0 0 18px; font-size: 14px; color: #cbd5e1; line-height: 1.5; }
    .details {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(230, 185, 75, 0.3);
      border-radius: 14px;
      padding: 14px;
      text-align: left;
      font-size: 13px;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      padding: 13px 18px;
      border-radius: 12px;
      background: #f59e0b;
      color: #0f172a;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${icon}</div>
    <h2>Misafir Talebi ${statusTitle}</h2>
    <p>Canlı Misafir Talepleri panosundaki durum otomatik olarak güncellendi.</p>
    <div class="details">
      <div><strong>Tesis:</strong> ${hotelName}</div>
      ${roomNumber ? `<div><strong>Birim:</strong> ${roomNumber}</div>` : ''}
      ${serviceTitle ? `<div><strong>Hizmet / Sipariş:</strong> ${serviceTitle}</div>` : ''}
      <div><strong>Talep Kodu:</strong> #${id.slice(-6)}</div>
    </div>
    <a class="btn" href="/hotel-portal/requests">Canlı Misafir Talepleri Panosunu Aç</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
