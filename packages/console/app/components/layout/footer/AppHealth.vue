<template>
  <ClientOnly>
    <!-- Status dot only, no hover tooltip. `aria-label` keeps the status
         readable to assistive tech without a floating popup on hover. -->
    <div
      class="relative flex-shrink-0 cursor-default"
      role="status"
      :aria-label="label"
    >
      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
      />

      <!-- Error state -->
      <div
        v-else-if="hasError"
        class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
      />

      <!-- Normal status indicator -->
      <template v-else>
        <div
          :class="[
            'w-2 h-2 rounded-full transition-colors duration-300',
            statusConfig.dotColor,
          ]"
        />
        <!-- Healthy pulse animation -->
        <div
          v-show="currentStatus === 'healthy'"
          :class="[
            'absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-30',
            statusConfig.dotColor,
          ]"
        />
      </template>
    </div>

    <template #fallback>
      <div
        class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
      />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { statusConfig, currentStatus, labelKey, isLoading, hasError } =
	useHealth();

const label = computed(() => {
	if (isLoading.value) return t("health.tooltip.loading");
	if (hasError.value) return t("health.tooltip.unavailable");
	return t(labelKey.value);
});
</script>
