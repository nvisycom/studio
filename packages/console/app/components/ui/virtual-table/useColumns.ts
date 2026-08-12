import { h, computed } from "vue";
import type { ComputedRef } from "vue";
import type { ColumnDef, RowData } from "@tanstack/vue-table";
import { Checkbox } from "#console/components/ui/checkbox";
import type { RowAction } from "#console/components/pages/RowActionItems.vue";
import type { Selection } from "#console/composables/useSelection";
import VirtualRowActions from "./VirtualRowActions.vue";
import type { TableFeatureSet } from "./features";
import type { VirtualColumn } from "./columns";
import { renderCell, alignClass, type CustomCellRenderer } from "./cells";

type Column<TRow extends RowData> = ColumnDef<TableFeatureSet, TRow>;

interface UseColumnsOptions<TRow> {
	columns: () => VirtualColumn<TRow>[];
	selection?: () => Selection | undefined;
	canSelect: (row: TRow) => boolean;
	rowActions?: () => ((row: TRow) => RowAction[]) | undefined;
	menuLabel: () => string;
	/** Resolves `#cell-<key>` for a given row + column key. */
	renderCustom: (row: TRow, key: string) => ReturnType<CustomCellRenderer>;
}

/**
 * Assemble the TanStack column defs for VirtualTable: an optional leading
 * checkbox-select column, the data columns (typed cells), and an optional
 * trailing ⋯ actions column. Kept out of the component so VirtualTable.vue is
 * just the table mechanics + template.
 */
export function useColumns<TRow extends { id: string }>(
	options: UseColumnsOptions<TRow>,
): ComputedRef<Column<TRow>[]> {
	const { t } = useI18n();

	return computed<Column<TRow>[]>(() => {
		const cols: Column<TRow>[] = [];
		const selection = options.selection?.();

		if (selection) {
			cols.push({
				id: "__select",
				size: 40,
				header: () =>
					h(Checkbox, {
						modelValue: selection.allSelected.value,
						"onUpdate:modelValue": () => selection.toggleAll(),
						ariaLabel: t("common.selectAll"),
					}),
				cell: ({ row }) =>
					h(Checkbox, {
						modelValue: selection.selected.value.has(row.original.id),
						"onUpdate:modelValue": () => selection.toggle(row.original.id),
						disabled: !options.canSelect(row.original),
						ariaLabel: t("common.selectRow"),
						onClick: (e: Event) => e.stopPropagation(),
					}),
			});
		}

		for (const col of options.columns()) {
			cols.push({
				id: col.key,
				size: col.width?.endsWith("px")
					? Number.parseInt(col.width)
					: undefined,
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
						renderCell(col.cell(row.original), col.key, (key) =>
							options.renderCustom(row.original, key),
						),
					]),
			});
		}

		const buildActions = options.rowActions?.();
		if (buildActions) {
			cols.push({
				id: "__actions",
				size: 40,
				header: () => null,
				cell: ({ row }) =>
					h(VirtualRowActions, {
						actions: buildActions(row.original),
						menuLabel: options.menuLabel(),
					}),
			});
		}

		return cols;
	});
}
