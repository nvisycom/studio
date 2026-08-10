import type { ComputedRef, Ref } from "vue";

/**
 * Optimistic overlay for a list query. Mutations can reflect a change on the
 * list immediately — patch a row in place, or drop it — then reconcile with the
 * server once settled. Shared by the workspace list composables so the (subtle)
 * merge, removal, and rollback logic lives in one place.
 *
 * @param source - The query data ref holding the canonical list.
 * @param getId - Extracts a stable id from a row.
 */
export function useOptimisticList<T extends object, P = Partial<T>>(
	source: Ref<T[] | undefined>,
	getId: (item: T) => string,
) {
	// Pending per-row patches, keyed by id (for optimistic updates).
	const overlays = ref<Record<string, P>>({});
	// Ids optimistically removed from the list (for optimistic deletes).
	const removed = ref(new Set<string>());

	/** The source list with pending patches merged and removed rows hidden. */
	const items: ComputedRef<T[] | undefined> = computed(() => {
		const data = source.value;
		if (!data) return data;
		return data
			.filter((item) => !removed.value.has(getId(item)))
			.map((item) => ({ ...item, ...overlays.value[getId(item)] }));
	});

	// --- Optimistic update ---

	/** Apply an optimistic patch to a row (call from `onMutate`). */
	function apply(id: string, patch: P) {
		overlays.value = { ...overlays.value, [id]: patch };
	}

	/** Drop a row's patch (call from `onError` to roll back an update). */
	function rollback(id: string) {
		const { [id]: _dropped, ...rest } = overlays.value;
		overlays.value = rest;
	}

	/**
	 * Reconcile once an update settles: adopt the server response as the patch
	 * when present, otherwise roll back (call from `onSettled`).
	 */
	function settle(id: string, data: P | undefined) {
		if (data) apply(id, data);
		else rollback(id);
	}

	// --- Optimistic delete ---

	/** Hide one or more rows immediately (call from `onMutate` of a delete). */
	function remove(ids: string | string[]) {
		const next = new Set(removed.value);
		for (const id of Array.isArray(ids) ? ids : [ids]) next.add(id);
		removed.value = next;
	}

	/** Restore optimistically-removed rows (call from `onError` of a delete). */
	function restore(ids: string | string[]) {
		const next = new Set(removed.value);
		for (const id of Array.isArray(ids) ? ids : [ids]) next.delete(id);
		removed.value = next;
	}

	return { items, apply, rollback, settle, remove, restore };
}
