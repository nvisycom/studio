<script setup lang="ts">
import type { HTMLAttributes, Ref } from "vue";
import {
	defaultDocument,
	useEventListener,
	useMediaQuery,
	useVModel,
} from "@vueuse/core";
import { TooltipProvider } from "reka-ui";
import { computed, ref } from "vue";
import { cn } from "#console/utils/shadcn";
import {
	provideSidebarContext,
	SIDEBAR_COOKIE_MAX_AGE,
	SIDEBAR_COOKIE_NAME,
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
} from "./utils";

const props = withDefaults(
	defineProps<{
		defaultOpen?: boolean;
		open?: boolean;
		class?: HTMLAttributes["class"];
	}>(),
	{
		defaultOpen: !defaultDocument?.cookie.includes(
			`${SIDEBAR_COOKIE_NAME}=false`,
		),
		open: undefined,
	},
);

const emits = defineEmits<{
	"update:open": [open: boolean];
}>();

const isMobile = useMediaQuery("(max-width: 768px)");
const openMobile = ref(false);

const open = useVModel(props, "open", emits, {
	defaultValue: props.defaultOpen ?? false,
	passive: (props.open === undefined) as false,
}) as Ref<boolean>;

function setOpen(value: boolean) {
	open.value = value; // emits('update:open', value)

	// This sets the cookie to keep the sidebar state.
	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not widely supported yet
	document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}

function setOpenMobile(value: boolean) {
	openMobile.value = value;
}

// Helper to toggle the sidebar.
function toggleSidebar() {
	return isMobile.value
		? setOpenMobile(!openMobile.value)
		: setOpen(!open.value);
}

useEventListener("keydown", (event: KeyboardEvent) => {
	if (
		event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
		(event.metaKey || event.ctrlKey)
	) {
		event.preventDefault();
		toggleSidebar();
	}
});

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
const state = computed(() => (open.value ? "expanded" : "collapsed"));

provideSidebarContext({
	state,
	open,
	setOpen,
	isMobile,
	openMobile,
	setOpenMobile,
	toggleSidebar,
});
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <!-- Grid shell laid out as three named tracks: the sidebar, a gap the toggle
         rail lives in, and the content card. Because the rail occupies its own
         track it is centered and full-height by construction — no positioning
         math, which was the whole source of the old fixed-panel fragility. The
         `--sidebar-track` var animates between expanded and collapsed; the
         `group` + data-state carry the collapse state to the sidebar's content
         components. On mobile the sidebar is an overlay sheet and takes no
         track. -->
    <div
      data-slot="sidebar-wrapper"
      class="sidebar-shell group/sidebar-wrapper text-sidebar-foreground bg-sidebar"
      :data-state="state"
      :data-collapsible="state === 'collapsed' ? 'icon' : ''"
      :data-mobile="isMobile ? 'true' : undefined"
      :style="{ '--sidebar-w': state === 'collapsed' ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH }"
      v-bind="$attrs"
      :class="cn(props.class)"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>

<style scoped>
/* One spacing token drives the shell's uniform inset: the gap around the
   floating card, the sidebar's inset from the window, and the rail-track width.
   The sidebar track is a *fixed* length (--sidebar-w), switched instantly by
   collapse state. The smooth width animation lives on the sidebar column itself
   (see Sidebar.vue); because the track is fixed rather than content-sized, the
   column animating inside it never forces a per-frame grid intrinsic-size
   recalc — which is what locked the main thread when the track was `auto`. */
.sidebar-shell {
  --shell-inset: 0.5rem;
  display: grid;
  grid-template-columns: [sidebar] var(--sidebar-w) [rail] var(--shell-inset) [content] minmax(0, 1fr);
  grid-template-rows: 100%;
  height: 100svh;
  width: 100%;
  overflow: hidden;
  padding: var(--shell-inset);
}
/* Mobile: no sidebar/rail tracks — the sidebar is an overlay sheet, content
   fills the shell with no floating inset. */
.sidebar-shell[data-mobile="true"] {
  grid-template-columns: [content] minmax(0, 1fr);
  padding: 0;
}
</style>
