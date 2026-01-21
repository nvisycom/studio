<script setup lang="ts">
import { ref, computed } from "vue";
import { Badge } from "@/components/ui/badge";

interface Integration {
  name: string;
  icon: string;
  description: string;
  status: "available" | "coming_soon";
  category: string;
}

const props = defineProps<{
  integrations: Integration[];
}>();

const activeCategory = ref("all");

const categories = [
  { id: "all", label: "All" },
  { id: "storage", label: "Storage" },
  { id: "ai", label: "AI" },
  { id: "automation", label: "Automation" },
  { id: "communication", label: "Communication" },
  { id: "productivity", label: "Productivity" },
];

const filteredIntegrations = computed(() => {
  if (activeCategory.value === "all") {
    return props.integrations;
  }
  return props.integrations.filter((i) => i.category === activeCategory.value);
});

const getCategoryCount = (categoryId: string) => {
  if (categoryId === "all") {
    return props.integrations.length;
  }
  return props.integrations.filter((i) => i.category === categoryId).length;
};
</script>

<template>
  <div>
    <!-- Category filters -->
    <div class="mb-8 flex flex-wrap items-center gap-2">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="activeCategory = category.id"
        class="px-4 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-2"
        :class="[
          activeCategory === category.id
            ? 'bg-foreground text-background'
            : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80',
        ]"
      >
        <span>{{ category.label }}</span>
        <span
          class="text-xs opacity-60"
          :class="activeCategory === category.id ? 'opacity-80' : ''"
        >
          {{ getCategoryCount(category.id) }}
        </span>
      </button>
    </div>

    <!-- Grid -->
    <div
      v-if="filteredIntegrations.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[800px] content-start"
    >
      <TransitionGroup name="integration">
        <div
          v-for="(integration, index) in filteredIntegrations"
          :key="integration.name"
          class="group relative p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300"
          :style="{ animationDelay: `${index * 30}ms` }"
        >
          <!-- Gradient background on hover -->
          <div
            class="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-100/80 to-pink-100/80 dark:from-sky-900/30 dark:to-pink-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />

          <div class="relative z-10 flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0 group-hover:bg-foreground/10 transition-colors duration-300"
            >
              <div
                class="w-7 h-7 text-foreground dark:text-foreground [&>svg]:w-full [&>svg]:h-full"
                v-html="integration.icon"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold">{{ integration.name }}</h3>
                <Badge
                  v-if="integration.status === 'coming_soon'"
                  variant="secondary"
                  class="text-xs"
                >
                  Soon
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ integration.description }}
              </p>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-16">
      <div class="text-muted-foreground mb-2">
        No integrations in this category
      </div>
      <button
        @click="activeCategory = 'all'"
        class="mt-4 text-sm text-foreground underline underline-offset-4 hover:no-underline"
      >
        View all integrations
      </button>
    </div>
  </div>
</template>

<style scoped>
.integration-enter-active {
  transition: all 0.3s ease;
}

.integration-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  opacity: 0;
}

.integration-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.integration-move {
  transition: transform 0.3s ease;
}
</style>
