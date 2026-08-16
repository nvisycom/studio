<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";

/**
 * A collapsible editor section: a clickable header with a rotating chevron,
 * title, item count, and hint, plus an `#action` slot for the section's add
 * control. The default slot is the collapsible body.
 */
const open = defineModel<boolean>("open", { default: false });

defineProps<{
	title: string;
	hint?: string;
	count?: number;
}>();
</script>

<template>
  <Collapsible v-model:open="open" as="section" class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <CollapsibleTrigger as-child>
        <button type="button" class="flex flex-1 items-center gap-2 text-left">
          <ChevronDown
            :size="16"
            class="shrink-0 text-muted-foreground transition-transform"
            :class="open ? '' : '-rotate-90'"
          />
          <div>
            <h2 class="text-sm font-medium">
              {{ title }}
              <span v-if="count !== undefined" class="text-muted-foreground">
                ({{ count }})
              </span>
            </h2>
            <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
          </div>
        </button>
      </CollapsibleTrigger>
      <slot name="action" />
    </div>
    <CollapsibleContent class="space-y-3">
      <slot />
    </CollapsibleContent>
  </Collapsible>
</template>
