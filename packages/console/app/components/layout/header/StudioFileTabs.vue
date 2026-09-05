<script setup lang="ts">
import StudioFileTab from "./StudioFileTab.vue";

const router = useRouter();
const { wLink } = useWorkspaceLink();

// Studio holds one tab per open file. The strip scrolls horizontally when the
// tabs outgrow the header's middle zone — the same pattern VS Code and browsers
// use — so there's no width measurement, no fit math, and no overflow menu to
// keep in sync. The active tab is scrolled into view whenever it changes.
const {
	openFiles,
	activeFileId,
	closeFile,
	closeOtherFiles,
	closeFilesToRight,
	closeAllFiles,
	reorderFiles,
	setActiveFile,
} = useStudioFiles();

const strip = ref<HTMLElement | null>(null);

// Is the given file the rightmost tab? "Close to the right" is a no-op there, so
// the item is disabled to signal that nothing would happen.
function isLast(fileId: string) {
	const files = openFiles.value;
	return files[files.length - 1]?.fileId === fileId;
}

// Drag-to-reorder with live motion: rather than draw an insertion marker, we
// reorder the tabs *as* the pointer moves, so the strip visibly parts and the
// dragged tab slides into its new slot (the tab is its own preview). The
// original order is snapshotted at drag start and restored if the drag is
// cancelled (Escape / dropped outside). Native HTML5 DnD keeps the strip's
// scroll and auto-scroll intact.
const draggingId = ref<string | null>(null);
const dropped = ref(false);
let originalOrder: string[] = [];

function onDragStart(fileId: string) {
	draggingId.value = fileId;
	dropped.value = false;
	originalOrder = openFiles.value.map((f) => f.fileId);
}

// Live reorder: move the dragged tab to just before or after the hovered tab,
// depending on which half the pointer is over. Skipped when it's already there.
function onDragOver(overId: string, before: boolean) {
	const dragged = draggingId.value;
	if (!dragged || dragged === overId) return;
	const ids = openFiles.value.map((f) => f.fileId);
	const anchor = before ? overId : ids[ids.indexOf(overId) + 1];
	// No-op if the dragged tab already sits in that slot.
	if (anchor === dragged) return;
	const currentBefore = ids[ids.indexOf(dragged) + 1];
	if (anchor === undefined ? isLast(dragged) : anchor === currentBefore) return;
	reorderFiles(dragged, anchor);
}

function onDragEnd() {
	// A drag that ends without a drop (Escape, or released off any tab) restores
	// the order it started from; a completed drop keeps the live reordering.
	const dragged = draggingId.value;
	if (dragged && !dropped.value) {
		for (const id of originalOrder) reorderFiles(id);
	}
	draggingId.value = null;
}

// The edge fade (a clipped tab dissolves instead of hard-cutting, signaling
// "scroll for more") is pure CSS below — a scroll-driven mask that fades only
// the side that actually hides content. No JS scroll tracking needed. We keep
// this ref solely to scroll the active tab into view on selection.

// Keep the active tab visible as the selection moves or new files open past the
// right edge. Runs after the DOM settles so the target element exists.
watch(
	activeFileId,
	(id) => {
		if (!id) return;
		nextTick(() => {
			strip.value
				?.querySelector<HTMLElement>(`[data-file-id="${id}"]`)
				?.scrollIntoView({ block: "nearest", inline: "nearest" });
		});
	},
	{ flush: "post" },
);

function handleCloseFile(fileId: string) {
	closeFile(fileId);
	leaveIfEmpty();
}

function handleCloseAll() {
	closeAllFiles();
	leaveIfEmpty();
}

// Any action that can empty the strip returns to the files list, since studio
// has nothing to show without an open file.
function leaveIfEmpty() {
	if (openFiles.value.length === 0) {
		router.push(wLink("/files"));
	}
}
</script>

<template>
  <!-- Horizontally-scrollable tab strip. `min-w-0` lets it shrink inside the
       header's flex row; the inner track scrolls when tabs overflow. The
       scrollbar is hidden — scrolling is via wheel/trackpad or the active-tab
       auto-scroll above, matching editor tab behavior. -->
  <div
    v-if="openFiles.length > 0"
    ref="strip"
    class="tab-strip flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <!-- No TooltipProvider here: the app-level provider from SidebarProvider
         (layouts/default) already wraps the header. A nested provider crashes
         reka-ui's slot render (currentRenderingInstance.ce null) on navigation. -->
    <div
      class="inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
      @dragover.prevent
      @drop.prevent="dropped = true"
    >
      <StudioFileTab
        v-for="file in openFiles"
        :key="file.fileId"
        :file="file"
        :active="activeFileId === file.fileId"
        :is-last="isLast(file.fileId)"
        :only="openFiles.length <= 1"
        :dragging-id="draggingId"
        @select="setActiveFile(file.fileId)"
        @close="handleCloseFile(file.fileId)"
        @close-others="closeOtherFiles(file.fileId)"
        @close-right="closeFilesToRight(file.fileId)"
        @close-all="handleCloseAll"
        @drag-start="onDragStart(file.fileId)"
        @drag-over="onDragOver(file.fileId, $event)"
        @drag-end="onDragEnd"
      />
    </div>
  </div>
  <!-- Nothing is shown in the header when no file is open — the empty preview
       area already conveys that, so the header stays clean. -->
</template>

<style scoped>
/*
 * Scroll-driven edge fade — pure CSS, no JS scroll tracking.
 *
 * Two typed custom properties hold each edge's fade width. A scroll-timeline
 * animation drives them from the strip's own horizontal scroll position:
 * `--fade-start` grows from 0 as you scroll away from the left edge, and
 * `--fade-end` shrinks to 0 as you reach the right edge. The mask then fades
 * only the side that actually hides a tab, so a fully-visible strip shows no
 * fade at all. Browsers without scroll-driven animations (e.g. older Safari)
 * simply keep both widths at their initial value and degrade to no fade.
 */
@property --fade-start {
	syntax: "<length>";
	inherits: false;
	initial-value: 0px;
}
@property --fade-end {
	syntax: "<length>";
	inherits: false;
	initial-value: 0px;
}

.tab-strip {
	--fade-size: 24px;
	--fade-start: 0px;
	--fade-end: var(--fade-size);
	mask-image: linear-gradient(
		to right,
		transparent,
		black var(--fade-start),
		black calc(100% - var(--fade-end)),
		transparent
	);
	animation: tab-strip-fade linear both;
	animation-timeline: scroll(self inline);
}

@keyframes tab-strip-fade {
	/* At the left edge: no start fade, full end fade (content hidden right). */
	0% {
		--fade-start: 0px;
		--fade-end: var(--fade-size);
	}
	/* Just past the left edge: start fade appears. */
	1% {
		--fade-start: var(--fade-size);
	}
	/* Just before the right edge: end fade still present. */
	99% {
		--fade-end: var(--fade-size);
	}
	/* At the right edge: full start fade, no end fade (nothing hidden right). */
	100% {
		--fade-start: var(--fade-size);
		--fade-end: 0px;
	}
}
</style>
