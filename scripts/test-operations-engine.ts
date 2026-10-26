/**
 * Purely Istanbul Operations Overhaul & Overbooking Prevention Verification Suite
 * Tests:
 * 1. InventoryEngine (ACID slot reservation, locks, confirmations, TTL expiry, overbooking prevention)
 * 2. ICalSyncService (RFC 5545 feed generation, event parsing, external calendar sync)
 * 3. Hotel Visibility (hotel-specific filtering vs global showcase)
 */

import { InventoryEngine } from '../src/services/inventoryEngine';
import { ICalSyncService } from '../src/services/icalSyncService';
import type { Experience } from '../src/lib/types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } else {
    results.push({ name, passed: false, error: message || 'Assertion failed' });
    console.error(`  ❌ ${name}: ${message || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('PURELY ISTANBUL OPERASYON & ENVANTER TEST PAKETİ');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. ADIM: ENVANTER MOTORU & SEANS KONTENJAN DENETİMİ (OVERBOOKING)
  // -----------------------------------------------------------------
  console.log('--- 1. Envanter Motoru & Çifte Rezervasyon Önleme Testleri ---');

  // Test 1.1: SlotId standardizasyonu
  const slotId = InventoryEngine.formatSlotId('exp_bosphorus_cruise', '2026-10-27', '14:00');
  assert(
    slotId === 'exp_bosphorus_cruise_20261027_1400',
    'formatSlotId standart slotId üretir (expId_YYYYMMDD_HHmm)',
    `Beklenen: exp_bosphorus_cruise_20261027_1400, Gelen: ${slotId}`
  );

  // Test 1.2: Toplu seans üretici
  const bulkSlots = await InventoryEngine.bulkCreateSlots({
    listingId: 'exp_yacht_sunset',
    dates: ['2026-11-01', '2026-11-02'],
    timeSlots: ['10:00', '15:00'],
    capacity: 8
  });
  assert(
    bulkSlots.length === 4,
    'bulkCreateSlots 2 gün x 2 saat = 4 seans üretir',
    `Üretilen: ${bulkSlots.length}`
  );
  assert(
    bulkSlots[0].capacity === 8 && bulkSlots[0].available_spots === 8 && bulkSlots[0].booked_count === 0,
    'bulkCreateSlots varsayılan kontenjan ve dolulukları doğru ilklendirir'
  );

  // Test 1.3: Geçici Koltuk Kilitleme (10 dk TTL Lock)
  const targetSlotId = bulkSlots[0].slot_id;
  const lockRes = await InventoryEngine.reserveInventorySlot({
    slotId: targetSlotId,
    requestedSeats: 3,
    guestId: 'guest_101',
    hotelId: 'hotel_heritage',
    roomNumber: '204',
    guestName: 'John Doe',
    guestPhone: '+905551112233',
    guestEmail: 'john@example.com'
  });

  assert(lockRes.success && Boolean(lockRes.lockId), 'reserveInventorySlot başarıyla 10 dakikalık kilit oluşturur');
  assert(lockRes.lockedSeats === 3, 'reserveInventorySlot 3 koltuğu kilitler');
  assert(
    lockRes.slot.available_spots === 5 && lockRes.slot.locked_count === 3,
    'reserveInventorySlot kalan net kontenjanı anında 8 - 3 = 5 koltuğa düşürür'
  );

  // Test 1.4: Kesin Rezervasyona Dönüştürme (confirmBooking)
  const confirmRes = await InventoryEngine.confirmBooking({
    lockId: lockRes.lockId,
    paymentIntentId: 'pi_test_12345',
    totalAmount: 450,
    currency: 'EUR',
    hotelName: 'Heritage Old City Hotel'
  });

  assert(confirmRes.success && confirmRes.booking.status === 'CONFIRMED', 'confirmBooking kilidi kesin rezervasyona dönüştürür');
  const slotAfterConfirm = await InventoryEngine.getSlotAvailability(targetSlotId);
  assert(
    slotAfterConfirm?.booked_count === 3 && slotAfterConfirm?.locked_count === 0 && slotAfterConfirm?.available_spots === 5,
    'confirmBooking koltuğu kesinleşmiş sayar ve locked_count düşürür'
  );

  // Test 1.5: Kapasite Aşımında Reddetme (Overbooking Prevention)
  // Kalan kontenjan: 5 koltuk. 6 koltuk talep edilirse REDDEDİLMELİDİR!
  let overbookingBlocked = false;
  try {
    await InventoryEngine.reserveInventorySlot({
      slotId: targetSlotId,
      requestedSeats: 6, // 5 koltuk varken 6 talep edildi
      guestId: 'guest_102',
      hotelId: 'hotel_heritage',
      roomNumber: '205',
      guestName: 'Jane Smith',
      guestPhone: '+905559998877',
      guestEmail: 'jane@example.com'
    });
  } catch (err: any) {
    if (err.message.includes('INSUFFICIENT_CAPACITY')) {
      overbookingBlocked = true;
    }
  }
  assert(overbookingBlocked, 'Kapasite aşıldığında reserveInventorySlot INSUFFICIENT_CAPACITY hatası verir');

  // Test 1.6: Doğrudan Rezervasyon (directBookSlot) Kontrolü
  // Kalan 5 koltuktan 5'ini dolduruyoruz
  const directBookSuccess = await InventoryEngine.directBookSlot({
    listingId: 'exp_yacht_sunset',
    date: '2026-11-01',
    timeSlot: '10:00',
    guestCount: 5,
    defaultCapacity: 8
  });
  assert(
    directBookSuccess.success && directBookSuccess.remainingSpots === 0,
    'directBookSlot kalan 5 koltuğu başarıyla rezerve eder ve kalan kontenjan 0 olur'
  );

  // Şimdi seans tamamen doldu (8/8). Yeni bir misafir 1 koltuk bile rezerve etmeye çalıştığında ÇİFTE REZERVASYON ENGELLENMELİ!
  const directBookOverbooking = await InventoryEngine.directBookSlot({
    listingId: 'exp_yacht_sunset',
    date: '2026-11-01',
    timeSlot: '10:00',
    guestCount: 1,
    defaultCapacity: 8
  });
  assert(
    !directBookOverbooking.success && directBookOverbooking.error === 'INSUFFICIENT_CAPACITY',
    'Tamamen dolan seansta directBookSlot işlemi INSUFFICIENT_CAPACITY ile engeller (Zero Overbooking)'
  );

  // Test 1.7: Seansı Kapatma / Bloke Etme
  const slotToClose = bulkSlots[1].slot_id;
  await InventoryEngine.upsertSlot({
    ...bulkSlots[1],
    status: 'closed',
    closed_reason: 'Tadilat / Özel Tahsis'
  });
  const closedSlotBooking = await InventoryEngine.directBookSlot({
    listingId: bulkSlots[1].listing_id,
    date: bulkSlots[1].date || '2026-11-01',
    timeSlot: bulkSlots[1].time_slot || '15:00',
    guestCount: 1
  });
  assert(
    !closedSlotBooking.success && closedSlotBooking.error === 'SLOT_CLOSED',
    'Kapatılan / Bloke edilen seansa rezervasyon yapılamaz (SLOT_CLOSED hatası)'
  );

  // -----------------------------------------------------------------
  // 2. ADIM: KANAL ENTEGRASYONU (iCal & DIŞ TAKVİM)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Kanal Entegrasyonu (iCal Feed & Parse) Testleri ---');

  // Test 2.1: RFC 5545 iCal takvim akışı üretimi
  const feedContent = ICalSyncService.generateICalFeed({
    listingId: 'exp_yacht_sunset',
    listingTitle: 'Sunset Yacht Bosphorus',
    events: [
      {
        id: 'bk_1',
        title: 'Özel Boğaz Turu',
        startTime: '2026-11-01T10:00:00Z',
        endTime: '2026-11-01T12:00:00Z',
        guestCount: 3,
        description: 'Purely Istanbul Rezervasyon Kodu: XEN-ABC123'
      }
    ]
  });

  assert(feedContent.includes('BEGIN:VCALENDAR') && feedContent.includes('END:VCALENDAR'), 'generateICalFeed RFC 5545 VCALENDAR bloğu üretir');
  assert(feedContent.includes('BEGIN:VEVENT') && feedContent.includes('SUMMARY:RESERVED: Özel Boğaz Turu'), 'generateICalFeed rezervasyon VEVENT bloğunu doğru oluşturur');
  assert(feedContent.includes('DTSTART:20261101T100000Z'), 'generateICalFeed başlangıç saatini ISO UTC biçiminde formatlar');

  // Test 2.2: Dış platform (Airbnb / Booking.com) iCal feed çözümü
  const sampleExternalIcal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Airbnb Inc//Hosting Calendar//EN',
    'BEGIN:VEVENT',
    'UID:airbnb_reservation_12345@airbnb.com',
    'DTSTART;VALUE=DATE:20261110',
    'DTEND;VALUE=DATE:20261112',
    'SUMMARY:Airbnb (Not available)',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const importResult = await ICalSyncService.parseAndImportICalFeed(sampleExternalIcal, 'exp_yacht_sunset');
  assert(importResult.importedEventsCount === 1, 'parseAndImportICalFeed dış takvimden 1 etkinlik çözümler');
  assert(
    importResult.blockedRanges.length === 1 && importResult.blockedRanges[0].summary.includes('Airbnb'),
    'parseAndImportICalFeed bloke tarih aralığını doğru tespit eder'
  );

  // -----------------------------------------------------------------
  // 3. ADIM: OTELE ÖZEL İLAN GÖRÜNÜRLÜĞÜ (HOTEL VISIBILITY)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Otele Özel İlan Görünürlüğü (Hotel Visibility) Testleri ---');

  const testExperiences: Experience[] = [
    {
      id: 'exp_global',
      title: 'Genel İstanbul Hamam Deneyimi',
      category: 'Hamam',
      provider: 'Tarihi Hamam',
      location: 'Sultanahmet',
      phone: '+905320000001',
      website: '',
      agentNote: '',
      scoreStr: '4.9',
      price: 60,
      currency: 'EUR',
      duration: '90 Dk',
      rating: 4.9,
      coords: { lat: 41, lng: 28 },
      categoryTag: 'Hamam',
      iconName: 'Compass',
      hotelVisibility: 'all', // Bütün otellerde görünür
      status: 'active'
    },
    {
      id: 'exp_exclusive_soho',
      title: 'Soho House Özel Rooftop Kokteyl',
      category: 'Gastronomi',
      provider: 'Soho House Lounge',
      location: 'Beyoğlu',
      phone: '+905320000002',
      website: '',
      agentNote: '',
      scoreStr: '5.0',
      price: 120,
      currency: 'EUR',
      duration: '2 Saat',
      rating: 5.0,
      coords: { lat: 41.03, lng: 28.97 },
      categoryTag: 'Gastronomi',
      iconName: 'Compass',
      hotelVisibility: 'specific', // Sadece Soho House misafirlerine açık!
      allowedHotelIds: ['hotel_soho_house'],
      status: 'active'
    }
  ];

  // Filtreleme fonksiyonu simülasyonu (guest-concierge-view.tsx ile birebir aynı)
  const filterForHotel = (exps: Experience[], activeHotelId: string) => {
    return exps.filter((e) => {
      if (e.status === 'suspended') return false;
      if (e.hotelVisibility === 'specific' && Array.isArray(e.allowedHotelIds) && e.allowedHotelIds.length > 0) {
        if (!e.allowedHotelIds.includes(activeHotelId)) return false;
      }
      return true;
    });
  };

  const sohoGuestListings = filterForHotel(testExperiences, 'hotel_soho_house');
  const fourSeasonsGuestListings = filterForHotel(testExperiences, 'hotel_four_seasons');

  assert(
    sohoGuestListings.some((e) => e.id === 'exp_exclusive_soho') &&
    sohoGuestListings.some((e) => e.id === 'exp_global'),
    'Soho House misafiri hem genel ilanı hem de otele özel özel Rooftop ilanını görür'
  );

  assert(
    fourSeasonsGuestListings.some((e) => e.id === 'exp_global') &&
    !fourSeasonsGuestListings.some((e) => e.id === 'exp_exclusive_soho'),
    'Four Seasons misafiri genel ilanı görür, Soho House\'a özel Rooftop ilanını ASLA GÖRMEZ'
  );

  // -----------------------------------------------------------------
  // ÖZET VE RAPOR
  // -----------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n======================================================');
  console.log(`TEST SONUCU: ${passedCount}/${results.length} BAŞARILI`);
  if (failedCount === 0) {
    console.log('🎉 TÜM OPERASYON VE ENVANTER DOĞRULAMA TESTLERİ BAŞARIYLA GEÇTİ!');
  } else {
    console.error(`⚠️ ${failedCount} ADET TEST BAŞARISIZ OLDU!`);
  }
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
