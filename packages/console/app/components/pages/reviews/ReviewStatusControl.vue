<script setup lang="ts">
import { Check, ChevronDown, RotateCcw } from "@lucide/vue";
import type { ReviewStatus } from "@nvisy/sdk/datatypes";
import { Badge } from "#console/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { reviewStatusVariant } from "#console/utils/reviews";

/**
 * The review status as a badge that, when interactive, opens a menu to advance
 * it: `needs_review`/`in_review` can be verified (→ resolved); `resolved` can be
 * reopened. Unlike a free-form status picker, only the valid transitions are
 * offered (in_review is derived server-side from review activity). Pass
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
  <Badge
    v-if="readonly"
    :variant="reviewStatusVariant(status)"
    class="capitalize"
  >
    {{ t(`reviews.status.${status}`) }}
  </Badge>
  <DropdownMenu v-else>
    <DropdownMenuTrigger :disabled="loading" class="outline-none">
      <Badge
        :variant="reviewStatusVariant(status)"
        class="cursor-pointer gap-1 capitalize"
      >
        {{ t(`reviews.status.${status}`) }}
        <ChevronDown :size="11" />
      </Badge>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuItem
        v-if="status !== 'resolved'"
        @select="emit('verify')"
      >
        <Check :size="14" class="mr-2 text-muted-foreground" />
        {{ t("reviews.actions.verify") }}
      </DropdownMenuItem>
      <DropdownMenuItem v-else @select="emit('reopen')">
        <RotateCcw :size="14" class="mr-2 text-muted-foreground" />
        {{ t("reviews.actions.reopen") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
