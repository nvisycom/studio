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
	fallbackFrom?: string;
	fallbackTo?: string;
}

const props = withDefaults(defineProps<Props>(), {
	size: "md",
	fallbackFrom: "#3B82F6", // blue-500
	fallbackTo: "#8B5CF6", // purple-500
});

const sizeClasses = computed(() => {
	switch (props.size) {
		case "sm":
			return "h-6 w-6";
		case "lg":
			return "h-12 w-12";
		default:
			return "h-8 w-8";
	}
});

const initials = computed(() => {
	return props.name ? getInitials(props.name) : "";
});

const gradientStyle = computed(() => ({
	background: `linear-gradient(135deg, ${props.fallbackFrom} 0%, ${props.fallbackTo} 100%)`,
}));
</script>

<template>
  <component
    :is="href ? 'NuxtLink' : 'div'"
    :to="href"
    class="inline-block"
  >
    <Avatar :class="['rounded-full', sizeClasses]">
      <AvatarImage
        v-if="src"
        :src="src"
        :alt="alt || name || 'Avatar'"
      />
      <AvatarFallback
        class="rounded-full text-white font-medium"
        :style="gradientStyle"
      >
        {{ initials }}
      </AvatarFallback>
    </Avatar>
  </component>
</template>
