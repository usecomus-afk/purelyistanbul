import Link from "next/link";
import { ShieldCheck, HeartHandshake, Compass, ArrowRight } from "lucide-react";

export const GUIDING_PILLARS = [
  {
    number: "01",
    title: "Clear & Direct",
    description:
      "Clear experience details, local context, and straightforward digital booking across Istanbul.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Genuine Hospitality",
    description:
      "Inspired by the timeless Turkish hosting tradition, with attentive guest support throughout your stay.",
    icon: HeartHandshake,
  },
  {
    number: "03",
    title: "Hyper-Local & Sincere",
    description:
      "\"Nothing but Istanbul.\" We don't stretch across 100 cities. We know every cobble of Galata, every tea garden in Kadıköy, and every historical secret of Sultanahmet.",
    icon: Compass,
  },
];

export function EthicalCharterContent() {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <Link href="/" className="text-[13px] font-medium text-ink-muted hover:text-ink transition">
        ← Back to Marketplace
      </Link>

      {/* Hero Narrative */}
      <div className="mt-8 rounded-3xl border border-sand-border bg-white p-8 md:p-12 shadow-[0_12px_36px_-16px_rgba(11,25,44,0.08)]">
        <h1 className="font-luxury-serif text-3xl sm:text-4xl md:text-[42px] font-semibold tracking-tight text-ink leading-[1.15]">
          Transparent, Hospitable, and Sincerely Local.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-ink leading-relaxed max-w-3xl font-medium">
          &ldquo;At <span translate="no" className="notranslate">Purely Istanbul</span>, we believe every traveler should experience Istanbul as an honored guest (&lsquo;Tanrı Misafiri&rsquo;) with authentic local guidance and curated city experiences.&rdquo;
        </p>
      </div>

      {/* Guiding Pillars */}
      <section className="mt-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-terracotta">Our Philosophy</p>
          <h2 className="mt-1.5 font-luxury-serif text-2xl sm:text-3xl font-semibold text-ink">
            Our Approach to Istanbul Hospitality
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDING_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.number}
                className="rounded-3xl border border-sand-border bg-white p-7 shadow-[0_6px_24px_-12px_rgba(11,25,44,0.08)] hover:border-terracotta/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-11 h-11 rounded-2xl bg-terracotta/10 border border-terracotta/25 flex items-center justify-center text-terracotta">
                      <Icon className="w-5 h-5" strokeWidth={1.85} />
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink-muted">{pillar.number}</span>
                  </div>
                  <h3 className="font-luxury-serif text-xl font-semibold text-ink mb-2.5">{pillar.title}</h3>
                  <p className="text-[14.5px] text-ink-muted leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About Us & Brand Story Section */}
      <section className="mt-16 rounded-3xl bg-[#0B192C] text-white p-8 md:p-12 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D47A43]">About Us &amp; Brand Story</p>
        <h2 className="mt-2 font-luxury-serif text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Purely Istanbul — Nothing but Istanbul.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Your curated city companion for authentic Bosphorus cruises, historic walks, culinary trails, and vetted local
          services across Istanbul&apos;s finest neighborhoods.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
            <h3 className="font-luxury-serif text-lg font-semibold text-[#D47A43] mb-2">The Genesis</h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Created by proud Istanbul locals, Purely Istanbul was born to end predatory tourist traps and bridge
              discerning world travelers directly to the city&apos;s authentic heart.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
            <h3 className="font-luxury-serif text-lg font-semibold text-[#D47A43] mb-2">Seamless Guest Access</h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Whether discovering experiences online or connecting from a partner boutique hotel, guests enjoy direct
              access to vetted local artisans, captains, and culinary masters without hidden markups.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
            <h3 className="font-luxury-serif text-lg font-semibold text-[#D47A43] mb-2">Vetted Local Perfection</h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Every experience is hand-selected and operated by licensed TÜRSAB Group A agencies, certified D2 luxury
              fleets, and time-honored Istanbul establishments.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-300">
            Need assistance during your stay in Istanbul? Our dedicated guest care team is here to help.
          </p>
          <Link
            href="/marketplace/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#D47A43] hover:bg-[#c06832] text-white text-xs font-semibold px-5 py-2.5 transition"
          >
            <span>Contact Guest Care</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
