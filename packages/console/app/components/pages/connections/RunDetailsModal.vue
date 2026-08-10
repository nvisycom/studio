<script setup lang="ts">
import type { PipelineRun, PipelineRunStatus } from "@nvisy/sdk/datatypes";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Badge } from "#console/components/ui/badge";

interface Props {
	open?: boolean;
	run: PipelineRun | null;
}

type Emits = (e: "update:open", value: boolean) => void;

const props = withDefaults(defineProps<Props>(), {
	open: false,
});

const emit = defineEmits<Emits>();

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function getStatusColor(status: PipelineRunStatus): string {
	switch (status) {
		case "running":
			return "text-blue-600 dark:text-blue-400";
		case "analyzed":
			return "text-yellow-600 dark:text-yellow-400";
		case "completed":
			return "text-green-600 dark:text-green-400";
		case "failed":
			return "text-red-600 dark:text-red-400";
		case "cancelled":
			return "text-red-600 dark:text-red-400";
		default:
			return "text-neutral-600 dark:text-neutral-400";
	}
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Run Details</DialogTitle>
        <DialogDescription>
          Detailed information about this pipeline run
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
                Run ID
              </p>
              <p class="text-sm text-neutral-900 dark:text-white font-mono">
                {{ run.id }}
              </p>
            </div>
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Trigger
              </p>
              <Badge variant="outline" class="capitalize">
                {{ run.triggerType }}
              </Badge>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Status
              </p>
              <span
                :class="getStatusColor(run.status)"
                class="text-sm font-medium capitalize"
              >
                {{ run.status }}
              </span>
            </div>
            <div>
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Duration
              </p>
              <p class="text-sm text-neutral-900 dark:text-white">
                {{ formatDuration(run.startedAt, run.completedAt) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
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
            <div v-if="run.completedAt">
              <p
                class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Completed At
              </p>
              <p class="text-sm text-neutral-900 dark:text-white">
                {{ formatDateTime(run.completedAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Metadata Section -->
        <div v-if="run.metadata">
          <p class="text-sm font-medium text-neutral-900 dark:text-white mb-2">
            Metadata
          </p>
          <div
            class="bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 font-mono text-xs text-neutral-300 dark:text-neutral-400 max-h-60 overflow-y-auto"
          >
            <pre>{{ JSON.stringify(run.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
