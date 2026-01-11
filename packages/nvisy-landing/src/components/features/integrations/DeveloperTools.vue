<template>
  <div class="bg-neutral-50 dark:bg-black py-12 md:py-20">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2
          class="text-3xl md:text-4xl font-light text-neutral-900 dark:text-white mb-6"
        >
          Developer Tools
        </h2>
        <p
          class="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed"
        >
          Build powerful integrations with our comprehensive developer toolkit.
          APIs, SDKs, and webhooks designed for seamless integration.
        </p>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
      >
        <div
          v-for="tool in integrations"
          :key="tool.data.title"
          class="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-4">
            <div
              class="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center"
            >
              <component
                :is="getIcon(tool.data.icon)"
                class="w-6 h-6 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div class="mb-2">
            <h3 class="text-lg font-light text-neutral-900 dark:text-white">
              {{ tool.data.title }}
            </h3>
          </div>

          <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
            {{ tool.data.description }}
          </p>

          <div class="flex items-center gap-4">
            <!-- Version with icon -->
            <div
              class="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400"
            >
              <FileText class="w-4 h-4" />
              <span>{{ tool.data.version }}</span>
            </div>

            <!-- Status with icon -->
            <div
              class="flex items-center gap-1 text-sm"
              :class="getStatusTextClasses(tool.data.status)"
            >
              <component
                :is="getStatusIcon(tool.data.status)"
                class="w-4 h-4"
              />
              <span>{{ tool.data.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CollectionEntry } from "astro:content";
import {
	Server,
	Code,
	Code2,
	Link,
	FileText,
	Clock,
	Calendar,
	CircleCheck,
} from "lucide-vue-next";

interface Props {
	integrations: CollectionEntry<"integrations">[];
}

const props = defineProps<Props>();
const { integrations } = props;

// Icon mapping from FontAwesome to Lucide
const getIcon = (iconName: string) => {
	const iconMap: Record<string, any> = {
		server: Server,
		python: Code,
		js: Code2,
		link: Link,
	};

	return iconMap[iconName] || FileText;
};

// Status icon mapping
const getStatusIcon = (status: string) => {
	const statusIconMap: Record<string, any> = {
		Completed: CircleCheck,
		"In Progress": Clock,
		Planned: Calendar,
	};

	return statusIconMap[status] || Clock;
};

// Status text color classes - less prominent
const getStatusTextClasses = (status: string) => {
	switch (status.toLowerCase()) {
		case "completed":
			return "text-neutral-600 dark:text-neutral-400";
		case "in progress":
			return "text-neutral-500 dark:text-neutral-500";
		case "planned":
			return "text-neutral-500 dark:text-neutral-500";
		default:
			return "text-neutral-600 dark:text-neutral-400";
	}
};
</script>
