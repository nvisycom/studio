<script setup lang="ts">
import { ref, computed } from "vue";

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
</script>

<template>
  <div>
    <!-- Category tabs -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="activeCategory = category.id"
        class="text-sm transition-colors"
        :class="[
          activeCategory === category.id
            ? 'font-medium text-foreground'
            : 'font-normal text-foreground/50 hover:text-foreground',
        ]"
      >
        {{ category.label }}
      </button>
    </div>

    <!-- Grid -->
    <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TransitionGroup name="int">
        <div
          v-for="integration in filteredIntegrations"
          :key="integration.name"
          class="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border [&>svg]:h-5 [&>svg]:w-5"
            v-html="integration.icon"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium tracking-tight">
                {{ integration.name }}
              </h3>
              <span
                v-if="integration.status === 'coming_soon'"
                class="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground/40"
              >
                Soon
              </span>
            </div>
            <p class="mt-1 text-[13px] leading-relaxed text-foreground/55">
              {{ integration.description }}
            </p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.int-enter-active {
	transition:
		opacity 0.3s ease,
		transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.int-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
	/* take out of flow while leaving so siblings reflow smoothly */
	position: absolute;
	width: calc((100% - 1.5rem) / 3);
}
.int-enter-from,
.int-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
/* smoothly animate cards sliding to new positions on filter change */
.int-move {
	transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (max-width: 1023px) {
	.int-leave-active {
		width: calc((100% - 0.75rem) / 2);
	}
}
@media (max-width: 639px) {
	.int-leave-active {
		width: 100%;
	}
}

@media (prefers-reduced-motion: reduce) {
	.int-enter-active,
	.int-leave-active,
	.int-move {
		transition: none;
	}
}
</style>
