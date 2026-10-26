/**
 * Xenios Native Inventory Engine (Tip A)
 * Firebase Firestore ACID Transactional Slot Reservation & 10-Minute Lock Engine
 *
 * Sağlar:
 * 1. listing_slots koleksiyonu üzerinden atomik kontenjan denetimi (çifte rezervasyon / overbooking engeli)
 * 2. 10 dakikalık geçici koltuk kilitleme (reserveInventorySlot)
 * 3. Kesin rezervasyona dönüştürme (confirmBooking)
 * 4. Süresi dolan kilitleri havuza iade etme (releaseExpiredLocks)
 * 5. Doğrudan rezervasyon sırasında atomik kontenjan kontrolü (directBookSlot)
 * 6. Yönetici seans ve kota tanımları (upsertSlot, bulkCreateSlots, getSlotsByListing)
 */

import {
  ListingSlot,
  InventoryLock,
  InventoryBooking,
} from '@/types/inventory';
import { getAdminDbOrNull } from '@/lib/firebase-admin';

// In-Memory Transactional Store for Local Emulation / Fallback
const inMemorySlots = new Map<string, ListingSlot>();
const inMemoryLocks = new Map<string, InventoryLock>();
const inMemoryBookings = new Map<string, InventoryBooking>();

// Seed default demonstration slots if empty
function ensureDemonstrationSlots() {
  if (inMemorySlots.size === 0) {
    const demoSlots: ListingSlot[] = [
      {
        slot_id: 'slot_hamam_cagaloglu_20260825_1000',
        listing_id: 'exp_cagaloglu_hamam',
        date: '2026-08-25',
        time_slot: '10:00',
        start_time: '2026-08-25T10:00:00Z',
        end_time: '2026-08-25T11:30:00Z',
        capacity: 8,
        booked_count: 3,
        locked_count: 0,
        available_spots: 5,
        status: 'open',
        version: 1,
        updated_at: new Date().toISOString()
      },
      {
        slot_id: 'slot_hamam_cagaloglu_20260825_1400',
        listing_id: 'exp_cagaloglu_hamam',
        date: '2026-08-25',
        time_slot: '14:00',
        start_time: '2026-08-25T14:00:00Z',
        end_time: '2026-08-25T15:30:00Z',
        capacity: 8,
        booked_count: 6,
        locked_count: 0,
        available_spots: 2,
        status: 'open',
        version: 1,
        updated_at: new Date().toISOString()
      },
      {
        slot_id: 'slot_ebru_workshop_20260825_1100',
        listing_id: 'exp_ebru_workshop',
        date: '2026-08-25',
        time_slot: '11:00',
        start_time: '2026-08-25T11:00:00Z',
        end_time: '2026-08-25T13:00:00Z',
        capacity: 6,
        booked_count: 4,
        locked_count: 0,
        available_spots: 2,
        status: 'open',
        version: 1,
        updated_at: new Date().toISOString()
      }
    ];

    demoSlots.forEach(s => inMemorySlots.set(s.slot_id, s));
  }
}

export class InventoryEngine {
  /**
   * Standart slotId formatı üretir: `${listingId}_${YYYYMMDD}_${HHmm}`
   */
  static formatSlotId(listingId: string, date: string, timeSlot: string): string {
    const cleanDate = date.replace(/[^0-9]/g, '').slice(0, 8);
    const cleanTime = (timeSlot || '1200').replace(/[^0-9]/g, '').slice(0, 4).padEnd(4, '0');
    return `${listingId}_${cleanDate}_${cleanTime}`;
  }

