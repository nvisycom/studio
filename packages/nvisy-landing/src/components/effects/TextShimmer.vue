<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
	delay?: number;
}>();

const isAnimating = ref(false);
const isDone = ref(false);

onMounted(() => {
	setTimeout(() => {
		isAnimating.value = true;
		// Animation duration is 1.5s
		setTimeout(() => {
			isAnimating.value = false;
			isDone.value = true;
		}, 1500);
	}, props.delay ?? 200);
});
</script>

<template>
  <span :class="['text-shimmer', { animating: isAnimating, done: isDone }]"
    ><slot
  /></span>
</template>

<style scoped>
.text-shimmer {
  display: inline;
  color: inherit;
}

.text-shimmer.animating {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    currentColor 35%,
    rgba(59, 130, 246, 1) 48%,
    rgba(147, 51, 234, 1) 52%,
    currentColor 65%,
    currentColor 100%
  );
  background-size: 200% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 1.5s ease-out forwards;
}

.text-shimmer.done {
  color: inherit;
  -webkit-text-fill-color: inherit;
  background: none;
}

:global(.dark) .text-shimmer.animating {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    currentColor 35%,
    rgba(96, 165, 250, 1) 48%,
    rgba(192, 132, 252, 1) 52%,
    currentColor 65%,
    currentColor 100%
  );
  background-size: 200% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  background-clip: text;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
