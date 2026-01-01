import { ref, computed, type Ref, type ComputedRef } from "vue";

interface UseSelectionOptions<T> {
  items: ComputedRef<T[]>;
  getKey: (item: T) => string;
  isSelectable?: (item: T) => boolean;
}

interface UseSelectionReturn {
  selected: Ref<Set<string>>;
  allSelected: ComputedRef<boolean>;
  toggle: (key: string) => void;
  toggleAll: () => void;
  clear: () => void;
}

export function useSelection<T>({
  items,
  getKey,
  isSelectable = () => true,
}: UseSelectionOptions<T>): UseSelectionReturn {
  const selected = ref<Set<string>>(new Set());

  const selectableItems = computed(() => items.value.filter(isSelectable));

  const allSelected = computed(
    () =>
      selectableItems.value.length > 0 &&
      selectableItems.value.every((item) => selected.value.has(getKey(item))),
  );

  function toggle(key: string): void {
    const newSet = new Set(selected.value);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    selected.value = newSet;
  }

  function toggleAll(): void {
    if (allSelected.value) {
      selected.value = new Set();
    } else {
      selected.value = new Set(selectableItems.value.map(getKey));
    }
  }

  function clear(): void {
    selected.value = new Set();
  }

  return {
    selected,
    allSelected,
    toggle,
    toggleAll,
    clear,
  };
}
