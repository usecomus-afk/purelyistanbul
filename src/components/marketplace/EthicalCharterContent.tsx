import Link from "next/link";
import { ShieldCheck, HeartHandshake, Compass, ArrowRight } from "lucide-react";

export const GUIDING_PILLARS = [
  {
    number: "01",
    title: "Clear & Direct (Transparent)",
    description:
      "Closed to surprises, open to Istanbul. We don't just give you fancy words; we provide clear experience details and the city's true local context. You know exactly where you're going and what you'll experience from the very beginning, and you can secure your spot in seconds with our easy digital booking platform.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Genuine Hospitality (Welcoming)",
    description:
      "True hospitality isn't just about a smiling face; it's about ensuring you have an absolutely wonderful time in this city. We set out to offer you a seamless, attentive, and sincere companionship throughout your Istanbul journey. That’s exactly why we brought Comus to life—your specially trained, Gemini-based AI guide. Plus, we don't want to bother you with downloading apps; we designed it as a highly practical mobile web app that you can start using instantly just by tapping \"add to home screen.\"",
    icon: HeartHandshake,
  },
  {
    number: "03",
    title: "Hyper-Local and Intimate (Sincere)",
    description:
      "\"Only Istanbul.\" We haven't expanded to other cities; we have no intention of being everywhere. We are only in Istanbul, and to always provide the best, we will continue to say \"Only Istanbul.\" This city is captivating, but let's admit, as it turns into a massive metropolis, it has corners that lose their sparkle. While it is home to wonderful local artisans and shopkeepers, it's also possible to encounter weary faces in the crowds. Our sole purpose is to host Istanbul’s guests in a manner worthy of this city; presenting them with what is good, beautiful, and valuable, while protecting these treasures and helping them flourish.",
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
          &lsquo;Tanrı Misafiri&rsquo;: The True Spirit of Istanbul
        </h1>

        <p className="mt-6 text-base sm:text-lg text-ink leading-relaxed max-w-3xl font-medium">
          We will never let you feel like a &ldquo;walking wallet&rdquo; while exploring Istanbul. Rooted in our centuries-old belief of the &ldquo;Guest of God&rdquo; (Tanrı Misafiri), we see you as the honored guest of this city. Alongside the trusted locals we work with, we remove all the question marks and anxieties from your journey, replacing them with trust, transparency, and the pure Istanbul experience.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-6">
            <h3 className="font-luxury-serif text-lg font-semibold text-[#D47A43] mb-2">Who Are We?</h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Purely Istanbul was created by the proud locals of this city for one single purpose: to keep you
              completely away from tourist traps and navigate you directly to the true heart of Istanbul. With us, you
              experience the city not as a tourist, but as a local.
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
