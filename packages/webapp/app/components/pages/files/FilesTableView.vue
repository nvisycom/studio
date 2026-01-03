<script setup lang="ts">
import { computed, h } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import {
	FileText,
	FileImage,
	FileCode,
	FileSpreadsheet,
	Download,
	Eye,
	Trash2,
	MoreHorizontal,
	Pencil,
	File as FileIcon,
} from "lucide-vue-next";
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { truncate } from "@/utils/naming";

interface Props {
	files: NvisyFile[];
	selectedFiles: Set<string>;
	allSelected: boolean;
	hasSelection: boolean;
	selectedCount: number;
}

interface Emits {
	(e: "toggle-select-all"): void;
	(e: "toggle-selection", fileId: string): void;
	(e: "view", fileId: string): void;
	(e: "edit", file: NvisyFile): void;
	(e: "download", file: NvisyFile): void;
	(e: "delete", file: NvisyFile): void;
	(e: "bulk-download", format: "zip" | "tar"): void;
	(e: "bulk-delete"): void;
	(e: "load-more"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function getFileIcon(fileName: string) {
	const ext = fileName.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
		case "doc":
		case "docx":
		case "txt":
		case "md":
			return FileText;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "svg":
		case "webp":
			return FileImage;
		case "json":
		case "xml":
		case "html":
		case "css":
		case "js":
		case "ts":
			return FileCode;
		case "csv":
		case "xlsx":
		case "xls":
			return FileSpreadsheet;
		default:
			return FileIcon;
	}
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
				modelValue: props.selectedFiles.has(row.original.fileId),
				"onUpdate:modelValue": () =>
					emit("toggle-selection", row.original.fileId),
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
				{ class: "uppercase text-xs font-light tracking-wider" },
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
				{ class: "uppercase text-xs font-light tracking-wider" },
				t("files.table.headers.size"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-light text-neutral-600 dark:text-neutral-400" },
				formatFileSize(row.original.fileSize),
			),
	},
	{
		accessorKey: "status",
		size: 120,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-light tracking-wider" },
				t("files.table.headers.status"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{
					class:
						"text-xs px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800",
				},
				t(`files.filters.${row.original.status}`),
			),
	},
	{
		accessorKey: "createdAt",
		size: 140,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-light tracking-wider" },
				t("files.table.headers.created"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-light text-neutral-600 dark:text-neutral-400" },
				formatDate(row.original.createdAt),
			),
	},
	{
		accessorKey: "updatedAt",
		size: 140,
		header: () =>
			h(
				"span",
				{ class: "uppercase text-xs font-light tracking-wider" },
				t("files.table.headers.updated"),
			),
		cell: ({ row }) =>
			h(
				"span",
				{ class: "text-sm font-light text-neutral-600 dark:text-neutral-400" },
				formatDate(row.original.updatedAt),
			),
	},
	{
		id: "actions",
		size: 60,
		header: () =>
			h(
				DropdownMenu,
				{},
				{
					default: () => [
						h(DropdownMenuTrigger, { asChild: true }, () =>
							h(
								Button,
								{
									variant: "ghost",
									class: "h-8 w-8 p-0",
									disabled: !props.hasSelection,
								},
								() => h(MoreHorizontal, { size: 16 }),
							),
						),
						h(DropdownMenuContent, { align: "end" }, () => [
							h(
								DropdownMenuItem,
								{
									class: "cursor-pointer",
									disabled: !props.hasSelection,
									onClick: () => emit("bulk-download", "zip"),
								},
								() => [
									h(Download, { size: 14, class: "mr-2" }),
									t("files.actions.downloadAsZip"),
									props.hasSelection ? ` (${props.selectedCount})` : "",
								],
							),
							h(
								DropdownMenuItem,
								{
									class: "cursor-pointer",
									disabled: !props.hasSelection,
									onClick: () => emit("bulk-download", "tar"),
								},
								() => [
									h(Download, { size: 14, class: "mr-2" }),
									t("files.actions.downloadAsTar"),
									props.hasSelection ? ` (${props.selectedCount})` : "",
								],
							),
							h(DropdownMenuSeparator),
							h(
								DropdownMenuItem,
								{
									class: "text-red-600 dark:text-red-400 cursor-pointer",
									disabled: !props.hasSelection,
									onClick: () => emit("bulk-delete"),
								},
								() => [
									h(Trash2, { size: 14, class: "mr-2" }),
									t("files.selection.delete"),
									props.hasSelection ? ` (${props.selectedCount})` : "",
								],
							),
						]),
					],
				},
			),
		cell: ({ row }) => {
			const file = row.original;
			return h(
				DropdownMenu,
				{},
				{
					default: () => [
						h(DropdownMenuTrigger, { asChild: true }, () =>
							h(
								Button,
								{ variant: "ghost", size: "sm", class: "h-8 w-8 p-0" },
								() => h(MoreHorizontal, { size: 16 }),
							),
						),
						h(DropdownMenuContent, { align: "end" }, () => [
							h(
								DropdownMenuItem,
								{
									class: "cursor-pointer",
									onClick: () => emit("view", file.fileId),
								},
								() => [
									h(Eye, { size: 14, class: "mr-2" }),
									t("files.actions.view"),
								],
							),
							h(
								DropdownMenuItem,
								{
									class: "cursor-pointer",
									onClick: () => emit("edit", file),
								},
								() => [
									h(Pencil, { size: 14, class: "mr-2" }),
									t("files.actions.edit"),
								],
							),
							h(
								DropdownMenuItem,
								{
									class: "cursor-pointer",
									onClick: () => emit("download", file),
								},
								() => [
									h(Download, { size: 14, class: "mr-2" }),
									t("files.actions.download"),
								],
							),
							h(DropdownMenuSeparator),
							h(
								DropdownMenuItem,
								{
									class: "text-red-600 dark:text-red-400 cursor-pointer",
									onClick: () => emit("delete", file),
								},
								() => [
									h(Trash2, { size: 14, class: "mr-2" }),
									t("files.actions.delete"),
								],
							),
						]),
					],
				},
			);
		},
	},
]);
</script>

<template>
  <div class="flex-1 min-h-0">
    <DataTable
      :columns="columns"
      :data="files"
      :get-row-id="(row) => row.fileId"
      class="h-full"
      @load-more="emit('load-more')"
    />
  </div>
</template>
