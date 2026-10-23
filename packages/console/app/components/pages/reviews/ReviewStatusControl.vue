<script setup lang="ts">
import { Check, RotateCcw } from "@lucide/vue";
import type { ReviewStatus } from "@nvisy/sdk/datatypes";
import { Badge } from "#console/components/ui/badge";
import { Button } from "#console/components/ui/button";
import { reviewStatusVariant } from "#console/utils/reviews";

/**
 * The review status badge, with the single available transition offered as a
 * direct button beside it: `needs_review`/`in_review` can be verified (→
 * resolved), `resolved` can be reopened. There's only ever one valid action
 * (in_review is derived server-side), so it's a plain button, not a menu. Pass
 * `readonly` to render just the badge.
 */
const props = defineProps<{
	status: ReviewStatus;
	readonly?: boolean;
	loading?: boolean;
}>();

const emit = defineEmits<{
	verify: [];
	reopen: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <Badge :variant="reviewStatusVariant(status)" class="capitalize">
      {{ t(`reviews.status.${status}`) }}
    </Badge>
    <template v-if="!readonly">
      <Button
        v-if="status !== 'resolved'"
        variant="outline"
        size="sm"
        class="h-7 gap-1.5"
        :disabled="loading"
        @click="emit('verify')"
      >
        <Check :size="14" />
        {{ t("reviews.actions.verify") }}
      </Button>
      <Button
        v-else
        variant="outline"
        size="sm"
        class="h-7 gap-1.5"
        :disabled="loading"
        @click="emit('reopen')"
      >
        <RotateCcw :size="14" />
        {{ t("reviews.actions.reopen") }}
      </Button>
    </template>
  </div>
</template>
