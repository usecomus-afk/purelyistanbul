/**
 * Xenios Stripe / Virtual POS Webhook Handler
 * Atomically confirms booking using lock_id (Tip A) or registers to Bókun/FareHarbor (Tip B)
 * Equipped with Fail-Safe Retry Queues & Emergency WhatsApp Alerts
 */

import { NextResponse } from 'next/server';
import { verifyStripeSignature, webhookGate } from '@/lib/api-auth';
import { InventoryEngine } from '@/services/inventoryEngine';
import { OctoAdapter } from '@/services/octoAdapter';
import { FailSafeGuardrails } from '@/services/failSafeGuardrails';
import { InventoryType, OctoChannelConfig } from '@/types/inventory';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const gate = webhookGate(
      stripeSecret,
      !!stripeSecret && verifyStripeSignature(rawBody, req.headers.get('stripe-signature'), stripeSecret)
    );
    if (!gate.ok) return gate.response;
    const payload = JSON.parse(rawBody);
    
    // Webhook metadata extraction
    const {
      event_type = 'payment_intent.succeeded',
      payment_intent_id = `pi_${Date.now()}`,
      lock_id,
      inventory_type = 'NATIVE_FIRESTORE',
      amount = 75,
      currency = 'EUR',
      hotel_name = 'Pera Palace Hotel',
      octo_config,
      octo_availability_id,
      guest_details = {
        name: 'Alex Mercer',
        phone: '+90 532 555 44 33',
        email: 'alex.mercer@gmail.com',
        hotel_room: '304'
      }
    } = payload as {
      event_type?: string;
      payment_intent_id?: string;
      lock_id?: string;
      inventory_type?: InventoryType;
      amount?: number;
      currency?: string;
      hotel_name?: string;
      octo_config?: OctoChannelConfig;
      octo_availability_id?: string;
      guest_details?: {
        name: string;
        phone: string;
        email: string;
        hotel_room: string;
      };
    };

    if (event_type !== 'payment_intent.succeeded' && event_type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true, message: `Event ${event_type} ignored.` });
    }

    // ==============================================================
    // 1. Tip A: Dahili Envanter (Firebase Native ACID Confirmation)
    // ==============================================================
    if (inventory_type === 'NATIVE_FIRESTORE') {
      if (!lock_id) {
        return NextResponse.json(
          { success: false, error: 'Dahili envanter için lock_id parametresi zorunludur.' },
          { status: 400 }
        );
      }

      // Execute with Exponential Backoff Retry Guardrail
      const result = await FailSafeGuardrails.executeWithRetry(
        async () => {
          return await InventoryEngine.confirmBooking({
            lockId: lock_id,
            paymentIntentId: payment_intent_id,
            totalAmount: amount,
            currency,
            hotelName: hotel_name
          });
        },
        3,
        800,
        `NATIVE_CONFIRM_LOCK_${lock_id}`
      );

      return NextResponse.json({
        success: true,
        inventory_type: 'NATIVE_FIRESTORE',
        booking_id: result.booking.booking_id,
        confirmation_code: result.booking.confirmation_code,
        message: 'Ödeme onaylandı, koltuk kilit durumundan kesinleşmiş rezervasyona geçirildi.'
      });
    }

    // ==============================================================
    // 2. Tip B: Harici Envanter (OCTO / Bókun & FareHarbor Booking Creation)
    // ==============================================================
    if (inventory_type === 'OCTO_API') {
      const config: OctoChannelConfig = octo_config || {
        provider_platform: 'BOKUN',
        endpoint_url: 'https://api.bokun.io/octo/v1',
        api_key_secret_id: 'mock_key',
        product_id: 'prod_bosphorus_cruise',
        option_id: 'opt_standard'
      };

      try {
        const octoResult = await FailSafeGuardrails.executeWithRetry(
          async () => {
            return await OctoAdapter.createBooking(config, {
              productId: config.product_id,
              optionId: config.option_id,
              availabilityId: octo_availability_id || `octo_avail_${Date.now()}`,
              units: [{ id: 'adult', quantity: 1 }],
              contact: {
                fullName: guest_details.name,
                email: guest_details.email,
                phoneNumber: guest_details.phone,
                notes: `Xenios In-Room Concierge Booking - Room ${guest_details.hotel_room}`
              }
            });
          },
          3,
          1000,
          `OCTO_CREATE_BOOKING_${config.product_id}`
        );

        return NextResponse.json({
          success: true,
          inventory_type: 'OCTO_API',
          external_booking_reference: octoResult.reference,
          voucher_url: octoResult.voucher?.deliveryUrl,
          barcode: octoResult.ticket?.barcode,
          message: 'Bókun/FareHarbor sistemine bilet başarıyla işlendi ve OTA senkronizasyonu tetiklendi.'
        });
      } catch (octoErr: any) {
        // FAIL-SAFE DISPATCH: Harici API yanıt vermezse acil durum WhatsApp mesajı tetiklenir
        await FailSafeGuardrails.dispatchSupplierEmergencyAlert({
          alert_id: `alert_${Date.now()}`,
          type: 'OCTO_CONFIRMATION_TIMEOUT',
          listing_id: config.product_id,
          provider_name: 'Bókun Bosphorus Partner',
          provider_phone: '+90 532 500 00 00',
          guest_name: guest_details.name,
          hotel_room: guest_details.hotel_room,
          spots_count: 1,
          error_details: octoErr.message,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json(
          {
            success: false,
            fallback_triggered: true,
            message: 'Harici operatör API zaman aşımı! WhatsApp acil teyit kuyruğuna aktarıldı.'
          },
          { status: 202 } // 202 Accepted (Manuel Teyit Sürecinde)
        );
      }
    }

    return NextResponse.json({ success: false, error: 'Geçersiz envanter tipi' }, { status: 400 });
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
