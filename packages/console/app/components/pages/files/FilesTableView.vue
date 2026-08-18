<script setup lang="ts">
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { truncate, personLabel } from "#console/utils/naming";

const { resolveAvatarUrl } = useAvatarUrl();

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

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const { fileActions } = useFileActions(props.selection, {
	view: (id) => emit("view", id),
	edit: (f) => emit("edit", f),
	download: (f) => emit("download", f),
	delete: (f) => emit("delete", f),
	bulkOpen: () => emit("bulk-open"),
	bulkDownload: () => emit("bulk-download"),
	bulkDelete: () => emit("bulk-delete"),
});

// Recent edits read as relative time; older than ~30 days show the full date.
const MONTH_MS = 1000 * 60 * 60 * 24 * 30;
function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	const age = Date.now() - new Date(dateStr).getTime();
	return age < MONTH_MS ? relativeTime(dateStr) : formatLongDate(dateStr);
}

// File kind is surfaced subtly as a ring on the file-icon tile (not a column):
// originals stay neutral; redacted/audit get a tinted ring + tooltip.
const KIND_RING: Record<NvisyFile["fileKind"], string> = {
	original: "",
	redacted: "ring-1 ring-amber-400/60 dark:ring-amber-500/50",
	audit: "ring-1 ring-blue-400/60 dark:ring-blue-500/50",
};

const columns = computed<VirtualColumn<NvisyFile>[]>(() => [
	{
		key: "name",
		header: t("files.table.headers.name"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "uploadedBy",
		header: t("files.table.headers.uploadedBy"),
		width: "140px",
		cell: (f) => ({
			type: "avatar",
			name: personLabel(f.uploadedBy),
			src: resolveAvatarUrl(f.uploadedBy.avatarUrl),
		}),
	},
	{
		key: "size",
		header: t("files.table.headers.size"),
		width: "100px",
		cell: (f) => ({
			type: "text",
			value: formatFileSize(f.fileSize),
			muted: true,
		}),
	},
	{
		key: "created",
		header: t("files.table.headers.created"),
		width: "140px",
		cell: (f) => ({
			type: "text",
			value: formatDate(f.createdAt),
			muted: true,
		}),
	},
	{
		key: "updated",
		header: t("files.table.headers.updated"),
		width: "140px",
		cell: (f) => ({
			type: "text",
			value: formatDate(f.updatedAt),
			muted: true,
		}),
	},
]);

const kindTitle = (file: NvisyFile) =>
	file.fileKind === "original" ? undefined : t(`files.kind.${file.fileKind}`);
</script>

<template>
  <VirtualTable
    :rows="files"
    :columns="columns"
    :selection="selection"
    :row-actions="fileActions"
    @load-more="emit('load-more')"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded bg-muted"
          :class="KIND_RING[row.fileKind]"
          :title="kindTitle(row)"
        >
          <component
            :is="getFileIcon(row.displayName)"
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
