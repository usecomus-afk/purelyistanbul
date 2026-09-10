"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";

export default function PartnerKayitPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePreRegister(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        message: `[Butik Otel/Host Ön Kayıt] ${about}`,
        uid: user?.uid,
      });
      toast.success("Ön kaydınız alındı — konaklama modülü açıldığında öncelikli haber vereceğiz.");
      setName("");
      setEmail("");
      setAbout("");
    } catch (err: any) {
      toast.error(err?.message || "Ön kayıt gönderilemedi, lütfen tekrar deneyin.");
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
        Hizmetinizi / Deneyiminizi Kaydedin
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
        İstanbul'un kültürünü, lezzetini ve zenginliğini dünyaya tanıtan bir deneyim sağlayıcısı
        mısınız ya da seçkin bir butik konaklama tesisiniz mi var?
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-sand-border bg-white p-6">
          <h2 className="text-[15px] font-semibold text-ink mb-2">Deneyim Sağlayıcıları İçin Başvuru</h2>
          <p className="text-[14px] text-ink-muted leading-relaxed mb-5">
            Kültürel miras, hamam, gastronomi, tekne/boğaz, sanat, atölye veya transfer alanlarında
            hizmet veren işletmeler hemen başvuru yaparak 10 kategori altında yerini alabilir.
          </p>
          <Link
            href="/marketplace/become-a-host"
            className="inline-flex items-center justify-center w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition"
          >
            Hizmetinizi Kaydedin
          </Link>
        </div>

        <div className="rounded-2xl border border-sand-border bg-white p-6">
          <h2 className="text-[15px] font-semibold text-ink mb-2">Butik Oteller ve Host'lar İçin Ön Kayıt</h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            purelyistanbul.com, platform trafiğini hedeflenen hacme ulaştırdığında devreye
            girecek olan konaklama modülü için şimdiden nitelikli butik otelleri, tarihi konakları
            ve seçkin ev sahiplerini portföyüne dahil etmektedir. Ön kayıt yaptıran tesisler,
            konaklama fazı açıldığında öncelikli listeleme ve comus AI concierge altyapısından
            yararlanacaktır.
          </p>

          <form onSubmit={handlePreRegister} className="mt-5 space-y-3">
            <input
              type="text"
              required
              placeholder="Tesis / Ad Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <input
              type="email"
              required
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <textarea
              placeholder="Tesisiniz hakkında kısa bilgi (opsiyonel)"
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-sand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full border border-ink text-ink font-semibold py-2.5 text-sm hover:bg-ink hover:text-white transition disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : "Ön Kayıt Yaptırın"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
