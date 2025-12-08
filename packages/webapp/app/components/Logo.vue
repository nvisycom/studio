<script setup lang="ts">
interface Props {
	size?: "sm" | "md" | "lg";
	asLink?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	size: "md",
	asLink: true,
});

const sizeClasses = computed(() => {
	const sizes = {
		sm: "h-6 w-auto",
		md: "h-8 w-auto",
		lg: "h-12 w-auto",
	};
	return sizes[props.size];
});
</script>

<template>
  <NuxtLink v-if="asLink" to="/" class="flex items-center">
    <img
      src="~/assets/nvisy.png"
      alt="Nvisy Logo"
      :class="sizeClasses"
    />
  </NuxtLink>
  <div v-else class="flex items-center">
    <img
      src="~/assets/nvisy.png"
      alt="Nvisy Logo"
      :class="sizeClasses"
    />
  </div>
</template>
