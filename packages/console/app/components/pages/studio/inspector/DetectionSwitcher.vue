<script setup lang="ts">
import type { WorkspaceDetection } from "@nvisy/sdk/datatypes";
import { Check, ChevronDown, ScanSearch } from "@lucide/vue";
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
 * other detection this file has. Shown only when the file has detections. Every
 * detection is equivalent now (a run against a policy set), so they're
 * identified by when they ran.
 */
const { t } = useI18n();

const props = defineProps<{
	detections: WorkspaceDetection[];
	selectedDetectionId: string | null;
}>();

const emit = defineEmits<{ select: [id: string] }>();

const selected = computed(() =>
	props.detections.find((d) => d.id === props.selectedDetectionId),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-8 w-full justify-start gap-1.5 px-2 text-sm font-normal"
      >
        <ScanSearch :size="14" class="shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate text-left">
          {{ selected ? t("studio.detections.item") : t("studio.detections.none") }}
        </span>
        <span
          v-if="selected"
          class="shrink-0 text-xs text-muted-foreground"
        >
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
        <ScanSearch :size="14" class="shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate">
          {{ t("studio.detections.item") }}
        </span>
        <span class="shrink-0 text-xs text-muted-foreground">
          {{ formatRelativeTime(d.startedAt, t) }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
