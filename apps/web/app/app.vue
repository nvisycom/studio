<script setup lang="ts">
import ErrorPage from "~/error.vue";

const error = useError();

// Title: a page sets its own via `useHead({ title })` and it renders as
// "<title> · Nvisy"; a page with no title (or the home page, whose title is just
// "Nvisy") shows plain "Nvisy" instead of the doubled "Nvisy · Nvisy". A function
// titleTemplate can't live in nuxt.config (must be serializable), so it lives here.
useHead({
	titleTemplate: (title) =>
		!title || title === "Nvisy" ? "Nvisy" : `${title} · Nvisy`,
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <ErrorPage v-if="error" :error="error" />
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
