<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

defineProps<{
	sections: Record<string, string[]>;
}>();

const sectionConfig: Record<string, { label: string }> = {
	features: { label: "Features" },
	improvements: { label: "Improvements" },
	fixes: { label: "Fixes" },
	changes: { label: "Changes" },
};
</script>

<template>
  <div class="space-y-2">
    <template v-for="(config, key) in sectionConfig" :key="key">
      <Collapsible
        v-if="sections[key] && sections[key].length > 0"
        v-slot="{ open }"
      >
        <CollapsibleTrigger
          class="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-1"
        >
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': open }"
          />
          <span>{{ config.label }}</span>
          <span class="text-muted-foreground font-normal"
            >({{ sections[key].length }})</span
          >
        </CollapsibleTrigger>
        <CollapsibleContent
          class="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
        >
          <ul class="pt-2 ml-6 space-y-1 text-sm text-muted-foreground">
            <li
              v-for="(item, index) in sections[key]"
              :key="index"
              class="flex"
            >
              <span class="text-muted-foreground/50 mr-2 select-none">•</span>
              <span class="flex-1">{{ item }}</span>
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </template>
  </div>
</template>
