<script setup lang="ts">
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#console/components/ui/avatar";
import { getInitials, gradientForName } from "#console/utils/naming";

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
	const pair = gradientForName(props.name);
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
