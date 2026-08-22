<script setup lang="ts">
import type { Component } from "vue";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";

/**
 * A section's navigation tabs, for the app-header socket. A page in the section
 * renders `<HeaderSocket><SectionTabs :tabs="…" /></HeaderSocket>`, co-locating
 * the tabs with the section instead of a per-route branch in a god-component.
 *
 * The active tab is derived from the current path against each tab's `to`
 * (longest-match wins, so `/settings/data` beats the `/settings` root). An
 * optional `#actions` slot sits on the right for section-level controls.
 */
export interface SectionTab {
	/** Stable value (also the TabsTrigger value). */
	value: string;
	label: string;
	icon: Component;
	/** Workspace-relative path this tab links to, e.g. "/settings/data". */
	to: string;
}

const props = withDefaults(
	defineProps<{
		tabs: SectionTab[];
		/**
		 * Whether `to` paths are workspace-relative (prefixed with /w/{slug}).
		 * Account settings live outside a workspace, so they pass `false`.
		 */
		workspaceScoped?: boolean;
	}>(),
	{ workspaceScoped: true },
);

const { wLink } = useWorkspaceLink();
const route = useRoute();

const linkTo = (to: string) => (props.workspaceScoped ? wLink(to) : to);

// Path to match against: workspace-relative sub-path for scoped sections, the
// raw path for account.
const subPath = computed(() =>
	props.workspaceScoped
		? route.path.replace(/^\/w\/[^/]+/, "") || "/"
		: route.path,
);

// Active tab = the tab whose `to` is the longest prefix of the current path.
const activeValue = computed(() => {
	let best: SectionTab | undefined;
	for (const tab of props.tabs) {
		if (
			(subPath.value === tab.to || subPath.value.startsWith(`${tab.to}/`)) &&
			(!best || tab.to.length > best.to.length)
		) {
			best = tab;
		}
	}
	return best?.value ?? props.tabs[0]?.value;
});
</script>

<template>
  <div class="flex w-full min-w-0 items-center justify-between gap-2">
    <Tabs :model-value="activeValue">
      <TabsList>
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          as-child
        >
          <NuxtLink :to="linkTo(tab.to)" class="flex items-center gap-2">
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
          </NuxtLink>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
