import Link from "next/link";
import type { Metadata } from "next";
import { getAllGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Istanbul Tourist Guide | purelyİstanbul",
  description: "Things tourists visiting Istanbul should be careful about: practical safety guides and tips.",
};

export default function GuideIndexPage() {
  const guides = getAllGuides();
  return (
    <main className="min-h-screen bg-[#F8F4ED] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-amber-900/70 hover:text-amber-900">← purelyİstanbul</Link>
        <h1 className="mt-6 text-3xl md:text-4xl font-serif font-bold text-slate-900">Istanbul Tourist Guide</h1>
        <p className="mt-3 text-slate-600">Things tourists visiting Istanbul should be careful about.</p>
        <div className="mt-10 space-y-5">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/istanbul-tourist-guide/${g.slug}`}
              className="block rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-slate-900">{g.title}</h2>
              <p className="mt-2 text-slate-600">{g.description}</p>
              <p className="mt-3 text-xs text-slate-500">
                {g.publishedAt} · {g.readingTime}
              </p>
            </Link>
          ))}
          {guides.length === 0 && <p className="text-slate-500">No articles yet.</p>}
        </div>
      </div>
    </main>
  );
}
