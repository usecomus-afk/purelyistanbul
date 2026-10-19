import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/services/whatsappService';

const FIRESTORE_BASE_URL =
  'https://firestore.googleapis.com/v1/projects/xenios-prod-c55cd/databases/(default)/documents';
const FIRESTORE_REQUESTS_URL = `${FIRESTORE_BASE_URL}/service_requests`;

const VERIFY_TOKENS = new Set([
  process.env.WHATSAPP_VERIFY_TOKEN || '',
  'rezervasyon_webhook_token',
  'purelyistanbul_webhook_token',
  'xenios_webhook_token',
]);

interface ParsedServiceRequest {
  docName: string;
  id: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  serviceTitle: string;
  status: string;
  stage: string;
  createdAt: string;
  whatsappMessageId: string;
}

function parseFirestoreDoc(doc: any): ParsedServiceRequest | null {
  if (!doc || !doc.fields) return null;
  const f = doc.fields;
  const docName = String(doc.name || '');
  const idFromPath = docName.split('/').pop() || '';
  return {
    docName,
    id: f.id?.stringValue || idFromPath,
    hotelId: f.hotelId?.stringValue || 'hotel-heritage-1',
    hotelName: f.hotelName?.stringValue || 'Purely Istanbul Partner',
    roomNumber: f.roomNumber?.stringValue || '101',
    serviceTitle: f.serviceTitle?.stringValue || 'Misafir Talebi',
    status: f.status?.stringValue || 'pending',
    stage: f.stage?.stringValue || 'pending',
    createdAt: f.createdAt?.stringValue || doc.createTime || '',
    whatsappMessageId: f.whatsappMessageId?.stringValue || '',
  };
}

