<script setup lang="ts">
import type { WorkspaceDocument as NvisyDocument } from "@nvisy/sdk/datatypes";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { truncate, personLabel } from "#console/utils/naming";

const { resolveAvatarUrl } = useAvatarUrl();

interface Props {
	documents: NvisyDocument[];
	selection: Selection;
}

interface Emits {
	(e: "view", documentId: string): void;
	(e: "edit", document: NvisyDocument): void;
	(e: "download", document: NvisyDocument): void;
	(e: "delete", document: NvisyDocument): void;
	(e: "export", document: NvisyDocument): void;
	(e: "assign", document: NvisyDocument): void;
	(e: "bulk-open"): void;
	(e: "bulk-download"): void;
	(e: "bulk-export"): void;
	(e: "bulk-delete"): void;
	(e: "load-more"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const { documentActions } = useDocumentActions(props.selection, {
	view: (id) => emit("view", id),
	edit: (f) => emit("edit", f),
	download: (f) => emit("download", f),
	delete: (f) => emit("delete", f),
	exportDocument: (f) => emit("export", f),
	assign: (f) => emit("assign", f),
	bulkOpen: () => emit("bulk-open"),
	bulkDownload: () => emit("bulk-download"),
	bulkExport: () => emit("bulk-export"),
	bulkDelete: () => emit("bulk-delete"),
});

// Recent edits read as relative time; older than ~30 days show the full date.
const MONTH_MS = 1000 * 60 * 60 * 24 * 30;
function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	const age = Date.now() - new Date(dateStr).getTime();
	return age < MONTH_MS ? relativeTime(dateStr) : formatLongDate(dateStr);
}

// Document kind is surfaced subtly as a ring on the icon tile (not a column):
// originals stay neutral; a redacted copy gets a tinted ring + tooltip.
const KIND_RING: Record<NvisyDocument["kind"], string> = {
	original: "",
	redacted: "ring-1 ring-amber-400/60 dark:ring-amber-500/50",
};

const columns = computed<VirtualColumn<NvisyDocument>[]>(() => [
	{
		key: "name",
		header: t("documents.table.headers.name"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "uploadedBy",
		header: t("documents.table.headers.uploadedBy"),
		width: "140px",
		cell: (f) => ({
			type: "avatar",
			name: personLabel(f.uploadedBy),
			src: resolveAvatarUrl(f.uploadedBy.avatarUrl),
		}),
	},
	{
		key: "size",
		header: t("documents.table.headers.size"),
		width: "100px",
		cell: (f) => ({
			type: "text",
			value: formatFileSize(f.size),
			muted: true,
		}),
	},
	{
		key: "created",
		header: t("documents.table.headers.created"),
		width: "140px",
		cell: (f) => ({
			type: "text",
			value: formatDate(f.createdAt),
			muted: true,
		}),
	},
	{
		key: "updated",
		header: t("documents.table.headers.updated"),
		width: "140px",
		cell: (f) => ({
			type: "text",
			value: formatDate(f.updatedAt),
			muted: true,
		}),
	},
]);

const kindTitle = (document: NvisyDocument) =>
	document.kind === "original"
		? undefined
		: t(`documents.kind.${document.kind}`);
</script>

<template>
  <VirtualTable
    :rows="documents"
    :columns="columns"
    :selection="selection"
    :row-actions="documentActions"
    @load-more="emit('load-more')"
    @row-dblclick="emit('view', $event.id)"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded bg-muted"
          :class="KIND_RING[row.kind]"
          :title="kindTitle(row)"
        >
          <component
            :is="getFileIconForExtension(row.extension)"
            :size="16"
            class="text-muted-foreground"
          />
        </div>
        <span
          class="truncate font-medium text-foreground"
          :title="row.displayName"
        >
          {{ truncate(row.displayName, 40) }}
        </span>
      </div>
    </template>
  </VirtualTable>
</template>
