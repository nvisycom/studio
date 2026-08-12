<script setup lang="ts">
import { Download, Eye, Trash2, Pencil } from "@lucide/vue";
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import type { Selection } from "#console/composables/useSelection";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "#console/components/ui/context-menu";

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
	(e: "scroll", event: Event): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

/** Files currently selected, and how many. */
const selectedFiles = computed(() => props.selection.selected.value);
const selectedCount = computed(() => selectedFiles.value.size);

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
      <ContextMenu v-for="file in files" :key="file.id">
        <ContextMenuTrigger as-child>
          <div
            class="group relative flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer"
            :class="{ 'bg-muted/50': selectedFiles.has(file.id) }"
            @click="selection.toggle(file.id)"
          >
            <!-- Selection Checkbox -->
            <div
              class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              :class="{ 'opacity-100': selectedFiles.has(file.id) }"
              @click.stop
            >
              <Checkbox
                :model-value="selectedFiles.has(file.id)"
                @update:model-value="selection.toggle(file.id)"
              />
            </div>

            <!-- File Icon -->
            <div
              class="mb-3 flex size-16 items-center justify-center rounded-lg bg-muted"
            >
              <component
                :is="getFileIcon(file.displayName)"
                :size="32"
                class="text-muted-foreground"
              />
            </div>

            <!-- File Name -->
            <p
              class="text-center text-sm text-foreground line-clamp-2 w-full"
              :title="file.displayName"
            >
              {{ file.displayName }}
            </p>

            <!-- File Size -->
            <div class="flex items-center gap-1.5 mt-1">
              <p
                class="text-xs font-normal text-muted-foreground"
              >
                {{ formatFileSize(file.fileSize) }}
              </p>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <!-- Bulk actions (when right-clicked file is in selection) -->
          <template v-if="selectedFiles.has(file.id)">
            <ContextMenuItem class="cursor-pointer" @click="emit('bulk-open')">
              <Eye :size="14" class="mr-2" />
              {{ t("files.actions.open") }} ({{ selectedCount }})
            </ContextMenuItem>
            <ContextMenuItem
              class="cursor-pointer"
              @click="emit('bulk-download')"
            >
              <Download :size="14" class="mr-2" />
              {{ t("files.actions.download") }} ({{ selectedCount }})
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              class="cursor-pointer text-destructive focus:text-destructive"
              @click="emit('bulk-delete')"
            >
              <Trash2 :size="14" class="mr-2" />
              {{ t("files.actions.delete") }} ({{ selectedCount }})
            </ContextMenuItem>
          </template>

          <!-- Single file actions (when right-clicked file is NOT in selection) -->
          <template v-else>
            <ContextMenuItem
              class="cursor-pointer"
              @click="emit('view', file.id)"
            >
              <Eye :size="14" class="mr-2" />
              {{ t("files.actions.openInStudio") }}
            </ContextMenuItem>
            <ContextMenuItem class="cursor-pointer" @click="emit('edit', file)">
              <Pencil :size="14" class="mr-2" />
              {{ t("files.actions.edit") }}
            </ContextMenuItem>
            <ContextMenuItem
              class="cursor-pointer"
              @click="emit('download', file)"
            >
              <Download :size="14" class="mr-2" />
              {{ t("files.actions.download") }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              class="cursor-pointer text-destructive focus:text-destructive"
              @click="emit('delete', file)"
            >
              <Trash2 :size="14" class="mr-2" />
              {{ t("files.actions.delete") }}
            </ContextMenuItem>
          </template>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  </div>
</template>
