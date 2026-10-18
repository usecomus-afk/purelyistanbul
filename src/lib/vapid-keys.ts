/**
 * VAPID Keys for RFC 8030 / RFC 8292 Web Push Notifications
 * Enables lock-screen push notifications on iOS 16.4+ Home Screen PWAs,
 * Android Chrome PWAs, and modern desktop/mobile browsers.
 */

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BD6GJHtL43GilWgXOZZBD-IdMO8eE3exCJExCaI6kRy5aGeQsNeJ2GxSZ9J36BN5B3VXYJ3cPo1gFn3obPPh7cE';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'EhytyxSeFeZvto6Q0fSDUdrz9_3RJatbNrSy1ref4uo';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:hi@usecomus.com';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
