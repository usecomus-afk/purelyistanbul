"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XeniosStore } from '@/lib/store';

export default function StayRoomPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.hotelId && params?.roomId) {
      const hotelId = params.hotelId as string;
      const roomId = params.roomId as string;

      XeniosStore.setActiveHotelId(hotelId);
      XeniosStore.setActiveRoomId(roomId);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('xenios_session_updated'));
        window.location.replace('/');
      } else {
        router.replace('/');
      }
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center p-4">
      <div className="text-center space-y-3 bg-white p-6 rounded-3xl border border-amber-200 shadow-lg animate-pulse max-w-sm">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
          🏛️
        </div>
        <h2 className="text-base font-bold text-zinc-900 font-serif">purelyİstanbul Girişi Yapılıyor...</h2>
        <p className="text-xs text-zinc-500">Oda kimliğiniz doğrulanıyor ve dijital rehberiniz yükleniyor.</p>
      </div>
    </div>
  );
}
