/**
 * SUNUCU TARAFI Firebase Admin SDK. Bu dosya hiçbir "use client" bileşeninden
 * import edilmemelidir — sadece API route'ları (örn. /api/admin-login)
 * içinde kullanılır.
 *
 * Cockpit'in eski env-var tabanlı admin girişini gerçek Firebase Authentication
 * ile köprülemek için kullanılır: admin, e-posta/şifre kontrolünden geçtiğinde
 * bu modül `role: 'admin'` custom claim'ine sahip bir Firebase custom token
 * üretir; istemci bu token ile signInWithCustomToken() çağırır ve artık
 * firestore.rules'daki isAdmin() kontrolünü ekstra bir girişe gerek kalmadan
 * geçer.
 *
 * Kimlik bilgileri öncelik sırasıyla sağlanabilir:
 *  1) FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
 *  2) Google Cloud Run / Firebase App Hosting yerleşik servis hesabı (ADC: K_SERVICE / FIREBASE_CONFIG / GOOGLE_APPLICATION_CREDENTIALS)
 * Hiçbiri yoksa bu modül null döner; admin girişi çalışmaya devam eder ama
 * custom token üretilmez (cockpit erişimi bozulmaz, sadece marketplace admin
 * eylemleri için ayrı bir Firebase girişi gerekir — bkz. admin-login route).
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App | null | undefined;

function initAdminApp(): App | null {
  if (app !== undefined) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'xenios-prod-c55cd';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE ||
      process.env.FIREBASE_CONFIG
    ) {
      app = initializeApp({ projectId });
    } else if (projectId && process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Yerel Firebase Auth emülatörüne karşı test için — gerçek servis hesabı gerekmez.
      // FIREBASE_AUTH_EMULATOR_HOST prod ortamında asla set edilmemelidir.
      app = initializeApp({ projectId });
    } else {
      app = null;
    }
  } catch (err) {
    console.warn('[firebase-admin] Başlatılamadı — custom token üretimi devre dışı:', err);
    app = null;
  }

  return app;
}

/** Admin SDK yapılandırılmamışsa null döner — çağıran taraf bunu graceful şekilde ele almalı. */
export function getAdminAuthOrNull() {
  const a = initAdminApp();
  return a ? getAuth(a) : null;
}
