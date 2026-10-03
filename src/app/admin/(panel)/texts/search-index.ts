import { groupByName, listScanPaths, scanPage } from "./scan";

// A searchable copy of every page's text, built by reading the live pages once
// and kept in memory for a few minutes. It is dropped whenever page text is
// saved. Built lazily (the first search, or when the search box gets focus).

export type IndexedItem = { value: string; lower: string; role: string; section: string; card: string };
export type IndexedPage = {
  path: string;
  slug: string;
  label: string;
  group: string;
  tag: string;
  items: IndexedItem[];
};

const TTL_MS = 5 * 60 * 1000;
const g = globalThis as unknown as { __ukSearch?: { at: number; pages: IndexedPage[]; building?: Promise<IndexedPage[]> } };

export function invalidateSearchIndex() {
  if (g.__ukSearch) g.__ukSearch.at = 0;
}

async function build(): Promise<IndexedPage[]> {
  const groups = await listScanPaths();
  const entries = groups.flatMap((grp) =>
    grp.entries.map((e) => ({ ...e, group: grp.group, slug: groupByName(grp.group)?.slug ?? "added" }))
  );
  const pages: IndexedPage[] = new Array(entries.length);
  let next = 0;
  // A few pages at a time, so indexing neither hammers the server nor takes minutes.
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= entries.length) return;
      const e = entries[i];
      const { items } = await scanPage(e.path);
      pages[i] = {
        path: e.path, slug: e.slug, label: e.label, group: e.group, tag: e.tag,
        items: items
          .filter((it) => it.region === "Page" && (it.kind === "text" || it.kind === "alt"))
          .map((it) => ({
            value: it.value.trim(), lower: it.value.trim().toLowerCase(), role: it.role,
            section: it.sectionTitle, card: it.cardTitle,
          })),
      };
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return pages.filter(Boolean);
}

/** The index, rebuilt when it is older than a few minutes (or `force`). */
export async function getSearchIndex(force = false): Promise<IndexedPage[]> {
  const cur = g.__ukSearch;
  if (!force && cur && cur.pages.length && Date.now() - cur.at < TTL_MS) return cur.pages;
  if (cur?.building) return cur.building;
  const building = build()
    .then((pages) => {
      g.__ukSearch = { at: Date.now(), pages };
      return pages;
    })
    .finally(() => {
      if (g.__ukSearch) delete g.__ukSearch.building;
    });
  g.__ukSearch = { at: cur?.at ?? 0, pages: cur?.pages ?? [], building };
  return building;
}
