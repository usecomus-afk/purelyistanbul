"use client";

import { useEffect, useState } from 'react';
import { PwaNotificationManager } from '@/lib/pwa-notifications';
import { FirestoreService } from '@/lib/firestore-service';
import { HotelAudioNotification, isNativeHostApp, shouldReceiveStaffRequestAlerts } from '@/lib/hotel-audio-notification';
import { HotelLiveAlertBanner } from '@/components/hotel/hotel-live-alert-banner';

export function PwaRegister() {
  const [enableStaffAlerts, setEnableStaffAlerts] = useState(false);

  useEffect(() => {
    // Register Service Worker for PWA & setup notification listeners
    PwaNotificationManager.registerServiceWorker();
    PwaNotificationManager.setupGlobalNotificationListeners();

    const shouldAlert = shouldReceiveStaffRequestAlerts();
    setEnableStaffAlerts(shouldAlert);

    if (isNativeHostApp()) {
      HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
    }

    if (!shouldAlert) return;

    // Global live request subscription ONLY for the Native iOS App and Hotel/Admin management portals
    const unsubscribe = FirestoreService.subscribeToLiveRequests(null, () => {});
    return () => {
      unsubscribe();
    };
  }, []);

  if (!enableStaffAlerts) return null;

  return <HotelLiveAlertBanner />;
}



