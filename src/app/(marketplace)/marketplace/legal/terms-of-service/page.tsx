import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { CORPORATE_CONFIG } from "@/lib/marketplace/corporate-config";

export const metadata: Metadata = {
  title: "Terms of Service | Purely Istanbul",
  description:
    "Terms of Service, marketplace intermediary disclosures, and certified third-party fulfillment rules for Purely Istanbul.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/terms-of-service",
  },
};

const ACTIVE_CATEGORIES = [
  "Bosphorus & Boat Cruises",
  "Historic Routes & Fast-Track Walks",
  "Culinary & Street Food Trails",
  "Traditional Turkish Bath & Hammam Rituals",
  "Arts & Whirling Dervishes",
  "Rooftop Photography & Costumes",
  "Private VIP Airport Transfers (Licensed Fleets)",
  "Curated Artisan & Bazaar Shopping",
  "In-Stay Breakfast & Gourmet Catering",
  "In-Stay Express Laundry & Garment Care",
];

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="Terms of Service"
      intro={`${CORPORATE_CONFIG.legalEntityName} operates an independent hospitality technology and digital concierge marketplace platform. Purely Istanbul is a technology provider and electronic commerce intermediary, not a travel agency, tour operator, or transportation carrier.`}
    >
      <section>
        <h2>1. Platform Scope &amp; 10 Curated Categories</h2>
        <p>
          Purely Istanbul provides an in-room hospitality operating system for Boutique Hotels &amp; Professional
          Property Managers alongside a curated web marketplace across 10 active categories:
        </p>
        <ul>
          {ACTIVE_CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>2. Independent Third-Party Fulfillment &amp; Regulatory Compliance</h2>
        <p>
          All excursions, historical walking tours, boat cruises, wellness treatments, in-stay catering/laundry
          services, and private airport transfers displayed on this platform are fulfilled and operated exclusively by
          independent, legally certified third-party businesses — including licensed <strong>TÜRSAB Group A</strong>{" "}
          travel agencies (pursuant to Turkish Law No. 1618) and Ministry of Transport <strong>D2-certified</strong>{" "}
          luxury transportation fleets under the laws of the Republic of Türkiye. Purely Istanbul acts solely as a
          digital concierge software and marketplace intermediary under Law No. 6563 on the Regulation of Electronic
          Commerce.
        </p>
      </section>

      <section>
        <h2>3. Transparent Pricing, Reservations &amp; Cancellations</h2>
        <p>
          All prices on purelyistanbul.com are displayed transparently in the selected currency with zero hidden tourist
          markups. Standard bookings qualify for free cancellation up to 48 hours prior to the scheduled experience
          start time. Please review our{" "}
          <Link href="/marketplace/legal/distance-sales-agreement" className="text-terracotta underline font-medium">
            Distance Sales Agreement
          </Link>{" "}
          and{" "}
          <Link href="/marketplace/legal/cancellation-refund" className="text-terracotta underline font-medium">
            Cancellation &amp; Refund Policy
          </Link>{" "}
          for complete statutory terms.
        </p>
      </section>

      <section>
        <h2>4. Official Contact &amp; Guest Care</h2>
        <ul>
          <li>
            <strong>Platform:</strong> {CORPORATE_CONFIG.legalEntityName}
          </li>
          <li>
            <strong>Location:</strong> {CORPORATE_CONFIG.registeredAddress}
          </li>
          <li>
            <strong>Official Contact:</strong> {CORPORATE_CONFIG.contactEmail} · {CORPORATE_CONFIG.contactPhone}
          </li>
        </ul>
      </section>
    </LegalPageShell>
  );
}

