"use client";

import { useState } from 'react';
import { XeniosStore } from '@/lib/store';
import { Experience } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Compass, Search, Phone, Globe, Star, MapPin, Clock, ExternalLink } from 'lucide-react';

export default function ExperiencesCockpitPage() {
  const experiences = XeniosStore.getExperiences() as Experience[];
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const categories = ['all', ...Array.from(new Set(experiences.map(e => e.category)))];

  const filtered = experiences.filter(e => {
    const matchesCat = selectedCat === 'all' || e.category === selectedCat;
    const matchesSearch = !search || 
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.provider.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-slate-100 pb-16">
      <div className="border-b border-amber-200 pb-4">
        <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-700" />
          <span>Gerçek İşletme & Deneyim Kataloğu</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
          13 Kategoride TÜRSAB Lisanslı Doğrulanmış Acenteler, Boğaz Turları, Hamamlar, Restoranlar & Rehberler ({filtered.length} İlan)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İlan, sağlayıcı veya bölge ara..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-amber-200 text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-xs"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-3 py-2.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 rounded-xl text-zinc-700 max-w-full sm:max-w-xs shadow-xs cursor-pointer"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'Tüm Kategoriler' : c}
            </option>
          ))}
        </select>
      </div>

      {/* 📱 MOBILE VERTICAL VIEW (No Horizontal Scroll Needed) */}
      <div className="block md:hidden space-y-3">
        {filtered.map((exp) => (
          <div
            key={exp.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                {exp.category}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 font-bold text-[10px] border border-amber-300">
                ★ {exp.scoreStr || '5.0'}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-slate-100 leading-snug">{exp.title}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-0.5">{exp.provider}</p>
            </div>

            <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] space-y-1">
              <div className="flex items-center gap-1 text-zinc-600 dark:text-slate-400">
                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{exp.location}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-600 dark:text-slate-400">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{exp.duration}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
              <strong className="text-sm font-bold font-mono text-emerald-700">
                {formatPrice(exp.price, exp.currency)}
              </strong>

              <a
                href={`tel:${exp.phone.replace(/\s/g, '')}`}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-lg text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition"
              >
                <Phone className="w-3 h-3 text-amber-700" />
                <span>{exp.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 💻 DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-amber-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-amber-50/80 text-zinc-600 dark:text-slate-400 border-b border-amber-200 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Kategori & İlan</th>
                <th className="p-4">İşletme / Sağlayıcı</th>
                <th className="p-4">Konum</th>
                <th className="p-4">İletişim</th>
                <th className="p-4">Fiyat / Süre</th>
                <th className="p-4">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-amber-50/40 transition">
                  <td className="p-4">
                    <span className="text-[10px] text-amber-800 font-bold block">{exp.category}</span>
                    <strong className="text-zinc-900 dark:text-slate-100 text-xs block mt-0.5">{exp.title}</strong>
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400 line-clamp-1 mt-0.5">{exp.agentNote}</p>
                  </td>
                  <td className="p-4 font-semibold text-zinc-800 dark:text-slate-200">{exp.provider}</td>
                  <td className="p-4 text-zinc-600 dark:text-slate-400">{exp.location}</td>
                  <td className="p-4 font-mono text-[11px] text-zinc-700">{exp.phone}</td>
                  <td className="p-4 font-mono font-bold text-emerald-700">
                    {formatPrice(exp.price, exp.currency)} <span className="text-[10px] font-normal text-zinc-500 dark:text-slate-400 font-sans">({exp.duration})</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px]">
                      ★ {exp.scoreStr || '5.0'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
