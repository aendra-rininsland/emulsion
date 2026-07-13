export interface PaginateOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
}

export const DEFAULT_PAGE_SIZE = 24;

/**
 * Slice an already-sorted list into a page, keyed off a stable `rkey` field. The cursor is
 * the rkey of the last item returned; passing it back in continues immediately after that item.
 * An unrecognized cursor (stale link, deleted item) yields an empty page rather than guessing.
 */
export function paginate<T extends { rkey: string }>(
  items: readonly T[],
  opts: PaginateOptions
): PaginatedResult<T> {
  const limit = opts.limit ?? DEFAULT_PAGE_SIZE;

  let startIndex = 0;
  if (opts.cursor !== undefined) {
    const cursorIndex = items.findIndex((item) => item.rkey === opts.cursor);
    if (cursorIndex === -1) {
      return { items: [] };
    }
    startIndex = cursorIndex + 1;
  }

  const page = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;
  const lastItem = page[page.length - 1];

  return {
    items: page,
    cursor: hasMore && lastItem ? lastItem.rkey : undefined
  };
}
