"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandMark } from "@/components/brand-mark";

export function MarketplaceHeader() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hotelSession, setHotelSession] = useState<{ hotelId: string; roomId: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qrVerified = localStorage.getItem("xenios_qr_verified") === "1";
      const hId = localStorage.getItem("xenios_hotel_id");
      const rId = localStorage.getItem("xenios_room_id");
      if (qrVerified && hId && rId && rId.toUpperCase() !== "TEST") {
        setHotelSession({ hotelId: hId, roomId: rId });
      }
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      setScrolled(currentY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 inset-x-0 z-40 w-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pt-[max(0.15rem,env(safe-area-inset-top))] backdrop-blur-xl translate-y-0 opacity-100 pointer-events-auto ${
        scrolled
          ? "bg-white/45 border-b border-white/65 shadow-[0_4px_24px_rgba(11,25,44,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.8)]"
          : "bg-white/32 border-b border-white/55 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.75)]"
      }`}
    >
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-10 h-[72px] gap-3">
        <BrandMark href="/" size={38} showIcon={true} showText={true} theme="light" className="shrink-0" />

        <nav className="ml-auto flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
          <div className="hidden md:flex items-center justify-end gap-0.5 lg:gap-1">
            <Link
              href="/our-philosophy"
              className="hidden lg:inline-flex text-[12.5px] font-medium text-ink/90 hover:text-ink px-2.5 py-1.5 rounded-full hover:bg-white/90 transition whitespace-nowrap"
            >
              Our Philosophy
            </Link>
            <Link
              href="/marketplace/partner/extranet"
              className="hidden xl:inline-flex text-[12.5px] font-medium text-ink/90 hover:text-ink px-2.5 py-1.5 rounded-full hover:bg-white/90 transition whitespace-nowrap"
            >
              For Boutique Hotels
            </Link>
            <Link
              href="/istanbul-tourist-guide"
              className="inline-flex text-[12.5px] font-medium text-ink/90 hover:text-ink px-2.5 py-1.5 rounded-full hover:bg-white/90 transition whitespace-nowrap"
            >
              Istanbul Guide
            </Link>
          </div>

          {hotelSession && (
            <Link
              href={`/stay/${hotelSession.hotelId}/${hotelSession.roomId}`}
              className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200/90 border border-amber-300 px-2.5 py-1 rounded-full transition shadow-2xs shrink-0 whitespace-nowrap"
            >
              <span className="hidden xl:inline">Return to Room</span>
              <span className="font-mono text-amber-950 font-bold">#{hotelSession.roomId}</span>
            </Link>
          )}

          {user && (
            <Link
              href="/marketplace/favorites"
              aria-label="Saved Experiences"
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/90 transition text-ink"
            >
              <Heart className="w-[17px] h-[17px]" strokeWidth={1.75} />
            </Link>
          )}

          {user ? (
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-sand-border bg-white pl-1.5 pr-3.5 py-1.5 text-[13px] font-medium text-ink shadow-[0_1px_3px_rgba(11,25,44,0.06)] hover:shadow-[0_2px_8px_rgba(11,25,44,0.1)] transition"
              >
                <span className="w-7 h-7 rounded-full bg-terracotta text-white flex items-center justify-center text-[12px] font-semibold">
                  {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="hidden md:inline">{profile?.displayName ?? "My Account"}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-sand-border bg-white shadow-[0_8px_32px_rgba(11,25,44,0.14)] py-1.5 text-[13.5px] z-50">
                    <div className="px-4 py-3 border-b border-sand-border/60">
                      <p className="font-semibold text-ink truncate">{profile?.displayName ?? "Guest"}</p>
                      <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                    </div>

                    <div className="py-1 border-b border-sand-border/60">
                      <Link href="/marketplace/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>My Profile & Bookings</span>
                      </Link>
                      <Link href="/marketplace/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>Saved Experiences</span>
                      </Link>
                      <Link href="/our-philosophy" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-terracotta font-semibold hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>Our Philosophy</span>
                      </Link>
                    </div>

                    <div className="py-1 border-b border-sand-border/60">
                      {profile?.roles.host ? (
                        <Link href="/marketplace/host/listings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                          <span>Manage Partner Listings</span>
                        </Link>
                      ) : (
                        <Link href="/marketplace/partner/extranet" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                          <span>For Boutique Hotels & Property Managers</span>
                        </Link>
                      )}
                      <Link href="/marketplace/partner/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>Register Certified Experience</span>
                      </Link>
                      <Link href="/marketplace/partner/partnership" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>Hotel &amp; Partner Network</span>
                      </Link>
                    </div>

                    <div className="py-1 border-b border-sand-border/60">
                      <Link href="/marketplace/contact" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>Guest Care &amp; Support</span>
                      </Link>
                      <Link href="/marketplace/legal/how-we-work" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-sand-bg transition rounded-xl mx-1">
                        <span>How We Work</span>
                      </Link>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); logout(); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-sand-bg transition rounded-xl mx-1 text-left text-ink-muted"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 border-l border-sand-border/60 shrink-0">
              <Link
                href="/marketplace/account"
                className="text-[12px] sm:text-[13px] font-medium text-ink px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white/80 transition whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href="/marketplace/account?mode=register"
                className="text-[12px] sm:text-[13px] font-semibold text-white bg-ink px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full hover:bg-terracotta transition whitespace-nowrap"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
