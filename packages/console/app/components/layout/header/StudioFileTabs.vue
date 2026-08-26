<script setup lang="ts">
import { X, Loader2 } from "@lucide/vue";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#console/components/ui/tooltip";
import { Button } from "#console/components/ui/button";

const router = useRouter();
const { wLink } = useWorkspaceLink();

// Studio holds one tab per open file. The strip scrolls horizontally when the
// tabs outgrow the header's middle zone — the same pattern VS Code and browsers
// use — so there's no width measurement, no fit math, and no overflow menu to
// keep in sync. The active tab is scrolled into view whenever it changes.
const { openFiles, activeFileId, closeFile, setActiveFile } = useStudioFiles();

const strip = ref<HTMLElement | null>(null);

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
	// Last tab closed — leave studio for the files list.
	if (openFiles.value.length === 0) {
		router.push(wLink("/files"));
	}
}

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
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
    >
      <Tooltip v-for="file in openFiles" :key="file.fileId">
        <TooltipTrigger as-child>
            <div
              :data-file-id="file.fileId"
              :class="[
                'group inline-flex min-w-[100px] max-w-[180px] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 py-1 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeFileId === file.fileId
                  ? 'border-transparent bg-background text-foreground shadow'
                  : 'border-border/60 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground',
              ]"
              @click="setActiveFile(file.fileId)"
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
