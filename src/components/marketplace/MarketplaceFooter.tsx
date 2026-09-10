"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Şartlar ve Ayarlar",
    links: [
      { label: "Gizlilik Bildirimi", href: "/marketplace/legal/gizlilik-bildirimi" },
      { label: "Hizmet Koşulları", href: "/marketplace/legal/hizmet-kosullari" },
      { label: "Erişilebilirlik Bildirisi", href: "/marketplace/legal/erisilebilirlik-bildirisi" },
      { label: "Çalışma Şeklimiz", href: "/marketplace/legal/calisma-seklimiz" },
    ],
  },
  {
    title: "Ortaklar İçin",
    links: [
      { label: "Extranet Girişi", href: "/marketplace/partner/extranet" },
      { label: "Ortaklar İçin Yardım Sayfası", href: "/marketplace/partner/yardim" },
      { label: "Hizmetinizi / Deneyiminizi Kaydedin", href: "/marketplace/partner/kayit" },
      { label: "İştirak Olun", href: "/marketplace/partner/istirak" },
    ],
  },
];

export function MarketplaceFooter() {
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({ name, email, message, uid: user?.uid });
      toast.success("Mesajınız alındı, en kısa sürede dönüş yapacağız.");
      setName("");
      setEmail("");
      setMessage("");
      setShowContact(false);
    } catch (err: any) {
      toast.error(err?.message || "Mesaj gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="border-t border-sand-border mt-16">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-14 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10">
        <div>
          <h3 className="text-[13px] font-semibold text-ink mb-4">Destek</h3>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/marketplace/legal/misafir-kalkani"
                className="text-[13px] font-semibold text-terracotta hover:text-amber-700 hover:underline underline-offset-2 transition"
              >
                Misafir Kalkanı & Adil Alışveriş Politikası
              </Link>
            </li>
            <li>
              <Link
                href="/marketplace/iletisim"
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
              >
                Müşteri Hizmetleriyle İletişime Geçin
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition text-left"
              >
                Bizimle İletişime Geçin
              </button>
            </li>
          </ul>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-[13px] font-semibold text-ink mb-4">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ink-muted hover:text-terracotta hover:underline underline-offset-2 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-sand-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          <span className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0">
            <Image src="/logo-header.png" alt="Purely Istanbul" fill className="object-contain" />
          </span>

          <div className="flex flex-col items-center md:items-start gap-1.5">
            <p className="text-[12px] text-ink-muted/70 tracking-wide text-center md:text-left">
              © {new Date().getFullYear()} Purely Istanbul — nothing but İstanbul.
            </p>
            <span className="relative h-4 sm:h-5 w-16 sm:w-20 opacity-70">
              <Image src="/comus-logo.png" alt="Powered by Comus" fill className="object-contain" />
            </span>
          </div>
        </div>
      </div>

      {showContact && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowContact(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sand-border relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContact(false)}
              aria-label="Kapat"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-bg hover:bg-sand-border/60 flex items-center justify-center text-ink-muted transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold tracking-tight text-ink mb-1">Bize Ulaşın</h2>
            <p className="text-sm text-ink-muted mb-5">
              Sorularınız, önerileriniz veya iş birliği talepleriniz için bize yazın.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta Adresiniz"
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajınız"
                rows={4}
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
              >
                {submitting ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
