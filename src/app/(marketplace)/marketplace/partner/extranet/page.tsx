"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function ExtranetGirisiPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    toast.info("Extranet erişimi yakında açılıyor — başvurunuz onaylandığında giriş bilgileriniz e-posta ile iletilecek.");
  }

  return (
    <div className="max-w-md mx-auto px-5 md:px-8 py-14 md:py-20">
      <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
        ← Ana Sayfa
      </Link>

      <p className="mt-8 text-[12px] font-semibold tracking-wide uppercase text-terracotta">Ortaklar İçin</p>
      <h1 className="mt-2 text-2xl md:text-[32px] font-light tracking-tight text-ink">Extranet Girişi</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        İstanbul deneyim sağlayıcıları, transfer operatörleri ve iş ortağımız olan ev sahipleri
        için pratik yönetim platformu. purelyistanbul.com Extranet üzerinden müsaitlik durumunuzu
        güncelleyebilir, rezervasyon taleplerini yönetebilir, misafir tercihlerini inceleyebilir
        ve hakedişlerinizi takip edebilirsiniz.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">E-posta / Partner Kodu</label>
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition"
        >
          Giriş Yap
        </button>
        <div className="flex items-center justify-between text-[12.5px] text-ink-muted pt-1">
          <button type="button" onClick={() => toast.info("Şifre sıfırlama bağlantısı e-postanıza gönderilecek.")} className="hover:text-ink transition">
            Şifremi Unuttum
          </button>
          <Link href="/marketplace/iletisim" className="hover:text-ink transition">
            Partner Destek Hattı
          </Link>
        </div>
      </form>
    </div>
  );
}
