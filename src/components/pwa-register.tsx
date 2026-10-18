"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PwaNotificationManager } from '@/lib/pwa-notifications';
import { FirestoreService } from '@/lib/firestore-service';
import {
  HotelAudioNotification,
  isNativeHostApp,
  shouldReceiveStaffRequestAlerts,
} from '@/lib/hotel-audio-notification';
import { HotelLiveAlertBanner } from '@/components/hotel/hotel-live-alert-banner';

export function PwaRegister() {
  const pathname = usePathname();
  const [enableStaffAlerts, setEnableStaffAlerts] = useState(false);

  useEffect(() => {
    PwaNotificationManager.registerServiceWorker();
    PwaNotificationManager.setupGlobalNotificationListeners();
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const evaluateAndSubscribe = () => {
      const nativeApp = isNativeHostApp();
      const shouldAlert = shouldReceiveStaffRequestAlerts(pathname || undefined);
      setEnableStaffAlerts(shouldAlert);

      if (nativeApp || shouldAlert) {
        HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
        HotelAudioNotification.startNativeWebViewKeepAlive();
        PwaNotificationManager.subscribeToWebPush({ role: 'staff' }).catch(() => {});
      } else {
        PwaNotificationManager.subscribeToWebPush({ role: 'guest' }).catch(() => {});
      }

      if (shouldAlert && !unsub) {
        unsub = FirestoreService.subscribeToLiveRequests(null, () => {});
      } else if (!shouldAlert && unsub) {
        unsub();
        unsub = null;
      }
    };

    const handleUserGestureForPush = () => {
      if (shouldReceiveStaffRequestAlerts(pathname || undefined)) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
        } else {
          PwaNotificationManager.subscribeToWebPush({ role: 'staff' }).catch(() => {});
        }
      }
    };

    evaluateAndSubscribe();
    const t1 = setTimeout(evaluateAndSubscribe, 400);
    const t2 = setTimeout(evaluateAndSubscribe, 1500);
    window.addEventListener('xenios_hotel_portal_auth', evaluateAndSubscribe);
    window.addEventListener('xenios_master_admin_auth', evaluateAndSubscribe);
    window.addEventListener('storage', evaluateAndSubscribe);
    window.addEventListener('click', handleUserGestureForPush, { once: true, passive: true });
    window.addEventListener('touchstart', handleUserGestureForPush, { once: true, passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('xenios_hotel_portal_auth', evaluateAndSubscribe);
      window.removeEventListener('xenios_master_admin_auth', evaluateAndSubscribe);
      window.removeEventListener('storage', evaluateAndSubscribe);
      window.removeEventListener('click', handleUserGestureForPush);
      window.removeEventListener('touchstart', handleUserGestureForPush);
      if (unsub) {
        unsub();
        unsub = null;
      }
    };
  }, [pathname]);

  if (!enableStaffAlerts) return null;

  return <HotelLiveAlertBanner />;
}
