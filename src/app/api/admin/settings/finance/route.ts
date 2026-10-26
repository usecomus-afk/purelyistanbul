import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getAdminDbOrNull } from '@/lib/firebase-admin';

export interface FinanceSettings {
  activeProvider: 'stripe' | 'iyzico' | 'paytr';
  defaultCurrency: string;
  vendorSharePercent: number;
  platformSharePercent: number;
  platformCommissionPct: number;
  hotelReferralPercent: number;
  hotelReferralPct: number;
  require3DSecure: boolean;
  roomChargeEnabled: boolean;
  cashOnArrivalEnabled: boolean;
  autoPayoutSchedule: 'daily' | 'weekly' | 'monthly';
  settlementAccountName: string;
  settlementIban: string;
  stripeEnabled: boolean;
  stripeMode: 'live' | 'test';
  stripePublishableKey: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeSplitConnect: boolean;
  iyzicoEnabled: boolean;
  iyzicoMode: 'live' | 'sandbox';
  iyzicoApiKey: string;
  iyzicoSecretKey?: string;
  iyzicoBaseUrl: string;
  iyzicoSubMerchantSplit: boolean;
  iyzicoForce3DS: boolean;
  paytrEnabled: boolean;
  paytrMerchantId: string;
  paytrMerchantKey?: string;
  paytrMerchantSalt?: string;
  roomFolioChargeEnabled: boolean;
  onSiteCashOrPosEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_FINANCE_CONFIG: FinanceSettings = {
  activeProvider: 'stripe',
  defaultCurrency: 'EUR',
  vendorSharePercent: 85,
  platformSharePercent: 12,
  platformCommissionPct: 12,
  hotelReferralPercent: 3,
  hotelReferralPct: 3,
  require3DSecure: true,
  roomChargeEnabled: true,
  cashOnArrivalEnabled: true,
  autoPayoutSchedule: 'weekly',
  settlementAccountName: 'Purely İstanbul Turizm & Teknoloji A.Ş.',
  settlementIban: 'TR48 0006 2000 4120 0006 2984 10',
  stripeEnabled: true,
  stripeMode: 'live',
  stripePublishableKey: 'pk_live_51PurelyIstanbul...',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  stripeSplitConnect: true,
  iyzicoEnabled: true,
  iyzicoMode: 'live',
  iyzicoApiKey: 'iyz_api_purelyistanbul...',
  iyzicoSecretKey: '',
  iyzicoBaseUrl: 'https://api.iyzipay.com',
  iyzicoSubMerchantSplit: true,
  iyzicoForce3DS: true,
  paytrEnabled: false,
  paytrMerchantId: '',
  paytrMerchantKey: '',
  paytrMerchantSalt: '',
  roomFolioChargeEnabled: true,
  onSiteCashOrPosEnabled: true,
};

function maskSecret(val?: string): string {
  if (!val || val.length < 8) return '';
  return val.slice(0, 4) + '••••••••' + val.slice(-4);
}

/**
 * GET /api/admin/settings/finance
 * Sunucu tarafı Firestore'dan sistem finans, komisyon ve ödeme ayarlarını getirir.
 */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = getAdminDbOrNull();
  if (!db) {
    return NextResponse.json({ success: true, config: DEFAULT_FINANCE_CONFIG });
  }

  try {
    const snap = await db.collection('system_settings').doc('finance').get();
    if (!snap.exists) {
      return NextResponse.json({ success: true, config: DEFAULT_FINANCE_CONFIG, isDefault: true });
    }

    const data = snap.data() as FinanceSettings;
    const safeConfig: FinanceSettings = {
      ...DEFAULT_FINANCE_CONFIG,
      ...data,
      // Mask sensitive secret values for UI viewing
      stripeSecretKey: data.stripeSecretKey ? maskSecret(data.stripeSecretKey) : '',
      iyzicoSecretKey: data.iyzicoSecretKey ? maskSecret(data.iyzicoSecretKey) : '',
      paytrMerchantKey: data.paytrMerchantKey ? maskSecret(data.paytrMerchantKey) : '',
      paytrMerchantSalt: data.paytrMerchantSalt ? maskSecret(data.paytrMerchantSalt) : '',
    };

    return NextResponse.json({ success: true, config: safeConfig, isDefault: false });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/finance
 * Finansal oranlar, hakediş planı ve Sanal POS konfigürasyonunu Firestore'a kalıcı kaydeder.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = getAdminDbOrNull();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Veritabanı erişilemez.' }, { status: 503 });
  }

  try {
    const body = (await req.json()) as Partial<FinanceSettings>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Geçersiz veri.' }, { status: 400 });
    }

    const docRef = db.collection('system_settings').doc('finance');
    const existingSnap = await docRef.get();
    const existing = existingSnap.exists ? (existingSnap.data() as FinanceSettings) : DEFAULT_FINANCE_CONFIG;

    // Preserve existing secrets if masked or empty strings are submitted
    const isMaskedOrEmpty = (v?: string) => !v || v.includes('••••');

    const merged: FinanceSettings = {
      ...existing,
      ...body,
      stripeSecretKey: isMaskedOrEmpty(body.stripeSecretKey) ? existing.stripeSecretKey : body.stripeSecretKey,
      iyzicoSecretKey: isMaskedOrEmpty(body.iyzicoSecretKey) ? existing.iyzicoSecretKey : body.iyzicoSecretKey,
      paytrMerchantKey: isMaskedOrEmpty(body.paytrMerchantKey) ? existing.paytrMerchantKey : body.paytrMerchantKey,
      paytrMerchantSalt: isMaskedOrEmpty(body.paytrMerchantSalt) ? existing.paytrMerchantSalt : body.paytrMerchantSalt,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    await docRef.set(merged, { merge: true });

    // Audit log
    await db.collection('ops_audit').add({
      action: 'update_finance_settings',
      actor: 'admin',
      platformCommissionPct: merged.platformCommissionPct,
      hotelReferralPct: merged.hotelReferralPct,
      autoPayoutSchedule: merged.autoPayoutSchedule,
      activeProvider: merged.activeProvider,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Finansal ayarlar ve Sanal POS yapılandırması sunucuda kalıcı olarak güncellendi.',
      updatedAt: merged.updatedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
