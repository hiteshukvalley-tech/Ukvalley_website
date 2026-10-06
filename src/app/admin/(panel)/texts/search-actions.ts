"use server";

import { requireAdmin } from "@/lib/admin-session";
import { getSearchIndex } from "./search-index";

export type SearchHit = {
  path: string;
  slug: string;
  page: string;
  group: string;
  tag: string;
  section: string;
  card: string;
  role: string;
  before: string;
  match: string;
  after: string;
};
export type SearchPage = { path: string; slug: string; page: string; group: string; tag: string };
export type SearchResult = {
  /** pages whose name matches */
  pages: SearchPage[];
  /** lines of text that match, at most a few per page */
  hits: SearchHit[];
  /** matches not shown (beyond the per-page / overall limits) */
  more: number;
  /** pages searched */
  searched: number;
};

const PER_PAGE = 4;
const MAX_HITS = 60;
const SNIPPET = 70;

/**
 * Searches every line of text on every page. An empty query just builds the
 * index (called when the search box gets focus, so the first real search is quick).
 */
export async function searchAllTextAction(query: string, refresh = false): Promise<SearchResult> {
  await requireAdmin("texts");
  const q = String(query ?? "").trim().slice(0, 100).toLowerCase();
  const pages = await getSearchIndex(refresh === true);
  const empty: SearchResult = { pages: [], hits: [], more: 0, searched: pages.length };
  if (q.length < 2) return empty;

  const words = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];
  const pageMatches: SearchPage[] = [];
  let more = 0;

  for (const p of pages) {
    const name = p.label.toLowerCase();
    if (words.every((w) => name.includes(w)) && pageMatches.length < 8) {
      pageMatches.push({ path: p.path, slug: p.slug, page: p.label, group: p.group, tag: p.tag });
    }
    let inPage = 0;
    for (const it of p.items) {
      if (!words.every((w) => it.lower.includes(w))) continue;
      if (inPage >= PER_PAGE || hits.length >= MAX_HITS) {
        more++;
        continue;
      }
      inPage++;
      // Show the phrase when it appears as typed, otherwise the first word.
      let at = it.lower.indexOf(q);
      let len = q.length;
      if (at < 0) {
        at = it.lower.indexOf(words[0]);
        len = words[0].length;
      }
      const start = Math.max(0, at - SNIPPET / 2);
      const end = Math.min(it.value.length, at + len + SNIPPET);
      hits.push({
        path: p.path, slug: p.slug, page: p.label, group: p.group, tag: p.tag,
        section: it.section, card: it.card, role: it.role,
        before: (start > 0 ? "…" : "") + it.value.slice(start, at),
        match: it.value.slice(at, at + len),
        after: it.value.slice(at + len, end) + (end < it.value.length ? "…" : ""),
      });
    }
  }
  return { pages: pageMatches, hits, more, searched: pages.length };
}
