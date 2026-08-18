<script setup lang="ts">
import {
	WithWorkspace,
	WithoutWorkspace,
} from "#console/components/pages/overview";

useHead({ title: "Overview" });

definePageMeta({
	pageCategory: "header.category.overview",
});

// Workspace state
const { currentWorkspaceSlug } = useWorkspaces();
const hasWorkspace = computed(() => !!currentWorkspaceSlug.value);
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <WithoutWorkspace v-if="!hasWorkspace" />
      <WithWorkspace v-else />
    </div>
  </div>
</template>
