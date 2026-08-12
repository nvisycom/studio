<script setup lang="ts">
import { ref, computed } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { useVirtualizer } from "@tanstack/vue-virtual";
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import type { Selection } from "#console/composables/useSelection";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "#console/components/ui/context-menu";
import RowActionItems from "#console/components/pages/RowActionItems.vue";

interface Props {
	files: NvisyFile[];
	selection: Selection;
}

interface Emits {
	(e: "view", fileId: string): void;
	(e: "edit", file: NvisyFile): void;
	(e: "download", file: NvisyFile): void;
	(e: "delete", file: NvisyFile): void;
	(e: "bulk-open"): void;
	(e: "bulk-download"): void;
	(e: "bulk-delete"): void;
	(e: "load-more"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedFiles = computed(() => props.selection.selected.value);

// Shared with the table view so the action menu is defined once.
const { fileActions } = useFileActions(props.selection, {
	view: (id) => emit("view", id),
	edit: (f) => emit("edit", f),
	download: (f) => emit("download", f),
	delete: (f) => emit("delete", f),
	bulkOpen: () => emit("bulk-open"),
	bulkDownload: () => emit("bulk-download"),
	bulkDelete: () => emit("bulk-delete"),
});

// ── Responsive grid virtualization ─────────────────────────────────────────
// Cards flow in a grid; we virtualize whole ROWS. Columns-per-row track the
// container width against the same breakpoints the CSS grid used.
const MIN_CARD = 150; // px; matches ~6 cols at xl
const ROW_HEIGHT = 148; // card + gap
const GAP = 16;

const containerRef = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);
useResizeObserver(containerRef, ([entry]) => {
	if (entry) containerWidth.value = entry.contentRect.width;
});

const columnsPerRow = computed(() => {
	const w = containerWidth.value - GAP * 2; // account for padding
	if (w <= 0) return 2;
	return Math.max(2, Math.min(6, Math.floor((w + GAP) / (MIN_CARD + GAP))));
});

const rows = computed<NvisyFile[][]>(() => {
	const cols = columnsPerRow.value;
	const out: NvisyFile[][] = [];
	for (let i = 0; i < props.files.length; i += cols) {
		out.push(props.files.slice(i, i + cols));
	}
	return out;
});

const rowVirtualizer = useVirtualizer(
	computed(() => ({
		count: rows.value.length,
		getScrollElement: () => containerRef.value,
		estimateSize: () => ROW_HEIGHT,
		overscan: 3,
	})),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalHeight = computed(() => rowVirtualizer.value.getTotalSize());

function onScroll(event: Event) {
	const el = event.target as HTMLElement;
	if (el.scrollHeight <= el.clientHeight) return;
	if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) emit("load-more");
}
</script>

<template>
  <div
    ref="containerRef"
    class="min-h-0 flex-1 overflow-auto rounded-md border p-4"
    @scroll="onScroll"
  >
    <div class="relative w-full" :style="{ height: `${totalHeight}px` }">
      <div
        v-for="virtualRow in virtualRows"
        :key="String(virtualRow.key)"
        class="absolute left-0 grid w-full gap-4"
        :style="{
          top: `${virtualRow.start}px`,
          gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
        }"
      >
        <ContextMenu v-for="file in rows[virtualRow.index]" :key="file.id">
          <ContextMenuTrigger as-child>
            <div
              class="group relative flex cursor-pointer flex-col items-center rounded-lg border border-transparent p-4 transition-colors hover:border-border hover:bg-muted/50"
              :class="{ 'bg-muted/50': selectedFiles.has(file.id) }"
              @click="selection.toggle(file.id)"
            >
              <div
                class="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                :class="{ 'opacity-100': selectedFiles.has(file.id) }"
                @click.stop
              >
                <Checkbox
                  :model-value="selectedFiles.has(file.id)"
                  @update:model-value="selection.toggle(file.id)"
                />
              </div>

              <div
                class="mb-3 flex size-16 items-center justify-center rounded-lg bg-muted"
              >
                <component
                  :is="getFileIcon(file.displayName)"
                  :size="32"
                  class="text-muted-foreground"
                />
              </div>

              <p
                class="line-clamp-2 w-full text-center text-sm text-foreground"
                :title="file.displayName"
              >
                {{ file.displayName }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ formatFileSize(file.fileSize) }}
              </p>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <RowActionItems :actions="fileActions(file)" variant="context" />
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  </div>
</template>
