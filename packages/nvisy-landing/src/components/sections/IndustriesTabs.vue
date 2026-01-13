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
    <!-- Button Group (matching HowItWorks style) -->
    <div class="flex items-center justify-center mb-10 md:mb-14">
      <div
        class="grid w-full max-w-3xl mx-auto grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <button
          v-for="industry in industries"
          :key="industry.id"
          @click="setActive(industry.id)"
          :class="[
            'flex items-center justify-center lg:justify-start gap-3 px-4 py-4 text-base font-light relative',
            'border rounded-xl transition-all duration-300',
            activeIndustry === industry.id
              ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg',
          ]"
        >
          <component
            :is="getIndustryIcon(industry.icon)"
            class="w-5 h-5 flex-shrink-0"
          />
          <span>{{ industry.name }}</span>
        </button>
      </div>
    </div>

    <!-- Use Cases Grid -->
    <Transition name="fade" mode="out-in">
      <div
        :key="activeIndustry"
        class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <div
          v-for="(useCase, index) in currentUseCases"
          :key="index"
          class="group bg-white dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg"
        >
          <h3
            class="text-base font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ useCase.title }}
          </h3>
          <p
            class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
          >
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
