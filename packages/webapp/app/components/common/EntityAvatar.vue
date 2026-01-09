<script setup lang="ts">
import { computed } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/naming";

interface Props {
	href?: string;
	size?: "sm" | "md" | "lg";
	name?: string;
	src?: string;
	alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
	size: "md",
});

// Gradient color pairs for avatars (vibrant, intense combinations)
const GRADIENT_PAIRS = [
	// Original favorites
	{ from: "#3B82F6", to: "#EC4899" }, // Blue → Pink
	{ from: "#14B8A6", to: "#8B5CF6" }, // Teal → Purple
	{ from: "#F97316", to: "#3B82F6" }, // Orange → Blue
	{ from: "#22C55E", to: "#0EA5E9" }, // Green → Sky
	{ from: "#EC4899", to: "#6366F1" }, // Pink → Indigo
	{ from: "#6366F1", to: "#14B8A6" }, // Indigo → Teal
	{ from: "#F59E0B", to: "#EC4899" }, // Amber → Pink
	{ from: "#8B5CF6", to: "#F97316" }, // Violet → Orange
	{ from: "#0EA5E9", to: "#22C55E" }, // Sky → Green
	{ from: "#EF4444", to: "#8B5CF6" }, // Red → Violet
	{ from: "#06B6D4", to: "#EC4899" }, // Cyan → Pink
	// More vibrant combinations
	{ from: "#10B981", to: "#6366F1" }, // Emerald → Indigo
	{ from: "#F43F5E", to: "#3B82F6" }, // Rose → Blue
	{ from: "#A855F7", to: "#06B6D4" }, // Purple → Cyan
	{ from: "#22C55E", to: "#EC4899" }, // Green → Pink
	{ from: "#EF4444", to: "#14B8A6" }, // Red → Teal
	{ from: "#3B82F6", to: "#F59E0B" }, // Blue → Amber
	{ from: "#EC4899", to: "#22C55E" }, // Pink → Green
	{ from: "#8B5CF6", to: "#10B981" }, // Violet → Emerald
	{ from: "#F97316", to: "#A855F7" }, // Orange → Purple
	{ from: "#06B6D4", to: "#F43F5E" }, // Cyan → Rose
	{ from: "#6366F1", to: "#EF4444" }, // Indigo → Red
	{ from: "#14B8A6", to: "#F97316" }, // Teal → Orange
	{ from: "#0EA5E9", to: "#EC4899" }, // Sky → Pink
	{ from: "#22C55E", to: "#8B5CF6" }, // Green → Violet
	{ from: "#F43F5E", to: "#06B6D4" }, // Rose → Cyan
	{ from: "#A855F7", to: "#22C55E" }, // Purple → Green
	{ from: "#EF4444", to: "#3B82F6" }, // Red → Blue
	{ from: "#10B981", to: "#EC4899" }, // Emerald → Pink
	{ from: "#F59E0B", to: "#6366F1" }, // Amber → Indigo
	{ from: "#0EA5E9", to: "#F43F5E" }, // Sky → Rose
	{ from: "#8B5CF6", to: "#14B8A6" }, // Violet → Teal
] as const;

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

const sizeClasses = computed(() => {
	switch (props.size) {
		case "sm":
			return "h-6 w-6 text-xs";
		case "lg":
			return "h-12 w-12 text-lg";
		default:
			return "h-8 w-8 text-sm";
	}
});

const initials = computed(() => {
	return props.name ? getInitials(props.name) : "";
});

const gradientStyle = computed(() => {
	const index = props.name ? hashString(props.name) % GRADIENT_PAIRS.length : 0;
	const pair = GRADIENT_PAIRS[index] ?? GRADIENT_PAIRS[0];
	return {
		background: `linear-gradient(135deg, ${pair.from} 0%, ${pair.to} 100%)`,
	};
});
</script>

<template>
  <component :is="href ? 'NuxtLink' : 'div'" :to="href" class="inline-block">
    <Avatar :class="['rounded-full', sizeClasses]">
      <AvatarImage v-if="src" :src="src" :alt="alt || name || 'Avatar'" />
      <AvatarFallback
        class="rounded-full text-white font-medium"
        :style="gradientStyle"
      >
        {{ initials }}
      </AvatarFallback>
    </Avatar>
  </component>
</template>
