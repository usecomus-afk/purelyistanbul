import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

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

export default function HizmetKosullariPage() {
  return (
    <LegalPageShell eyebrow="Legal & Governance" title="Terms of Service">
      <p className="text-ink-muted">
        Purely Istanbul Ltd is an independent hospitality technology and software company registered in the United Kingdom (Company Registration No: [Insert UK Number]). Purely Istanbul is a technology provider, not a travel agency, tour operator, or transportation carrier.
      </p>

      <section>
        <h2>Platform Scope &amp; 10 Curated Categories</h2>
        <p>
          Purely Istanbul provides an in-room hospitality operating system for Boutique Hotels &amp; Professional Property Managers alongside a curated marketplace interface across 10 active categories:
        </p>
        <ul>
          {ACTIVE_CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Independent Third-Party Fulfillment</h2>
        <p>
          All excursions, historical walking tours, boat cruises, wellness treatments, in-stay catering/laundry services, and private transfers displayed on this platform are fulfilled and operated exclusively by independent, legally certified third-party businesses (including licensed TÜRSAB Group A travel agencies and authorized transportation fleets under the laws of the Republic of Turkey). Purely Istanbul acts solely as a digital concierge software and marketplace interface.
        </p>
      </section>

      <section>
        <h2>Transparent Pricing &amp; Cancellations</h2>
        <p>
          All prices are displayed transparently with zero hidden tourist markups. Cancellation windows and participation terms set by the certified operator are clearly stated prior to checkout.
        </p>
      </section>
    </LegalPageShell>
  );
}
