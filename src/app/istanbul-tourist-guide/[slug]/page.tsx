import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllGuides, getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return { title: `${g.title} | purelyİstanbul`, description: g.description };
}

export default async function GuideArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  return (
    <main className="min-h-screen bg-[#F8F4ED] px-4 py-10 md:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 md:p-10 shadow-sm border border-amber-900/10">
        <Link href="/istanbul-tourist-guide" className="text-sm text-amber-900/70 hover:text-amber-900">
          ← Istanbul Tourist Guide
        </Link>
        <h1 className="mt-5 text-3xl md:text-4xl font-serif font-bold text-slate-900">{g.title}</h1>
        <p className="mt-3 text-sm text-slate-500">
          {g.author} · {g.publishedAt} · {g.readingTime}
        </p>
        <div
          className="mt-8 text-slate-700 leading-relaxed
            [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900
            [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900
            [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1
            [&_hr]:my-8 [&_hr]:border-slate-200 [&_a]:text-amber-800 [&_a]:underline
            [&_table]:my-5 [&_table]:w-full [&_table]:text-sm [&_table]:block [&_table]:overflow-x-auto
            [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2 [&_th]:text-left
            [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{g.body}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
