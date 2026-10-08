"use client";

import { useState } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel } from '@/lib/types';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  QrCode, 
  Search,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';

export default function HotelsPage() {
  const hotels = XeniosStore.getHotels();
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const districts = ['all', ...Array.from(new Set(hotels.map(h => h.district)))];

  const filtered = hotels.filter(h => {
    const matchesDistrict = selectedDistrict === 'all' || h.district === selectedDistrict;
    const matchesSearch = !search || 
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100">Anlaşmalı Partner Oteller</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">Xenios Sözleşmeli Otel Envanteri ve Doğrudan Kokpit Bağlantıları</p>
        </div>

        <Link
          href="/qr-generator"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <QrCode className="w-4 h-4" />
          <span>Toplu QR Kod Yazdır</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 dark:text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Otel adı veya adres ara..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-amber-200 text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-xs"
          />
        </div>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 rounded-xl text-zinc-700 shadow-xs cursor-pointer"
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'Tüm Semtler / Bölgeler' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((hotel) => (
          <div
            key={hotel.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 hover:border-amber-400 transition space-y-3 flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                    {hotel.type}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 mt-1 leading-snug">{hotel.name}</h3>
                </div>
                <span className="text-xs font-mono text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  ★ {hotel.ratingStr.split(' ')[0]}
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{hotel.address}</span>
              </p>

              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-[11px] text-zinc-700 space-y-1">
                <strong className="text-amber-800 text-[10px] block font-bold">ComusHost V2 Hedef Notu:</strong>
                <p className="text-zinc-600 dark:text-slate-400 line-clamp-2">{hotel.targetReason}</p>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-slate-400 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-zinc-500 dark:text-slate-400" />
                  {hotel.phone}
                </span>
                {hotel.website && (
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>Web</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Room QR generator & Otel Kokpiti action */}
            <div className="pt-3 border-t border-amber-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 dark:text-slate-400">{hotel.rooms.length} Tanımlı Oda</span>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/hotel-portal?hotelId=${hotel.id}`}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1 transition"
                >
                  <span>Otel Kokpiti</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/qr-generator?hotelId=${hotel.id}`}
                  className="p-1.5 rounded-xl bg-zinc-100 hover:bg-amber-50 text-zinc-700 border border-zinc-200 transition"
                  title="Oda QR Kodları"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-600 dark:text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
