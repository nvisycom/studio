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

// Gradient color pairs for avatars (high contrast pairs)
const GRADIENT_PAIRS = [
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
] as const;

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
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
	const { from, to } = GRADIENT_PAIRS[index];
	return {
		background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
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
