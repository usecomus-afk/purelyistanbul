"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";
import { useState, useEffect } from 'react';
import { PropertyListing, InvestorPersona, Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { getT } from '@/lib/i18n';
import { getLocalizedProperty, INVEST_MODAL_I18N } from '@/lib/invest-i18n';
import { toast } from 'sonner';
import {
  Building2, MapPin, BedDouble, Maximize2, ShieldCheck,
  Search, Bath, X, Sparkles, TrendingUp, Calendar, CheckCircle2
} from 'lucide-react';

interface InvestInIstanbulProps {
  hotel: Hotel;
  roomNumber: string;
  lang?: Language;
}

function formatUSD(amount: number) {
  return `$${amount.toLocaleString('en-US')}`;
}

export function InvestInIstanbul({ hotel, roomNumber, lang = "tr" }: InvestInIstanbulProps) {
  const t = getT(lang);
  const modalT = INVEST_MODAL_I18N[lang] || INVEST_MODAL_I18N.en;

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [personaFilter, setPersonaFilter] = useState<'all' | InvestorPersona>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PropertyListing | null>(null);
  
  // VIP Keşif Turu Modal State
  const [tourProperty, setTourProperty] = useState<PropertyListing | null>(null);
  const [tourName, setTourName] = useState('');
  const [tourContact, setTourContact] = useState('');
  const [tourDate, setTourDate] = useState('10:30');
  const [tourVehicle, setTourVehicle] = useState('VIP Mercedes Vito');
  const [tourLanguage, setTourLanguage] = useState('English / Türkçe');
  const [tourNote, setTourNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  useEffect(() => {
    const refresh = () => setProperties(XeniosStore.getPropertyListings());
    refresh();
    window.addEventListener('xenios_properties_updated', refresh);
    return () => window.removeEventListener('xenios_properties_updated', refresh);
  }, []);

  const visible = properties.filter((p) => {
    if (p.status === 'suspended') return false;
    const loc = getLocalizedProperty(p, lang);
    const matchesPersona = personaFilter === 'all' || p.personas?.includes(personaFilter);
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      loc.title.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase()) ||
      loc.district.toLowerCase().includes(search.toLowerCase()) ||
      (p.developer && p.developer.toLowerCase().includes(search.toLowerCase()));
    return matchesPersona && matchesSearch;
  });

  const openDetail = (p: PropertyListing) => {
    setSelected(p);
    XeniosStore.trackPropertyView(p);
  };

  const openTourModal = (p: PropertyListing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTourProperty(p);
    XeniosStore.trackPropertyView(p);
  };

  const closeTourModal = () => {
    setTourProperty(null);
    setTourName('');
    setTourContact('');
    setTourNote('');
  };

  const handleTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourProperty) return;
    if (!tourName.trim() || !tourContact.trim()) {
      toast.error('Lütfen bilgilerinizi giriniz.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const profile = XeniosStore.getGuestProfile();
      const newLead = XeniosStore.addInvestmentLead({
        propertyId: tourProperty.id,
        propertyTitle: tourProperty.title,
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber,
        guestName: tourName.trim(),
        guestContact: tourContact.trim(),
        note: `[VIP Keşif Turu Talebi] Saat: ${tourDate} | Transfer: ${tourVehicle} | Dil: ${tourLanguage} | Not: ${tourNote.trim() || 'Yok'}`,
        personaGuess: profile.investPersonaGuess
      });

      FirestoreService.addInvestmentLead(newLead);
      NotificationService.notifyInvestmentLead(newLead, tourProperty);
      toast.success(modalT.tourSuccess, {
        description: `${hotel.name} ${t.room} ${roomNumber} · VIP Transfer`
      });
      setIsSubmitting(false);
      closeTourModal();
      if (selected) setSelected(null);
    }, 500);
  };

  const selectedLoc = selected ? getLocalizedProperty(selected, lang) : null;
  const tourLoc = tourProperty ? getLocalizedProperty(tourProperty, lang) : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-serif text-white">{t.investTitle}</h2>
        <p className="text-xs text-white/70 max-w-xl">{t.investSubtitle}</p>
      </div>

      {/* Filter Personas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setPersonaFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'all'
              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
              : 'bg-black/20 backdrop-blur-md text-white/90 hover:bg-white/10 border-white/20'
          }`}
        >
          {t.allPersonas}
        </button>
        <button
          onClick={() => setPersonaFilter('citizenship')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'citizenship'
              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
              : 'bg-black/20 backdrop-blur-md text-white/90 hover:bg-white/10 border-white/20'
          }`}
        >
          🛂 {t.citizenshipFilter}
        </button>
        <button
          onClick={() => setPersonaFilter('short_term_rental')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'short_term_rental'
              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
              : 'bg-black/20 backdrop-blur-md text-white/90 hover:bg-white/10 border-white/20'
          }`}
        >
          🏠 {t.airbnbFilter}
        </button>
        <button
          onClick={() => setPersonaFilter('luxury_lifestyle')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'luxury_lifestyle'
              ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
              : 'bg-black/20 backdrop-blur-md text-white/90 hover:bg-white/10 border-white/20'
          }`}
        >
          🌊 {t.luxuryFilter}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/60 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => {
          const loc = getLocalizedProperty(p, lang);
          return (
            <div
              key={p.id}
              onClick={() => openDetail(p)}
              className="bg-black/20 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={p.image || '/images/realestate/vadi-1.jpg'}
                    alt={loc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {p.citizenshipEligible && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t.citizenshipEligible}</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {loc.district}
                    </span>
                    <h3 className="text-sm font-bold font-serif truncate group-hover:text-amber-300 transition-colors">
                      {loc.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                      <span>{p.bedrooms} {modalT.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>{p.areaM2} m²</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                    {loc.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                    <div>
                      <span className="text-[10px] text-white/60 block uppercase font-semibold">{modalT.priceRange}</span>
                      <strong className="text-base font-bold text-amber-800 font-mono">
                        {formatUSD(p.priceUSD)}
                      </strong>
                    </div>

                    <button
                      onClick={(e) => openTourModal(p, e)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      {t.bookDiscoveryTour}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Property Details Modal */}
      {selected && selectedLoc && (
        <div 
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/75 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="relative w-full max-w-lg bg-black/20 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/20 text-white space-y-4 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
            
            {/* Top Right Prominent Close Button */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={modalT.close}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer border border-white/20 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Header with Badge */}
            <div className="relative h-60 rounded-2xl overflow-hidden bg-zinc-900 shadow-inner">
              <img
                src={selected.image || '/images/realestate/vadi-1.jpg'}
                alt={selectedLoc.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                <span className="bg-amber-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {selectedLoc.district}
                </span>
                {selected.citizenshipEligible && (
                  <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.citizenshipEligible}</span>
                  </span>
                )}
              </div>

              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider block">
                  {selectedLoc.propertyType}
                </span>
                <h2 className="text-lg font-bold font-serif text-white drop-shadow-md">
                  {selectedLoc.title}
                </h2>
              </div>
            </div>

            {/* Agency Info */}
            <div className="flex items-center justify-between text-xs text-white/70 px-1">
              <span>{modalT.agency}: <strong className="text-white font-semibold">{selected.developer || selected.agency || 'Xenios Prime Real Estate'}</strong></span>
              <span className="font-mono text-amber-700 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">ID: {selected.id}</span>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-3 gap-2 text-center p-3.5 bg-white/10/70 rounded-2xl border border-white/20 text-xs">
              <div>
                <span className="text-[10px] text-white/60 block uppercase font-semibold">{modalT.bedrooms}</span>
                <strong className="text-white text-sm font-bold">{selected.bedrooms}</strong>
              </div>
              <div>
                <span className="text-[10px] text-white/60 block uppercase font-semibold">{modalT.grossArea}</span>
                <strong className="text-white text-sm font-bold">{selected.areaM2} m²</strong>
              </div>
              <div>
                <span className="text-[10px] text-white/60 block uppercase font-semibold">{modalT.priceRange}</span>
                <strong className="text-amber-800 font-mono text-sm font-bold">{formatUSD(selected.priceUSD)}</strong>
              </div>
            </div>

            {/* Localized Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{modalT.specs}</span>
              </h4>
              <p className="text-xs text-white/90 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/20">
                {selectedLoc.description}
              </p>
            </div>

            {/* Highlights Chips */}
            {selectedLoc.highlights && selectedLoc.highlights.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {selectedLoc.highlights.map((h: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-amber-100/60 text-amber-900 text-[11px] font-semibold border border-white/20 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-700" />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ROI & Citizenship Status Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 space-y-0.5">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">{modalT.citizenship}</span>
                <p className="text-[11px] font-semibold leading-tight">{selectedLoc.citizenshipStatus}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10/80 border border-white/20 text-amber-950 space-y-0.5">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">{modalT.roi}</span>
                <p className="text-[11px] font-semibold leading-tight">{selectedLoc.roiEstimate}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 font-bold text-xs transition cursor-pointer"
              >
                {modalT.close}
              </button>
              <button
                type="button"
                onClick={(e) => openTourModal(selected, e)}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.bookDiscoveryTour}</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* VIP Discovery Tour Modal */}
      {tourProperty && tourLoc && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTourModal();
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="relative w-full max-w-md bg-black/20 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/20 space-y-4 text-white animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
            
            {/* Top Right Prominent Close Button */}
            <button
              type="button"
              onClick={closeTourModal}
              aria-label={modalT.close}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center text-sm font-bold cursor-pointer transition border border-white/20 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pr-8">
              <h3 className="text-base font-bold font-serif text-white">{modalT.tourTitle}</h3>
              <p className="text-xs text-amber-800 font-semibold">{tourLoc.title}</p>
            </div>

            <form onSubmit={handleTourSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-white/90 font-bold block mb-1">{modalT.fullName}</label>
                <input
                  type="text"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  placeholder={modalT.fullNamePlaceholder}
                  className="w-full p-2.5 bg-black/20 backdrop-blur-md rounded-xl border border-white/20 focus:ring-2 focus:ring-amber-500/40 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-white/90 font-bold block mb-1">{modalT.phone}</label>
                <input
                  type="text"
                  value={tourContact}
                  onChange={(e) => setTourContact(e.target.value)}
                  placeholder={modalT.phonePlaceholder}
                  className="w-full p-2.5 bg-black/20 backdrop-blur-md rounded-xl border border-white/20 focus:ring-2 focus:ring-amber-500/40 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-white/90 font-bold block mb-1">{modalT.notes}</label>
                <textarea
                  value={tourNote}
                  onChange={(e) => setTourNote(e.target.value)}
                  placeholder={modalT.notesPlaceholder}
                  rows={2}
                  className="w-full p-2.5 bg-black/20 backdrop-blur-md rounded-xl border border-white/20 focus:ring-2 focus:ring-amber-500/40 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeTourModal}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white/90 font-bold rounded-2xl transition cursor-pointer"
                >
                  {modalT.close}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? '...' : modalT.bookTourBtn}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
