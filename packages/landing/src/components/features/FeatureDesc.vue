<script setup lang="ts">
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
	description: string;
}

const props = defineProps<Props>();

// Parse description to identify tooltip triggers
// Format: {word|tooltip text}
const parseDescription = (text: string) => {
	const parts: Array<{ text: string; tooltip?: string }> = [];
	const regex = /\{([^|]+)\|([^}]+)\}/g;
	let lastIndex = 0;
	let match;

	while ((match = regex.exec(text)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			parts.push({ text: text.slice(lastIndex, match.index) });
		}
		// Add the tooltip trigger
		parts.push({ text: match[1], tooltip: match[2] });
		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < text.length) {
		parts.push({ text: text.slice(lastIndex) });
	}

	return parts.length > 0 ? parts : [{ text }];
};

const descriptionParts = parseDescription(props.description);
</script>

<template>
  <p
    class="text-sm md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed"
  >
    <TooltipProvider v-if="descriptionParts.some((p) => p.tooltip)">
      <template v-for="(part, index) in descriptionParts" :key="index">
        <Tooltip v-if="part.tooltip">
          <TooltipTrigger
            class="text-neutral-900 dark:text-white underline decoration-dotted underline-offset-4 cursor-help"
          >
            {{ part.text }}
          </TooltipTrigger>
          <TooltipContent
            :side-offset="8"
            class="!bg-neutral-900 dark:!bg-black !text-white !border-neutral-700 dark:!border-neutral-800 !px-2 !py-1.5 !text-xs [&_[data-slot=tooltip-arrow]]:!hidden"
          >
            <p class="max-w-[200px]">{{ part.tooltip }}</p>
          </TooltipContent>
        </Tooltip>
        <template v-else>{{ part.text }}</template>
      </template>
    </TooltipProvider>
    <template v-else>{{ description }}</template>
  </p>
</template>