async function fetchRecentServiceRequests(): Promise<ParsedServiceRequest[]> {
  const list: ParsedServiceRequest[] = [];

  try {
    const queryRes = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'service_requests' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 60,
        },
      }),
    });

    if (queryRes.ok) {
      const rows = await queryRes.json();
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const parsed = parseFirestoreDoc(row?.document);
          if (parsed) list.push(parsed);
        }
      }
    }
  } catch {
    // Fallback to simple collection GET below
  }

  if (list.length === 0) {
    try {
      const res = await fetch(`${FIRESTORE_REQUESTS_URL}?pageSize=100`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const docs = Array.isArray(data?.documents) ? data.documents : [];
        for (const doc of docs) {
          const parsed = parseFirestoreDoc(doc);
          if (parsed) list.push(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }

  list.sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  return list;
}

async function markServiceRequestCompleted(
  reqId: string,
  senderPhone: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const queryParams = [
    'updateMask.fieldPaths=status',
    'updateMask.fieldPaths=stage',
    'updateMask.fieldPaths=updatedAt',
    'updateMask.fieldPaths=approvedViaWhatsAppBy',
  ].join('&');

  const url = `${FIRESTORE_REQUESTS_URL}/${encodeURIComponent(reqId)}?${queryParams}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        status: { stringValue: 'completed' },
        stage: { stringValue: 'completed' },
        updatedAt: { stringValue: nowIso },
        approvedViaWhatsAppBy: { stringValue: senderPhone },
      },
    }),
  });

  return res.ok;
}

function isApprovalMessage(rawText: string): {
  approved: boolean;
  extractedCode?: string;
} {
  const cleaned = String(rawText || '').trim();
  if (!cleaned) return { approved: false };

  // Ignore pure numeric restaurant reservation commands like "ONAY 142" or "RED 142" unless it has a #code
  if (/^(onay|red)\s+\d+$/i.test(cleaned)) {
    return { approved: false };
  }

  // Extract optional #CODE (e.g. #8A4F12)
  const codeMatch = cleaned.match(/#([A-Za-z0-9]{4,8})/);
  const extractedCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;

  const normalized = cleaned
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const approvalRegex =
    /\b(ok|okay|okey|tamam|tamamdir|tamamdır|tamamlandi|tamamlandı|onay|onaylandi|onaylandı|onayliyorum|onaylıyorum|evet|hazir|hazır|alindi|alındı|teslim|yapildi|yapıldı)\b/i;

  const emojiApproval = /^(👍|✅|👌|🙏|✔️)+$/.test(cleaned);

  if (approvalRegex.test(normalized) || emojiApproval || Boolean(extractedCode)) {
    return { approved: true, extractedCode };
  }

  return { approved: false };
}

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp Cloud API Webhook Verification
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token') || '';
  const challenge = searchParams.get('hub.challenge') || '';

  if (mode === 'subscribe' && VERIFY_TOKENS.has(token)) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ status: 'error', message: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Handles incoming WhatsApp replies ("ok", "tamam", "ok, tamam", etc.) from hotel managers/staff
 * and marks the corresponding guest request as completed in Firestore.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    const processed: Array<{
      requestId: string;
      roomNumber: string;
      serviceTitle: string;
      senderPhone: string;
    }> = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const statuses = Array.isArray(value?.statuses) ? value.statuses : [];
        for (const st of statuses) {
          if (st?.status === 'failed') {
            const errs = Array.isArray(st?.errors) ? st.errors : [];
            console.error(
              `[WHATSAPP DELIVERY FAILED] to=${st?.recipient_id} wamid=${st?.id}`,
              errs.map((e: any) => `${e?.code} ${e?.title} — ${e?.error_data?.details || e?.message || ''}`).join(' | ')
            );
          }
        }
        const messages = Array.isArray(value?.messages) ? value.messages : [];

        for (const msg of messages) {
          const senderPhone = String(msg?.from || '');
          const msgType = String(msg?.type || '');
          const contextWamid = String(msg?.context?.id || '');

          let textBody = '';
          if (msgType === 'text') {
            textBody = String(msg?.text?.body || '');
          } else if (msgType === 'button') {
            textBody = String(msg?.button?.text || msg?.button?.payload || '');
          } else if (msgType === 'interactive') {
            textBody = String(
              msg?.interactive?.button_reply?.title ||
                msg?.interactive?.list_reply?.title ||
                ''
            );
          }

          const { approved, extractedCode } = isApprovalMessage(textBody);
          if (!approved) {
            if (/^(onay|approve|red|reject)[\s\-_:]*\d+$/i.test(textBody.trim())) {
              await fetch('https://usecomus.com/api/webhooks/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              }).catch(() => {});
            }
            continue;
          }

          const recentRequests = await fetchRecentServiceRequests();
          if (recentRequests.length === 0) {
            continue;
          }

          let targetRequest: ParsedServiceRequest | undefined;

          // 1. Match by quoted WhatsApp message ID (if the user swiped/replied to a specific alert)
          if (contextWamid) {
            targetRequest = recentRequests.find(
              (r) => r.whatsappMessageId && r.whatsappMessageId === contextWamid
            );
          }

          // 2. Match by #SHORTCODE if provided in the reply text
          if (!targetRequest && extractedCode) {
            targetRequest = recentRequests.find((r) => {
              const shortCode = r.id.replace(/^req-/, '').slice(-6).toUpperCase();
              return (
                shortCode === extractedCode ||
                r.id.toUpperCase().endsWith(extractedCode)
              );
            });
          }

          // 3. Match the latest active ('pending' or 'in_progress') request
          if (!targetRequest) {
            targetRequest = recentRequests.find(
              (r) => r.status === 'pending' || r.status === 'in_progress'
            );
          }

          // 4. Fallback to the most recent request overall
          if (!targetRequest) {
            targetRequest = recentRequests[0];
          }

          if (targetRequest) {
            const updated = await markServiceRequestCompleted(
              targetRequest.id,
              senderPhone
            );

            if (updated) {
              const rawUnit = String(targetRequest.roomNumber || '101').trim();
              const unitLabel = /^(Birim|Daire|Suite|Oda)/i.test(rawUnit)
                ? rawUnit
                : `Birim ${rawUnit}`;
              const shortCode = targetRequest.id
                .replace(/^req-/, '')
                .slice(-6)
                .toUpperCase();

              const replyBody = [
                '✅ *Talep Onaylandı ve Tamamlandı!*',
                '━━━━━━━━━━━━━━━━━━━━━━',
                `🚪 *Birim:* ${unitLabel}`,
                `🛎️ *Talep / Sipariş:* ${targetRequest.serviceTitle}`,
                shortCode ? `🔖 *Talep Kodu:* #${shortCode}` : '',
                '📌 *Durum:* Canlı Misafir Talepleri ekranında *Tamamlandı* olarak işaretlendi.',
              ]
                .filter(Boolean)
                .join('\n');

              await WhatsAppService.sendTextMessage(senderPhone, replyBody);

              processed.push({
                requestId: targetRequest.id,
                roomNumber: targetRequest.roomNumber,
                serviceTitle: targetRequest.serviceTitle,
                senderPhone,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      processedCount: processed.length,
      processed,
    });
  } catch (err: any) {
    console.error('[WHATSAPP WEBHOOK] Error processing incoming message:', err);
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Webhook error' },
      { status: 200 }
    );
  }
}
