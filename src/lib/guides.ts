import fs from "node:fs";
import path from "node:path";

const GUIDES_DIR = path.join(process.cwd(), "content", "istanbul-tourist-guide");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  readingTime: string;
  isPublished: boolean;
}

export interface Guide extends GuideMeta {
  body: string;
}

function stripQuotes(v: string): string {
  return v.trim().replace(/^["']|["']$/g, "");
}

function parse(raw: string, fileSlug: string): Guide {
  const text = raw.replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm: Record<string, string> = {};
  let body = text;
  if (match) {
    body = match[2];
    for (const line of match[1].split("\n")) {
      const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (m && m[2]) fm[m[1]] = stripQuotes(m[2]);
    }
  }
  return {
    slug: fm.slug || fileSlug,
    title: fm.title || fileSlug,
    description: fm.description || "",
    publishedAt: fm.publishedAt || "",
    author: fm.author || "Purelyistanbul Editorial Team",
    readingTime: fm.readingTime || "",
    isPublished: fm.isPublished !== "false",
    // The page renders its own <h1> from the title, so drop the leading one.
    body: body.replace(/^\s*# .*\n/, "").trim(),
  };
}

export function getAllGuides(): Guide[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parse(fs.readFileSync(path.join(GUIDES_DIR, f), "utf8"), f.replace(/\.md$/, "")))
    .filter((g) => g.isPublished)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getGuide(slug: string): Guide | undefined {
  return getAllGuides().find((g) => g.slug === slug);
}
