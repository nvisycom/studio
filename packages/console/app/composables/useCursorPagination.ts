import type { Ref } from "vue";

/** A single page of a cursor-paginated list. */
export interface Page<T> {
	items: T[];
	nextCursor?: string;
}

/**
 * Cursor pagination over a list query. The base query owns page one; this
 * accumulates further pages and exposes the combined list, resetting whenever
 * the base page changes (e.g. a filter change refetches). Deriving the cursor
 * from the page result keeps it out of the query body as a side effect.
 *
 * @param source - The base query's data ref (its first `Page`).
 * @param loadPage - Fetches a page after the given cursor.
 */
export function useCursorPagination<T>(
	source: Ref<Page<T> | undefined>,
	loadPage: (after: string) => Promise<Page<T>>,
) {
	// Pages fetched beyond the first, and the cursor of the latest one.
	const extraPages = ref<T[]>([]) as Ref<T[]>;
	const extraCursor = ref<string | undefined>(undefined);

	// Reset the accumulator whenever the base page changes (filter/refetch).
	watch(source, () => {
		extraPages.value = [];
		extraCursor.value = undefined;
	});

	const items = computed<T[]>(() => [
		...(source.value?.items ?? []),
		...extraPages.value,
	]);

	// The active cursor is the extra pages' cursor once loading has started,
	// otherwise the base page's.
	const cursor = computed(() =>
		extraPages.value.length ? extraCursor.value : source.value?.nextCursor,
	);
	const hasMore = computed(() => !!cursor.value);
	const isLoadingMore = ref(false);

	async function loadMore() {
		if (!cursor.value || isLoadingMore.value) return;
		isLoadingMore.value = true;
		try {
			const page = await loadPage(cursor.value);
			extraPages.value = [...extraPages.value, ...page.items];
			extraCursor.value = page.nextCursor;
		} finally {
			isLoadingMore.value = false;
		}
	}

	return { items, hasMore, isLoadingMore, loadMore };
}
