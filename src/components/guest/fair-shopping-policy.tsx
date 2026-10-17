"use client";

import { ExternalLink, ShieldCheck, Scale, HeartHandshake, Compass } from "lucide-react";
import Link from "next/link";
import { Language } from "@/lib/types";
import { LuxuryCategoryIcon } from "./luxury-category-icon";

interface FairShoppingPolicyProps {
  lang?: Language;
}

const PILLARS = [
  {
    number: "01",
    title: "Radical Transparency (Şeffaf)",
    desc: "Real local rates, zero tourist markups, zero hidden backroom commissions, secure Stripe processing.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Fairness for All (Adil)",
    desc: "While global platforms take 25-30% from local boat captains and artisans, we charge a modest 10-12% tech fee so authentic Turkish craftspeople thrive and travelers save.",
    icon: Scale,
  },
  {
    number: "03",
    title: "Genuine Hospitality (Misafirperver)",
    desc: "The timeless Turkish hosting tradition digitized. If an experience doesn't match our verified standards, our dedicated guest care resolves it with empathy and speed.",
    icon: HeartHandshake,
  },
  {
    number: "04",
    title: "Hyper-Local & Sincere (Samimi)",
    desc: "\"Nothing but Istanbul.\" We don't stretch across 100 cities. We know every cobble of Galata, every tea garden in Kadıköy, and every historical secret of Sultanahmet.",
    icon: Compass,
  },
];

export function FairShoppingPolicy({ lang: _lang = "en" }: FairShoppingPolicyProps) {
  return (
    <div className="space-y-5 font-luxury-sans text-[#0B192C]">
      {/* Official Istanbulkart & MuseumPass Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="luxury-service-card p-5 space-y-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="istanbulkart" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-luxury-sans text-[14.5px] sm:text-[16px] font-bold text-[#0B192C] leading-snug">
                Official Istanbulkart &amp; Transit
              </h3>
              <p className="text-xs text-[#4A433B] leading-relaxed">
                The official public transit card valid across all metros, trams, ferries, and Marmaray trains. Obtain at station kiosks or top up online.
              </p>
            </div>
          </div>

          <a
            href="https://www.istanbulkart.istanbul"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8E6C35] hover:to-[#6B4F21] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(92,68,30,0.22)] transition cursor-pointer"
          >
            <span>Istanbulkart Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="luxury-service-card p-5 space-y-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="muzekart" className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-luxury-sans text-[14.5px] sm:text-[16px] font-bold text-[#0B192C] leading-snug">
                Official MuseumPass &amp; Tickets
              </h3>
              <p className="text-xs text-[#4A433B] leading-relaxed">
                Skip-the-line official entrance pass valid at historic museums and palaces under the Ministry of Culture and Tourism.
              </p>
            </div>
          </div>

          <a
            href="https://muze.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9E7B42] to-[#7D5E2A] hover:from-[#8E6C35] hover:to-[#6B4F21] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(92,68,30,0.22)] transition cursor-pointer"
          >
            <span>Official Museum Tickets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Our Ethical Charter & Guest Commitment */}
      <div className="luxury-service-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <LuxuryCategoryIcon categoryKey="shield" className="w-12 h-12 shrink-0" />
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#D47A43] block">
              Our Ethical Charter &amp; Guest Commitment
            </span>
            <h3 className="font-luxury-serif text-lg sm:text-xl font-semibold text-[#0B192C] tracking-wide mt-0.5">
              Transparent, Fair, Hospitable, and Sincerely Local
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#2C2620] leading-relaxed">
          &ldquo;At Purely Istanbul, we believe every traveler should experience Istanbul not as a walking wallet,
          but as an honored guest (&lsquo;Tanrı Misafiri&rsquo;). We replace anxiety with authenticity through
          radical transparency, pre-vetted local partners, and direct accountability.&rdquo;
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.number}
                className="p-4 rounded-2xl bg-[#FAF8F4]/95 border border-[#D8CBB8] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-[#D47A43]/15 flex items-center justify-center text-[#D47A43]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#64748B]">{pillar.number}</span>
                </div>
                <h4 className="font-luxury-serif text-sm font-bold text-[#0B192C]">{pillar.title}</h4>
                <p className="text-xs text-[#4A433B] leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href="/our-philosophy"
            className="text-xs font-semibold text-[#D47A43] hover:underline"
          >
            Read Our Full Ethical Charter →
          </Link>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="luxury-service-card p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <LuxuryCategoryIcon categoryKey="emergency" className="w-12 h-12 shrink-0" />
          <h3 className="font-luxury-serif text-lg font-semibold text-[#0B192C]">
            Official Emergency &amp; Support Lines
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">Emergency Call Center</span>
            <strong className="text-[#8B3A2B] text-sm font-mono font-bold">112</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">Tourism Police</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">+90 212 527 45 03</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">Municipality Help Desk</span>
            <strong className="text-[#0B192C] text-sm font-mono font-bold">153</strong>
          </div>
          <div className="p-3 bg-[#FAF8F4]/90 rounded-2xl border border-[#D8CBB8]">
            <span className="text-[#6E655B] block text-[10.5px] font-medium">Purely Guest Care</span>
            <strong className="text-[#D47A43] text-xs font-mono font-bold">24/7 Support</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
