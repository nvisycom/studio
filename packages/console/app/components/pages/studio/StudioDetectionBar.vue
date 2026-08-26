<script setup lang="ts">
import type { PipelineSummary } from "@nvisy/sdk/datatypes";
import { Loader2, Play, RotateCcw } from "@lucide/vue";
import type { StudioAuditPhase } from "#console/composables/useStudioAudit";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

const { t } = useI18n();

defineProps<{
	pipelines: PipelineSummary[] | undefined;
	phase: StudioAuditPhase;
	canRun: boolean;
}>();

const selectedPipeline = defineModel<string>("selectedPipeline", {
	default: "",
});

defineEmits<{ run: [] }>();
</script>

<template>
  <div class="flex h-11 items-center gap-2 border-b border-border/50 bg-background px-3">
    <Select v-model="selectedPipeline" :disabled="phase === 'running'">
      <SelectTrigger class="h-8 flex-1 text-sm">
        <SelectValue :placeholder="t('studio.audit.pipelinePlaceholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="p in pipelines ?? []"
          :key="p.slug"
          :value="p.slug"
          class="text-sm font-normal"
        >
          {{ p.displayName }}
        </SelectItem>
        <!-- Avoid a blank menu box when there are no pipelines to pick. -->
        <p
          v-if="!pipelines?.length"
          class="px-2 py-1.5 text-sm text-muted-foreground"
        >
          {{ t("studio.audit.noPipelines") }}
        </p>
      </SelectContent>
    </Select>

    <Button
      size="icon"
      class="size-8 shrink-0"
      :disabled="!canRun"
      :title="phase === 'complete' ? t('studio.audit.runAgain') : t('studio.audit.run')"
      @click="$emit('run')"
    >
      <Loader2 v-if="phase === 'running'" :size="16" class="animate-spin" />
      <RotateCcw v-else-if="phase === 'complete'" :size="16" />
      <Play v-else :size="16" />
    </Button>
  </div>
</template>
