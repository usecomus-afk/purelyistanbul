import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function ErisilebilirlikBildirisiPage() {
  return (
    <LegalPageShell eyebrow="Legal & Governance" title="Accessibility Statement">
      <p className="text-ink-muted">
        Purely Istanbul is committed to ensuring digital accessibility across our web marketplace and in-room PWA, while transparently communicating physical accessibility details for Istanbul&apos;s historic venues and topography.
      </p>

      <section>
        <h2>Digital PWA &amp; ComusAI Accessibility</h2>
        <p>
          Our progressive web application, high-contrast typography, and ComusAI conversational interfaces are designed to support screen readers, keyboard navigation, and mobile accessibility standards without requiring app downloads.
        </p>
      </section>

      <section>
        <h2>Historic Venue &amp; Terrain Transparency</h2>
        <p>
          Because many experiences take place across Sultanahmet, Galata&apos;s cobbled hills, Bosphorus piers, or protected 16th-century hammams without elevators, mobility and step-free access details are clearly disclosed on each experience page and through our Guest Care team.
        </p>
      </section>
    </LegalPageShell>
  );
}
