<script setup lang="ts">
import { ref, computed } from "vue";

interface UseCase {
	title: string;
	description: string;
}

interface Industry {
	id: string;
	name: string;
	icon: string;
	useCases: UseCase[];
}

const props = defineProps<{
	industries: Industry[];
}>();

const activeIndustry = ref(props.industries[0]?.id || "");

const setActive = (id: string) => {
	activeIndustry.value = id;
};

const currentUseCases = computed(() => {
	return (
		props.industries.find((i) => i.id === activeIndustry.value)?.useCases || []
	);
});
</script>

<template>
  <div class="w-full">
    <!-- Tabs (text) -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
      <button
        v-for="industry in industries"
        :key="industry.id"
        @click="setActive(industry.id)"
        class="text-sm transition-colors"
        :class="[
          activeIndustry === industry.id
            ? 'font-medium text-foreground'
            : 'font-normal text-foreground/50 hover:text-foreground',
        ]"
      >
        {{ industry.name }}
      </button>
    </div>

    <!-- Use cases grid -->
    <Transition name="fade" mode="out-in">
      <div
        :key="activeIndustry"
        class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="(useCase, index) in currentUseCases"
          :key="index"
          class="flex flex-col rounded-xl border border-border bg-card p-6"
        >
          <h3 class="text-base font-medium tracking-tight">
            {{ useCase.title }}
          </h3>
          <p class="mt-2 text-sm text-foreground/55 leading-relaxed">
            {{ useCase.description }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
