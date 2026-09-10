import Link from "next/link";
import type { ReactNode } from "react";

interface LegalPageShellProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}

/**
 * Kurumsal/hukuki içerik sayfaları (Gizlilik Bildirimi, Hizmet Koşulları vb.)
 * için ortak, sade sayfa iskeleti. Footer'daki bağlantıların hepsi bu kabuğu
 * kullanır — tipografi ve genişlik tek yerden tutarlı kalır.
 */
export function LegalPageShell({ eyebrow, title, intro, children }: LegalPageShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <Link href="/" className="text-[13px] text-ink-muted hover:text-ink transition">
        ← Ana Sayfa
      </Link>

      {eyebrow && (
        <p className="mt-8 text-[12px] font-semibold tracking-wide uppercase text-terracotta">{eyebrow}</p>
      )}
      <h1 className={`text-2xl md:text-[32px] font-light tracking-tight text-ink ${eyebrow ? "mt-2" : "mt-8"}`}>
        {title}
      </h1>
      {intro && <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{intro}</p>}

      <div className="mt-10 space-y-10 text-[14.5px] leading-relaxed text-ink [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mb-3 [&_p]:text-ink-muted [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:text-ink-muted [&_li]:pl-5 [&_li]:relative [&_li]:before:content-['—'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-terracotta [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading?: string; children: ReactNode }) {
  return (
    <section>
      {heading && <h2>{heading}</h2>}
      {children}
    </section>
  );
}
