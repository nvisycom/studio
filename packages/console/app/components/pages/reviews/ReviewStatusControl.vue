<script setup lang="ts">
import {
	CheckCircle2,
	MessageSquareWarning,
	RotateCcw,
	Send,
} from "@lucide/vue";
import type { ReviewStatus } from "@nvisy/sdk/datatypes";
import { Badge } from "#console/components/ui/badge";
import { Button } from "#console/components/ui/button";
import { reviewStatusVariant } from "#console/utils/reviews";

/**
 * The review status badge + the transitions available from the current status in
 * the approval lifecycle (draft → in_review → changes_requested /
 * partially_approved → approved):
 * - `draft` / `changes_requested`: submit (→ in_review).
 * - `in_review` / `partially_approved`: approve, or request changes.
 * - `approved`: reopen.
 * Pass `readonly` to render just the badge. Pass `secondaryOnly` to show only the
 * secondary transition (request changes) and hide the primary ones (submit /
 * approve / reopen) — for hosts that surface the primary action elsewhere (the
 * studio tab's bottom CTA).
 */
const props = defineProps<{
	status: ReviewStatus;
	readonly?: boolean;
	secondaryOnly?: boolean;
	loading?: boolean;
}>();

const emit = defineEmits<{
	submit: [];
	approve: [];
	requestChanges: [];
	reopen: [];
}>();

const { t } = useI18n();

// Which transition buttons apply to the current status. The primary moves (submit,
// approve, reopen) are suppressed in `secondaryOnly` mode; request changes (the
// secondary) always shows when available.
const inReview = computed(
	() => props.status === "in_review" || props.status === "partially_approved",
);
const canSubmit = computed(
	() =>
		!props.secondaryOnly &&
		(props.status === "draft" || props.status === "changes_requested"),
);
const canApprove = computed(() => !props.secondaryOnly && inReview.value);
const canRequestChanges = computed(() => inReview.value);
const canReopen = computed(
	() => !props.secondaryOnly && props.status === "approved",
);
</script>

<template>
  <div class="inline-flex flex-wrap items-center gap-2">
    <Badge :variant="reviewStatusVariant(status)" class="capitalize">
      {{ t(`reviews.status.${status}`) }}
    </Badge>
    <template v-if="!readonly">
      <Button
        v-if="canSubmit"
        variant="outline"
        size="sm"
        class="h-7 gap-1.5"
        :disabled="loading"
        @click="emit('submit')"
      >
        <Send :size="14" />
        {{ t("reviews.actions.submit") }}
      </Button>
      <Button
        v-if="canApprove"
        variant="outline"
        size="sm"
        class="h-7 gap-1.5"
        :disabled="loading"
        @click="emit('approve')"
      >
        <CheckCircle2 :size="14" />
        {{ t("reviews.actions.approve") }}
      </Button>
      <Button
        v-if="canRequestChanges"
        variant="outline"
        size="sm"
        class="h-7 gap-1.5"
        :disabled="loading"
        @click="emit('requestChanges')"
      >
        <MessageSquareWarning :size="14" />
        {{ t("reviews.actions.requestChanges") }}
      </Button>
      <Button
        v-if="canReopen"
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
