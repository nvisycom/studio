<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { WithoutWorkspace } from "#console/components/pages/overview";

useHead({ title: "Nvisy" });

// Sidebar-less layout: at "/" there is no active workspace yet (we're resolving
// one or onboarding), so the workspace chrome would be broken/locked. Uses the
// plain frame (not auth) — these are logged-in states, so the auth brand panel
// would be out of place.
definePageMeta({
	layout: "plain",
});

// The "/" landing resolves the active workspace: once the list loads, redirect
// into the last-used (or first) workspace. Users with no workspace see the
// onboarding / create-first-workspace screen right here.
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
  <div class="flex flex-1 items-center justify-center px-4">
    <!-- Resolving / redirecting into a workspace -->
    <Loader2
      v-if="isLoading || !hasNoWorkspace"
      :size="24"
      class="animate-spin text-muted-foreground"
    />

    <!-- No workspace yet: onboarding -->
    <WithoutWorkspace v-else />
  </div>
</template>
