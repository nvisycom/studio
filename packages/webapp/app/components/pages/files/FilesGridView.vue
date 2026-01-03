<script setup lang="ts">
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

interface Props {
	files: NvisyFile[];
	selectedFiles: Set<string>;
}

interface Emits {
	(e: "toggle-selection", fileId: string): void;
	(e: "view", fileId: string): void;
	(e: "edit", file: NvisyFile): void;
	(e: "download", file: NvisyFile): void;
	(e: "delete", file: NvisyFile): void;
	(e: "scroll", event: Event): void;
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

function handleScroll(event: Event) {
	emit("scroll", event);
}
</script>

<template>
  <div
    class="flex-1 min-h-0 overflow-auto rounded-md border"
    @scroll="handleScroll"
  >
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4"
    >
      <div
        v-for="file in files"
        :key="file.fileId"
        class="group relative flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-colors"
        @click="emit('view', file.fileId)"
      >
        <!-- Selection Checkbox -->
        <div
          class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100': selectedFiles.has(file.fileId) }"
          @click.stop
        >
          <Checkbox
            :model-value="selectedFiles.has(file.fileId)"
            @update:model-value="emit('toggle-selection', file.fileId)"
            class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        <!-- Actions Menu -->
        <div
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="h-7 w-7 p-0">
                <MoreHorizontal :size="14" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                class="cursor-pointer"
                @click="emit('view', file.fileId)"
              >
                <Eye :size="14" class="mr-2" />
                {{ t("files.actions.view") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                class="cursor-pointer"
                @click="emit('edit', file)"
              >
                <Pencil :size="14" class="mr-2" />
                {{ t("files.actions.edit") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                class="cursor-pointer"
                @click="emit('download', file)"
              >
                <Download :size="14" class="mr-2" />
                {{ t("files.actions.download") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-red-600 dark:text-red-400 cursor-pointer"
                @click="emit('delete', file)"
              >
                <Trash2 :size="14" class="mr-2" />
                {{ t("files.actions.delete") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- File Icon -->
        <div
          class="w-16 h-16 mb-3 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800"
        >
          <component
            :is="getFileIcon(file.displayName)"
            :size="32"
            class="text-neutral-500 dark:text-neutral-400"
          />
        </div>

        <!-- File Name -->
        <p
          class="text-sm font-normal text-neutral-900 dark:text-white text-center line-clamp-2 w-full"
          :title="file.displayName"
        >
          {{ file.displayName }}
        </p>

        <!-- File Size and Status -->
        <div class="flex items-center gap-1.5 mt-1">
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-yellow-500': file.status === 'pending',
              'bg-blue-500': file.status === 'processing',
              'bg-green-500': file.status === 'completed',
              'bg-red-500': file.status === 'failed',
              'bg-neutral-400':
                file.status === 'canceled' || file.status === 'skipped',
            }"
          />
          <p
            class="text-xs font-light text-neutral-500 dark:text-neutral-400"
          >
            {{ formatFileSize(file.fileSize) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
