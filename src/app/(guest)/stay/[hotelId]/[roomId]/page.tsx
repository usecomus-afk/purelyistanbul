"use client";

import { useParams } from 'next/navigation';
import { GuestConciergeView } from '@/components/guest/guest-concierge-view';

export default function StayRoomPage() {
  const params = useParams();
  const hotelId = (params?.hotelId as string) || undefined;
  const roomId = (params?.roomId as string) || undefined;

  return <GuestConciergeView initialHotelId={hotelId} initialRoomId={roomId} />;
}
