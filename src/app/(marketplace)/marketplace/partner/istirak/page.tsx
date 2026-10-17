"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";

export default function IstirakOlunPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        message: `[İştirak / Affiliate Başvurusu] Kanal/İçerik: ${channel}`,
        uid: user?.uid,
      });
      toast.success("Başvurunuz alındı, ekibimiz kısa süre içinde sizinle iletişime geçecek.");
      setName("");
      setEmail("");
      setChannel("");
    } catch (err: any) {
      toast.error(err?.message || "Başvuru gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
        ← Ana Sayfa
      </Link>

      <p className="mt-8 text-[12px] font-semibold tracking-wide uppercase text-terracotta">Ortaklar İçin</p>
      <h1 className="mt-2 text-2xl md:text-[32px] font-light tracking-tight text-ink">
        İştirak Olun
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        İstanbul odaklı seyahat içerik üreticileri, şehir rehberleri, kültür elçileri ve seyahat
        platformları için gelir paylaşım modeli.
      </p>

      <section className="mt-10">
        <h2 className="text-[16px] font-semibold text-ink mb-3">İş Birliği Modeli</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-muted">
          purelyistanbul.com'un 10 odak kategorideki doğrulanmış deneyimlerini veya comus AI
          destekli İstanbul turlarını kitlenize önerin; her başarılı rezervasyonda şeffaf komisyon
          kazanın.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-[16px] font-semibold text-ink mb-3">Ayrıcalıklar</h2>
        <ul className="space-y-2 text-[14.5px] text-ink-muted [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['—'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-terracotta">
          <li>Takip edilebilir özel bağlantılar ve anlık kazanç paneli.</li>
          <li>Takipçilerinize özel deneyim avantajları.</li>
          <li>purelyistanbul.com editoryal ekibiyle ortak İstanbul içerik ve kültür projeleri.</li>
        </ul>
      </section>

      <form onSubmit={handleSubmit} className="mt-10 space-y-3 max-w-md">
        <input
          type="text"
          required
          placeholder="Ad Soyad / Marka"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <input
          type="email"
          required
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <input
          type="text"
          placeholder="Kanal / İçerik bağlantısı (Instagram, blog, YouTube vb.)"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
        >
          {submitting ? "Gönderiliyor..." : "İştirak / Partner Başvurusu Yapın"}
        </button>
      </form>
    </div>
  );
}
