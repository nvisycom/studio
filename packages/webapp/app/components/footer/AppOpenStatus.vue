<template>
  <ClientOnly>
    <a
      href="https://nvisy.openstatus.dev"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 text-xs hover:text-neutral-900 dark:hover:text-neutral-400 transition-colors"
    >
      <!-- Status Indicator -->
      <div class="relative flex-shrink-0">
        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
          title="Loading status..."
        />

        <!-- Error state -->
        <div
          v-else-if="hasError"
          class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
          title="Unable to load status"
        />

        <!-- Normal status indicator -->
        <template v-else>
          <div
            :class="[
              'w-2 h-2 rounded-full transition-colors duration-300',
              statusConfig.dotColor,
            ]"
            :title="statusConfig.label"
          />
          <!-- Operational pulse animation -->
          <div
            v-show="currentStatus === 'operational'"
            :class="[
              'absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-30',
              statusConfig.dotColor,
            ]"
          />
        </template>
      </div>

      <!-- Status Label -->
      <span v-if="isLoading">Loading</span>
      <span v-else-if="hasError">Unavailable</span>
      <span v-else>{{ statusConfig.label }}</span>
    </a>

    <template #fallback>
      <a
        href="https://nvisy.openstatus.dev"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-xs hover:text-neutral-900 dark:hover:text-neutral-400 transition-colors"
      >
        <div class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse" />
        <span>Loading</span>
      </a>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { statusConfig, currentStatus, isLoading, hasError } = useOpenstatus();
</script>
