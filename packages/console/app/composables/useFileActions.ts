import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import { Download, Eye, Trash2, Pencil } from "@lucide/vue";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";

/** Callbacks the file views raise; shared so the action menu is defined once. */
export interface FileActionHandlers {
	view: (fileId: string) => void;
	edit: (file: NvisyFile) => void;
	download: (file: NvisyFile) => void;
	delete: (file: NvisyFile) => void;
	bulkOpen: () => void;
	bulkDownload: () => void;
	bulkDelete: () => void;
}

/**
 * The right-click action list for a file, shared by the table and grid views.
 * When the file is part of a multi-selection the menu switches to bulk actions
 * (open / download / delete the whole selection); otherwise it's the single
 * file's actions.
 */
export function useFileActions(
	selection: Selection,
	handlers: FileActionHandlers,
) {
	const { t } = useI18n();

	function fileActions(file: NvisyFile): RowAction[] {
		const selected = selection.selected.value;
		if (selected.has(file.id) && selected.size > 1) {
			const n = selected.size;
			return [
				{
					key: "bulk-open",
					label: `${t("files.actions.open")} (${n})`,
					icon: Eye,
					select: handlers.bulkOpen,
				},
				{
					key: "bulk-download",
					label: `${t("files.actions.download")} (${n})`,
					icon: Download,
					select: handlers.bulkDownload,
				},
				{
					key: "bulk-delete",
					label: `${t("files.actions.delete")} (${n})`,
					icon: Trash2,
					danger: true,
					separatorBefore: true,
					select: handlers.bulkDelete,
				},
			];
		}
		return [
			{
				key: "view",
				label: t("files.actions.openInStudio"),
				icon: Eye,
				select: () => handlers.view(file.id),
			},
			{
				key: "edit",
				label: t("files.actions.edit"),
				icon: Pencil,
				select: () => handlers.edit(file),
			},
			{
				key: "download",
				label: t("files.actions.download"),
				icon: Download,
				select: () => handlers.download(file),
			},
			{
				key: "delete",
				label: t("files.actions.delete"),
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				select: () => handlers.delete(file),
			},
		];
	}

	return { fileActions };
}
