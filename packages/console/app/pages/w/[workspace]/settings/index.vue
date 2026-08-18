<script setup lang="ts">
definePageMeta({
	pageCategory: "header.category.settings",
});

const { wLink } = useWorkspaceLink();
navigateTo(wLink("/settings/general"), { replace: true });
</script>

<template>
  <div />
</template>
