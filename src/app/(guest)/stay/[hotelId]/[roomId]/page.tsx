"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { XeniosStore } from '@/lib/store';
import { GuestConciergeView } from '@/components/guest/guest-concierge-view';

export default function StayRoomPage() {
  const params = useParams();
  const rawHotelId = params?.hotelId as string | undefined;
  const rawRoomId = params?.roomId as string | undefined;
  const hotelId = rawHotelId ? decodeURIComponent(rawHotelId) : undefined;
  const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : undefined;

  useEffect(() => {
    if (hotelId && roomId) {
      XeniosStore.setActiveHotelSession(hotelId, roomId);
    }
  }, [hotelId, roomId]);

  return <GuestConciergeView initialHotelId={hotelId} initialRoomId={roomId} />;
}
