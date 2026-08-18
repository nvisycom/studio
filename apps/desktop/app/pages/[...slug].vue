<script setup lang="ts">
// Catch-all 404 for SPA mode. Surface a fatal error so app.vue renders the
// error page instead of this route.
definePageMeta({
	layout: false,
});

throw createError({
	statusCode: 404,
	statusMessage: "Page not found",
	fatal: true,
});
</script>

<template>
  <div />
</template>
