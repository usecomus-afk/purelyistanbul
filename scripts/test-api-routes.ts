/**
 * HTTP Integration Test Suite for Purely Istanbul API Routes:
 * 1. POST /api/ops/bookings (Capacity enforcement & 409 Conflict on overbooking)
 * 2. GET /api/channels/ical/exp-test/export.ics (RFC 5545 Content-Type text/calendar)
 * 3. GET /api/admin/settings/finance (Auth protection)
 * 4. GET /api/admin/inventory/slots (Auth protection)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3106';

async function run() {
  console.log(`\nTesting API Routes on ${BASE_URL}...\n`);

  let allOk = true;

  // Test 1: iCal Export Feed
  try {
    const res = await fetch(`${BASE_URL}/api/channels/ical/exp_cagaloglu_hamam/export.ics`);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 200 && contentType.includes('text/calendar') && text.includes('BEGIN:VCALENDAR')) {
      console.log('  ✅ GET /api/channels/ical/.../export.ics -> 200 OK & valid iCalendar format');
    } else {
      console.error(`  ❌ GET /api/channels/ical failed: status=${res.status}, type=${contentType}`);
      allOk = false;
    }
  } catch (e: any) {
    console.error('  ❌ iCal route fetch error:', e.message);
    allOk = false;
  }

  // Test 2: Admin Finance Settings Auth Protection (Unauthorized without admin token)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/settings/finance`);
    if (res.status === 401 || res.status === 403) {
      console.log('  ✅ GET /api/admin/settings/finance -> Protected (401/403 Unauthorized without token)');
    } else {
      console.error(`  ❌ GET /api/admin/settings/finance expected 401/403, got ${res.status}`);
      allOk = false;
    }
  } catch (e: any) {
    console.error('  ❌ Finance route fetch error:', e.message);
    allOk = false;
  }

  // Test 3: Admin Inventory Slots Auth Protection
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inventory/slots?listingId=exp_1`);
    if (res.status === 401 || res.status === 403) {
      console.log('  ✅ GET /api/admin/inventory/slots -> Protected (401/403 Unauthorized without token)');
    } else {
      console.error(`  ❌ GET /api/admin/inventory/slots expected 401/403, got ${res.status}`);
      allOk = false;
    }
  } catch (e: any) {
    console.error('  ❌ Inventory slots route fetch error:', e.message);
    allOk = false;
  }

  // Test 4: Ops Bookings Overbooking Protection via HTTP
  // Step 4a: First booking filling 10 seats of a 12-seat capacity slot
  const testDate = `2026-12-15`;
  const testTime = `10:00`;
  const testExpId = `exp_http_test_${Date.now()}`;

  try {
    const res1 = await fetch(`${BASE_URL}/api/ops/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experienceId: testExpId,
        experienceTitle: 'HTTP Test Boat Tour',
        guestName: 'First Group',
        hotelId: 'hotel-1',
        hotelName: 'Heritage Hotel',
        roomNumber: '101',
        guestCount: 10,
        bookingDate: testDate,
        bookingTime: testTime,
        amount: 500,
        currency: 'EUR'
      })
    });
    const data1 = await res1.json();
    if (res1.status === 200 && data1.success) {
      console.log('  ✅ POST /api/ops/bookings -> 200 OK (First 10 seats booked successfully)');
    } else {
      console.error('  ❌ POST /api/ops/bookings first booking failed:', res1.status, data1);
      allOk = false;
    }

    // Step 4b: Attempting to book 5 more seats when only 2 remain -> MUST RETURN 409 Conflict!
    const res2 = await fetch(`${BASE_URL}/api/ops/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experienceId: testExpId,
        experienceTitle: 'HTTP Test Boat Tour',
        guestName: 'Overbooking Attempt Group',
        hotelId: 'hotel-1',
        hotelName: 'Heritage Hotel',
        roomNumber: '102',
        guestCount: 5, // Requires 5 seats, but only 2 remain!
        bookingDate: testDate,
        bookingTime: testTime,
        amount: 250,
        currency: 'EUR'
      })
    });
    const data2 = await res2.json();
    if (res2.status === 409 && data2.error === 'INSUFFICIENT_CAPACITY') {
      console.log('  ✅ POST /api/ops/bookings -> 409 Conflict INSUFFICIENT_CAPACITY (Overbooking blocked by HTTP API!)');
    } else {
      console.error('  ❌ POST /api/ops/bookings expected 409 INSUFFICIENT_CAPACITY, got:', res2.status, data2);
      allOk = false;
    }
  } catch (e: any) {
    console.error('  ❌ Ops bookings route fetch error:', e.message);
    allOk = false;
  }

  if (allOk) {
    console.log('\n🎉 ALL HTTP API ROUTE INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME HTTP API ROUTE TESTS FAILED!\n');
    process.exit(1);
  }
}

run();
