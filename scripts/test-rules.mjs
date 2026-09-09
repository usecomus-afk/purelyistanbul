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
