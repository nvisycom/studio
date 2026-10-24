<script setup lang="ts">
import type { WorkspacePolicySummary } from "@nvisy/sdk/datatypes";
import { Loader2, Play, ShieldCheck } from "@lucide/vue";
import { EmptyState } from "#console/components/shared";
import type { StudioDetectionPhase } from "#console/composables/studio/useStudioDetection";
import LabelChecklist from "./LabelChecklist.vue";
import { Button } from "#console/components/ui/button";
import { Checkbox } from "#console/components/ui/checkbox";
import { TagCombobox } from "#console/components/ui/tag-combobox";
import {
	COUNTRY_CODES,
	LANGUAGE_TAGS,
	languageName,
	regionName,
} from "#console/utils/locales";

/**
 * The "New detection" form: one source drives a run, chosen from two peers —
 * built-in **labels** (minting a derived policy, the no-setup path) or existing
 * **policies**. An optional per-run **scope** (jurisdictions + languages) applies
 * to whichever source is chosen. Running empties into the Audit tab with the
 * fresh result.
 */
const { t, locale } = useI18n();

const props = defineProps<{
	policies: WorkspacePolicySummary[] | undefined;
	phase: StudioDetectionPhase;
	canRun: boolean;
}>();

const source = defineModel<"labels" | "policies">("source", {
	default: "labels",
});
const labels = defineModel<string[]>("labels", { default: () => [] });
const policyIds = defineModel<string[]>("policyIds", { default: () => [] });
const countries = defineModel<string[]>("countries", { default: () => [] });
const languages = defineModel<string[]>("languages", { default: () => [] });

defineEmits<{ run: [] }>();

const SOURCES = ["labels", "policies"] as const;

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
    <!-- Fixed top: the source toggle + the shared scope. Kept out of the scroll
         area so scope sits at the same place on every source (the source list
         below is what varies in height). -->
    <div class="@container shrink-0 space-y-3 p-3">
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

      <!-- Scope: shared across both sources. Fixed above the source list so it
           doesn't drift with the source content's height. Jurisdictions +
           languages sit side by side on a wide panel to keep the block compact. -->
      <div class="grid grid-cols-1 items-start gap-2.5 @md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">
            {{ t("studio.detections.jurisdictions") }}
          </p>
          <TagCombobox
            v-model="countries"
            :options="countryOptions"
            :normalize="toCountryCode"
            :placeholder="t('studio.detections.scope.countriesPlaceholder')"
            :add-label="t('studio.detections.scope.addValue')"
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
            :placeholder="t('studio.detections.scope.languagesPlaceholder')"
            :add-label="t('studio.detections.scope.addValue')"
            :remove-label="t('common.remove')"
          />
        </div>
      </div>
    </div>

    <!-- Scrolling source list: the part whose height varies by source. A flex
         column so an empty state can fill and center vertically. -->
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto border-t p-3">
      <!-- Labels: scan the catalogue by category and tick entity types. -->
      <div v-if="source === 'labels'" class="space-y-1.5">
        <LabelChecklist v-model="labels" />
      </div>

      <!-- Policies: pick existing workspace policies (multi-select). -->
      <div
        v-else
        class="flex flex-1 flex-col"
        :class="props.policies?.length ? 'space-y-0.5' : ''"
      >
        <template v-if="props.policies?.length">
          <label
            v-for="p in props.policies"
            :key="p.id"
            class="flex cursor-pointer items-start gap-2 rounded-sm px-1.5 py-1.5 transition-colors hover:bg-muted"
          >
            <Checkbox
              class="mt-0.5 shrink-0"
              :model-value="policyIds.includes(p.id)"
              @update:model-value="(v) => togglePolicy(p.id, v)"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm">{{ p.displayName }}</span>
              <span
                v-if="p.description"
                class="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
              >
                {{ p.description }}
              </span>
            </span>
          </label>
        </template>
        <EmptyState
          v-else
          compact
          :icon="ShieldCheck"
          :title="t('studio.detections.emptyPolicies.title')"
          :description="t('studio.detections.emptyPolicies.description')"
        />
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
