"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function MarketplaceHeader() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-sand-bg/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_rgba(30,33,41,0.08)]" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 h-[84px]">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="relative h-11 md:h-12 w-[130px] md:w-[145px] shrink-0">
            <Image src="/logo-header.png" alt="Purely Istanbul" fill className="object-contain object-left" priority />
          </span>
          <span className="text-[16px] tracking-tight text-ink leading-none">
            purely <span className="font-semibold text-terracotta">istanbul</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {profile?.roles.host ? (
            <Link
              href="/marketplace/host/listings"
              className="hidden sm:inline-flex text-[13px] font-medium text-ink px-4 py-2 rounded-full hover:bg-white transition"
            >
              İlanlarım
            </Link>
          ) : (
            <Link
              href={user ? "/marketplace/become-a-host" : "/marketplace/account"}
              className="hidden sm:inline-flex text-[13px] font-medium text-ink px-4 py-2 rounded-full hover:bg-white transition"
            >
              İlanınızı Verin
            </Link>
          )}

          {user && (
            <Link
              href="/marketplace/favorites"
              aria-label="Favorilerim"
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white transition text-ink"
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>
          )}

          {user ? (
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-sand-border bg-white pl-1.5 pr-3.5 py-1.5 text-[13px] font-medium text-ink shadow-[0_1px_3px_rgba(30,33,41,0.06)] hover:shadow-[0_2px_8px_rgba(30,33,41,0.1)] transition"
              >
                <span className="w-7 h-7 rounded-full bg-terracotta text-white flex items-center justify-center text-[12px] font-semibold">
                  {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="hidden md:inline">{profile?.displayName ?? "Hesap"}</span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl border border-sand-border bg-white shadow-[0_8px_28px_rgba(30,33,41,0.12)] py-2 text-[13px]"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href="/marketplace/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 hover:bg-sand-bg">
                    Hesabım
                  </Link>
                  <Link
                    href="/marketplace/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-sand-bg sm:hidden"
                  >
                    Favorilerim
                  </Link>
                  {profile?.roles.host && (
                    <Link href="/marketplace/host/listings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 hover:bg-sand-bg">
                      İlanlarım
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2.5 hover:bg-sand-bg text-red-600"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 ml-1">
              <Link
                href="/marketplace/account"
                className="text-[13px] font-medium text-ink px-4 py-2 rounded-full hover:bg-white transition"
              >
                Giriş Yap
              </Link>
              <Link
                href="/marketplace/account?mode=register"
                className="text-[13px] font-semibold text-white bg-ink px-4 py-2 rounded-full hover:bg-terracotta transition"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
