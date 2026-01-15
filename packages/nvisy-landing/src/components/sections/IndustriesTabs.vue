<script setup lang="ts">
import { ref, computed } from "vue";
import { Building2, Landmark, HeartPulse, ShieldCheck } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";

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

// Get max number of use cases across all industries to ensure consistent grid
const maxUseCases = computed(() => {
	return Math.max(...props.industries.map((i) => i.useCases.length));
});

// Industry icon mapping
const industryIcons: Record<string, FunctionalComponent> = {
	"building-2": Building2,
	landmark: Landmark,
	"heart-pulse": HeartPulse,
	"shield-check": ShieldCheck,
};

const getIndustryIcon = (iconName: string) => {
	return industryIcons[iconName] || Building2;
};
</script>

<template>
  <div class="w-full">
    <!-- Tab buttons -->
    <div class="flex items-center justify-center mb-12">
      <div
        class="inline-flex p-1 rounded-xl bg-muted/50 backdrop-blur-sm border border-border"
      >
        <button
          v-for="industry in industries"
          :key="industry.id"
          @click="setActive(industry.id)"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
            activeIndustry === industry.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <component
            :is="getIndustryIcon(industry.icon)"
            class="w-4 h-4 flex-shrink-0"
          />
          <span class="hidden sm:inline">{{ industry.name }}</span>
        </button>
      </div>
    </div>

    <!-- Use Cases Grid - Fixed height container -->
    <div class="min-h-[400px]">
      <Transition name="fade" mode="out-in">
        <div
          :key="activeIndustry"
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="(useCase, index) in currentUseCases"
            :key="index"
            class="group relative p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 min-h-[140px] flex flex-col"
          >
            <!-- Subtle gradient on hover -->
            <div
              class="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-100/80 to-pink-100/80 dark:from-sky-900/30 dark:to-pink-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />

            <div class="relative flex-1 flex flex-col">
              <h3 class="text-base font-medium mb-2">
                {{ useCase.title }}
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed flex-1">
                {{ useCase.description }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
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
