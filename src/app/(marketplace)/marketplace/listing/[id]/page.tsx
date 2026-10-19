"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  X,
  ImageOff,
  MapPin,
  Users,
  ShieldCheck,
  Clock,
  CalendarCheck,
  Navigation,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { watchListing, bumpListingStat } from "@/lib/marketplace/listings";
import { useCategoryConfigs } from "@/lib/marketplace/use-category-configs";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import type { MarketplaceListing } from "@/lib/marketplace/types";

interface ItineraryStep {
  time: string;
  title: string;
  detail: string;
}

interface StructuredExperienceDetails {
  cancellationBadge: string;
  durationLabel: string;
  itinerary: ItineraryStep[];
  included: string[];
  excluded: string[];
  meetingPoint: {
    locationName: string;
    meetingTimeNote: string;
    pickupDetails: string;
    coordinates: { lat: number; lng: number };
    mapQuery: string;
  };
}

function buildExperienceDetails(listing: MarketplaceListing): StructuredExperienceDetails {
  const cat = listing.category || "cat-1";
  const baseAmenities = listing.amenities && listing.amenities.length > 0 ? listing.amenities : [];

  if (cat === "cat-1") {
    return {
      cancellationBadge: "Free cancellation up to 48 hours before start",
      durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "2 – 3 Hours",
      itinerary: [
        {
          time: "00:00",
          title: "Private Pier Welcome & Captain Briefing",
          detail:
            "Meet your licensed captain and crew at the designated Bosphorus pier. Enjoy welcome refreshments as you board.",
        },
        {
          time: "00:25",
          title: "European Shoreline & Ottoman Palaces",
          detail:
            "Cruise past Dolmabahçe Palace, Çırağan Kempinski, Ortaköy Mosque, and the historic waterfront yalı mansions.",
        },
        {
          time: "01:15",
          title: "Rumeli Fortress & Two-Continent Strait Crossing",
          detail:
            "Sail beneath the Bosphorus bridges toward the Asian shoreline, passing Anadolu Hisarı and Beylerbeyi Palace.",
        },
        {
          time: "02:00",
          title: "Maiden's Tower Panorama & Disembarkation",
          detail:
            "Pause off Maiden's Tower (Kız Kulesi) for golden-hour photographs before returning smoothly to your departure pier.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Licensed private vessel & experienced maritime crew",
          "Complimentary Turkish tea, artisanal coffee & bottled water",
          "All port taxes, fuel, and pier mooring fees",
          "24/7 WhatsApp Concierge coordination",
        ])
      ),
      excluded: [
        "Imported alcoholic beverages unless pre-ordered via Concierge",
        "Private hotel-to-pier chauffeur transfer (available as an add-on)",
        "Discretionary crew gratuities",
      ],
      meetingPoint: {
        locationName: "Kabataş / Karaköy Private Yacht Pier, Beyoğlu",
        meetingTimeNote: "Please arrive 15 minutes prior to your confirmed sailing time.",
        pickupDetails:
          "Your exact berth number, yacht name, and captain's live WhatsApp contact are shared upon booking confirmation.",
        coordinates: listing.coords ?? { lat: 41.0339, lng: 28.9932 },
        mapQuery: "Kabatas+Yacht+Pier+Istanbul",
      },
    };
  }

  if (cat === "cat-2") {
    return {
      cancellationBadge: "Free cancellation up to 48 hours before start",
      durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "3 – 4 Hours",
      itinerary: [
        {
          time: "00:00",
          title: "Historian Meet & Fast-Track Briefing",
          detail:
            "Meet your Ministry-licensed (TUREB) historian guide in Sultanahmet and receive your pre-reserved fast-track museum credentials.",
        },
        {
          time: "00:30",
          title: "Priority Entry & Architectural Walkthrough",
          detail:
            "Bypass standard ticket queues and explore the imperial monuments of the Historical Peninsula with in-depth historical context.",
        },
        {
          time: "02:00",
          title: "Hidden Courtyards & Artisanal Tea Pause",
          detail:
            "Discover quiet Ottoman courtyards, ancient cisterns, and neighborhood backstreets away from crowded tourist paths.",
        },
        {
          time: "03:00",
          title: "Curated Conclusion & Local Recommendations",
          detail:
            "Conclude in the Old City with personalized dining and gallery tips from your historian.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Ministry of Culture & Tourism (TUREB) licensed historian guide",
          "Fast-track priority ticket coordination",
          "Whisper audio headset system for clear acoustics",
          "TÜRSAB Group A agency operational insurance",
        ])
      ),
      excluded: [
        "Personal souvenirs and optional lunch",
        "Hotel drop-off after the walk",
        "Discretionary guide gratuities",
      ],
      meetingPoint: {
        locationName: "Sultanahmet Square — German Fountain (Alman Çeşmesi), Fatih",
        meetingTimeNote: "Meet your licensed guide 15 minutes before the scheduled start time.",
        pickupDetails:
          "Your guide will hold a discreet Purely Istanbul credential badge and connect with you via WhatsApp prior to departure.",
        coordinates: listing.coords ?? { lat: 41.0066, lng: 28.9769 },
        mapQuery: "German+Fountain+Sultanahmet+Istanbul",
      },
    };
  }

  if (cat === "cat-3") {
    return {
      cancellationBadge: "Free cancellation up to 48 hours before start",
      durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "3.5 – 4 Hours",
      itinerary: [
        {
          time: "00:00",
          title: "Karaköy & Spice Quarter Tasting Start",
          detail:
            "Begin with traditional simit, aged Anatolian cheeses, and freshly brewed copper-pot coffee at a heritage roastery.",
        },
        {
          time: "01:00",
          title: "Bosphorus Ferry Crossing to Kadıköy",
          detail:
            "Board a public commuter ferry across continents while enjoying panoramic views of the Old City skyline.",
        },
        {
          time: "01:45",
          title: "Kadıköy Market & Family-Run Lokantas",
          detail:
            "Sample regional mezes, wood-fired lahmacun, artisanal pickles, and seasonal regional dishes at time-honored culinary stops.",
        },
        {
          time: "03:15",
          title: "Pistachio Baklava & Anatolian Dessert Finale",
          detail:
            "Conclude at a master confectioner in Moda/Kadıköy with curated tastings.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Curated food & beverage tastings across 6+ vetted local stops",
          "Public Bosphorus ferry tickets between Europe and Asia",
          "Dedicated local culinary host",
          "Dietary & allergy adaptation (vegetarian/halal/nut-free options)",
        ])
      ),
      excluded: [
        "Additional take-home spice or confectionery boxes",
        "Alcoholic pairings unless specified in the tasting menu",
        "Return private transfer to hotel",
      ],
      meetingPoint: {
        locationName: "Eminönü / Karaköy Ferry Terminal Entrance, Beyoğlu",
        meetingTimeNote: "Please arrive 10 minutes before the tasting trail begins.",
        pickupDetails:
          "Exact meeting pin and your culinary host's live WhatsApp number are sent 24 hours prior to your experience.",
        coordinates: listing.coords ?? { lat: 41.0221, lng: 28.9762 },
        mapQuery: "Karakoy+Ferry+Terminal+Istanbul",
      },
    };
  }

  if (cat === "cat-4") {
    return {
      cancellationBadge: "Free cancellation up to 48 hours before start",
      durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "90 – 120 Mins",
      itinerary: [
        {
          time: "00:00",
          title: "Private Changing Suite & Herbal Welcome",
          detail:
            "Check in at the historic hammam, receive your traditional silk/cotton peştemal wrap, and relax in your private Camekan lounge.",
        },
        {
          time: "00:20",
          title: "Warm Marble Room (Sıcaklık) Acclimatization",
          detail:
            "Rest on the heated central marble stone (Göbektaşı) under the domed skylight to open pores naturally.",
        },
        {
          time: "00:40",
          title: "Traditional Kese Exfoliation & Olive-Oil Foam Ritual",
          detail:
            "Your dedicated tellak/natır therapist performs a full-body silk mitt exfoliation followed by an aerated olive-oil bubble massage.",
        },
        {
          time: "01:15",
          title: "Cooling Lounge & Homemade Sherbet",
          detail:
            "Unwind in the tranquil relaxation lounge with chilled Ottoman rose sherbet, herbal tea, and Turkish delight.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Single-use sealed kese exfoliation mitt & organic olive-oil soap",
          "Private locker/suite, peştemal towels, and slippers",
          "Complimentary herbal tea, sherbet & refreshments",
          "Certified traditional hammam therapist",
        ])
      ),
      excluded: [
        "Extra aromatherapy oil massages not in your selected tier",
        "Hotel-to-hammam private transfer",
        "Therapist gratuities",
      ],
      meetingPoint: {
        locationName: `${listing.district || "Sultanahmet / Çemberlitaş"}, Historic Hammam Reception`,
        meetingTimeNote: "Please check in at reception 15 minutes before your reserved slot.",
        pickupDetails:
          "Simply present your Purely Istanbul digital reservation voucher at the hammam reception desk.",
        coordinates: listing.coords ?? { lat: 41.0085, lng: 28.9718 },
        mapQuery: `${encodeURIComponent(listing.district || "Cemberlitas")}++Hammam+Istanbul`,
      },
    };
  }

  if (cat === "cat-7") {
    return {
      cancellationBadge: "Free cancellation up to 24 hours before pickup",
      durationLabel: "60 – 75 Mins (Traffic Dependent)",
      itinerary: [
        {
          time: "Step 1",
          title: "Real-Time Flight Tracking & Chauffeur Allocation",
          detail:
            "Our dispatch monitors your flight number (IST or SAW) automatically; early or delayed landings are adjusted at zero extra cost.",
        },
        {
          time: "Step 2",
          title: "Terminal Exit Gate VIP Meet & Greet",
          detail:
            "Meet our uniformed coordinator at the designated terminal exit gate holding your personalized name sign.",
        },
        {
          time: "Step 3",
          title: "Luggage Assistance & Mercedes-Benz V-Class Boarding",
          detail:
            "Step directly into a climate-controlled, D2-licensed luxury Mercedes-Benz V-Class with onboard Wi-Fi and bottled water.",
        },
        {
          time: "Step 4",
          title: "Direct Door-to-Door Hotel Drop-Off",
          detail:
            "Enjoy a smooth, fixed-rate transfer directly to your Boutique Hotel or residence in Istanbul.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Ministry of Transport D2-licensed VIP Mercedes-Benz V-Class",
          "All highway tolls, bridge/tunnel fees & airport parking",
          "Complimentary 60-minute airport arrival waiting window",
          "Bottled water & high-speed onboard Wi-Fi",
        ])
      ),
      excluded: [
        "Unscheduled multi-district detours outside the booked route",
        "Extra oversized cargo exceeding standard van luggage capacity",
      ],
      meetingPoint: {
        locationName: "Istanbul Airport (IST) Gate 14 / Sabiha Gökçen (SAW) Column 9 — Or Hotel Lobby",
        meetingTimeNote: "Chauffeur tracks your flight live and waits up to 60 minutes after landing.",
        pickupDetails:
          "You will receive your chauffeur's name, license plate, and exact exit gate instructions via WhatsApp 12 hours before pickup.",
        coordinates: listing.coords ?? { lat: 41.2608, lng: 28.7418 },
        mapQuery: "Istanbul+Airport+Arrivals+Exit+14",
      },
    };
  }

  if (cat === "cat-8") {
    return {
      cancellationBadge: "Free cancellation up to 48 hours before start",
      durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "2.5 – 3 Hours",
      itinerary: [
        {
          time: "00:00",
          title: "Nuruosmaniye Gate Welcome & Bazaar Orientation",
          detail:
            "Meet your curated shopping specialist at the historic gate of the Grand Bazaar for a briefing on Ottoman guild history.",
        },
        {
          time: "00:30",
          title: "Hidden Hans & Master Artisan Ateliers",
          detail:
            "Step beyond commercial storefronts into historic stone caravanserais (hans) where master weavers, jewelers, and ceramicists work.",
        },
        {
          time: "01:30",
          title: "Authentic Craftsmanship & Provenance Verification",
          detail:
            "Learn how to distinguish hand-knotted natural-dye Anatolian carpets, Iznik quartz ceramics, and bespoke jewelry with zero sales pressure.",
        },
        {
          time: "02:30",
          title: "Private Courtyard Tea & Certified Export Assistance",
          detail:
            "Conclude with traditional apple or black tea in a quiet artisan courtyard, complete with authenticity certificates for any chosen pieces.",
        },
      ],
      included: Array.from(
        new Set([
          ...baseAmenities,
          "Dedicated cultural & artisan shopping specialist",
          "Private access to historical bazaar hans and workshops",
          "Tanrı Misafiri zero-pressure, zero-markup price protection",
          "Complimentary Turkish tea & traditional hospitality",
        ])
      ),
      excluded: [
        "Personal artisan purchases and bespoke commissions",
        "International insured courier shipping fees (if requested)",
      ],
      meetingPoint: {
        locationName: "Grand Bazaar — Gate 1 (Nuruosmaniye Gate), Çemberlitaş, Fatih",
        meetingTimeNote: "Please arrive 10 minutes prior to your scheduled atelier walk.",
        pickupDetails:
          "Meet your specialist directly beneath the Nuruosmaniye Mosque courtyard arch next to Gate 1 of the Grand Bazaar.",
        coordinates: listing.coords ?? { lat: 41.0107, lng: 28.9681 },
        mapQuery: "Grand+Bazaar+Nuruosmaniye+Gate+Istanbul",
      },
    };
  }

  return {
    cancellationBadge: "Free cancellation up to 48 hours before start",
    durationLabel: listing.durationMinutes ? `${listing.durationMinutes} mins` : "2 – 3 Hours",
    itinerary: [
      {
        time: "00:00",
        title: "Welcome & Concierge Check-In",
        detail: `Arrive at the designated ${listing.district} venue or meeting point for a personal welcome from our certified host.`,
      },
      {
        time: "00:30",
        title: "Core Curated Experience",
        detail:
          "Immerse yourself in the full experience with authentic local guidance, priority access, and zero tourist traps.",
      },
      {
        time: "01:45",
        title: "Hospitality Refreshments & Local Insights",
        detail:
          "Enjoy traditional Turkish refreshments while your host shares insider recommendations for the surrounding neighborhood.",
      },
    ],
    included: Array.from(
      new Set([
        ...baseAmenities,
        "Pre-vetted, licensed local operator fulfillment",
        "Transparent local pricing with zero hidden fees",
        "24/7 English & WhatsApp Concierge support",
      ])
    ),
    excluded: [
      "Personal expenses and optional add-on services",
      "Private round-trip hotel transfer unless specified",
      "Discretionary gratuities",
    ],
    meetingPoint: {
      locationName: `${listing.district || "Beyoğlu / Sultanahmet"}, Istanbul`,
      meetingTimeNote: "Please arrive 15 minutes prior to your confirmed experience time.",
      pickupDetails:
        "Exact meeting coordinates, host contact number, and door-to-door directions are sent upon reservation confirmation.",
      coordinates: listing.coords ?? { lat: 41.0151, lng: 28.9795 },
      mapQuery: `${encodeURIComponent(listing.district || "Beyoglu")}+Istanbul`,
    },
  };
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [activeTab, setActiveTab] = useState<"itinerary" | "inclusions" | "meeting">("itinerary");
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    itinerary: true,
    inclusions: true,
    meeting: true,
  });
  const categoryConfigs = useCategoryConfigs();

  useEffect(() => {
    const unsub = watchListing(
      id,
      (data) => setListing(data),
      () => setListing(null)
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (listing) bumpListingStat(listing.id, "viewCount");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const details = useMemo(() => (listing ? buildExperienceDetails(listing) : null), [listing]);

  if (listing === undefined) {
    return <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-sm text-ink-muted">Loading experience...</div>;
  }

  if (listing === null || !details) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 text-center">
          <p className="text-sm text-ink-muted">This experience could not be found or is no longer active.</p>
        </div>
        <MarketplaceFooter />
      </>
    );
  }

  const gallery = listing.images.length > 0 ? listing.images : [];
  const priceUnit = listing.type === "stay" ? "night" : "guest";
  const nights =
    listing.type === "stay" && checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 1;
  const total =
    listing.type === "stay"
      ? listing.pricing.basePrice * nights + (listing.pricing.cleaningFee ?? 0)
      : listing.pricing.basePrice * guests;

  function handleReserve() {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/marketplace/listing/${listing!.id}/book?${params.toString()}`);
  }

  function toggleAccordion(sectionKey: string) {
    setOpenAccordions((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }

  function selectTab(tab: "itinerary" | "inclusions" | "meeting") {
    setActiveTab(tab);
    setOpenAccordions((prev) => ({ ...prev, [tab]: true }));
    const el = document.getElementById(`section-${tab}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        {/* Top Cancellation Policy & Category Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span
            data-testid="cancellation-policy-badge"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-[12px] font-semibold text-emerald-800"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
            {details.cancellationBadge}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-card border border-sand-border px-3 py-1 text-[12px] font-medium text-ink-muted">
            <Clock className="w-3.5 h-3.5 text-terracotta shrink-0" strokeWidth={1.75} />
            Duration: {details.durationLabel}
          </span>
        </div>

        <h1 className="font-luxury-serif text-[26px] md:text-3xl font-semibold tracking-tight text-ink mb-1.5">
          {listing.title}
        </h1>
        <p className="text-[13.5px] text-ink-muted flex items-center gap-1.5 mb-7">
          <MapPin className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.75} /> {listing.district}
        </p>

        {/* Photo Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-3xl overflow-hidden mb-12 h-[340px] md:h-[440px] ring-1 ring-inset ring-black/[0.04]">
          <div
            className={`relative col-span-4 row-span-2 ${
              gallery.length > 1 ? "md:col-span-2 md:row-span-2" : "md:col-span-4 md:row-span-2"
            } bg-sand-card`}
          >
            {gallery[0] ? (
              <Image
                src={gallery[0].url}
                alt={listing.title}
                fill
                className="object-cover"
                sizes={gallery.length > 1 ? "50vw" : "100vw"}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-muted/50">
                <ImageOff className="w-7 h-7" strokeWidth={1.5} />
              </div>
            )}
          </div>
          {gallery.length > 1 &&
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="relative hidden md:block bg-sand-card">
                {gallery[i] ? (
                  <Image src={gallery[i].url} alt={`${listing.title} ${i}`} fill className="object-cover" sizes="25vw" />
                ) : null}
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-muted border-b border-sand-border/70 pb-6">
              <Users className="w-4 h-4 text-terracotta" strokeWidth={1.75} />
              <span>
                Up to {listing.capacity} guests ·{" "}
                {listing.type === "stay" ? "Boutique Stay" : "Verified Local Experience"}
                {listing.category
                  ? ` · ${categoryConfigs.find((c) => c.key === listing.category)?.label ?? listing.category}`
                  : ""}
              </span>
            </div>

            <div>
              <h2 className="font-luxury-serif text-[19px] font-semibold text-ink mb-3">About This Experience</h2>
              <p className="text-[14.5px] text-ink-muted leading-relaxed whitespace-pre-line">
                {listing.description || "Verified local experience curated by Purely Istanbul."}
              </p>
            </div>

            {/* Quick Section Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-sand-border pb-3">
              <button
                type="button"
                onClick={() => selectTab("itinerary")}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${
                  activeTab === "itinerary"
                    ? "bg-ink text-white"
                    : "bg-white border border-sand-border text-ink-muted hover:text-ink"
                }`}
              >
                Full Itinerary
              </button>
              <button
                type="button"
                onClick={() => selectTab("inclusions")}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${
                  activeTab === "inclusions"
                    ? "bg-ink text-white"
                    : "bg-white border border-sand-border text-ink-muted hover:text-ink"
                }`}
              >
                What&apos;s Included &amp; Excluded
              </button>
              <button
                type="button"
                onClick={() => selectTab("meeting")}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${
                  activeTab === "meeting"
                    ? "bg-ink text-white"
                    : "bg-white border border-sand-border text-ink-muted hover:text-ink"
                }`}
              >
                Departure &amp; Meeting Point
              </button>
            </div>

            {/* ACCORDION 1: Full Itinerary */}
            <section
              id="section-itinerary"
              className="rounded-2xl border border-sand-border bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,25,44,0.03)]"
            >
              <button
                type="button"
                onClick={() => toggleAccordion("itinerary")}
                aria-expanded={openAccordions.itinerary}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-sand-bg/50 transition cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-terracotta block">
                    Chronological Schedule
                  </span>
                  <h2 className="font-luxury-serif text-[19px] font-semibold text-ink">Full Itinerary</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-ink-muted transition-transform ${
                    openAccordions.itinerary ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openAccordions.itinerary && (
                <div className="px-6 pb-6 pt-2 border-t border-sand-border/60">
                  <ol className="relative border-l-2 border-terracotta/30 ml-3 space-y-6 mt-3">
                    {details.itinerary.map((step, idx) => (
                      <li key={idx} className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-terracotta" />
                        <span className="inline-block font-mono text-[11px] font-semibold uppercase tracking-wider text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full mb-1">
                          {step.time}
                        </span>
                        <h3 className="font-semibold text-[15px] text-ink">{step.title}</h3>
                        <p className="text-[13.5px] text-ink-muted leading-relaxed mt-1">{step.detail}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>

            {/* ACCORDION 2: What's Included & Excluded */}
            <section
              id="section-inclusions"
              className="rounded-2xl border border-sand-border bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,25,44,0.03)]"
            >
              <button
                type="button"
                onClick={() => toggleAccordion("inclusions")}
                aria-expanded={openAccordions.inclusions}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-sand-bg/50 transition cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-terracotta block">
                    Transparent Package Breakdown
                  </span>
                  <h2 className="font-luxury-serif text-[19px] font-semibold text-ink">
                    What&apos;s Included &amp; Excluded
                  </h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-ink-muted transition-transform ${
                    openAccordions.inclusions ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openAccordions.inclusions && (
                <div className="px-6 pb-6 pt-4 border-t border-sand-border/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/70 p-4">
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.25} />
                      <span>✓ Included</span>
                    </h3>
                    <ul className="space-y-2.5 text-[13.5px] text-ink">
                      {details.included.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="text-emerald-600 font-bold leading-5 shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-rose-50/40 border border-rose-200/70 p-4">
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-rose-900 mb-3 flex items-center gap-1.5">
                      <X className="w-4 h-4 text-rose-600" strokeWidth={2.25} />
                      <span>✕ Not Included</span>
                    </h3>
                    <ul className="space-y-2.5 text-[13.5px] text-ink-muted">
                      {details.excluded.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="text-rose-600 font-bold leading-5 shrink-0">✕</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            {/* ACCORDION 3: Departure & Meeting Point */}
            <section
              id="section-meeting"
              className="rounded-2xl border border-sand-border bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,25,44,0.03)]"
            >
              <button
                type="button"
                onClick={() => toggleAccordion("meeting")}
                aria-expanded={openAccordions.meeting}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-sand-bg/50 transition cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-terracotta block">
                    Logistics &amp; GPS Coordinates
                  </span>
                  <h2 className="font-luxury-serif text-[19px] font-semibold text-ink">
                    Departure &amp; Meeting Point
                  </h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-ink-muted transition-transform ${
                    openAccordions.meeting ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openAccordions.meeting && (
                <div className="px-6 pb-6 pt-4 border-t border-sand-border/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13.5px]">
                    <div className="rounded-xl bg-sand-bg/70 border border-sand-border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Designated Meeting Point
                      </p>
                      <p className="font-semibold text-ink">{details.meetingPoint.locationName}</p>
                      <p className="text-xs text-ink-muted mt-1 font-mono">
                        GPS: {details.meetingPoint.coordinates.lat.toFixed(4)}° N,{" "}
                        {details.meetingPoint.coordinates.lng.toFixed(4)}° E
                      </p>
                    </div>

                    <div className="rounded-xl bg-sand-bg/70 border border-sand-border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Check-In &amp; Arrival Window
                      </p>
                      <p className="font-semibold text-ink">{details.meetingPoint.meetingTimeNote}</p>
                      <p className="text-xs text-ink-muted mt-1">{details.meetingPoint.pickupDetails}</p>
                    </div>
                  </div>

                  {/* Embedded Interactive Google Map */}
                  <div className="rounded-2xl overflow-hidden border border-sand-border bg-sand-card h-[240px] relative">
                    <iframe
                      title={`Meeting Point Map — ${listing.title}`}
                      src={`https://www.google.com/maps?q=${details.meetingPoint.coordinates.lat},${details.meetingPoint.coordinates.lng}&z=15&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <span className="text-xs text-ink-muted flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-terracotta" />
                      Exact Google Maps pin and host WhatsApp contact are included in your booking voucher.
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${details.meetingPoint.coordinates.lat},${details.meetingPoint.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </section>

            <div className="rounded-2xl border border-sand-border bg-white p-5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-terracotta shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="text-xs text-ink-muted leading-relaxed">
                <p className="font-semibold text-ink mb-0.5">Tanrı Misafiri Ethical Guarantee &amp; TÜRSAB Compliance</p>
                <p>
                  Real local rates, zero tourist markups, and pre-vetted licensed fulfillment (TÜRSAB Group A travel
                  agencies &amp; D2-certified luxury transport fleets) under our{" "}
                  <Link href="/our-philosophy" className="text-terracotta underline">
                    Ethical Charter
                  </Link>{" "}
                  and{" "}
                  <Link href="/marketplace/legal/cancellation-refund" className="text-terracotta underline">
                    48-Hour Free Cancellation Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="lg:self-start lg:sticky lg:top-28">
            <div className="rounded-3xl border border-sand-border bg-white shadow-[0_4px_24px_rgba(11,25,44,0.07)] p-6 space-y-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[19px]">
                  <span className="font-semibold text-ink">
                    {listing.pricing.basePrice.toLocaleString("en-GB")} {listing.pricing.currency}
                  </span>{" "}
                  <span className="text-[13.5px] text-ink-muted">/ {priceUnit}</span>
                </p>
              </div>

              {/* Cancellation Policy Badge inside Booking Widget */}
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 flex items-start gap-2.5">
                <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-[11.5px] leading-snug text-emerald-950">
                  <p className="font-semibold">{details.cancellationBadge}</p>
                  <p className="text-emerald-800/80 mt-0.5">
                    100% refund via Stripe ·{" "}
                    <Link href="/marketplace/legal/cancellation-refund" className="underline font-medium">
                      View policy
                    </Link>
                  </p>
                </div>
              </div>

              {listing.type === "stay" ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="border border-sand-border rounded-xl px-3.5 py-2.5">
                    <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Check-in</span>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-[12.5px] outline-none mt-0.5"
                    />
                  </label>
                  <label className="border border-sand-border rounded-xl px-3.5 py-2.5">
                    <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Check-out</span>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-[12.5px] outline-none mt-0.5"
                    />
                  </label>
                </div>
              ) : (
                <label className="block border border-sand-border rounded-xl px-3.5 py-2.5">
                  <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Preferred Date</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-[12.5px] outline-none mt-0.5"
                  />
                </label>
              )}

              <label className="block border border-sand-border rounded-xl px-3.5 py-2.5">
                <span className="block text-[10px] tracking-wide uppercase text-ink-muted">Guests</span>
                <input
                  type="number"
                  min={1}
                  max={listing.capacity}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full text-[12.5px] outline-none mt-0.5"
                />
              </label>

              <button
                onClick={handleReserve}
                disabled={!checkIn || (listing.type === "stay" && !checkOut)}
                className="w-full rounded-full bg-ink text-white font-semibold py-3 text-[14px] hover:bg-terracotta transition disabled:opacity-40"
              >
                Request Reservation
              </button>

              <div className="text-[13px] text-ink-muted flex justify-between pt-1 border-t border-sand-border/70">
                <span>Estimated Total</span>
                <span className="font-semibold text-ink">
                  {total.toLocaleString("en-GB")} {listing.pricing.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MarketplaceFooter />
    </>
  );
}
