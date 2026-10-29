<script setup lang="ts">
import { ReviewsList } from "#console/components/pages/reviews";

/** All reviews in the active workspace, with status and assignee filters. */
const { t } = useI18n();

// Reviews require server-backed workspace accounts.
useServerOnlyPage();

useHead({ title: () => t("reviews.title") });

definePageMeta({
	pageCategory: "header.category.reviews",
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <ReviewsList />
    </div>
  </div>
</template>
