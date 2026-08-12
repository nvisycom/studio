<script setup lang="ts" generic="TData extends RowData">
import { ref, computed } from "vue";
import type { HTMLAttributes } from "vue";
import type {
	ColumnDef,
	SortingState,
	ColumnVisibilityState,
	RowSelectionState,
	ExpandedState,
	Row,
	RowData,
	Updater,
} from "@tanstack/vue-table";
import { FlexRender, useTable } from "@tanstack/vue-table";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { cn } from "#console/utils/shadcn";
import { valueUpdater } from "#console/components/ui/table/utils";
import {
	dataTableFeatures,
	type DataTableFeatures,
} from "#console/components/ui/data-table/features";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableEmpty,
} from "#console/components/ui/table";

export interface DataTableProps<TData extends RowData> {
	columns: ColumnDef<DataTableFeatures, TData>[];
	data: TData[];
	class?: HTMLAttributes["class"];
	rowHeight?: number;
	overscan?: number;
	enableSorting?: boolean;
	enableRowSelection?: boolean;
	enableMultiRowSelection?: boolean;
	enableExpanding?: boolean;
	manualSorting?: boolean;
	getRowId?: (row: TData) => string;
	getRowCanExpand?: (row: Row<DataTableFeatures, TData>) => boolean;
	getSubRows?: (row: TData) => TData[] | undefined;
}

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
	rowHeight: 48,
	overscan: 5,
	enableSorting: true,
	enableRowSelection: false,
	enableMultiRowSelection: true,
	enableExpanding: false,
	manualSorting: false,
});

const emit = defineEmits<{
	(e: "sorting-change", sorting: SortingState): void;
	(e: "row-selection-change", selection: RowSelectionState): void;
	(e: "expanded-change", expanded: ExpandedState): void;
	(e: "load-more"): void;
	(e: "row-click", row: TData): void;
	(e: "row-contextmenu", event: MouseEvent, row: TData): void;
}>();

const sorting = ref<SortingState>([]);
const columnVisibility = ref<ColumnVisibilityState>({});
const rowSelection = ref<RowSelectionState>({});
const expanded = ref<ExpandedState>({});
const globalFilter = ref("");

const tableContainerRef = ref<HTMLDivElement | null>(null);

const table = useTable({
	// Row models + sorting/visibility/filtering/selection/expanding are declared
	// once in `dataTableFeatures` (v9's opt-in feature model).
	features: dataTableFeatures,
	get data() {
		return props.data;
	},
	get columns() {
		return props.columns;
	},
	getRowId: props.getRowId,
	getRowCanExpand: props.getRowCanExpand,
	getSubRows: props.getSubRows,
	manualSorting: props.manualSorting,
	enableRowSelection: props.enableRowSelection,
	enableMultiRowSelection: props.enableMultiRowSelection,
	onSortingChange: (updaterOrValue: Updater<SortingState>) => {
		valueUpdater(updaterOrValue, sorting);
		emit("sorting-change", sorting.value);
	},
	onColumnVisibilityChange: (updaterOrValue: Updater<ColumnVisibilityState>) =>
		valueUpdater(updaterOrValue, columnVisibility),
	onRowSelectionChange: (updaterOrValue: Updater<RowSelectionState>) => {
		valueUpdater(updaterOrValue, rowSelection);
		emit("row-selection-change", rowSelection.value);
	},
	onExpandedChange: (updaterOrValue: Updater<ExpandedState>) => {
		valueUpdater(updaterOrValue, expanded);
		emit("expanded-change", expanded.value);
	},
	onGlobalFilterChange: (updaterOrValue: Updater<string>) =>
		valueUpdater(updaterOrValue, globalFilter),
	state: {
		get sorting() {
			return sorting.value;
		},
		get columnVisibility() {
			return columnVisibility.value;
		},
		get rowSelection() {
			return rowSelection.value;
		},
		get expanded() {
			return expanded.value;
		},
		get globalFilter() {
			return globalFilter.value;
		},
	},
});

const rowVirtualizer = useVirtualizer(
	computed(() => ({
		count: table.getRowModel().rows.length,
		getScrollElement: () => tableContainerRef.value,
		estimateSize: () => props.rowHeight,
		overscan: props.overscan,
	})),
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

const paddingTop = computed(() =>
	virtualRows.value.length > 0 ? (virtualRows.value[0]?.start ?? 0) : 0,
);

const paddingBottom = computed(() =>
	virtualRows.value.length > 0
		? totalSize.value -
			(virtualRows.value[virtualRows.value.length - 1]?.end ?? 0)
		: 0,
);

function handleScroll(event: Event) {
	const target = event.target as HTMLElement;
	const { scrollTop, scrollHeight, clientHeight } = target;

	if (scrollHeight <= clientHeight) return;

	const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
	if (distanceFromBottom < 100) {
		emit("load-more");
	}
}

function handleRowClick(row: TData) {
	emit("row-click", row);
}

function handleRowContextMenu(event: MouseEvent, row: TData) {
	event.preventDefault();
	emit("row-contextmenu", event, row);
}

defineExpose({
	table,
	sorting,
	columnVisibility,
	rowSelection,
	expanded,
	globalFilter,
	setGlobalFilter: (value: string) => {
		globalFilter.value = value;
	},
	resetRowSelection: () => {
		rowSelection.value = {};
	},
});
</script>

<template>
  <div
    ref="tableContainerRef"
    :class="cn('relative w-full overflow-auto rounded-md border', props.class)"
    @scroll="handleScroll"
  >
    <table class="w-full caption-bottom text-sm table-fixed">
      <TableHeader class="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
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
            :data-index="virtualRow.index"
            :data-state="
              table.getRowModel().rows[virtualRow.index]?.getIsSelected()
                ? 'selected'
                : undefined
            "
            :style="{ height: `${virtualRow.size}px` }"
            class="group cursor-pointer"
            @click="
              handleRowClick(
                table.getRowModel().rows[virtualRow.index]?.original as TData,
              )
            "
            @contextmenu="
              handleRowContextMenu(
                $event,
                table.getRowModel().rows[virtualRow.index]?.original as TData,
              )
            "
          >
            <TableCell
              v-for="cell in table
                .getRowModel()
                .rows[virtualRow.index]?.getVisibleCells()"
              :key="cell.id"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>

          <!-- Bottom padding row for virtualization -->
          <tr v-if="paddingBottom > 0" :style="{ height: `${paddingBottom}px` }" />
        </template>

        <TableEmpty v-else :colspan="columns.length">
          <slot name="empty">
            <span class="text-muted-foreground">No results.</span>
          </slot>
        </TableEmpty>
      </TableBody>
    </Table>
  </div>
</template>
