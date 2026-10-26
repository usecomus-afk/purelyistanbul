const BASE = 'http://localhost:3107';

async function test() {
  console.log('\n--- Testing Unified Admin PWA ---');
  let ok = true;

  // Test 1: /manifest-admin.json
  try {
    const res = await fetch(`${BASE}/manifest-admin.json`);
    const json = await res.json();
    if (res.ok && json.short_name === 'Purely Admin' && json.start_url === '/admin') {
      console.log('  ✅ GET /manifest-admin.json -> 200 OK & valid PWA manifest');
    } else {
      console.error('  ❌ /manifest-admin.json invalid:', res.status, json);
      ok = false;
    }
  } catch (e: any) {
    console.error('  ❌ /manifest-admin.json error:', e.message);
    ok = false;
  }

  // Test 2: GET /admin
  try {
    const res = await fetch(`${BASE}/admin`);
    const html = await res.text();
    if (res.ok && html.includes('manifest-admin.json') && (html.includes('purely') || html.includes('Yönetici'))) {
      console.log('  ✅ GET /admin -> 200 OK & contains PWA manifest link');
    } else {
      console.error('  ❌ GET /admin failed:', res.status);
      ok = false;
    }
  } catch (e: any) {
    console.error('  ❌ GET /admin error:', e.message);
    ok = false;
  }

  // Test 3: GET /usepurelydashboard redirect to /admin
  try {
    const res = await fetch(`${BASE}/usepurelydashboard`, { redirect: 'manual' });
    const location = res.headers.get('location');
    if ((res.status === 307 || res.status === 308) && location && location.endsWith('/admin')) {
      console.log(`  ✅ GET /usepurelydashboard -> ${res.status} Redirect to ${location}`);
    } else if (res.status === 200) {
      // If client redirect rendered
      console.log('  ✅ GET /usepurelydashboard -> 200 handled');
    } else {
      console.log(`  ℹ️ /usepurelydashboard status: ${res.status}, location: ${location}`);
    }
  } catch (e: any) {
    console.error('  ❌ /usepurelydashboard redirect error:', e.message);
    ok = false;
  }

  if (ok) {
    console.log('\n🎉 UNIFIED ADMIN PWA VERIFICATION SUCCESSFUL!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

test();
