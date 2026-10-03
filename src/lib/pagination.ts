// Shared paging for the admin lists: the page number and rows-per-page come
// from the address (?page=2&per=25) so a page can be bookmarked or shared.
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type Paged<T> = {
  slice: T[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  /** index of the first row of this page in the whole list */
  start: number;
};

/** Page number and rows-per-page from the address (unknown values fall back). */
export function readPaging(
  pageParam?: string,
  perParam?: string,
  defaultSize: number = DEFAULT_PAGE_SIZE,
  sizes: readonly number[] = PAGE_SIZES
) {
  const per = Number.parseInt(perParam ?? "", 10);
  const pageSize = sizes.includes(per) ? per : defaultSize;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  return { page, pageSize };
}

/** One page of an in-memory list; the page is clamped to the last one that exists. */
export function paginate<T>(items: T[], pageParam?: string, perParam?: string, defaultSize: number = DEFAULT_PAGE_SIZE): Paged<T> {
  const { page: want, pageSize } = readPaging(pageParam, perParam, defaultSize);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(want, pages);
  const start = (page - 1) * pageSize;
  return { slice: items.slice(start, start + pageSize), total, page, pages, pageSize, start };
}
