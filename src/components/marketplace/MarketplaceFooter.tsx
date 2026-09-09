"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";

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
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 shrink-0">
          <Image src="/logo-header.png" alt="Purely Istanbul" fill className="object-contain" />
        </span>

        <span className="text-[13px] text-ink-muted">Istanbul, Türkiye</span>

        <button
          type="button"
          onClick={() => setShowContact(true)}
          className="inline-flex items-center gap-2 rounded-full border border-sand-border bg-white px-5 py-2.5 text-[13px] font-semibold text-ink hover:border-terracotta hover:text-terracotta transition shrink-0"
        >
          <Mail className="w-4 h-4" strokeWidth={1.75} />
          Bizimle İletişime Geçin
        </button>

        <p className="text-[12px] text-ink-muted/70 tracking-wide">
          © {new Date().getFullYear()} Purely Istanbul — nothing but İstanbul.
        </p>
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
