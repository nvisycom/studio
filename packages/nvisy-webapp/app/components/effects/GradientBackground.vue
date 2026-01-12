<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const container = ref<HTMLDivElement | null>(null);
const mouseX = ref(0.5);
const mouseY = ref(0.5);

function handleMouseMove(e: MouseEvent) {
	if (!container.value) return;
	const rect = container.value.getBoundingClientRect();
	mouseX.value = (e.clientX - rect.left) / rect.width;
	mouseY.value = (e.clientY - rect.top) / rect.height;
}

onMounted(() => {
	document.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
	document.removeEventListener("mousemove", handleMouseMove);
});
</script>

<template>
  <div
    ref="container"
    class="absolute inset-0 overflow-hidden"
  >
    <!-- Base gradient layer -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-pink-100 dark:from-blue-950 dark:via-neutral-950 dark:to-pink-950"
    />

    <!-- Animated blob 1 - Blue -->
    <div
      class="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 dark:opacity-30 animate-blob-1"
      :style="{
        background: 'radial-gradient(circle, rgba(147, 197, 253, 0.8) 0%, transparent 70%)',
        left: `calc(20% + ${(mouseX - 0.5) * 30}px)`,
        top: `calc(30% + ${(mouseY - 0.5) * 30}px)`,
      }"
    />

    <!-- Animated blob 2 - Pink -->
    <div
      class="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 dark:opacity-30 animate-blob-2"
      :style="{
        background: 'radial-gradient(circle, rgba(249, 168, 212, 0.8) 0%, transparent 70%)',
        right: `calc(20% + ${(mouseX - 0.5) * -20}px)`,
        bottom: `calc(30% + ${(mouseY - 0.5) * -20}px)`,
      }"
    />

    <!-- Animated blob 3 - Purple (mix) -->
    <div
      class="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-30 dark:opacity-20 animate-blob-3"
      :style="{
        background: 'radial-gradient(circle, rgba(196, 181, 253, 0.7) 0%, transparent 70%)',
        left: `calc(50% + ${(mouseX - 0.5) * 40}px)`,
        top: `calc(50% + ${(mouseY - 0.5) * 40}px)`,
        transform: 'translate(-50%, -50%)',
      }"
    />

    <!-- Subtle grid overlay for texture -->
    <div
      class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
      style="
        background-image: linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
        background-size: 40px 40px;
      "
    />
  </div>
</template>

<style scoped>
@keyframes blob-1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -50px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 30px) scale(0.95);
  }
  75% {
    transform: translate(40px, 20px) scale(1.05);
  }
}

@keyframes blob-2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(-40px, 30px) scale(1.05);
  }
  50% {
    transform: translate(30px, -40px) scale(1.1);
  }
  75% {
    transform: translate(-20px, -20px) scale(0.95);
  }
}

@keyframes blob-3 {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(-50%, -50%) scale(1.1) rotate(120deg);
  }
  66% {
    transform: translate(-50%, -50%) scale(0.9) rotate(240deg);
  }
}

.animate-blob-1 {
  animation: blob-1 20s ease-in-out infinite;
}

.animate-blob-2 {
  animation: blob-2 25s ease-in-out infinite;
}

.animate-blob-3 {
  animation: blob-3 30s ease-in-out infinite;
}
</style>
