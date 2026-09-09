"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage } from "@/lib/marketplace/firestore";

export function MarketplaceFooter() {
  const { user } = useAuth();
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
    } catch (err: any) {
      toast.error(err?.message || "Mesaj gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="border-t border-sand-border mt-16">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
        <div className="max-w-xl mx-auto text-center mb-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink mb-1">Bize Ulaşın</h2>
          <p className="text-sm text-ink-muted mb-6">
            Sorularınız, önerileriniz veya iş birliği talepleriniz için bize yazın.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <div className="grid sm:grid-cols-2 gap-3">
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
            </div>
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
              className="w-full sm:w-auto rounded-full bg-ink text-white font-semibold px-8 py-2.5 text-sm hover:bg-terracotta transition disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : "Gönder"}
            </button>
          </form>
        </div>

        <div className="border-t border-sand-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-90">
            <span className="relative h-10 sm:h-12 w-[115px] sm:w-[135px] shrink-0">
              <Image src="/logo-header.png" alt="" fill className="object-contain object-left" />
            </span>
            <span className="text-[17px] sm:text-[19px] tracking-tight text-ink leading-none">
              purely <span className="font-semibold text-red-600">istanbul</span>
            </span>
          </div>

          <span className="text-[13px] text-ink-muted">Istanbul, Türkiye</span>

          <p className="text-[12px] text-ink-muted/70 tracking-wide">
            © {new Date().getFullYear()} Purely Istanbul — nothing but İstanbul.
          </p>
        </div>
      </div>
    </footer>
  );
}
