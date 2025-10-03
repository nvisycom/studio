<script setup lang="ts">
import { COMPANY_NAME } from "@nvisy/config";

interface Props {
	/** Whether the logo should be a clickable link to home page */
	asLink?: boolean;
	/** Size variant of the logo */
	size?: "sm" | "md" | "lg";
	/** Whether to show the company name text */
	showText?: boolean;
	/** Custom company name override */
	companyName?: string;
}

const props = withDefaults(defineProps<Props>(), {
	asLink: true,
	size: "md",
	showText: true,
	companyName: COMPANY_NAME,
});

const sizeClasses = {
	sm: {
		icon: "w-6 h-6",
		text: "text-sm",
		spacing: "space-x-1.5",
	},
	md: {
		icon: "w-8 h-8",
		text: "text-lg",
		spacing: "space-x-2",
	},
	lg: {
		icon: "w-10 h-10",
		text: "text-xl",
		spacing: "space-x-3",
	},
};

const currentSize = sizeClasses[props.size];
</script>

<template>
  <component
    :is="asLink ? 'a' : 'div'"
    :href="asLink ? '/' : undefined"
    :class="[
      'flex items-center',
      currentSize.spacing,
      asLink ? 'hover:opacity-80 transition-opacity' : ''
    ]"
  >
    <!-- Logo Icon -->
    <div
      :class="[
        'bg-black dark:bg-white rounded flex items-center justify-center',
        currentSize.icon
      ]"
    >
      <span
        :class="[
          'text-white dark:text-black font-bold',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        ]"
      >
        N
      </span>
    </div>

    <!-- Company Name -->
    <span
      v-if="showText"
      :class="[
        'font-semibold text-gray-900 dark:text-white',
        currentSize.text
      ]"
    >
      {{ companyName }}
    </span>
  </component>
</template>
