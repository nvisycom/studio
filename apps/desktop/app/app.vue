<script setup lang="ts">
import ErrorPage from "~/error.vue";

const error = useError();
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
