/** A cursor-paginated response page: a batch of items plus the next cursor. */
interface CursorPage<T> {
	items: T[];
	nextCursor?: string;
}

/**
 * Fetch every page of a cursor-paginated list and return the flattened items.
 *
 * `fetchPage(after)` requests one page starting after the given cursor (undefined
 * for the first). We keep following `nextCursor` until it's absent, so a caller
 * that must show the whole list (workspace-config tables — connections, webhooks,
 * providers, policies, …) isn't silently truncated to the first page.
 *
 * A safety cap bounds the loop so a server that always returns a cursor can't
 * spin forever; it's far above any realistic config-list size.
 */
export async function fetchAllPages<T>(
	fetchPage: (after?: string) => Promise<CursorPage<T>>,
	maxPages = 100,
): Promise<T[]> {
	const all: T[] = [];
	let after: string | undefined;
	for (let page = 0; page < maxPages; page++) {
		const { items, nextCursor } = await fetchPage(after);
		all.push(...items);
		if (!nextCursor) return all;
		after = nextCursor;
	}
	return all;
}
