import type { WorkspaceDocument as NvisyDocument } from "@nvisy/sdk/datatypes";
import {
	ArrowUpFromLine,
	Download,
	Eye,
	Pencil,
	Trash2,
	UserPlus,
} from "@lucide/vue";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";

/** Callbacks the document views raise; shared so the action menu is defined once. */
export interface DocumentActionHandlers {
	view: (documentId: string) => void;
	edit: (document: NvisyDocument) => void;
	download: (document: NvisyDocument) => void;
	delete: (document: NvisyDocument) => void;
	/** Export one document to a file-service connection (opens the export dialog). */
	exportDocument: (document: NvisyDocument) => void;
	/** Assign one document to a reviewer (opens the assign dialog). */
	assign: (document: NvisyDocument) => void;
	bulkOpen: () => void;
	bulkDownload: () => void;
	bulkExport: () => void;
	bulkDelete: () => void;
}

/**
 * The right-click action list for a document, shared by the table and grid
 * views. When the document is part of a multi-selection the menu switches to
 * bulk actions (open / download / delete the whole selection); otherwise it's
 * the single document's actions.
 */
export function useDocumentActions(
	selection: Selection,
	handlers: DocumentActionHandlers,
) {
	const { t } = useI18n();

	function documentActions(document: NvisyDocument): RowAction[] {
		const selected = selection.selected.value;
		if (selected.has(document.id) && selected.size > 1) {
			const n = selected.size;
			return [
				{
					key: "bulk-open",
					label: `${t("documents.actions.open")} (${n})`,
					icon: Eye,
					select: handlers.bulkOpen,
				},
				{
					key: "bulk-download",
					label: `${t("documents.actions.download")} (${n})`,
					icon: Download,
					select: handlers.bulkDownload,
				},
				{
					key: "bulk-export",
					label: `${t("documents.actions.export")} (${n})`,
					icon: ArrowUpFromLine,
					select: handlers.bulkExport,
				},
				{
					key: "bulk-delete",
					label: `${t("documents.actions.delete")} (${n})`,
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
				label: t("documents.actions.openInStudio"),
				icon: Eye,
				select: () => handlers.view(document.id),
			},
			{
				key: "edit",
				label: t("documents.actions.edit"),
				icon: Pencil,
				select: () => handlers.edit(document),
			},
			{
				key: "download",
				label: t("documents.actions.download"),
				icon: Download,
				select: () => handlers.download(document),
			},
			{
				key: "export",
				label: t("documents.actions.export"),
				icon: ArrowUpFromLine,
				select: () => handlers.exportDocument(document),
			},
			{
				key: "assign",
				label: t("documents.actions.assign"),
				icon: UserPlus,
				select: () => handlers.assign(document),
			},
			{
				key: "delete",
				label: t("documents.actions.delete"),
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				select: () => handlers.delete(document),
			},
		];
	}

	return { documentActions };
}
