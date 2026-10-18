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

      if (nativeApp) {
        HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
        HotelAudioNotification.startNativeWebViewKeepAlive();
      }

      if (shouldAlert && !unsub) {
        unsub = FirestoreService.subscribeToLiveRequests(null, () => {});
      } else if (!shouldAlert && unsub) {
        unsub();
        unsub = null;
      }
    };

    evaluateAndSubscribe();
    const t1 = setTimeout(evaluateAndSubscribe, 400);
    const t2 = setTimeout(evaluateAndSubscribe, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (unsub) {
        unsub();
        unsub = null;
      }
    };
  }, [pathname]);

  if (!enableStaffAlerts) return null;

  return <HotelLiveAlertBanner />;
}




