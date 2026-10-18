"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PwaNotificationManager } from '@/lib/pwa-notifications';
import { FirestoreService } from '@/lib/firestore-service';
import { HotelAudioNotification } from '@/lib/hotel-audio-notification';
import { HotelLiveAlertBanner } from '@/components/hotel/hotel-live-alert-banner';

export function PwaRegister() {
  useEffect(() => {
    // Register Service Worker for PWA & setup notification listeners
    PwaNotificationManager.registerServiceWorker();
    PwaNotificationManager.setupGlobalNotificationListeners();

    if (Capacitor.isNativePlatform()) {
      HotelAudioNotification.requestSystemNotificationPermission().catch(() => {});
    }

    // Global live request subscription so new room orders/requests trigger notifications on any screen
    const unsubscribe = FirestoreService.subscribeToLiveRequests(null, () => {});
    return () => {
      unsubscribe();
    };
  }, []);

  return <HotelLiveAlertBanner />;
}


