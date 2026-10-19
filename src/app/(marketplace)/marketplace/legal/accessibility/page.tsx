import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export const metadata: Metadata = {
  title: "Accessibility Statement | Purely Istanbul",
  description:
    "Digital web accessibility standards and historic Istanbul venue mobility transparency on Purely Istanbul.",
  alternates: {
    canonical: "https://www.purelyistanbul.com/marketplace/legal/accessibility",
  },
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell
      eyebrow="Legal & Trust"
      title="Accessibility Statement"
      intro="Purely Istanbul is committed to ensuring digital accessibility across our web marketplace and in-room concierge platform, while transparently communicating physical accessibility details for Istanbul's historic venues and topography."
    >
      <section>
        <h2>Digital Platform &amp; Comus Concierge Accessibility</h2>
        <p>
          Our web platform, high-contrast typography, and Comus conversational interfaces are designed to support screen
          readers, keyboard navigation, and modern web accessibility standards without requiring app downloads.
        </p>
      </section>

      <section>
        <h2>Historic Venue &amp; Terrain Transparency</h2>
        <p>
          Because many experiences take place across Sultanahmet, Galata&apos;s cobbled hills, Bosphorus piers, or
          protected 16th-century hammams without elevators, mobility and step-free access details are clearly disclosed
          on each experience page and through our 24/7 Guest Care team.
        </p>
      </section>
    </LegalPageShell>
  );
}
