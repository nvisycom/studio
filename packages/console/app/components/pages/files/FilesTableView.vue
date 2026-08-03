<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import { Download, Eye, Trash2, Pencil } from "@lucide/vue";
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "#console/components/ui/dropdown-menu";

import { DataTable } from "#console/components/ui/data-table";
import { truncate } from "#console/utils/naming";

// Context menu state
const contextMenuOpen = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuFile = ref<NvisyFile | null>(null);

interface Props {
	files: NvisyFile[];
	selectedFiles: Set<string>;
	allSelected: boolean;
	selectedCount: number;
}

interface Emits {
	(e: "toggle-select-all"): void;
	(e: "toggle-selection", fileId: string): void;
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

function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (hours < 1) return t("common.time.justNow");
	if (hours < 24) return t("common.time.hoursAgo", { hours });
	if (days < 7) return t("common.time.daysAgo", { days });
	if (days < 30)
		return t("common.time.weeksAgo", { weeks: Math.floor(days / 7) });

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

const columns = computed<ColumnDef<NvisyFile>[]>(() => [
	{
		id: "select",
		size: 40,
		header: () =>
			h(Checkbox, {
				modelValue: props.allSelected,
				"onUpdate:modelValue": () => emit("toggle-select-all"),
				ariaLabel: "Select all",
				class:
					"border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
			}),
		cell: ({ row }) =>
			h(Checkbox, {
				modelValue: props.selectedFiles.has(row.original.id),
				"onUpdate:modelValue": () => emit("toggle-selection", row.original.id),
				ariaLabel: "Select row",
				class:
					"border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "displayName",
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-normal tracking-wider" },
				t("files.table.headers.name"),
			),
		cell: ({ row }) => {
			const file = row.original;
			const IconComponent = getFileIcon(file.displayName);
			return h("div", { class: "flex items-center gap-3" }, [
				h(
					"div",
					{
						class:
							"w-8 h-8 shrink-0 rounded flex items-center justify-center bg-neutral-100 dark:bg-neutral-800",
					},
					h(IconComponent, {
						size: 16,
						class: "text-neutral-600 dark:text-neutral-400",
					}),
				),
				h(
					"span",
					{
						class: "font-normal text-neutral-900 dark:text-white",
						title: file.displayName,
					},
					truncate(file.displayName, 40),
				),
			]);
		},
	},
	{
		accessorKey: "fileSize",
		size: 100,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-normal tracking-wider" },
				t("files.table.headers.size"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-normal text-neutral-600 dark:text-neutral-400" },
				formatFileSize(row.original.fileSize),
			),
	},
	{
		accessorKey: "createdAt",
		size: 140,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-normal tracking-wider" },
				t("files.table.headers.created"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-normal text-neutral-600 dark:text-neutral-400" },
				formatDate(row.original.createdAt),
			),
	},
	{
		accessorKey: "updatedAt",
		size: 140,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-normal tracking-wider" },
				t("files.table.headers.updated"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-normal text-neutral-600 dark:text-neutral-400" },
				formatDate(row.original.updatedAt),
			),
	},
]);

function handleRowContextMenu(event: MouseEvent, file: NvisyFile) {
	event.preventDefault();
	contextMenuFile.value = file;
	contextMenuPosition.value = { x: event.clientX, y: event.clientY };
	contextMenuOpen.value = true;
}
</script>

<template>
  <div class="flex-1 min-h-0">
    <DataTable
      :columns="columns"
      :data="files"
      :get-row-id="(row) => row.id"
      class="h-full"
      @load-more="emit('load-more')"
      @row-click="(row) => emit('toggle-selection', row.id)"
      @row-contextmenu="handleRowContextMenu"
    />

    <!-- Context Menu (using DropdownMenu positioned at cursor) -->
    <DropdownMenu v-model:open="contextMenuOpen">
      <DropdownMenuTrigger as-child>
        <div
          class="fixed w-0 h-0 pointer-events-none"
          :style="{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent v-if="contextMenuFile" align="start">
        <!-- Bulk actions (when right-clicked file is in selection) -->
        <template v-if="selectedFiles.has(contextMenuFile.id)">
          <DropdownMenuItem class="cursor-pointer" @click="emit('bulk-open')">
            <Eye :size="14" class="mr-2" />
            {{ t("files.actions.open") }} ({{ selectedCount }})
          </DropdownMenuItem>
          <DropdownMenuItem
            class="cursor-pointer"
            @click="emit('bulk-download')"
          >
            <Download :size="14" class="mr-2" />
            {{ t("files.actions.download") }} ({{ selectedCount }})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-red-600 dark:text-red-400 cursor-pointer"
            @click="emit('bulk-delete')"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("files.actions.delete") }} ({{ selectedCount }})
          </DropdownMenuItem>
        </template>

        <!-- Single file actions (when right-clicked file is NOT in selection) -->
        <template v-else>
          <DropdownMenuItem
            class="cursor-pointer"
            @click="emit('view', contextMenuFile.id)"
          >
            <Eye :size="14" class="mr-2" />
            {{ t("files.actions.openInStudio") }}
          </DropdownMenuItem>
          <DropdownMenuItem
            class="cursor-pointer"
            @click="emit('edit', contextMenuFile)"
          >
            <Pencil :size="14" class="mr-2" />
            {{ t("files.actions.edit") }}
          </DropdownMenuItem>
          <DropdownMenuItem
            class="cursor-pointer"
            @click="emit('download', contextMenuFile)"
          >
            <Download :size="14" class="mr-2" />
            {{ t("files.actions.download") }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-red-600 dark:text-red-400 cursor-pointer"
            @click="emit('delete', contextMenuFile)"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("files.actions.delete") }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
