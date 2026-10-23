<script setup lang="ts">
import type {
	WorkspaceDetection,
	WorkspacePipelineSummary,
} from "@nvisy/sdk/datatypes";
import { Check, ChevronDown, Workflow, Zap } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { formatRelativeTime } from "#console/utils/date";

/**
 * The Audit tab's header: which detection is shown, and a menu to switch to any
 * other detection this file has. Shown only when the file has detections.
 */
const { t } = useI18n();

const props = defineProps<{
	detections: WorkspaceDetection[];
	pipelines: WorkspacePipelineSummary[] | undefined;
	selectedDetectionId: string | null;
}>();

const emit = defineEmits<{ select: [id: string] }>();

const selected = computed(() =>
	props.detections.find((d) => d.id === props.selectedDetectionId),
);

/** Whether a detection was a quick (ad-hoc) run — it has no owning pipeline. */
function isQuick(d: WorkspaceDetection): boolean {
	return !d.pipelineId;
}
function sourceLabel(d: WorkspaceDetection): string {
	if (isQuick(d)) return t("studio.detections.adhoc");
	const p = props.pipelines?.find((x) => x.id === d.pipelineId);
	return p?.displayName ?? t("studio.detections.pipeline");
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-8 w-full justify-start gap-1.5 px-2 text-sm font-normal"
      >
        <component
          :is="selected && isQuick(selected) ? Zap : Workflow"
          :size="14"
          class="shrink-0 text-muted-foreground"
        />
        <span class="min-w-0 flex-1 truncate text-left">
          {{ selected ? sourceLabel(selected) : t("studio.detections.none") }}
        </span>
        <span v-if="selected" class="shrink-0 text-xs text-muted-foreground">
          {{ formatRelativeTime(selected.startedAt, t) }}
        </span>
        <ChevronDown :size="14" class="shrink-0 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      class="w-(--reka-dropdown-menu-trigger-width) min-w-64"
    >
      <DropdownMenuItem
        v-for="d in detections"
        :key="d.id"
        class="gap-2"
        @select="emit('select', d.id)"
      >
        <Check
          :size="14"
          class="shrink-0"
          :class="d.id === selectedDetectionId ? 'opacity-100' : 'opacity-0'"
        />
        <component
          :is="isQuick(d) ? Zap : Workflow"
          :size="14"
          class="shrink-0 text-muted-foreground"
        />
        <span class="min-w-0 flex-1 truncate">{{ sourceLabel(d) }}</span>
        <span class="shrink-0 text-xs text-muted-foreground">
          {{ formatRelativeTime(d.startedAt, t) }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
