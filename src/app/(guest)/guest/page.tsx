"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XeniosStore } from '@/lib/store';
import { GuestConciergeView } from '@/components/guest/guest-concierge-view';

export default function GuestDirectPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (XeniosStore.hasActiveHotelSession()) {
      setAllowed(true);
    } else {
      router.replace('/');
    }
  }, [router]);

  if (!allowed) return null;

  return (
    <GuestConciergeView
      initialHotelId={XeniosStore.getActiveHotelId()}
      initialRoomId={XeniosStore.getActiveRoomId()}
    />
  );
}
