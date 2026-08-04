<script setup lang="ts">
definePageMeta({
	pageCategory: "Settings",
});

const { wLink } = useWorkspaceLink();
navigateTo(wLink("/settings/general"), { replace: true });
</script>

<template>
  <div />
</template>
