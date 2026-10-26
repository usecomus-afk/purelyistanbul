import { NextResponse } from 'next/server';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import type { HotelPartnerApplication } from '@/lib/types';

const COLLECTION_NAME = 'hotel_partner_applications';

// Server-side in-memory fallback store in case adminDb is temporarily unavailable
const memoryStore = new Map<string, HotelPartnerApplication>();

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean as T;
}

export async function GET() {
  try {
    const adminDb = getAdminDbOrNull();
    if (adminDb) {
      const snap = await adminDb.collection(COLLECTION_NAME).get();
      const list: HotelPartnerApplication[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as HotelPartnerApplication;
        if (data && !(data as any).deleted) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return NextResponse.json({ ok: true, applications: list });
    }

    const fallbackList = Array.from(memoryStore.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
    return NextResponse.json({ ok: true, applications: fallbackList });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Başvurular alınamadı', applications: [] },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action || 'submit';
    const now = new Date().toISOString();
    const adminDb = getAdminDbOrNull();

    if (action === 'update_status' && body?.id) {
      const id = String(body.id);
      const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : 'pending';
      if (adminDb) {
        await adminDb.collection(COLLECTION_NAME).doc(id).set(
          {
            status,
            reviewedAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      }
      const existing = memoryStore.get(id);
      if (existing) {
        memoryStore.set(id, { ...existing, status, reviewedAt: now, updatedAt: now });
      }
      return NextResponse.json({ ok: true, id, status });
    }

    if (action === 'delete' && body?.id) {
      const id = String(body.id);
      if (adminDb) {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete().catch(async () => {
          await adminDb.collection(COLLECTION_NAME).doc(id).set({ deleted: true, updatedAt: now }, { merge: true });
        });
      }
      memoryStore.delete(id);
      return NextResponse.json({ ok: true, id });
    }

    // Default: submit a new hotel partner application from /hotel-portal ("Üye Ol")
    const payload = body?.application || body || {};
    const propertyName = String(payload.propertyName || '').trim();
    const businessType = String(payload.businessType || '').trim();
    const capacity = Math.max(1, Number(payload.capacity) || 1);
    const locationDistrict = String(payload.locationDistrict || '').trim();
    const locationAddress = String(payload.locationAddress || '').trim();
    const authorizedPerson = String(payload.authorizedPerson || '').trim();
    const phone = String(payload.phone || '').trim();
    const email = String(payload.email || '').trim();
    const website = payload.website ? String(payload.website).trim() : undefined;
    const notes = payload.notes ? String(payload.notes).trim() : undefined;
    const wantsToBePartner = Boolean(payload.wantsToBePartner);

    if (
      !propertyName ||
      !businessType ||
      !locationDistrict ||
      !locationAddress ||
      !authorizedPerson ||
      !phone ||
      !email ||
      !wantsToBePartner
    ) {
      return NextResponse.json(
        { ok: false, error: 'Lütfen tüm zorunlu alanları doldurun ve partnerlik onay kutusunu işaretleyin.' },
        { status: 400 }
      );
    }

    const id = payload.id ? String(payload.id) : `partner-app-${Date.now()}`;
    const application: HotelPartnerApplication = stripUndefined({
      id,
      propertyName,
      businessType,
      capacity,
      locationDistrict,
      locationAddress,
      authorizedPerson,
      phone,
      email,
      website,
      notes,
      wantsToBePartner: true,
      status: 'pending',
      createdAt: payload.createdAt || now,
      updatedAt: now,
    });

    memoryStore.set(id, application);

    if (adminDb) {
      await adminDb.collection(COLLECTION_NAME).doc(id).set(application);
    }

    return NextResponse.json({ ok: true, application });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Başvuru kaydedilemedi' },
      { status: 500 }
    );
  }
}