  /**
   * Adım 1: Atomik Koltuk Kilitleme (reserveInventorySlot)
   * 10 Dakikalık TTL ile geçici kilit oluşturur ve seans stoğunu güvenceye alır.
   */
  static async reserveInventorySlot(params: {
    slotId: string;
    requestedSeats: number;
    guestId: string;
    hotelId: string;
    roomNumber: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
  }): Promise<{
    success: boolean;
    lockId: string;
    expiresAt: string;
    lockedSeats: number;
    slot: ListingSlot;
  }> {
    const { slotId, requestedSeats, guestId, hotelId, roomNumber, guestName, guestPhone, guestEmail } = params;

    if (!slotId || requestedSeats <= 0) {
      throw new Error('INVALID_ARGUMENTS: Geçersiz seans veya koltuk sayısı.');
    }

    const now = Date.now();
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 Dakika TTL
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const db = getAdminDbOrNull();

    if (db) {
      // FIRESTORE ACID TRANSACTION
      const slotRef = db.collection('listing_slots').doc(slotId);
      const lockRef = db.collection('inventory_locks').doc(lockId);

      const updatedSlot = await db.runTransaction(async (txn) => {
        const slotSnap = await txn.get(slotRef);

        let slotData: ListingSlot;
        if (!slotSnap.exists) {
          // İlanın varsayılan seansı henüz yoksa oluştur
          const parts = slotId.split('_');
          const listingId = parts[0] || 'exp-default';
          slotData = {
            slot_id: slotId,
            listing_id: listingId,
            start_time: new Date().toISOString(),
            end_time: new Date(now + 2 * 3600 * 1000).toISOString(),
            capacity: 10,
            booked_count: 0,
            locked_count: 0,
            available_spots: 10,
            status: 'open',
            version: 1,
            updated_at: new Date().toISOString()
          };
        } else {
          slotData = slotSnap.data() as ListingSlot;
        }

        if (slotData.status === 'closed') {
          throw new Error(`SLOT_CLOSED: Bu seans rezervasyonlara kapatılmıştır (${slotData.closed_reason || 'Dolu'}).`);
        }

        const available = slotData.capacity - (slotData.booked_count + slotData.locked_count);
        if (available < requestedSeats) {
          throw new Error(
            `INSUFFICIENT_CAPACITY: Seans dolu veya yeterli koltuk yok. Kalan net kontenjan: ${Math.max(0, available)}`
          );
        }

        const lock: InventoryLock = {
          lock_id: lockId,
          slot_id: slotId,
          listing_id: slotData.listing_id,
          guest_id: guestId,
          hotel_id: hotelId,
          room_number: roomNumber,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail,
          spots_count: requestedSeats,
          status: 'ACTIVE',
          created_at: new Date(now).toISOString(),
          expires_at: expiresAt
        };

        slotData.locked_count += requestedSeats;
        slotData.available_spots = slotData.capacity - (slotData.booked_count + slotData.locked_count);
        if (slotData.available_spots <= 0) {
          slotData.status = 'sold_out';
        }
        slotData.version = (slotData.version || 1) + 1;
        slotData.updated_at = new Date().toISOString();

        txn.set(slotRef, slotData);
        txn.set(lockRef, lock);

        return slotData;
      });

      return {
        success: true,
        lockId,
        expiresAt,
        lockedSeats: requestedSeats,
        slot: updatedSlot
      };
    }

    // In-memory fallback
    ensureDemonstrationSlots();
    const slot = inMemorySlots.get(slotId);
    if (!slot) {
      throw new Error(`SLOT_NOT_FOUND: ${slotId} kimlikli seans bulunamadı.`);
    }

    if (slot.status === 'closed') {
      throw new Error('SLOT_CLOSED: Bu seans kapatılmıştır.');
    }

    const available = slot.capacity - (slot.booked_count + slot.locked_count);
    if (available < requestedSeats) {
      throw new Error(
        `INSUFFICIENT_CAPACITY: Seans dolu veya yeterli koltuk yok. Kalan net kontenjan: ${Math.max(0, available)}`
      );
    }

    const lock: InventoryLock = {
      lock_id: lockId,
      slot_id: slotId,
      listing_id: slot.listing_id,
      guest_id: guestId,
      hotel_id: hotelId,
      room_number: roomNumber,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail,
      spots_count: requestedSeats,
      status: 'ACTIVE',
      created_at: new Date(now).toISOString(),
      expires_at: expiresAt
    };

    slot.locked_count += requestedSeats;
    slot.available_spots = slot.capacity - (slot.booked_count + slot.locked_count);
    slot.version += 1;
    slot.updated_at = new Date().toISOString();

    inMemoryLocks.set(lockId, lock);
    inMemorySlots.set(slotId, slot);

    return {
      success: true,
      lockId,
      expiresAt,
      lockedSeats: requestedSeats,
      slot
    };
  }

