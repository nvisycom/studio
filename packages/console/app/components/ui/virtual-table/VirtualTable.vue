<script setup lang="ts" generic="TRow extends { id: string }">
import { h } from "vue";
import type { VNodeChild } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import type { DataTableFeatures } from "#console/components/ui/data-table/features";
import { DataTable } from "#console/components/ui/data-table";
import { Badge } from "#console/components/ui/badge";
import { Checkbox } from "#console/components/ui/checkbox";
import { EntityAvatar } from "#console/components/common";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import RowActionItems from "#console/components/pages/RowActionItems.vue";
import type { RowAction } from "#console/components/pages/RowActionItems.vue";
import type { BulkAction } from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import VirtualRowActions from "./VirtualRowActions.vue";
import type { VirtualColumn, VirtualCell, VirtualTableEmpty } from "./columns";

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
	 * Bulk action shown in the right-click menu when the clicked row is part of
	 * a multi-row selection. Requires `selection`.
	 */
	bulkAction?: (selected: Set<string>) => BulkAction;
	/** Accessible label for the ⋯ trigger. */
	menuLabel?: string;
	/** Row pixel height for the virtualizer. */
	rowHeight?: number;
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

const slots =
	defineSlots<Record<`cell-${string}`, (props: { row: TRow }) => unknown>>();

const { t } = useI18n();

const canSelect = (row: TRow) => props.isSelectable?.(row) ?? true;

// Right-click menu: a single cursor-positioned menu reused across rows. It
// shows the row's actions, or the bulk action when the clicked row is part of a
// multi-row selection (mirrors RowActions' bulk-vs-single behavior).
const menuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const menuRow = ref<TRow | null>(null);

const menuIsBulk = computed(() => {
	const row = menuRow.value;
	if (!row || !props.selection || !props.bulkAction) return false;
	const selected = props.selection.selected.value;
	return selected.has(row.id) && selected.size > 1;
});

