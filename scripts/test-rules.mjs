/**
 * Firestore + Storage güvenlik kuralları için emülatör tabanlı regresyon testi.
 *
 * Amaç: firestore.rules / storage.rules üzerindeki değişikliklerin (1) mevcut
 * OCTO tur/deneyim sistemine ait kuralları (listings, listing_slots,
 * inventory_locks, bookings, system_alerts) BOZMADIĞINI ve (2) yeni
 * marketplace koleksiyonlarındaki kritik güvenlik invaryantlarını (host
 * kendi kendini onaylayamaz, kullanıcı kendi rol/komisyon alanını
 * değiştiremez, vb.) gerçekten uyguladığını kanıtlamaktır.
 *
 * Çalıştırma: `npm run test:rules` (Firebase emülatörünü otomatik ayağa
 * kaldırır, testleri çalıştırır, sonra kapatır). Canlı Firebase projesine
 * BAĞLANMAZ — tamamen yerel emülatörde çalışır.
 */
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const results = [];

function record(name, ok, err) {
  results.push({ name, ok, err });
  console.log(`${ok ? "✅" : "❌"} ${name}${ok ? "" : ` — ${err}`}`);
}

async function run() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-purelyistanbul",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") }
  });

  // Kural motorunun "mevcut veri" (resource.data) üzerinden karar verebilmesi için
  // bazı belgeleri güvenlik kurallarını atlayarak (withSecurityRulesDisabled) önceden yazıyoruz.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "listings", "l1"), { title: "Boğaz Turu" });
    await setDoc(doc(db, "listing_slots", "s1"), { capacity: 10 });
    await setDoc(doc(db, "inventory_locks", "lock1"), { guest_id: "guest1" });
    await setDoc(doc(db, "bookings", "b1"), { guest_details: { guest_id: "guest1" } });
    await setDoc(doc(db, "system_alerts", "a1"), { message: "test" });

    await setDoc(doc(db, "users", "guest1"), {
      uid: "guest1",
      roles: { guest: true, host: false },
      activeRole: "guest"
    });
    await setDoc(doc(db, "host_applications", "app1"), { uid: "guest1", status: "pending" });
    await setDoc(doc(db, "marketplace_listings", "lst1"), { hostId: "guest1", status: "draft" });
    await setDoc(doc(db, "marketplace_listings", "lst2"), { hostId: "guest1", status: "approved" });
  });

  const admin = testEnv.authenticatedContext("admin1", { role: "admin" });
  const guest = testEnv.authenticatedContext("guest1", {});
  const otherGuest = testEnv.authenticatedContext("guest2", {});
  const anon = testEnv.unauthenticatedContext();

  async function check(name, promise, expect) {
    try {
      await (expect === "allow" ? assertSucceeds(promise) : assertFails(promise));
      record(name, true);
    } catch (e) {
      record(name, false, e.message?.split("\n")[0]);
    }
  }

  // ---- Mevcut (OCTO) kurallar — davranış korunuyor mu? ----
  await check("listings: herkes okuyabilir", getDoc(doc(anon.firestore(), "listings", "l1")), "allow");
  await check(
    "listings: admin olmayan yazamaz",
    setDoc(doc(guest.firestore(), "listings", "l1"), { title: "hack" }),
    "deny"
  );
  await check(
    "listings: admin yazabilir",
    setDoc(doc(admin.firestore(), "listings", "l1"), { title: "güncel" }),
    "allow"
  );
  await check(
    "listing_slots: admin dahil hiç kimse client'tan yazamaz",
    setDoc(doc(admin.firestore(), "listing_slots", "s1"), { capacity: 5 }),
    "deny"
  );
  await check(
    "bookings: sahibi dahi client'tan yazamaz (sadece webhook/CF)",
    updateDoc(doc(guest.firestore(), "bookings", "b1"), { status: "cancelled" }),
    "deny"
  );
  await check(
    "system_alerts: admin olmayan okuyamaz",
    getDoc(doc(guest.firestore(), "system_alerts", "a1")),
    "deny"
  );
  await check("system_alerts: admin okuyabilir", getDoc(doc(admin.firestore(), "system_alerts", "a1")), "allow");

  // ---- Yeni marketplace kuralları — kritik invaryantlar ----
  await check(
    "users: kullanıcı kendi roles.host alanını true yapamaz",
    updateDoc(doc(guest.firestore(), "users", "guest1"), { roles: { guest: true, host: true }, activeRole: "guest" }),
    "deny"
  );
  await check(
    "users: kullanıcı host onayı almadan activeRole='host' yapamaz",
    updateDoc(doc(guest.firestore(), "users", "guest1"), { roles: { guest: true, host: false }, activeRole: "host" }),
    "deny"
  );
  await check(
    "users: admin roles.host'u onaylayabilir",
    updateDoc(doc(admin.firestore(), "users", "guest1"), {
      roles: { guest: true, host: true },
      activeRole: "guest"
    }),
    "allow"
  );

  await check(
    "host_applications: başka birinin uid'iyle başvuru oluşturulamaz",
    setDoc(doc(guest.firestore(), "host_applications", "fake"), { uid: "guest2", status: "pending" }),
    "deny"
  );
  await check(
    "host_applications: doğrudan status='approved' ile başvuru oluşturulamaz",
    setDoc(doc(guest.firestore(), "host_applications", "fake2"), { uid: "guest1", status: "approved" }),
    "deny"
  );
  await check(
    "host_applications: sahibi kendi başvurusunu onaylayamaz",
    updateDoc(doc(guest.firestore(), "host_applications", "app1"), { status: "approved" }),
    "deny"
  );
  await check(
    "host_applications: admin onaylayabilir",
    updateDoc(doc(admin.firestore(), "host_applications", "app1"), { status: "approved" }),
    "allow"
  );

  await check(
    "marketplace_listings: host taslaktan 'approved' durumuna kendi kendine geçemez",
    updateDoc(doc(guest.firestore(), "marketplace_listings", "lst1"), { hostId: "guest1", status: "approved" }),
    "deny"
  );
  await check(
    "marketplace_listings: host draft -> pending_review yapabilir",
    updateDoc(doc(guest.firestore(), "marketplace_listings", "lst1"), {
      hostId: "guest1",
      status: "pending_review"
    }),
    "allow"
  );
  await check(
    "marketplace_listings: admin pending_review -> approved yapabilir",
    updateDoc(doc(admin.firestore(), "marketplace_listings", "lst1"), { hostId: "guest1", status: "approved" }),
    "allow"
  );
  await check(
    "marketplace_listings: host approved -> suspended yapabilir",
    updateDoc(doc(guest.firestore(), "marketplace_listings", "lst2"), { hostId: "guest1", status: "suspended" }),
    "allow"
  );
  await check(
    "marketplace_listings: başka host'un ilanını değiştiremez",
    updateDoc(doc(otherGuest.firestore(), "marketplace_listings", "lst1"), { hostId: "guest1", status: "draft" }),
    "deny"
  );

  await check(
    "orders: misafir kendi adına 'pending' sipariş oluşturabilir",
    setDoc(doc(guest.firestore(), "orders", "o1"), { guestId: "guest1", status: "pending" }),
    "allow"
  );
  await check(
    "orders: misafir başkası adına sipariş oluşturamaz",
    setDoc(doc(guest.firestore(), "orders", "o2"), { guestId: "guest2", status: "pending" }),
    "deny"
  );
  await check(
    "orders: misafir doğrudan status='completed' ile oluşturamaz",
    setDoc(doc(guest.firestore(), "orders", "o3"), { guestId: "guest1", status: "completed" }),
    "deny"
  );

  await check(
    "legal_consents: kayıt onayı oluşturulabilir",
    setDoc(doc(guest.firestore(), "legal_consents", "c1"), { uid: "guest1", context: "registration" }),
    "allow"
  );
  await check(
    "legal_consents: log sonradan değiştirilemez",
    updateDoc(doc(guest.firestore(), "legal_consents", "c1"), { context: "tampered" }),
    "deny"
  );

  await check("cms_media: herkes okuyabilir", getDoc(doc(anon.firestore(), "cms_media", "hero")), "allow");
  await check(
    "cms_media: admin olmayan yazamaz",
    setDoc(doc(guest.firestore(), "cms_media", "hero"), { url: "hack" }),
    "deny"
  );

  // ---- Otel portalı / operasyon koleksiyonları (sıkılaştırma) ----
  await check(
    "hotels: kimliksiz istemci otel oluşturamaz",
    setDoc(doc(anon.firestore(), "hotels", "hx"), { name: "Hack Hotel" }),
    "deny"
  );
  await check(
    "hotels: admin geçerli adla yazabilir",
    setDoc(doc(admin.firestore(), "hotels", "hx"), { name: "Real Hotel" }),
    "allow"
  );
  await check(
    "hotels: admin bile adsız otel yazamaz",
    setDoc(doc(admin.firestore(), "hotels", "hy"), { city: "Istanbul" }),
    "deny"
  );

  const validReq = {
    id: "r1",
    serviceKey: "towels",
    serviceTitle: "Havlu",
    hotelId: "h1",
    roomNumber: "101",
    status: "pending",
    notes: "x",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
  await check(
    "service_requests: kimliksiz geçerli talep oluşturabilir",
    setDoc(doc(anon.firestore(), "service_requests", "r1"), validReq),
    "allow"
  );
  await check(
    "service_requests: status!='pending' ile oluşturulamaz",
    setDoc(doc(anon.firestore(), "service_requests", "r2"), { ...validReq, id: "r2", status: "completed" }),
    "deny"
  );
  await check(
    "service_requests: alan eksik talep reddedilir",
    setDoc(doc(anon.firestore(), "service_requests", "r3"), { id: "r3", status: "pending" }),
    "deny"
  );
  await check(
    "service_requests: dev boyutlu serviceTitle reddedilir",
    setDoc(doc(anon.firestore(), "service_requests", "r4"), { ...validReq, id: "r4", serviceTitle: "a".repeat(500) }),
    "deny"
  );
  await check(
    "service_requests: kimliksiz status güncelleyebilir (otel portalı)",
    updateDoc(doc(anon.firestore(), "service_requests", "r1"), { status: "in_progress", updatedAt: "2026-01-01T01:00:00.000Z" }),
    "allow"
  );
  await check(
    "service_requests: kimliksiz geçersiz status'a güncelleyemez",
    updateDoc(doc(anon.firestore(), "service_requests", "r1"), { status: "hacked" }),
    "deny"
  );
  await check(
    "service_requests: kimliksiz hotelId değiştiremez",
    updateDoc(doc(anon.firestore(), "service_requests", "r1"), { hotelId: "other" }),
    "deny"
  );
  await check(
    "service_requests: aktif (in_progress) talep kimliksiz silinemez",
    deleteDoc(doc(anon.firestore(), "service_requests", "r1")),
    "deny"
  );
  await check(
    "service_requests: tamamlanan talep kimliksiz silinebilir (geçici, TODO hotel-auth)",
    (async () => {
      await updateDoc(doc(anon.firestore(), "service_requests", "r1"), { status: "completed" });
      await deleteDoc(doc(anon.firestore(), "service_requests", "r1"));
    })(),
    "allow"
  );

  await check(
    "complaints: kimliksiz geçerli şikayet oluşturabilir",
    setDoc(doc(anon.firestore(), "complaints", "c1"), {
      businessName: "Bar X",
      description: "Fazla ücret",
      guestEmail: "a@b.com",
      status: "under_review"
    }),
    "allow"
  );
  await check("complaints: kimliksiz okuyamaz", getDoc(doc(anon.firestore(), "complaints", "c1")), "deny");
  await check("complaints: admin okuyabilir", getDoc(doc(admin.firestore(), "complaints", "c1")), "allow");
  await check(
    "complaints: dev açıklama reddedilir",
    setDoc(doc(anon.firestore(), "complaints", "c2"), {
      businessName: "Bar X",
      description: "a".repeat(6000),
      guestEmail: "a@b.com",
      status: "under_review"
    }),
    "deny"
  );

  await check(
    "investment_leads: geçerli talep oluşturulabilir",
    setDoc(doc(anon.firestore(), "investment_leads", "il1"), { guestName: "Ali", guestContact: "+90555" }),
    "allow"
  );
  await check(
    "investment_leads: adsız talep reddedilir",
    setDoc(doc(anon.firestore(), "investment_leads", "il2"), { guestContact: "+90555" }),
    "deny"
  );
  await check(
    "notifications_log: geçerli log oluşturulabilir",
    setDoc(doc(anon.firestore(), "notifications_log", "n1"), { type: "room_service", title: "t", details: { a: 1 } }),
    "allow"
  );
  await check(
    "notifications_log: dev başlık reddedilir",
    setDoc(doc(anon.firestore(), "notifications_log", "n2"), { type: "room_service", title: "a".repeat(2000) }),
    "deny"
  );
  await check(
    "ai_logs: geçerli log oluşturulabilir",
    setDoc(doc(anon.firestore(), "ai_logs", "a1"), { message: "merhaba" }),
    "allow"
  );

  // isAdmin() e-posta yedeği: e-posta doğrulanmadıkça geçerli değil
  const unverifiedFounder = testEnv.authenticatedContext("f1", { email: "anilaslan@usecomus.com", email_verified: false });
  const verifiedFounder = testEnv.authenticatedContext("f2", { email: "anilaslan@usecomus.com", email_verified: true });
  await check(
    "isAdmin: doğrulanmamış e-posta admin sayılmaz",
    getDoc(doc(unverifiedFounder.firestore(), "system_alerts", "a1")),
    "deny"
  );
  await check(
    "isAdmin: doğrulanmış e-posta admin sayılır",
    getDoc(doc(verifiedFounder.firestore(), "system_alerts", "a1")),
    "allow"
  );

  // ---- Storage kuralları ----
  const image = new Uint8Array([1, 2, 3]);
  await check(
    "storage: host kendi ilanına görsel yükleyebilir",
    uploadBytes(ref(guest.storage(), "marketplace_listings/guest1/lst1/photo.jpg"), image, {
      contentType: "image/jpeg"
    }),
    "allow"
  );
  await check(
    "storage: başka host'un klasörüne yüklenemez",
    uploadBytes(ref(otherGuest.storage(), "marketplace_listings/guest1/lst1/hack.jpg"), image, {
      contentType: "image/jpeg"
    }),
    "deny"
  );
  await check(
    "storage: görsel olmayan dosya reddedilir",
    uploadBytes(ref(guest.storage(), "marketplace_listings/guest1/lst1/evil.exe"), image, {
      contentType: "application/octet-stream"
    }),
    "deny"
  );

  await testEnv.cleanup();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} test geçti.`);
  if (failed.length > 0) {
    console.error(`${failed.length} test BAŞARISIZ.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test çalıştırma hatası:", err);
  process.exit(1);
});
