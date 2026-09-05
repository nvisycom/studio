<script setup lang="ts">
import { X, Loader2 } from "@lucide/vue";
import type { OpenFile } from "#console/composables/useStudioFiles";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#console/components/ui/tooltip";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#console/components/ui/context-menu";
import { Button } from "#console/components/ui/button";

const props = defineProps<{
	file: OpenFile;
	active: boolean;
	/** True when this is the rightmost tab (disables "Close to the right"). */
	isLast: boolean;
	/** True when only one tab is open (disables "Close others"). */
	only: boolean;
	/** id of the tab currently being dragged, if any. */
	draggingId: string | null;
}>();

const emit = defineEmits<{
	select: [];
	close: [];
	"close-others": [];
	"close-right": [];
	"close-all": [];
	"drag-start": [];
	/** Live drop preview: the pointer moved over this tab from another tab. */
	"drag-over": [before: boolean];
	"drag-end": [];
}>();

const { t } = useI18n();

// This tab is the one being dragged, so it renders as the drop slot that tracks
// the cursor (the live reorder keeps it where the tab will land).
const dragging = computed(() => props.draggingId === props.file.fileId);

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}

// Emit the pointer's side of the tab so the strip can reorder live: the dragged
// tab lands before this one when the cursor is in its left half, after otherwise.
function onDragOver(event: DragEvent) {
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
	emit("drag-over", event.clientX < rect.left + rect.width / 2);
}
</script>

<template>
  <Tooltip>
    <ContextMenu>
      <TooltipTrigger as-child>
        <ContextMenuTrigger as-child>
          <div
            :data-file-id="file.fileId"
            draggable="true"
            :class="[
              'group inline-flex min-w-[100px] max-w-[180px] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 py-1 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              dragging
                ? 'border-primary/30 bg-primary/[0.06] text-foreground shadow'
                : active
                  ? 'border-transparent bg-background text-foreground shadow'
                  : 'border-border/60 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground',
            ]"
            @click="emit('select')"
            @dragstart="emit('drag-start')"
            @dragover.prevent="onDragOver"
            @dragend="emit('drag-end')"
          >
            <div class="relative flex-shrink-0">
              <Loader2 v-if="file.isLoading" :size="14" class="animate-spin" />
              <component
                :is="getFileIconForExtension(file.fileExtension)"
                v-else
                :size="14"
              />
            </div>
            <span class="flex-1 truncate text-sm">
              {{ truncate(file.displayName, 20) }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 flex-shrink-0 p-0 opacity-0 group-hover:opacity-100"
              @click.stop="emit('close')"
            >
              <X :size="12" />
            </Button>
          </div>
        </ContextMenuTrigger>
      </TooltipTrigger>
      <ContextMenuContent>
        <ContextMenuItem @select="emit('close')">
          {{ t("studio.tabs.close") }}
        </ContextMenuItem>
        <ContextMenuItem :disabled="only" @select="emit('close-others')">
          {{ t("studio.tabs.closeOthers") }}
        </ContextMenuItem>
        <ContextMenuItem :disabled="isLast" @select="emit('close-right')">
          {{ t("studio.tabs.closeToRight") }}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem @select="emit('close-all')">
          {{ t("studio.tabs.closeAll") }}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <TooltipContent>
      <p>{{ file.displayName }}</p>
    </TooltipContent>
  </Tooltip>
</template>
