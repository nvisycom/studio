import type { Ref, ComputedRef } from "vue";

export interface UseSelectionOptions<T, K> {
	items: Ref<T[]> | ComputedRef<T[]>;
	getKey: (item: T) => K;
	isSelectable?: (item: T) => boolean;
}

/**
 * The multi-select state a list/table consumes. Pass a whole `useSelection`
 * result down as one prop instead of drilling `selected` + `allSelected` +
 * toggle callbacks separately.
 */
export interface Selection<K extends string | number = string> {
	selected: Ref<Set<K>>;
	allSelected: ComputedRef<boolean>;
	toggle: (key: K) => void;
	toggleAll: () => void;
}

/**
 * Composable for managing multi-select state
 */
export function useSelection<T, K extends string | number>(
	options: UseSelectionOptions<T, K>,
) {
	const { items, getKey, isSelectable = () => true } = options;

	// Use shallowRef to avoid Vue's generic type unwrapping issues with Set<K>
	const selected = shallowRef(new Set<K>());

	const selectableItems = computed(() => items.value.filter(isSelectable));

	const allSelected = computed(() => {
		if (selectableItems.value.length === 0) return false;
		return selectableItems.value.every((item) =>
			selected.value.has(getKey(item)),
		);
	});

	function toggle(key: K) {
		const newSet = new Set(selected.value);
		if (newSet.has(key)) {
			newSet.delete(key);
		} else {
			newSet.add(key);
		}
		selected.value = newSet;
	}

	function toggleAll() {
		if (allSelected.value) {
			selected.value = new Set<K>();
		} else {
			selected.value = new Set<K>(selectableItems.value.map(getKey));
		}
	}

	function clear() {
		selected.value = new Set<K>();
	}

	function select(key: K) {
		const newSet = new Set(selected.value);
		newSet.add(key);
		selected.value = newSet;
	}

	function deselect(key: K) {
		const newSet = new Set(selected.value);
		newSet.delete(key);
		selected.value = newSet;
	}

	return {
		selected,
		allSelected,
		toggle,
		toggleAll,
		clear,
		select,
		deselect,
	};
}
