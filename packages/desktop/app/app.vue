<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout name="default">
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
  scroll-behavior: smooth;
}

body {
  @apply antialiased;
}
</style>
