<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Enable color mode support
useHead({
	htmlAttrs: {
		class: () => useColorMode().value,
	},
});
</script>

<style>
/* Global app styles */
html {
  overflow: hidden;
}

body {
  @apply antialiased;
  overflow: hidden;
}
</style>
