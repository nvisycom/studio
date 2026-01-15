<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
	delay?: number;
	duration?: number;
	distance?: number;
	once?: boolean;
	threshold?: number;
	direction?: "up" | "down" | "left" | "right";
}

const props = withDefaults(defineProps<Props>(), {
	delay: 0,
	duration: 600,
	distance: 24,
	once: true,
	threshold: 0.1,
	direction: "up",
});

const elementRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;

const getTransform = () => {
	const d = props.distance;
	switch (props.direction) {
		case "down":
			return `translateY(-${d}px)`;
		case "left":
			return `translateX(${d}px)`;
		case "right":
			return `translateX(-${d}px)`;
		default:
			return `translateY(${d}px)`;
	}
};

onMounted(() => {
	if (!elementRef.value) return;

	observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					isVisible.value = true;
					if (props.once && observer) {
						observer.unobserve(entry.target);
					}
				} else if (!props.once) {
					isVisible.value = false;
				}
			});
		},
		{
			threshold: props.threshold,
			rootMargin: "0px 0px -50px 0px",
		},
	);

	observer.observe(elementRef.value);
});

onUnmounted(() => {
	if (observer) {
		observer.disconnect();
	}
});
</script>

<template>
  <div
    ref="elementRef"
    class="scroll-reveal"
    :class="{ 'is-visible': isVisible }"
    :style="{
      '--reveal-delay': `${delay}ms`,
      '--reveal-duration': `${duration}ms`,
      '--reveal-transform': getTransform(),
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-reveal {
  opacity: 0;
  transform: var(--reveal-transform);
  transition:
    opacity var(--reveal-duration) cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay),
    transform var(--reveal-duration) cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0) translateX(0);
}
</style>
