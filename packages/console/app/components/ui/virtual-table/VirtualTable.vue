<script setup lang="ts" generic="TRow extends { id: string }">
import { ref, computed, nextTick } from "vue";
import type { VNodeChild } from "vue";
import { FlexRender, useTable } from "@tanstack/vue-table";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { tableFeatureSet } from "./features";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import RowActionItems from "#console/components/pages/RowActionItems.vue";
import type { RowAction } from "#console/components/pages/RowActionItems.vue";
import type { BulkAction } from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import { useColumns } from "./useColumns";
import type { VirtualColumn, VirtualTableEmpty } from "./columns";

// A virtualized table (TanStack Table v9 core + vue-virtual) driven by the
// declarative VirtualColumn descriptor. Only the features we use are enabled —
// The enabled TanStack feature set lives in features.ts (shared with
// useColumns). Everything not enabled there — sorting, filtering, expanding —
// is out; selection, actions, and paging are handled here, not by TanStack.

const props = defineProps<{
	rows: TRow[];
	columns: VirtualColumn<TRow>[];
	/** Multi-select state (adds the leading checkbox column when present). */
	selection?: Selection;
	/** Guards which rows are selectable (mirrors useSelection's isSelectable). */
	isSelectable?: (row: TRow) => boolean;
	/** Per-row actions (adds the trailing ⋯ column + right-click context menu). */
	rowActions?: (row: TRow) => RowAction[];
	/**
	 * Bulk action shown in the right-click menu when the clicked row is part of a
	 * multi-row selection. Requires `selection`.
	 */
	bulkAction?: (selected: Set<string>) => BulkAction;
	/** Accessible label for the ⋯ trigger. */
	menuLabel?: string;
	/** Row pixel height for the virtualizer. */
	rowHeight?: number;
	/** Overscan rows rendered beyond the viewport. */
	overscan?: number;
	/**
	 * Caps the scroll viewport so the table virtualizes inside a growing layout
	 * (e.g. a Card). Any CSS length, e.g. "60vh". Omit when the table already
	 * fills a bounded flex parent (files/team pages).
	 */
	maxHeight?: string;
	/** Shared empty-state tile (omit to render nothing when empty). */
	empty?: VirtualTableEmpty;
}>();

const emit = defineEmits<{
	"load-more": [];
	/** Fired on row click; default behavior toggles selection when present. */
	"row-click": [row: TRow];
}>();

const slots = defineSlots<
	Record<`cell-${string}`, (props: { row: TRow }) => unknown> & {
		/** Optional CTA shown under the empty-state text (e.g. "Clear filters"). */
		"empty-action"?: () => unknown;
	}
>();

const { t } = useI18n();

const canSelect = (row: TRow) => props.isSelectable?.(row) ?? true;

// Columns (select + data + actions) are assembled in a helper; cells render via
// the shared renderCell dispatcher. See useColumns.ts / cells.ts.
const columnDefs = useColumns<TRow>({
	columns: () => props.columns,
	selection: () => props.selection,
	canSelect,
	rowActions: () => props.rowActions,
	menuLabel: () => props.menuLabel ?? t("common.openMenu"),
	renderCustom: (row, key) =>
		(slots[`cell-${key}`]?.({ row }) ?? null) as VNodeChild,
});

// The table's minimum usable width: each fixed column keeps its px width, each
// flex column (no width, e.g. name) gets a readable floor, plus the leading
// checkbox / trailing actions gutters. The table stays `w-full` and fills the
// container above this; below it, the scroll container scrolls horizontally
// instead of crushing the columns into one another.
const FLEX_COLUMN_MIN = 200; // readable floor for an auto-sized column (e.g. name)
const GUTTER_WIDTH = 40; // checkbox / actions columns
const minTableWidth = computed(() => {
	let width = 0;
	if (props.selection) width += GUTTER_WIDTH;
	if (props.rowActions) width += GUTTER_WIDTH;
	for (const col of props.columns) {
		const px = col.width?.endsWith("px")
			? Number.parseInt(col.width, 10)
			: undefined;
		width += px ?? FLEX_COLUMN_MIN;
	}
	return width;
});

// ── TanStack table (core only) + virtualizer ──────────────────────────────

const table = useTable({
	features: tableFeatureSet,
	get data() {
		return props.rows;
	},
	get columns() {
		return columnDefs.value;
	},
	getRowId: (row: TRow) => row.id,
});

const containerRef = ref<HTMLDivElement | null>(null);

// When there are no rows, the empty state renders in place of the table so it
// can fill and center in the available height (instead of a short cell clinging
// to the top). Only when an `empty` descriptor was provided.
const isEmpty = computed(() => props.rows.length === 0 && !!props.empty);

