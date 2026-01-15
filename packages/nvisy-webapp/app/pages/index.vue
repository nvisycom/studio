<script setup lang="ts">
import { WithWorkspace, WithoutWorkspace } from "@/components/pages/overview";

useHead({ title: "Overview" });

definePageMeta({
	pageCategory: "Overview",
});

// Workspace state
const { currentWorkspaceId } = useWorkspaces();
const hasWorkspace = computed(() => !!currentWorkspaceId.value);
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <WithoutWorkspace v-if="!hasWorkspace" />
      <WithWorkspace v-else />
    </div>
  </div>
</template>
