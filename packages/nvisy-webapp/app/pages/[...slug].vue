<script setup lang="ts">
// Catch-all route for 404 pages in SPA mode
definePageMeta({
	layout: false,
});

throw createError({
	statusCode: 404,
	message: "Page not found",
	fatal: true,
});
</script>
