import { NextResponse } from 'next/server';
import { getAdminDbOrNull } from '@/lib/firebase-admin';
import { experienceToMarketplaceListing, hotelToMarketplaceListing } from '@/lib/marketplace/seed-listings';
import { normalizeCategoryLabel, type CategoryConfig } from '@/lib/marketplace/categories';
import type { Experience, Hotel, PropertyListing, SupplierPartner } from '@/lib/types';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean as T;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body || {};

    const adminDb = getAdminDbOrNull();
    if (!adminDb) {
      return NextResponse.json({ ok: false, reason: 'admin_db_unavailable' }, { status: 200 });
    }

    const now = new Date().toISOString();

    if (action === 'upsert_experience' && payload?.id) {
      const exp = payload as Experience;
      const stamped = stripUndefined({
        ...exp,
        updatedAt: exp.updatedAt || now,
      });
      await adminDb.collection('experiences').doc(exp.id).set(stamped);

      const mpListing = experienceToMarketplaceListing(exp, 0);
      const mpStatus = exp.status === 'suspended' || exp.publishToWeb === false ? 'suspended' : 'approved';
      await adminDb.collection('marketplace_listings').doc(exp.id).set(
        stripUndefined({
          ...mpListing,
          status: mpStatus,
          updatedAt: stamped.updatedAt,
        })
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_experience' && payload?.id) {
      const id = String(payload.id);
      await adminDb.collection('experiences').doc(id).set({
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now,
      });
      await adminDb.collection('marketplace_listings').doc(id).delete().catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === 'upsert_property' && payload?.id) {
      const prop = payload as PropertyListing;
      await adminDb.collection('properties').doc(prop.id).set(
        stripUndefined({
          ...prop,
          deleted: false,
          updatedAt: (prop as any).updatedAt || now,
        })
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_property' && payload?.id) {
      const id = String(payload.id);
      await adminDb.collection('properties').doc(id).set({
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now,
      });
      await adminDb.collection('marketplace_listings').doc(id).delete().catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === 'upsert_hotel' && payload?.id) {
      const hotel = payload as Hotel;
      const stamped = stripUndefined({
        ...hotel,
        deleted: false,
        updatedAt: (hotel as any).updatedAt || now,
      });
      await adminDb.collection('hotels').doc(hotel.id).set(stamped);

      if (hotel.publishToWeb && hotel.status !== 'suspended') {
        const mpListing = hotelToMarketplaceListing(hotel, 0);
        await adminDb.collection('marketplace_listings').doc(hotel.id).set(
          stripUndefined({
            ...mpListing,
            status: 'approved',
            updatedAt: stamped.updatedAt,
          })
        );
      } else {
        await adminDb.collection('marketplace_listings').doc(hotel.id).delete().catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_hotel' && payload?.id) {
      const id = String(payload.id);
      await adminDb.collection('hotels').doc(id).set({
        id,
        deleted: true,
        status: 'suspended',
        publishToWeb: false,
        publishToMobile: false,
        updatedAt: now,
      });
      await adminDb.collection('marketplace_listings').doc(id).delete().catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (action === 'upsert_supplier' && payload?.id) {
      const sup = payload as SupplierPartner;
      await adminDb.collection('suppliers').doc(sup.id).set(
        stripUndefined({
          ...sup,
          deleted: false,
          updatedAt: sup.updatedAt || now,
        })
      );
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_supplier' && payload?.id) {
      const id = String(payload.id);
      await adminDb.collection('suppliers').doc(id).set({
        id,
        deleted: true,
        contractStatus: 'suspended',
        updatedAt: now,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'upsert_category' && payload?.key) {
      const cfg = payload as CategoryConfig;
      const normalizedLabel = normalizeCategoryLabel(cfg.label, cfg.label);
      await adminDb.collection('site_categories').doc(cfg.key).set(
        stripUndefined({
          ...cfg,
          label: normalizedLabel,
          labelEn: normalizeCategoryLabel(cfg.labelEn, normalizedLabel),
          updatedAt: cfg.updatedAt || now,
        })
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.warn('[api/admin/catalog] error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
