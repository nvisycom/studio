<script setup lang="ts">
import ErrorPage from "~/error.vue";
import AppTitlebar from "~/components/AppTitlebar.vue";

const error = useError();
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
