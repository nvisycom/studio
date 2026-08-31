<script setup lang="ts">
import type { SidebarProps } from ".";
import { cn } from "#console/utils/shadcn";
import { Sheet, SheetContent } from "#console/components/ui/sheet";
import SheetDescription from "#console/components/ui/sheet/SheetDescription.vue";
import SheetHeader from "#console/components/ui/sheet/SheetHeader.vue";
import SheetTitle from "#console/components/ui/sheet/SheetTitle.vue";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE, useSidebar } from "./utils";

defineOptions({
	inheritAttrs: false,
});

const props = withDefaults(defineProps<SidebarProps>(), {
	side: "left",
	variant: "sidebar",
	collapsible: "offcanvas",
});

const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
</script>

<template>
  <!-- Non-collapsible: always the expanded width, independent of the provider's
       collapse state/track (which only drives the collapsible modes). Its own
       fixed `--sidebar-width` (not the provider's animated `--sidebar-w`). -->
  <div
    v-if="collapsible === 'none'"
    data-slot="sidebar"
    :style="{ '--sidebar-width': SIDEBAR_WIDTH }"
    :class="cn('bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col', props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>

  <Sheet v-else-if="isMobile" :open="openMobile" v-bind="$attrs" @update:open="setOpenMobile">
    <SheetContent
      data-sidebar="sidebar"
      data-slot="sidebar"
      data-mobile="true"
      :side="side"
      class="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
      }"
    >
      <SheetHeader class="sr-only">
        <SheetTitle>Sidebar</SheetTitle>
        <SheetDescription>Displays the mobile sidebar.</SheetDescription>
      </SheetHeader>
      <div class="flex h-full w-full flex-col">
        <slot />
      </div>
    </SheetContent>
  </Sheet>

  <!-- Desktop: the sidebar is the shell's `[sidebar]` grid track (see
       SidebarProvider). A plain in-flow flex column — its width is driven by the
       grid track, so there's no fixed positioning or per-state width math. The
       `group` + `data-collapsible` carry the collapse state to the sidebar's
       content, which keys off `group-data-[collapsible=icon]` to hide labels and
       center icons; the width animation makes that reflow smoothly. -->
  <div
    v-else
    data-slot="sidebar"
    data-sidebar="sidebar"
    :data-state="state"
    :data-collapsible="state === 'collapsed' ? collapsible : ''"
    :data-side="side"
    class="sidebar-column group bg-sidebar hidden h-full min-h-0 flex-col overflow-hidden md:flex"
    :class="cn(props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<style scoped>
.sidebar-column {
  grid-column: sidebar / rail;
  /* The column just fills the animated `sidebar` track (see SidebarProvider);
     the width motion lives on the track itself. Labels fade in step (below) so
     the contents don't clip as the column shrinks. */
  width: 100%;
  min-width: 0;
}

/* Fade the menu-item labels out as the sidebar collapses (and in as it expands)
   in step with the width, instead of letting `overflow-hidden` clip them. The
   menu button carries the `peer/menu-button` marker class whether it renders as
   a <button> or an <a> (as-child), so match that. */
.sidebar-column :deep(.peer\/menu-button > span:last-child) {
  transition: opacity 150ms ease;
}
.sidebar-column[data-state="collapsed"]
  :deep(.peer\/menu-button > span:last-child) {
  opacity: 0;
}
</style>
