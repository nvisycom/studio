<script setup lang="ts">
import type {
	WorkspacePipelineSummary,
	WorkspacePolicySummary,
} from "@nvisy/sdk/datatypes";
import { Loader2, Play } from "@lucide/vue";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";
import StudioLabelChecklist from "./StudioLabelChecklist.vue";
import { Button } from "#console/components/ui/button";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { TagCombobox } from "#console/components/ui/tag-combobox";
import {
	COUNTRY_CODES,
	LANGUAGE_TAGS,
	languageName,
	regionName,
} from "#console/utils/locales";

/**
 * The "New detection" form: one source drives a run, chosen from three peers —
 * a saved **pipeline**, built-in **labels** (minting a one-shot policy), or
 * existing **policies**. An optional per-run **scope** (jurisdictions +
 * languages) applies to whichever source is chosen. Running empties into the
 * Audit tab with the fresh result.
 */
const { t, locale } = useI18n();

const props = defineProps<{
	pipelines: WorkspacePipelineSummary[] | undefined;
	policies: WorkspacePolicySummary[] | undefined;
	phase: StudioDetectionPhase;
	canRun: boolean;
}>();

const source = defineModel<"pipeline" | "labels" | "policies">("source", {
	default: "pipeline",
});
const selectedPipeline = defineModel<string>("selectedPipeline", {
	default: "",
});
const labels = defineModel<string[]>("labels", { default: () => [] });
const policyIds = defineModel<string[]>("policyIds", { default: () => [] });
const countries = defineModel<string[]>("countries", { default: () => [] });
const languages = defineModel<string[]>("languages", { default: () => [] });

defineEmits<{ run: [] }>();

const SOURCES = ["pipeline", "labels", "policies"] as const;

const countryOptions = computed(() =>
	COUNTRY_CODES.map((value) => ({
		value,
		label: regionName(value, locale.value) ?? value,
	})),
);
const languageOptions = computed(() =>
	LANGUAGE_TAGS.map((value) => ({
		value,
		label: languageName(value, locale.value) ?? value,
	})),
);
const toCountryCode = (raw: string) => raw.trim().toUpperCase();
const toLanguageTag = (raw: string) => raw.trim().toLowerCase();

function togglePolicy(id: string, checked: boolean | "indeterminate") {
	policyIds.value =
		checked === true
			? [...policyIds.value, id]
			: policyIds.value.filter((v) => v !== id);
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
      <!-- Source: the one choice that drives the run. -->
      <div class="flex rounded-md border border-input p-0.5">
        <button
          v-for="option in SOURCES"
          :key="option"
          type="button"
          class="flex-1 rounded-sm px-2 py-1 text-sm transition-colors"
          :class="
            source === option
              ? 'bg-secondary font-medium text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="source = option"
        >
          {{ t(`studio.detections.source.${option}`) }}
        </button>
      </div>

      <!-- Pipeline: pick a saved pipeline. -->
      <div v-if="source === 'pipeline'" class="space-y-1.5">
        <Select v-model="selectedPipeline" :disabled="phase === 'running'">
          <SelectTrigger class="h-9 w-full text-sm">
            <SelectValue :placeholder="t('studio.audit.pipelinePlaceholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="p in pipelines ?? []"
              :key="p.id"
              :value="p.id"
              class="text-sm font-normal"
            >
              {{ p.displayName }}
            </SelectItem>
            <p
              v-if="!pipelines?.length"
              class="px-2 py-1.5 text-sm text-muted-foreground"
            >
              {{ t("studio.audit.noPipelines") }}
            </p>
          </SelectContent>
        </Select>
      </div>

      <!-- Labels: scan the catalogue by category and tick entity types. -->
      <div v-else-if="source === 'labels'" class="space-y-1.5">
        <StudioLabelChecklist v-model="labels" />
        <p class="text-xs text-muted-foreground">
          {{ t("studio.detections.labelsHint") }}
        </p>
      </div>

      <!-- Policies: pick existing workspace policies. -->
      <div v-else class="space-y-1.5">
        <div
          v-if="props.policies?.length"
          class="max-h-60 space-y-0.5 overflow-y-auto"
        >
          <label
            v-for="p in props.policies"
            :key="p.id"
            class="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-muted"
          >
            <Checkbox
              :model-value="policyIds.includes(p.id)"
              @update:model-value="(v) => togglePolicy(p.id, v)"
            />
            <span class="truncate">{{ p.displayName }}</span>
          </label>
        </div>
        <p v-else class="text-xs text-muted-foreground">
          {{ t("studio.detections.noPolicies") }}
        </p>
      </div>

      <!-- Scope: shared across every source (for a pipeline it overrides the
           pipeline's saved default). Always shown. -->
      <div class="space-y-2.5 border-t pt-3">
        <p class="text-xs font-medium text-muted-foreground">
          {{ t("studio.detections.scope") }}
        </p>
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">
            {{ t("studio.detections.jurisdictions") }}
          </p>
          <TagCombobox
            v-model="countries"
            :options="countryOptions"
            :normalize="toCountryCode"
            :placeholder="t('pipelines.create.countriesPlaceholder')"
            :add-label="t('pipelines.create.addValue')"
            :remove-label="t('common.remove')"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">
            {{ t("studio.detections.languages") }}
          </p>
          <TagCombobox
            v-model="languages"
            :options="languageOptions"
            :normalize="toLanguageTag"
            :placeholder="t('pipelines.create.languagesPlaceholder')"
            :add-label="t('pipelines.create.addValue')"
            :remove-label="t('common.remove')"
          />
        </div>
      </div>
    </div>

    <!-- Run, pinned to the bottom of the form. -->
    <div class="shrink-0 border-t p-3">
      <Button class="w-full gap-2" :disabled="!canRun" @click="$emit('run')">
        <Loader2 v-if="phase === 'running'" :size="16" class="animate-spin" />
        <Play v-else :size="16" />
        {{ t("studio.detections.runDetection") }}
      </Button>
    </div>
  </div>
</template>
