<template>
  <ClientOnly>
    <!-- No TooltipProvider: the app-level provider from SidebarProvider
         (layouts/default) already wraps the header this lives in. A nested
         provider crashes reka-ui's slot render on navigation. -->
    <Tooltip>
      <TooltipTrigger as-child>
          <div class="relative flex-shrink-0 cursor-default">
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
        </TooltipTrigger>
        <TooltipContent>{{ tooltip }}</TooltipContent>
      </Tooltip>

    <template #fallback>
      <div
        class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
      />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#console/components/ui/tooltip";

const { t } = useI18n();
const { statusConfig, currentStatus, labelKey, isLoading, hasError } =
	useHealth();

const tooltip = computed(() => {
	if (isLoading.value) return t("health.tooltip.loading");
	if (hasError.value) return t("health.tooltip.unavailable");
	return t(labelKey.value);
});
</script>
