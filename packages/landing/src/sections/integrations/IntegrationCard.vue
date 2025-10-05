<template>
  <div
    class="bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
  >
    <div class="flex items-start justify-between mb-4">
      <div
        class="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center"
      >
        <component
          :is="getIcon(icon)"
          class="w-6 h-6 text-gray-900 dark:text-white"
        />
      </div>
    </div>

    <div class="mb-2">
      <div class="flex items-center gap-2 mb-2">
        <h3
          class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-0"
        >
          {{ title }}
          <span
            class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full"
          >
            {{ category }}
          </span>
        </h3>
      </div>
    </div>

    <p class="text-gray-600 dark:text-neutral-400 text-sm mb-4">
      {{ description }}
    </p>

    <div class="flex items-center gap-4">
      <!-- Version with icon -->
      <div
        class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400"
      >
        <FileText class="w-4 h-4" />
        <span>{{ version }}</span>
      </div>

      <!-- Status with icon -->
      <div class="flex items-center gap-1 text-sm" :class="statusTextClasses">
        <component :is="getStatusIcon(status)" class="w-4 h-4" />
        <span>{{ status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
	// Main icons
	Cloud,
	Zap,
	Settings,
	Rocket,
	MessageSquare,
	Building,
	FileText,
	Shield,
	Server,
	Code,
	Code2,
	Link,
	// Status icons
	CircleCheck,
	Clock,
	Calendar,
	// Version icon
} from "lucide-vue-next";

interface Props {
	icon: string;
	isBrand?: boolean;
	version: string;
	status: string;
	title: string;
	category: string;
	description: string;
	availability: string;
}

const props = withDefaults(defineProps<Props>(), {
	isBrand: false,
});

// Icon mapping from FontAwesome to Lucide
const getIcon = (iconName: string) => {
	const iconMap: Record<string, any> = {
		"google-drive": Cloud,
		dropbox: Cloud,
		aws: Cloud,
		bolt: Zap,
		gears: Settings,
		rocket: Rocket,
		slack: MessageSquare,
		microsoft: Building,
		notion: FileText,
		building: Building,
		shield: Shield,
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
const statusTextClasses = computed(() => {
	switch (props.status.toLowerCase()) {
		case "completed":
			return "text-gray-600 dark:text-gray-400";
		case "in progress":
			return "text-gray-500 dark:text-gray-500";
		case "planned":
			return "text-gray-500 dark:text-gray-500";
		default:
			return "text-gray-600 dark:text-gray-400";
	}
});
</script>