const menuActions = computed<RowAction[]>(() => {
	const row = menuRow.value;
	if (!row) return [];
	if (menuIsBulk.value && props.selection && props.bulkAction) {
		const bulk = props.bulkAction(props.selection.selected.value);
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
	if (!props.rowActions && !props.bulkAction) return;
	menuRow.value = row;
	menuPosition.value = { x: event.clientX, y: event.clientY };
	// Close first so a right-click on another row re-anchors the dropdown at the
	// new cursor position instead of staying where it first opened.
	menuOpen.value = false;
	nextTick(() => {
		menuOpen.value = true;
	});
}

const alignClass = (align?: "left" | "right" | "center") =>
	align === "right" ? "text-right" : align === "center" ? "text-center" : "";

/** Resolve a typed cell spec to renderable children. */
function renderCell(spec: VirtualCell, row: TRow, key: string): VNodeChild {
	switch (spec.type) {
		case "text":
			return h(
				"span",
				{
					class: [
						spec.mono ? "font-mono text-xs" : "text-sm",
						spec.muted ? "text-muted-foreground" : "text-foreground",
						spec.title ? "block truncate" : "",
					],
					title: spec.title,
				},
				spec.value,
			);
		case "primary":
			return h("div", { class: ["min-w-0", spec.maxWidth] }, [
				h(
					"p",
					{ class: "truncate font-medium text-foreground", title: spec.title },
					spec.title,
				),
				spec.subtitle
					? h(
							"p",
							{ class: "truncate text-xs text-muted-foreground" },
							spec.subtitle,
						)
					: null,
			]);
		case "badge":
			return h(
				Badge,
				{
					variant: spec.variant ?? "secondary",
					class: ["font-normal", spec.capitalize && "capitalize"],
				},
				() => spec.label,
			);
		case "avatar":
			return h("div", { class: "flex items-center gap-2" }, [
				h(EntityAvatar, {
					name: spec.name,
					src: spec.src,
					size: spec.size ?? "sm",
				}),
				h("div", { class: "min-w-0" }, [
					h(
						"p",
						{
							class: [
								"truncate text-sm text-foreground",
								spec.mono && "font-mono",
							],
						},
						spec.name,
					),
					spec.subtitle
						? h(
								"p",
								{ class: "truncate text-xs text-muted-foreground" },
								spec.subtitle,
							)
						: null,
				]),
			]);
		case "status":
			return h("div", { class: "flex items-center gap-2" }, [
				h(spec.icon, {
					size: 14,
					class: ["shrink-0", spec.iconClass, spec.spin && "animate-spin"],
				}),
				h("div", { class: "min-w-0" }, [
					h("span", { class: "text-sm text-foreground" }, spec.label),
					spec.subtitle
						? h(
								"p",
								{ class: "truncate text-xs text-muted-foreground" },
								spec.subtitle,
							)
						: null,
				]),
			]);
		case "custom":
			return (slots[`cell-${key}`]?.({ row }) ?? null) as VNodeChild;
	}
}

/** Build the tanstack column defs: [select?] + data columns + [actions?]. */
const tableColumns = computed<ColumnDef<DataTableFeatures, TRow>[]>(() => {
	const cols: ColumnDef<DataTableFeatures, TRow>[] = [];

	if (props.selection) {
		const sel = props.selection;
		cols.push({
			id: "__select",
			size: 40,
			enableSorting: false,
			header: () =>
				h(Checkbox, {
					modelValue: sel.allSelected.value,
					"onUpdate:modelValue": () => sel.toggleAll(),
					ariaLabel: t("common.selectAll"),
				}),
			cell: ({ row }) =>
				h(Checkbox, {
					modelValue: sel.selected.value.has(row.original.id),
					"onUpdate:modelValue": () => sel.toggle(row.original.id),
					disabled: !canSelect(row.original),
					ariaLabel: t("common.selectRow"),
					onClick: (e: Event) => e.stopPropagation(),
				}),
		});
	}

	for (const col of props.columns) {
		cols.push({
			id: col.key,
			size: col.width?.endsWith("px") ? Number.parseInt(col.width) : undefined,
			header: () =>
				h(
					"span",
					{
						class: [
							"text-xs font-normal uppercase tracking-wider",
							alignClass(col.align),
						],
					},
					col.header ?? "",
				),
			cell: ({ row }) =>
				h("div", { class: alignClass(col.align) }, [
					renderCell(col.cell(row.original), row.original, col.key),
				]),
		});
	}

	if (props.rowActions) {
		const buildActions = props.rowActions;
		cols.push({
			id: "__actions",
			size: 40,
			enableSorting: false,
			header: () => null,
			cell: ({ row }) =>
				h(VirtualRowActions, {
					actions: buildActions(row.original),
					menuLabel: props.menuLabel ?? t("common.openMenu"),
				}),
		});
	}

	return cols;
});

function onRowClick(row: TRow) {
	if (props.selection && canSelect(row)) props.selection.toggle(row.id);
	emit("row-click", row);
}
</script>

<template>
  <DataTable
    :columns="tableColumns"
    :data="rows"
    :get-row-id="(row) => row.id"
    :row-height="rowHeight"
    :enable-row-selection="!!selection"
    :class="['rounded-none border-0', maxHeight ? '' : 'h-full']"
    :style="maxHeight ? { maxHeight } : undefined"
    @load-more="emit('load-more')"
    @row-click="onRowClick"
    @row-contextmenu="onRowContextMenu"
  >
    <template #empty>
      <div v-if="empty" class="py-8 text-center">
        <div
          class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <component :is="empty.icon" class="size-5 text-muted-foreground" />
        </div>
        <p class="mb-1 text-sm text-foreground">{{ empty.title }}</p>
        <p v-if="empty.description" class="text-xs text-muted-foreground">
          {{ empty.description }}
        </p>
      </div>
    </template>
  </DataTable>

  <!-- Right-click menu: a dropdown anchored to an invisible element placed at
       the cursor, opened programmatically from the row's contextmenu event. -->
  <DropdownMenu v-if="rowActions || bulkAction" v-model:open="menuOpen">
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
