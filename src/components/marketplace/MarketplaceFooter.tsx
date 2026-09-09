import Image from "next/image";
import Link from "next/link";

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-sand-border mt-16">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative h-7 w-[130px] opacity-80">
          <Image src="/logo-header.png" alt="Purely Istanbul" fill className="object-contain object-left" />
        </div>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-ink-muted">
          <Link href="/marketplace/become-a-host" className="hover:text-ink transition">
            İlanınızı Verin
          </Link>
          <Link href="/marketplace/account" className="hover:text-ink transition">
            Giriş Yap
          </Link>
          <span>Istanbul, Türkiye</span>
        </nav>

        <p className="text-[12px] text-ink-muted/70 tracking-wide">
          © {new Date().getFullYear()} Purely Istanbul — nothing but İstanbul.
        </p>
      </div>
    </footer>
  );
}
