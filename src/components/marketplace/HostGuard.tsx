"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/** Host paneli sayfalarını sadece onaylı host'lara açar. */
export function HostGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">Yükleniyor...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">
        Bu sayfayı görmek için{" "}
        <Link href="/marketplace/account" className="text-terracotta underline">
          giriş yapmalısınız
        </Link>
        .
      </div>
    );
  }

  if (!profile.roles.host) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-sm text-ink-muted">
        İlan verebilmek için önce{" "}
        <Link href="/marketplace/become-a-host" className="text-terracotta underline">
          host başvurusu yapmalı ve onay almalısınız
        </Link>
        .
      </div>
    );
  }

  return <>{children}</>;
}