  /**
   * Adım 2: Ödeme Sonrası Kesinleştirme (confirmBooking)
   * Kilitli kontenjanı kesin rezervasyona dönüştürür.
   */
  static async confirmBooking(params: {
    lockId: string;
    paymentIntentId?: string;
    totalAmount: number;
    currency?: string;
    hotelName?: string;
  }): Promise<{
    success: boolean;
    booking: InventoryBooking;
    message: string;
  }> {
    const { lockId, paymentIntentId, totalAmount, currency = 'EUR', hotelName = 'Purely Istanbul Partner Hotel' } = params;

    const db = getAdminDbOrNull();
    const now = Date.now();

    if (db) {
      const lockRef = db.collection('inventory_locks').doc(lockId);
      const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const confirmationCode = 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const booking = await db.runTransaction(async (txn) => {
        const lockSnap = await txn.get(lockRef);
        if (!lockSnap.exists) {
          throw new Error(`LOCK_NOT_FOUND: ${lockId} nolu kilit bulunamadı.`);
        }

        const lock = lockSnap.data() as InventoryLock;
        if (lock.status !== 'ACTIVE') {
          throw new Error(`LOCK_INVALID_STATUS: Bu kilit zaten işlenmiş (${lock.status}).`);
        }

        const lockExpiry = new Date(lock.expires_at).getTime();
        if (lockExpiry < now) {
          txn.update(lockRef, { status: 'EXPIRED' });
          throw new Error('LOCK_EXPIRED: 10 dakikalık ödeme süresi doldu, koltuklar serbest bırakıldı.');
        }

        const slotRef = db.collection('listing_slots').doc(lock.slot_id);
        const slotSnap = await txn.get(slotRef);
        if (!slotSnap.exists) {
          throw new Error(`SLOT_NOT_FOUND: ${lock.slot_id} seansı bulunamadı.`);
        }

        const slot = slotSnap.data() as ListingSlot;

        const b: InventoryBooking = {
          booking_id: bookingId,
          listing_id: lock.listing_id,
          slot_id: lock.slot_id,
          inventory_type: 'NATIVE_FIRESTORE',
          lock_id: lockId,
          payment_intent_id: paymentIntentId,
          guest_details: {
            guest_id: lock.guest_id,
            guest_name: lock.guest_name,
            hotel_id: lock.hotel_id,
            hotel_name: hotelName,
            room_number: lock.room_number,
            phone: lock.guest_phone,
            email: lock.guest_email
          },
          spots_count: lock.spots_count,
          total_amount: totalAmount,
          currency,
          status: 'CONFIRMED',
          confirmation_code: confirmationCode,
          created_at: lock.created_at,
          confirmed_at: new Date().toISOString()
        };

        // Kilit ve seansı atomik güncelle
        txn.update(lockRef, {
          status: 'CONVERTED',
          converted_booking_id: bookingId,
          payment_intent_id: paymentIntentId || null
        });

        const newLocked = Math.max(0, slot.locked_count - lock.spots_count);
        const newBooked = slot.booked_count + lock.spots_count;
        const newAvailable = slot.capacity - (newBooked + newLocked);

        txn.update(slotRef, {
          locked_count: newLocked,
          booked_count: newBooked,
          available_spots: newAvailable,
          status: newAvailable <= 0 ? 'sold_out' : 'open',
          version: (slot.version || 1) + 1,
          updated_at: new Date().toISOString()
        });

        const bookingRef = db.collection('bookings').doc(bookingId);
        txn.set(bookingRef, {
          id: bookingId,
          confirmationCode,
          hotelId: lock.hotel_id,
          hotelName,
          roomNumber: lock.room_number,
          experienceId: lock.listing_id,
          guestName: lock.guest_name,
          guestPhone: lock.guest_phone,
          guestEmail: lock.guest_email,
          guestCount: lock.spots_count,
          slotId: lock.slot_id,
          amount: totalAmount,
          currency,
          status: 'payment_success',
          createdAt: new Date().toISOString(),
          verified: true
        });

        return b;
      });

      return {
        success: true,
        booking,
        message: 'Rezervasyon başarıyla kesinleşti ve koltuk stoğu güncellendi.'
      };
    }

    // In-memory fallback
    const lock = inMemoryLocks.get(lockId);
    if (!lock) throw new Error(`LOCK_NOT_FOUND: ${lockId} nolu kilit bulunamadı.`);
    if (lock.status !== 'ACTIVE') throw new Error(`LOCK_INVALID_STATUS: Bu kilit zaten işlenmiş (${lock.status}).`);

    const lockExpiry = new Date(lock.expires_at).getTime();
    if (lockExpiry < now) {
      lock.status = 'EXPIRED';
      throw new Error('LOCK_EXPIRED: 10 dakikalık ödeme süresi doldu, koltuklar serbest bırakıldı.');
    }

    const slot = inMemorySlots.get(lock.slot_id);
    if (!slot) throw new Error(`SLOT_NOT_FOUND: ${lock.slot_id} seansı bulunamadı.`);

    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const confirmationCode = 'XEN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const booking: InventoryBooking = {
      booking_id: bookingId,
      listing_id: lock.listing_id,
      slot_id: lock.slot_id,
      inventory_type: 'NATIVE_FIRESTORE',
      lock_id: lockId,
      payment_intent_id: paymentIntentId,
      guest_details: {
        guest_id: lock.guest_id,
        guest_name: lock.guest_name,
        hotel_id: lock.hotel_id,
        hotel_name: hotelName,
        room_number: lock.room_number,
        phone: lock.guest_phone,
        email: lock.guest_email
      },
      spots_count: lock.spots_count,
      total_amount: totalAmount,
      currency,
      status: 'CONFIRMED',
      confirmation_code: confirmationCode,
      created_at: lock.created_at,
      confirmed_at: new Date().toISOString()
    };

