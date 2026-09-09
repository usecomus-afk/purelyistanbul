"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function MarketplaceHeader() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-border bg-sand-bg/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 h-16">
        <Link href="/marketplace" className="text-lg font-semibold tracking-tight text-terracotta">
          purely<span className="text-ink">istanbul</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {profile?.roles.host ? (
            <Link
              href="/marketplace/host/listings"
              className="hidden sm:inline-flex text-xs font-semibold text-ink px-3.5 py-2 rounded-full hover:bg-sand-card transition"
            >
              İlanlarım
            </Link>
          ) : (
            <Link
              href={user ? "/marketplace/become-a-host" : "/marketplace/account"}
              className="hidden sm:inline-flex text-xs font-semibold text-ink px-3.5 py-2 rounded-full hover:bg-sand-card transition"
            >
              İlanınızı Verin
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-sand-border bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:shadow-md transition"
            >
              <span className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-[11px] font-bold">
                {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="hidden md:inline">{profile?.displayName ?? "Hesap"}</span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl border border-sand-border bg-white shadow-lg py-2 text-sm"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {user ? (
                  <>
                    <Link href="/marketplace/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-sand-bg">
                      Hesabım
                    </Link>
                    {profile?.roles.host && (
                      <Link href="/marketplace/host/listings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-sand-bg">
                        İlanlarım
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-sand-bg text-red-600"
                    >
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <Link href="/marketplace/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-sand-bg">
                    Giriş Yap / Kayıt Ol
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
