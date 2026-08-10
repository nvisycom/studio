import type { ComputedRef, Ref } from "vue";

/**
 * Optimistic overlay for a list query. Update mutations can reflect a change on
 * a row immediately, then reconcile with the server response once settled —
 * shared by the connections and webhooks composables so the (subtle) merge and
 * rollback logic lives in one place.
 *
 * @param source - The query data ref holding the canonical list.
 * @param getId - Extracts a stable id from a row.
 */
export function useOptimisticList<T extends object, P = Partial<T>>(
	source: Ref<T[] | undefined>,
	getId: (item: T) => string,
) {
	// Pending per-row overlays, keyed by id.
	const overlays = ref<Record<string, P>>({});

	/** The source list with any pending overlays merged on top. */
	const items: ComputedRef<T[] | undefined> = computed(() => {
		const data = source.value;
		if (!data) return data;
		return data.map((item) => ({ ...item, ...overlays.value[getId(item)] }));
	});

	/** Apply an optimistic overlay for a row (call from `onMutate`). */
	function apply(id: string, patch: P) {
		overlays.value = { ...overlays.value, [id]: patch };
	}

	/** Drop a row's overlay (call from `onError` to roll back). */
	function rollback(id: string) {
		const { [id]: _dropped, ...rest } = overlays.value;
		overlays.value = rest;
	}

	/**
	 * Reconcile once the mutation settles: adopt the server response as the
	 * overlay when present, otherwise roll back (call from `onSettled`).
	 */
	function settle(id: string, data: P | undefined) {
		if (data) apply(id, data);
		else rollback(id);
	}

	return { items, apply, rollback, settle };
}
