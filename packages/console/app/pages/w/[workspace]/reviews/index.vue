<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { ReviewsList } from "#console/components/pages/reviews";

/**
 * The reviewer's queue — document reviews assigned to the current user, each
 * opening in the studio. A workspace-scoped page (the `reviews` nav entry); the
 * list content lives in {@link ReviewsList}, scoped to the current user's
 * account id.
 */
const { t } = useI18n();
const { accountId } = useAccount();

useHead({ title: () => t("reviews.title") });

definePageMeta({
	pageCategory: "header.category.reviews",
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <ReviewsList v-if="accountId" :assignee="accountId" />
      <div
        v-else
        class="flex items-center justify-center py-16 text-muted-foreground"
      >
        <Loader2 :size="22" class="animate-spin" />
      </div>
    </div>
  </div>
</template>
