<script setup lang="ts">
import { computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface IntegrationRun {
  id: string;
  integration: string;
  name: string;
  statusCode: number;
  startedAt: Date;
  duration: string;
}

interface Props {
  open?: boolean;
  run: IntegrationRun | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<Emits>();

function handleOpenChange(open: boolean) {
  emit("update:open", open);
}

function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 100 && statusCode < 200) {
    return "text-blue-600 dark:text-blue-400";
  } else if (statusCode >= 200 && statusCode < 300) {
    return "text-green-600 dark:text-green-400";
  } else if (statusCode >= 300 && statusCode < 400) {
    return "text-yellow-600 dark:text-yellow-400";
  } else if (statusCode >= 400 && statusCode < 500) {
    return "text-orange-600 dark:text-orange-400";
  } else if (statusCode >= 500) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-neutral-600 dark:text-neutral-400";
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Run Details</DialogTitle>
        <DialogDescription>
          Detailed information about this integration run
        </DialogDescription>
      </DialogHeader>

      <div v-if="run" class="space-y-6 py-6">
        <!-- Basic Information -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Name
              </p>
              <p class="text-sm text-neutral-900 dark:text-white">
                {{ run.name }}
              </p>
            </div>
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Integration
              </p>
              <p class="text-sm text-neutral-900 dark:text-white">
                {{ run.integration }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Status Code
              </p>
              <span
                :class="getStatusCodeColor(run.statusCode)"
                class="font-mono text-sm font-semibold"
              >
                {{ run.statusCode }}
              </span>
            </div>
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Duration
              </p>
              <p class="text-sm text-neutral-900 dark:text-white">
                {{ run.duration }}
              </p>
            </div>
          </div>

          <div>
            <p
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Started At
            </p>
            <p class="text-sm text-neutral-900 dark:text-white">
              {{ formatDateTime(run.startedAt) }}
            </p>
          </div>
        </div>

        <!-- Logs Section -->
        <div>
          <p class="text-sm font-medium text-neutral-900 dark:text-white mb-2">
            Logs
          </p>
          <div
            class="bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 font-mono text-xs text-neutral-300 dark:text-neutral-400 max-h-60 overflow-y-auto"
          >
            <p>
              [{{ formatDateTime(run.startedAt) }}] Starting {{ run.name }}...
            </p>
            <p>
              [{{ formatDateTime(run.startedAt) }}] Connecting to
              {{ run.integration }}...
            </p>
            <p>[{{ formatDateTime(run.startedAt) }}] Processing request...</p>
            <p>
              [{{ formatDateTime(run.startedAt) }}] Completed with status
              {{ run.statusCode }}
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