    lock.status = 'CONVERTED';
    lock.converted_booking_id = bookingId;
    lock.payment_intent_id = paymentIntentId;

    slot.locked_count = Math.max(0, slot.locked_count - lock.spots_count);
    slot.booked_count += lock.spots_count;
    slot.available_spots = slot.capacity - (slot.booked_count + slot.locked_count);
    slot.version += 1;
    slot.updated_at = new Date().toISOString();

    inMemoryBookings.set(bookingId, booking);
    inMemoryLocks.set(lockId, lock);
    inMemorySlots.set(slot.slot_id, slot);

    return {
      success: true,
      booking,
      message: 'Rezervasyon başarıyla kesinleşti ve koltuk stoğu güncellendi.'
    };
  }

  /**
   * Adım 3: Doğrudan Rezervasyon Sırasında Atomik Kontenjan Denetimi (directBookSlot)
   * PWA ve Otel Konsiyerj doğrudan sipariş oluştururken çağrılır.
   * Kontenjan yoksa işlemi 409 ile engeller (Overbooking Prevention).
   */
  static async directBookSlot(params: {
    listingId: string;
    date: string;
    timeSlot: string;
    guestCount: number;
    defaultCapacity?: number;
    listingTitle?: string;
  }): Promise<{
    success: boolean;
    slotId: string;
    remainingSpots: number;
    error?: string;
    message?: string;
  }> {
    const { listingId, date, timeSlot, guestCount, defaultCapacity = 12 } = params;
    const slotId = this.formatSlotId(listingId, date, timeSlot);
    const db = getAdminDbOrNull();

    if (db) {
      const slotRef = db.collection('listing_slots').doc(slotId);

      const result = await db.runTransaction(async (txn) => {
        const snap = await txn.get(slotRef);
        let slotData: ListingSlot;

        if (!snap.exists) {
          slotData = {
            slot_id: slotId,
            listing_id: listingId,
            date,
            time_slot: timeSlot,
            start_time: `${date}T${timeSlot || '12:00'}:00Z`,
            end_time: `${date}T${timeSlot || '14:00'}:00Z`,
            capacity: defaultCapacity,
            booked_count: 0,
            locked_count: 0,
            available_spots: defaultCapacity,
            status: 'open',
            version: 1,
            updated_at: new Date().toISOString()
          };
        } else {
          slotData = snap.data() as ListingSlot;
        }

        if (slotData.status === 'closed') {
          return {
            success: false,
            error: 'SLOT_CLOSED',
            message: `Bu seans rezervasyonlara kapatılmıştır (${slotData.closed_reason || 'Tadilat/Özel Tahsis'}).`,
            slotId,
            remainingSpots: 0
          };
        }

        const available = slotData.capacity - (slotData.booked_count + slotData.locked_count);
        if (available < guestCount) {
          return {
            success: false,
            error: 'INSUFFICIENT_CAPACITY',
            message: `Bu seans için yeterli kontenjan kalmadı. Kalan: ${Math.max(0, available)}, Talep: ${guestCount}`,
            slotId,
            remainingSpots: Math.max(0, available)
          };
        }

        // Kontenjanı düş
        slotData.booked_count += guestCount;
        slotData.available_spots = slotData.capacity - (slotData.booked_count + slotData.locked_count);
        if (slotData.available_spots <= 0) {
          slotData.status = 'sold_out';
        }
        slotData.version = (slotData.version || 1) + 1;
        slotData.updated_at = new Date().toISOString();

        txn.set(slotRef, slotData);

        return {
          success: true,
          slotId,
          remainingSpots: slotData.available_spots
        };
      });

      return result;
    }

    // In-memory fallback
    ensureDemonstrationSlots();
    let slot = inMemorySlots.get(slotId);
    if (!slot) {
      slot = {
        slot_id: slotId,
        listing_id: listingId,
        date,
        time_slot: timeSlot,
        start_time: `${date}T${timeSlot}:00Z`,
        end_time: `${date}T${timeSlot}:00Z`,
        capacity: defaultCapacity,
        booked_count: 0,
        locked_count: 0,
        available_spots: defaultCapacity,
        status: 'open',
        version: 1,
        updated_at: new Date().toISOString()
      };
      inMemorySlots.set(slotId, slot);
    }

    if (slot.status === 'closed') {
      return {
        success: false,
        error: 'SLOT_CLOSED',
        message: 'Bu seans kapatılmıştır.',
        slotId,
        remainingSpots: 0
      };
    }

    const available = slot.capacity - (slot.booked_count + slot.locked_count);
    if (available < guestCount) {
      return {
        success: false,
        error: 'INSUFFICIENT_CAPACITY',
        message: `Kapasite yetersiz. Kalan: ${Math.max(0, available)}`,
        slotId,
        remainingSpots: Math.max(0, available)
      };
    }

    slot.booked_count += guestCount;
    slot.available_spots = slot.capacity - (slot.booked_count + slot.locked_count);
    if (slot.available_spots <= 0) slot.status = 'sold_out';
    slot.version += 1;
    slot.updated_at = new Date().toISOString();

    return {
      success: true,
      slotId,
      remainingSpots: slot.available_spots
    };
  }

  /**
   * Adım 4: Süresi Dolan Kilitleri Serbest Bırakma (releaseExpiredLocks)
   * 10 dakikalık TTL'i dolmuş kilitleri serbest bırakır.
   */
  static async releaseExpiredLocks(): Promise<{
    releasedCount: number;
    expiredLockIds: string[];
  }> {
    const nowIso = new Date().toISOString();
    const expiredLockIds: string[] = [];
    const db = getAdminDbOrNull();

    if (db) {
      const snap = await db
        .collection('inventory_locks')
        .where('status', '==', 'ACTIVE')
        .where('expires_at', '<=', nowIso)
        .limit(50)
        .get();

      for (const doc of snap.docs) {
        const lock = doc.data() as InventoryLock;
        try {
          await db.runTransaction(async (txn) => {
            const lockRef = db.collection('inventory_locks').doc(lock.lock_id);
            const slotRef = db.collection('listing_slots').doc(lock.slot_id);

            const slotSnap = await txn.get(slotRef);
            if (slotSnap.exists) {
              const slot = slotSnap.data() as ListingSlot;
              const newLocked = Math.max(0, slot.locked_count - lock.spots_count);
              const newAvailable = slot.capacity - (slot.booked_count + newLocked);

              txn.update(slotRef, {
                locked_count: newLocked,
                available_spots: newAvailable,
                status: newAvailable > 0 && slot.status === 'sold_out' ? 'open' : slot.status,
                version: (slot.version || 1) + 1,
                updated_at: new Date().toISOString()
              });
            }

            txn.update(lockRef, { status: 'EXPIRED' });
          });
          expiredLockIds.push(lock.lock_id);
        } catch (e) {
          console.error(`[inventoryEngine] release lock ${lock.lock_id} error:`, e);
        }
      }

      return {
        releasedCount: expiredLockIds.length,
        expiredLockIds
      };
    }

    // In-memory fallback
    const now = Date.now();
    for (const [lockId, lock] of inMemoryLocks.entries()) {
      if (lock.status === 'ACTIVE' && new Date(lock.expires_at).getTime() <= now) {
        lock.status = 'EXPIRED';
        expiredLockIds.push(lockId);

        const slot = inMemorySlots.get(lock.slot_id);
        if (slot) {
          slot.locked_count = Math.max(0, slot.locked_count - lock.spots_count);
          slot.available_spots = slot.capacity - (slot.booked_count + slot.locked_count);
          slot.version += 1;
          slot.updated_at = new Date().toISOString();
          inMemorySlots.set(slot.slot_id, slot);
        }
      }
    }

    return {
      releasedCount: expiredLockIds.length,
      expiredLockIds
    };
  }

  /**
   * İlana ait tüm seansları listele
   */
  static async getSlotsByListing(listingId: string): Promise<ListingSlot[]> {
    const db = getAdminDbOrNull();
    if (db) {
      await this.releaseExpiredLocks().catch(() => {});
      const snap = await db
        .collection('listing_slots')
        .where('listing_id', '==', listingId)
        .limit(100)
        .get();

      return snap.docs.map((d) => d.data() as ListingSlot);
    }

    ensureDemonstrationSlots();
    await this.releaseExpiredLocks();
    return Array.from(inMemorySlots.values()).filter(s => s.listing_id === listingId);
  }

  /**
   * Seans uygunluğu sorgulama
   */
  static async getSlotAvailability(slotId: string): Promise<ListingSlot | null> {
    const db = getAdminDbOrNull();
    if (db) {
      const snap = await db.collection('listing_slots').doc(slotId).get();
      return snap.exists ? (snap.data() as ListingSlot) : null;
    }

    ensureDemonstrationSlots();
    await this.releaseExpiredLocks();
    return inMemorySlots.get(slotId) || null;
  }

  /**
   * Yönetici Seans Güncelleme / Oluşturma
   */
  static async upsertSlot(slot: ListingSlot): Promise<void> {
    const db = getAdminDbOrNull();
    if (db) {
      await db.collection('listing_slots').doc(slot.slot_id).set(slot, { merge: true });
      return;
    }

    inMemorySlots.set(slot.slot_id, slot);
  }

  /**
   * Yönetici Toplu Seans Oluşturucu (Belirli tarihler ve saatler için seans üretir)
   */
  static async bulkCreateSlots(params: {
    listingId: string;
    dates: string[];
    timeSlots: string[];
    capacity: number;
  }): Promise<ListingSlot[]> {
    const { listingId, dates, timeSlots, capacity } = params;
    const createdSlots: ListingSlot[] = [];
    const db = getAdminDbOrNull();
    const batch = db ? db.batch() : null;

    for (const d of dates) {
      for (const t of timeSlots) {
        const slotId = this.formatSlotId(listingId, d, t);
        const slot: ListingSlot = {
          slot_id: slotId,
          listing_id: listingId,
          date: d,
          time_slot: t,
          start_time: `${d}T${t}:00Z`,
          end_time: `${d}T${t}:00Z`,
          capacity,
          booked_count: 0,
          locked_count: 0,
          available_spots: capacity,
          status: 'open',
          version: 1,
          updated_at: new Date().toISOString()
        };

        if (batch && db) {
          batch.set(db.collection('listing_slots').doc(slotId), slot, { merge: true });
        } else {
          inMemorySlots.set(slotId, slot);
        }
        createdSlots.push(slot);
      }
    }

    if (batch) {
      await batch.commit();
    }

    return createdSlots;
  }
}
