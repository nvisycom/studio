<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { WithoutWorkspace } from "#console/components/pages/overview";

useHead({ title: "Nvisy" });

// At "/" there's no active workspace yet (we're resolving one or onboarding),
// so the workspace chrome would be broken. Render without the dashboard layout.
definePageMeta({
	layout: false,
});

// Resolve the active workspace: once the list loads, redirect into the last-used
// (or first) workspace. Users with no workspace see onboarding here instead.
const { workspaces, isLoading, lastWorkspaceSlug } = useWorkspaces();

watch(
	workspaces,
	(list) => {
		if (!list || list.length === 0) return; // -> onboarding below
		const target =
			list.find((w) => w.slug === lastWorkspaceSlug.value) ?? list[0];
		if (target) navigateTo(`/w/${target.slug}`, { replace: true });
	},
	{ immediate: true },
);

const hasNoWorkspace = computed(
	() => !isLoading.value && (workspaces.value?.length ?? 0) === 0,
);
</script>

<template>
  <div class="flex min-h-screen flex-1 items-center justify-center px-4">
    <Loader2
      v-if="isLoading || !hasNoWorkspace"
      :size="24"
      class="animate-spin text-muted-foreground"
    />
    <WithoutWorkspace v-else />
  </div>
</template>
