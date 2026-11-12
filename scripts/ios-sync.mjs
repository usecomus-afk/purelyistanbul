// Mac'te yerel iOS derlemesi için Capacitor senkronizasyonu.
// Tek Xcode projesi (ios/App/App.xcodeproj) iki uygulama hedefi içerir:
//   - App          -> purelyİstanbul (misafir + otel)   com.usecomus.olympus.R8LQC6KZG8
//   - PurelyAdmin  -> Purely Admin (/admin)             com.usecomus.purelyadmin.R8LQC6KZG8
// Bu betik `cap sync ios` çalıştırır, ardından GitHub Actions iş akışlarının yaptığı
// düzeltmeleri uygular ve Admin hedefinin kendi capacitor.config.json dosyasını üretir.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ADMIN_BUNDLE_ID = process.env.ADMIN_BUNDLE_ID || 'com.usecomus.purelyadmin.R8LQC6KZG8';
const BASE_URL = (process.env.CAPACITOR_SERVER_URL || 'https://purelyistanbul--xenios-prod-c55cd.us-central1.hosted.app').replace(/\/+$/, '');
const NATIVE_PLUGIN = 'XeniosNotificationPlugin';

const guestConfigPath = 'ios/App/App/capacitor.config.json';
const adminConfigPath = 'ios/App/Admin/capacitor.config.json';

execSync('npx cap sync ios', { stdio: 'inherit' });

if (!existsSync(guestConfigPath)) {
  throw new Error(`${guestConfigPath} bulunamadı; cap sync başarısız olmuş olabilir.`);
}

const guest = JSON.parse(readFileSync(guestConfigPath, 'utf8'));
guest.packageClassList = Array.from(new Set([...(guest.packageClassList || []), NATIVE_PLUGIN]));
writeFileSync(guestConfigPath, JSON.stringify(guest, null, '\t'));

const admin = {
  ...guest,
  appId: ADMIN_BUNDLE_ID,
  appName: 'Purely Admin',
  server: { url: `${BASE_URL}/admin`, cleartext: true, allowNavigation: ['*'] },
  ios: { contentInset: 'never', backgroundColor: '#F6F1E8', preferredContentMode: 'mobile' },
};
mkdirSync('ios/App/Admin', { recursive: true });
writeFileSync(adminConfigPath, JSON.stringify(admin, null, '\t'));

console.log(`\n✔ purelyİstanbul -> ${guest.server?.url}`);
console.log(`✔ Purely Admin   -> ${admin.server.url}`);
console.log('Xcode: ios/App/App.xcodeproj  (şemalar: App, PurelyAdmin)');
