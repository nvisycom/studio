import type { Ref, ComputedRef } from "vue";

export interface UseSelectionOptions<T, K> {
	items: Ref<T[]> | ComputedRef<T[]>;
	getKey: (item: T) => K;
	isSelectable?: (item: T) => boolean;
}

/**
 * Composable for managing multi-select state
 */
export function useSelection<T, K extends string | number>(
	options: UseSelectionOptions<T, K>,
) {
	const { items, getKey, isSelectable = () => true } = options;

	const selected = ref<Set<K>>(new Set());

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
			selected.value = new Set();
		} else {
			selected.value = new Set(selectableItems.value.map(getKey));
		}
	}

	function clear() {
		selected.value = new Set();
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
