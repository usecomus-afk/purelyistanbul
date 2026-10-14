"use client";

import { HotelAdminPanel } from '@/components/cockpit/hotel-admin-panel';

export default function HotelsPage() {
  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      <div className="border-b border-amber-200 pb-4">
        <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100">
          Anlaşmalı Partner Oteller & Oda Envanteri Yönetimi
        </h1>
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          Purelyİstanbul sözleşmeli otel envanteri, yeni tesis kaydı, oda/Wi-Fi yönetimi ve doğrudan otel kokpiti bağlantıları
        </p>
      </div>

      <HotelAdminPanel />
    </div>
  );
}

