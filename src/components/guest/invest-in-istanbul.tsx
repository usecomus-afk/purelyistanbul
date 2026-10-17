"use client";

import { NotificationService } from "@/lib/notification-service";
import { FirestoreService } from "@/lib/firestore-service";
import { useState, useEffect } from 'react';
import { PropertyListing, InvestorPersona, Hotel, Language } from '@/lib/types';
import { XeniosStore } from '@/lib/store';
import { getT } from '@/lib/i18n';
import { getLocalizedProperty, INVEST_MODAL_I18N } from '@/lib/invest-i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { toast } from 'sonner';
import {
  MapPin, BedDouble, Maximize2, ShieldCheck,
  Search, X, Sparkles, Calendar, CheckCircle2
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
    <div className="space-y-4 px-1">
      {/* Top Header Card */}
      <div className="luxury-service-card p-4 sm:p-5 flex items-center gap-3.5">
        <div className="shrink-0">
          <LuxuryCategoryIcon categoryKey="invest" className="w-14 h-14 sm:w-16 sm:h-16" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-luxury-serif text-[19px] sm:text-[22px] font-semibold tracking-[0.04em] uppercase text-[#141414]">
            {t.investTitle}
          </h2>
          <p className="font-luxury-sans text-xs text-[#5C4938] leading-relaxed">{t.investSubtitle}</p>
        </div>
      </div>

      {/* Filter Personas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setPersonaFilter('all')}
          className={`font-luxury-sans px-3.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'all'
              ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm'
              : 'bg-[#FAF8F4]/90 backdrop-blur-md text-[#221F1C] font-semibold hover:bg-[#F3ECE0] border-[#C4B8A4]/80'
          }`}
        >
          {t.allPersonas}
        </button>
        <button
          onClick={() => setPersonaFilter('citizenship')}
          className={`font-luxury-sans px-3.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'citizenship'
              ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm'
              : 'bg-[#FAF8F4]/90 backdrop-blur-md text-[#221F1C] font-semibold hover:bg-[#F3ECE0] border-[#C4B8A4]/80'
          }`}
        >
          {t.citizenshipFilter}
        </button>
        <button
          onClick={() => setPersonaFilter('short_term_rental')}
          className={`font-luxury-sans px-3.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'short_term_rental'
              ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm'
              : 'bg-[#FAF8F4]/90 backdrop-blur-md text-[#221F1C] font-semibold hover:bg-[#F3ECE0] border-[#C4B8A4]/80'
          }`}
        >
          {t.airbnbFilter}
        </button>
        <button
          onClick={() => setPersonaFilter('luxury_lifestyle')}
          className={`font-luxury-sans px-3.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition cursor-pointer border ${
            personaFilter === 'luxury_lifestyle'
              ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm'
              : 'bg-[#FAF8F4]/90 backdrop-blur-md text-[#221F1C] font-semibold hover:bg-[#F3ECE0] border-[#C4B8A4]/80'
          }`}
        >
          {t.luxuryFilter}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8E7252] absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 text-xs font-luxury-sans text-[#141414] placeholder:text-[#78716C] bg-[#FAF8F4]/90 backdrop-blur-md rounded-2xl border-[1.5px] border-[#C4B8A4]/85 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40"
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
              className="luxury-service-card overflow-hidden cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-[#1D2025]">
                  <img
                    src={p.image || '/images/realestate/vadi-1.jpg'}
                    alt={loc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {p.citizenshipEligible && (
                    <div className="absolute top-3 left-3 bg-[#FAF8F4]/95 text-[#141414] border border-[#C4B8A4] font-luxury-sans text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#7D5E2A]" />
                      <span>{t.citizenshipEligible}</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="font-luxury-sans text-[10.5px] text-[#E5C896] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {loc.district}
                    </span>
                    <h3 className="font-luxury-serif text-[16px] font-bold text-[#FAF8F4] truncate group-hover:text-[#E5C896] transition-colors">
                      {loc.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between font-luxury-sans text-xs text-[#3D352E] font-medium">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-[#8E7252]" />
                      <span>{p.bedrooms} {modalT.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-[#8E7252]" />
                      <span>{p.areaM2} m²</span>
                    </div>
                  </div>

                  <p className="font-luxury-sans text-[11.5px] text-[#221F1C] line-clamp-2 leading-relaxed bg-[#FAF8F4]/90 p-2.5 rounded-xl border border-[#D8CBB8]">
                    {loc.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D8CBB8]">
                    <div>
                      <span className="font-luxury-sans text-[10px] text-[#6B5A48] block uppercase font-semibold">{modalT.priceRange}</span>
                      <strong className="font-luxury-serif text-lg font-bold text-[#141414]">
                        {formatUSD(p.priceUSD)}
                      </strong>
                    </div>

                    <button
                      onClick={(e) => openTourModal(p, e)}
                      className="font-luxury-sans px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm transition cursor-pointer"
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
          className="fixed inset-0 z-50 overflow-y-scroll bg-black/50 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="luxury-service-card relative w-full max-w-lg p-5 sm:p-6 space-y-4 text-[#141414] animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Right Prominent Close Button */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={modalT.close}
                className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer border border-[#C4B8A4] active:scale-95"
              >
                <X className="w-4 h-4 stroke-[1.8]" />
              </button>

              {/* Image Header with Badge */}
              <div className="relative h-60 rounded-2xl overflow-hidden bg-[#1D2025] border border-[#C4B8A4] shadow-inner">
                <img
                  src={selected.image || '/images/realestate/vadi-1.jpg'}
                  alt={selectedLoc.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <span className="font-luxury-sans bg-[#FAF8F4]/95 text-[#141414] border border-[#C4B8A4] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {selectedLoc.district}
                  </span>
                  {selected.citizenshipEligible && (
                    <span className="font-luxury-sans bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t.citizenshipEligible}</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <span className="font-luxury-sans text-xs text-[#E5C896] font-semibold uppercase tracking-wider block">
                    {selectedLoc.propertyType}
                  </span>
                  <h2 className="font-luxury-serif text-lg sm:text-xl font-bold text-[#FAF8F4] drop-shadow-md">
                    {selectedLoc.title}
                  </h2>
                </div>
              </div>

              {/* Agency Info */}
              <div className="flex items-center justify-between font-luxury-sans text-xs text-[#5C4938] px-1">
                <span>{modalT.agency}: <strong className="text-[#141414] font-bold">{selected.developer || selected.agency || 'Xenios Prime Real Estate'}</strong></span>
                <span className="font-mono text-[#7D5E2A] bg-[#FAF8F4] px-2.5 py-0.5 rounded-full border border-[#C4B8A4]">ID: {selected.id}</span>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-3 gap-2 text-center p-3.5 bg-[#FAF8F4]/90 rounded-2xl border border-[#C4B8A4] text-xs">
                <div>
                  <span className="font-luxury-sans text-[10px] text-[#6B5A48] block uppercase font-semibold">{modalT.bedrooms}</span>
                  <strong className="font-luxury-serif text-[#141414] text-base font-bold">{selected.bedrooms}</strong>
                </div>
                <div>
                  <span className="font-luxury-sans text-[10px] text-[#6B5A48] block uppercase font-semibold">{modalT.grossArea}</span>
                  <strong className="font-luxury-serif text-[#141414] text-base font-bold">{selected.areaM2} m²</strong>
                </div>
                <div>
                  <span className="font-luxury-sans text-[10px] text-[#6B5A48] block uppercase font-semibold">{modalT.priceRange}</span>
                  <strong className="font-luxury-serif text-[#7D5E2A] text-base font-bold">{formatUSD(selected.priceUSD)}</strong>
                </div>
              </div>

              {/* Localized Description */}
              <div className="space-y-1.5">
                <h4 className="font-luxury-serif text-sm font-bold uppercase tracking-[0.04em] text-[#141414] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8E7252]" />
                  <span>{modalT.specs}</span>
                </h4>
                <p className="font-luxury-sans text-xs text-[#221F1C] leading-relaxed bg-[#FAF8F4]/90 p-4 rounded-2xl border border-[#D8CBB8]">
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
                        className="font-luxury-sans px-2.5 py-1 rounded-xl bg-[#FAF8F4] text-[#5C4938] text-[11px] font-semibold border border-[#C4B8A4] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#8E7252]" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ROI & Citizenship Status Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-[#141414] space-y-0.5">
                  <span className="font-luxury-sans text-[10px] text-[#7D5E2A] font-bold uppercase block">{modalT.citizenship}</span>
                  <p className="font-luxury-sans text-[11px] font-semibold leading-tight">{selectedLoc.citizenshipStatus}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-[#141414] space-y-0.5">
                  <span className="font-luxury-sans text-[10px] text-[#7D5E2A] font-bold uppercase block">{modalT.roi}</span>
                  <p className="font-luxury-sans text-[11px] font-semibold leading-tight">{selectedLoc.roiEstimate}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#D8CBB8]">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="font-luxury-sans py-3 px-4 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] border border-[#C4B8A4] font-bold text-xs transition cursor-pointer"
                >
                  {modalT.close}
                </button>
                <button
                  type="button"
                  onClick={(e) => openTourModal(selected, e)}
                  className="font-luxury-sans flex-1 py-3 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
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
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-3 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTourModal();
          }}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div 
              className="luxury-service-card relative w-full max-w-md p-5 sm:p-6 space-y-4 text-[#141414] animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Right Prominent Close Button */}
              <button
                type="button"
                onClick={closeTourModal}
                aria-label={modalT.close}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] flex items-center justify-center text-sm font-bold cursor-pointer transition border border-[#C4B8A4] active:scale-95"
              >
                <X className="w-4 h-4 stroke-[1.8]" />
              </button>

              <div className="space-y-1 pr-8">
                <h3 className="font-luxury-serif text-lg font-bold uppercase tracking-[0.04em] text-[#141414]">{modalT.tourTitle}</h3>
                <p className="font-luxury-sans text-xs text-[#7D5E2A] font-semibold">{tourLoc.title}</p>
              </div>

              <form onSubmit={handleTourSubmit} className="space-y-3 text-xs font-luxury-sans">
                <div>
                  <label className="text-[#141414] font-bold block mb-1">{modalT.fullName}</label>
                  <input
                    type="text"
                    value={tourName}
                    onChange={(e) => setTourName(e.target.value)}
                    placeholder={modalT.fullNamePlaceholder}
                    className="w-full p-2.5 bg-[#FAF8F4] text-[#141414] placeholder:text-[#78716C] rounded-xl border border-[#C4B8A4] focus:ring-2 focus:ring-[#8E7252]/40 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#141414] font-bold block mb-1">{modalT.phone}</label>
                  <input
                    type="text"
                    value={tourContact}
                    onChange={(e) => setTourContact(e.target.value)}
                    placeholder={modalT.phonePlaceholder}
                    className="w-full p-2.5 bg-[#FAF8F4] text-[#141414] placeholder:text-[#78716C] rounded-xl border border-[#C4B8A4] focus:ring-2 focus:ring-[#8E7252]/40 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#141414] font-bold block mb-1">{modalT.notes}</label>
                  <textarea
                    value={tourNote}
                    onChange={(e) => setTourNote(e.target.value)}
                    placeholder={modalT.notesPlaceholder}
                    rows={2}
                    className="w-full p-2.5 bg-[#FAF8F4] text-[#141414] placeholder:text-[#78716C] rounded-xl border border-[#C4B8A4] focus:ring-2 focus:ring-[#8E7252]/40 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeTourModal}
                    className="py-3 px-4 bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] border border-[#C4B8A4] font-bold rounded-xl transition cursor-pointer"
                  >
                    {modalT.close}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
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