const rowVirtualizer = useVirtualizer(
	computed(() => ({
		count: table.getRowModel().rows.length,
		getScrollElement: () => containerRef.value,
		estimateSize: () => props.rowHeight ?? 48,
		overscan: props.overscan ?? 5,
	})),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const paddingTop = computed(() => virtualRows.value[0]?.start ?? 0);
const paddingBottom = computed(() => {
	const total = rowVirtualizer.value.getTotalSize();
	const last = virtualRows.value.at(-1)?.end ?? 0;
	return virtualRows.value.length ? total - last : 0;
});

// ── Interaction ────────────────────────────────────────────────────────────

function onScroll(event: Event) {
	const el = event.target as HTMLElement;
	if (el.scrollHeight <= el.clientHeight) return;
	if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) emit("load-more");
}

function onRowClick(row: TRow) {
	if (props.selection && canSelect(row)) props.selection.toggle(row.id);
	emit("row-click", row);
}

// Right-click menu: a single cursor-anchored dropdown reused across rows. It
// shows the row's actions, or the bulk action when the clicked row is part of a
// multi-row selection (mirrors RowActions' bulk-vs-single behavior).
const hasMenu = computed(() => !!props.rowActions || !!props.bulkAction);
const menuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const menuRow = ref<TRow | null>(null);

const menuActions = computed<RowAction[]>(() => {
	const row = menuRow.value;
	if (!row) return [];
	const selected = props.selection?.selected.value;
	const isBulk =
		!!props.bulkAction &&
		!!selected &&
		selected.has(row.id) &&
		selected.size > 1;
	if (isBulk && props.bulkAction && selected) {
		const bulk = props.bulkAction(selected);
		return [
			{
				key: "bulk",
				label: `${bulk.label} (${bulk.count})`,
				icon: bulk.icon,
				danger: true,
				select: bulk.select,
			},
		];
	}
	return props.rowActions?.(row) ?? [];
});

function onRowContextMenu(event: MouseEvent, row: TRow) {
	if (!hasMenu.value) return;
	event.preventDefault();
	menuRow.value = row;
	menuPosition.value = { x: event.clientX, y: event.clientY };
	// Close first so a right-click on another row re-anchors the dropdown at the
	// new cursor position instead of staying where it first opened.
	menuOpen.value = false;
	nextTick(() => {
		menuOpen.value = true;
	});
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-auto"
    :class="maxHeight ? '' : 'h-full'"
    :style="maxHeight ? { maxHeight } : undefined"
    @scroll="onScroll"
  >
    <!-- Empty state: rendered instead of the table so it fills and centers in
         the available height. -->
    <div
      v-if="isEmpty && empty"
      class="flex h-full min-h-[240px] flex-col items-center justify-center py-16 text-center"
    >
      <div
        class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
      >
        <component :is="empty.icon" class="size-5 text-muted-foreground" />
      </div>
      <p class="mb-1 text-sm font-medium text-foreground">{{ empty.title }}</p>
      <p
        v-if="empty.description"
        class="max-w-sm text-sm text-muted-foreground"
      >
        {{ empty.description }}
      </p>
      <!-- Optional CTA (e.g. a "Clear filters" button). -->
      <div v-if="$slots['empty-action']" class="mt-4">
        <slot name="empty-action" />
      </div>
    </div>

    <Table
      v-else
      class="table-fixed"
      :style="{ minWidth: `${minTableWidth}px` }"
    >
      <TableHeader
        class="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_0_hsl(var(--border))]"
      >
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :style="{
              width:
                header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
            }"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="table.getRowModel().rows.length > 0">
          <tr
            v-if="paddingTop > 0"
            :style="{ height: `${paddingTop}px` }"
            aria-hidden="true"
          />

          <TableRow
            v-for="virtualRow in virtualRows"
            :key="String(virtualRow.key)"
            :style="{ height: `${virtualRow.size}px` }"
            class="group cursor-pointer"
            @click="
              onRowClick(table.getRowModel().rows[virtualRow.index]!.original)
            "
            @contextmenu="
              onRowContextMenu(
                $event,
                table.getRowModel().rows[virtualRow.index]!.original,
              )
            "
          >
            <TableCell
              v-for="cell in table.getRowModel().rows[virtualRow.index]!.getVisibleCells()"
              :key="cell.id"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>

          <tr
            v-if="paddingBottom > 0"
            :style="{ height: `${paddingBottom}px` }"
          />
        </template>
      </TableBody>
    </Table>
  </div>

  <!-- Right-click menu: a dropdown anchored to an invisible element placed at
       the cursor, opened programmatically from the row's contextmenu event. -->
  <DropdownMenu v-if="hasMenu" v-model:open="menuOpen">
    <DropdownMenuTrigger as-child>
      <div
        class="pointer-events-none fixed size-0"
        :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent v-if="menuActions.length" align="start">
      <RowActionItems :actions="menuActions" variant="dropdown" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
