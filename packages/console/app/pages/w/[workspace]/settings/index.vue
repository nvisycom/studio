<script setup lang="ts">
// /w/:workspace/settings has no page of its own — redirect to the general tab
// from inline middleware (returning navigateTo) so it happens before the page
// renders, rather than firing an ignored navigateTo promise during setup.
definePageMeta({
	pageCategory: "header.category.settings",
	middleware: [
		() => {
			const { wLink } = useWorkspaceLink();
			return navigateTo(wLink("/settings/general"), { replace: true });
		},
	],
});
</script>

<template>
  <div />
</template>
