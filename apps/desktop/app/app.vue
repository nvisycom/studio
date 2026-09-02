<script setup lang="ts">
import ErrorPage from "~/error.vue";
import AppTitlebar from "~/components/AppTitlebar.vue";

const error = useError();

// See apps/web/app/app.vue: a function titleTemplate (can't live in nuxt.config)
// so a missing or "Nvisy" title renders as plain "Nvisy", not "Nvisy · Nvisy".
useHead({
	titleTemplate: (title) =>
		!title || title === "Nvisy" ? "Nvisy" : `${title} · Nvisy`,
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <AppTitlebar />
    <ErrorPage v-if="error" :error="error" />
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
