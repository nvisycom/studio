<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { X, Loader2, ChevronDown } from "@lucide/vue";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#console/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";

const router = useRouter();
const { wLink } = useWorkspaceLink();

// Use studio files store for multiple open files
const { openFiles, activeFileId, closeFile, setActiveFile, moveFileToFront } =
	useStudioFiles();

// Tabs fill the available header width and overflow into a dropdown once they no
// longer fit — the count isn't capped. We measure the strip's available width
// (the space the tabs may use) and one tab's rendered width, both via
// ResizeObserver on stable refs — never a per-render getBoundingClientRect,
// which would force a reflow on every tab-list change and thrash.
const strip = ref<HTMLElement | null>(null);
const firstTab = ref<HTMLElement | null>(null);
const availableWidth = ref(0);
const tabWidth = ref(180); // fallback until measured (max-w-[180px])

// Round measured widths so subpixel jitter can't re-trigger the fit computation.
useResizeObserver(strip, ([entry]) => {
	availableWidth.value = Math.floor(entry?.contentRect.width ?? 0);
});
useResizeObserver(firstTab, ([entry]) => {
	const w = Math.round(entry?.contentRect.width ?? 0);
	if (w > 0) tabWidth.value = w;
});

// Bind the first visible tab (stable element) for measurement, without touching
// layout during render.
function setFirstTab(i: number, el: Element | null) {
	if (i === 0) firstTab.value = (el as HTMLElement | null) ?? null;
}

const OVERFLOW_WIDTH = 52; // the "+N" dropdown trigger, reserved when overflowing
const GAP = 4; // gap-1 between tabs

// How many tabs fit in the available width. When they all fit, no space is
// reserved for the overflow trigger; otherwise it is. At least one tab shows.
const fitCount = computed(() => {
	const width = availableWidth.value;
	const count = openFiles.value.length;
	if (width <= 0 || count === 0) return count; // pre-measure: show all
	const per = tabWidth.value + GAP;
	if (count * tabWidth.value + GAP * (count - 1) <= width) return count;
	return Math.max(1, Math.floor((width - OVERFLOW_WIDTH) / per));
});

// Compute visible tabs and overflow tabs.
const visibleFiles = computed(() => {
	const max = fitCount.value;
	if (openFiles.value.length <= max) return openFiles.value;

	// Always keep the active file visible: if it's past the fit window, swap it
	// into the last visible slot.
	const activeIndex = openFiles.value.findIndex(
		(f) => f.fileId === activeFileId.value,
	);
	if (activeIndex < max) return openFiles.value.slice(0, max);
	const visible = openFiles.value.slice(0, max - 1);
	const activeFile = openFiles.value[activeIndex];
	return activeFile ? [...visible, activeFile] : visible;
});

const overflowFiles = computed(() => {
	if (openFiles.value.length <= fitCount.value) return [];
	const visibleIds = new Set(visibleFiles.value.map((f) => f?.fileId));
	return openFiles.value.filter((f) => f && !visibleIds.has(f.fileId));
});

const hasOverflow = computed(() => overflowFiles.value.length > 0);

function handleCloseFile(fileId: string) {
	closeFile(fileId);
	// If no more files open, navigate back to files page
	if (openFiles.value.length === 0) {
		router.push(wLink("/files"));
	}
}

function handleSelectFile(fileId: string) {
	setActiveFile(fileId);
}

function handleSelectFromDropdown(fileId: string) {
	moveFileToFront(fileId);
}

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}
</script>

<template>
  <!-- Outer wrapper fills the available header width so we can measure how much
       room the tabs have; the inner pill hugs its actual tabs. The left/right
       padding clears the sidebar trigger and app chrome overlaid on the header
       edges. -->
  <div
    v-if="openFiles.length > 0"
    ref="strip"
    class="flex min-w-0 flex-1 pl-9 pr-20"
  >
    <div
      class="inline-flex h-9 max-w-full items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
    >
    <TooltipProvider>
      <!-- Visible Tabs -->
      <Tooltip v-for="(file, i) in visibleFiles" :key="file.fileId">
        <TooltipTrigger as-child>
          <div
            :ref="(el) => setFirstTab(i, el as Element | null)"
            :class="[
              'inline-flex items-center justify-center whitespace-nowrap rounded-md border px-3 py-1 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer gap-2 group min-w-[100px] max-w-[180px]',
              activeFileId === file.fileId
                ? 'border-transparent bg-background text-foreground shadow'
                : 'border-border/60 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground',
            ]"
            @click="handleSelectFile(file.fileId)"
          >
            <div class="relative flex-shrink-0">
              <Loader2 v-if="file.isLoading" :size="14" class="animate-spin" />
              <component :is="getFileIcon(file.displayName)" v-else :size="14" />
            </div>
            <span class="text-sm truncate flex-1">
              {{ truncate(file.displayName, 20) }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              @click.stop="handleCloseFile(file.fileId)"
            >
              <X :size="12" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{{ file.displayName }}</p>
        </TooltipContent>
      </Tooltip>

      <!-- Overflow Dropdown -->
      <DropdownMenu v-if="hasOverflow">
        <DropdownMenuTrigger as-child>
          <div
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-normal ring-offset-background transition-all cursor-pointer gap-1 hover:bg-background/50 text-muted-foreground"
          >
            <span class="text-xs">+{{ overflowFiles.length }}</span>
            <ChevronDown :size="14" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="w-[220px] max-h-[300px] overflow-y-auto"
        >
          <DropdownMenuItem
            v-for="file in overflowFiles"
            :key="file.fileId"
            class="cursor-pointer flex items-center gap-2 group"
            @click="handleSelectFromDropdown(file.fileId)"
          >
            <div class="relative flex-shrink-0">
              <Loader2 v-if="file.isLoading" :size="14" class="animate-spin" />
              <component :is="getFileIcon(file.displayName)" v-else :size="14" />
            </div>
            <span class="flex-1 truncate">{{ file.displayName }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              @click.stop="handleCloseFile(file.fileId)"
            >
              <X :size="12" />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
    </div>
  </div>
  <!-- Nothing is shown in the header when no file is open — the empty preview
       area already conveys that, so the header stays clean. -->
</template>
