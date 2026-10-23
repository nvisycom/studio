<script setup lang="ts">
import { ChevronDown, X } from "@lucide/vue";
import type {
	CreateWorkspacePipeline,
	WorkspacePipeline,
	WorkspacePolicySummary,
	Retention,
	UpdateWorkspacePipeline,
} from "@nvisy/sdk/datatypes";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Badge } from "#console/components/ui/badge";
import { Textarea } from "#console/components/ui/textarea";
import { MultiSelect } from "#console/components/ui/multi-select";
import { TagCombobox } from "#console/components/ui/tag-combobox";
import {
	COUNTRY_CODES,
	LANGUAGE_TAGS,
	languageName,
	regionName,
} from "#console/utils/locales";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";

const { t } = useI18n();

// `pipeline` present → edit mode; absent → create mode. The parent sheet owns the
// chrome and pinned footer; it drives submit through the exposed `submit()` and
// reads `enabled`/`canSubmit` for the footer switch and button.
const props = defineProps<{
	isLoading?: boolean;
	policies?: WorkspacePolicySummary[];
	pipeline?: WorkspacePipeline | null;
}>();

const emit = defineEmits<{
	create: [pipeline: CreateWorkspacePipeline];
	update: [id: string, updates: UpdateWorkspacePipeline];
	/** Whether the form is submittable (valid). */
	"can-submit": [value: boolean];
}>();

const isEdit = computed(() => !!props.pipeline);

const name = ref("");
const description = ref("");
// A new pipeline defaults to enabled so it can run immediately (the API
// otherwise creates a draft, which rejects runs).
const enabled = ref(true);

// Linked policies.
const selectedPolicies = ref<string[]>([]);
const policyOptions = computed(() =>
	(props.policies ?? []).map((p) => ({ value: p.id, label: p.displayName })),
);

// Scope: jurisdictions (country codes) + asserted languages (BCP-47 tags). Each
// is a tag field with suggestions — the well-known codes labelled by their
// localized name (`Intl.DisplayNames`), while a less common code can still be
// typed. Codes are stored uppercase (countries) / lowercase (languages).
const scopeOpen = ref(false);
const countries = ref<string[]>([]);
const languages = ref<string[]>([]);
const countryOptions = computed(() =>
	COUNTRY_CODES.map((value) => ({
		value,
		label: regionName(value) ?? value,
	})),
);
const languageOptions = computed(() =>
	LANGUAGE_TAGS.map((value) => ({
		value,
		label: languageName(value) ?? value,
	})),
);
const toCountryCode = (raw: string) => raw.trim().toUpperCase();
const toLanguageTag = (raw: string) => raw.trim().toLowerCase();

// Retention override (audit logs + redacted docs). Each scope is either
// "inherit" (take the workspace default — sent as null, the API's
// override-when-set semantics) or a concrete Retention mode. A day count backs
// the "days" mode.
type FieldMode = "inherit" | Retention["mode"];
interface RetentionField {
	mode: FieldMode;
	days: number;
}
// "inherit" leads: it's the default, and everything after it is an override.
const RETENTION_FIELD_MODES: FieldMode[] = [
	"inherit",
	"persistent",
	"fixed",
	"ephemeral",
];
const RETENTION_TARGETS = ["auditLogs", "redactedDocuments"] as const;
type RetentionTarget = (typeof RETENTION_TARGETS)[number];
function newRetentionField(): RetentionField {
	return { mode: "inherit", days: 30 };
}
const retentionOpen = ref(false);
const retention = ref<Record<RetentionTarget, RetentionField>>({
	auditLogs: newRetentionField(),
	redactedDocuments: newRetentionField(),
});
// null == inherit the workspace default for this scope.
function fieldToRetention(f: RetentionField): Retention | null {
	if (f.mode === "inherit") return null;
	return f.mode === "fixed"
		? { mode: "fixed", days: f.days }
		: { mode: f.mode };
}
// Only send the `retention` override when at least one scope isn't inheriting.
const hasRetentionOverride = computed(() =>
	RETENTION_TARGETS.some((tgt) => retention.value[tgt].mode !== "inherit"),
);

// Convert a stored Retention (or null) back into an editor field.
function retentionToField(r: Retention | null | undefined): RetentionField {
	if (!r) return newRetentionField();
	return r.mode === "fixed"
		? { mode: "fixed", days: r.days }
		: { mode: r.mode, days: 30 };
}

// Populate the form from an existing pipeline (edit mode).
function populate(pipeline: WorkspacePipeline) {
	name.value = pipeline.displayName;
	description.value = pipeline.description ?? "";
	enabled.value = pipeline.status === "enabled";
	selectedPolicies.value = [...(pipeline.definition.policyIds ?? [])];
	const scope = pipeline.definition.defaultScope;
	countries.value = [...(scope?.countries ?? [])];
	languages.value = (scope?.languages ?? []).map((l) => l.language);
	scopeOpen.value = countries.value.length > 0 || languages.value.length > 0;
	retention.value = {
		auditLogs: retentionToField(pipeline.retention?.auditLogs),
		redactedDocuments: retentionToField(pipeline.retention?.redactedDocuments),
	};
	retentionOpen.value = RETENTION_TARGETS.some(
		(tgt) => retention.value[tgt].mode !== "inherit",
	);
}

// Repopulate whenever the edited pipeline changes (the parent mounts the form
// only once the full pipeline is loaded).
watch(
	() => props.pipeline,
	(pipeline) => {
		if (pipeline) populate(pipeline);
	},
	{ immediate: true },
);

function removePolicy(value: string) {
	selectedPolicies.value = selectedPolicies.value.filter((v) => v !== value);
}

// A retention target in `days` mode needs a positive day count — the `min="1"`
// on the input is only a browser hint, and `v-model.number` yields "" (or 0/
// negative) that would otherwise submit as `{ mode: "days", days: "" }` and be
// rejected by the API.
const retentionDaysValid = computed(() =>
	RETENTION_TARGETS.every((tgt) => {
		const field = retention.value[tgt];
		return field.mode !== "fixed" || Number(field.days) >= 1;
	}),
);

const isValid = computed(
	() => name.value.trim().length >= 3 && retentionDaysValid.value,
);
watch(isValid, (value) => emit("can-submit", value), { immediate: true });

// The generated type marks both retention scopes as required Retention, but the
// API's contract is "override when set / null == inherit" (each field
// `@default null`). Sending null for an inheriting scope is the correct wire
// shape; cast past the codegen quirk.
type RetentionOverride = CreateWorkspacePipeline["retention"];
function buildRetention(): RetentionOverride {
	return {
		auditLogs: fieldToRetention(retention.value.auditLogs),
		redactedDocuments: fieldToRetention(retention.value.redactedDocuments),
	} as RetentionOverride;
}

// Assemble the pipeline definition shared by create + edit. Only asserted
// languages/countries are sent, so a simple pipeline inherits defaults.
function buildDefinition(): CreateWorkspacePipeline["definition"] {
	const hasScope = countries.value.length > 0 || languages.value.length > 0;
	return {
		...(selectedPolicies.value.length && {
			policyIds: [...selectedPolicies.value],
		}),
		...(hasScope && {
			defaultScope: {
				languages: languages.value.map((language) => ({
					language,
					source: "asserted" as const,
				})),
				...(countries.value.length && { countries: [...countries.value] }),
			},
		}),
	};
}

function submit() {
	if (!isValid.value) return;

	const status = enabled.value ? "enabled" : "disabled";

	if (isEdit.value && props.pipeline) {
		// Edit replaces the whole definition; retention is always sent (each scope
		// inheriting sends null, matching the override-when-set contract).
		const updates: UpdateWorkspacePipeline = {
			displayName: name.value.trim(),
			description: description.value.trim() || undefined,
			status,
			definition: buildDefinition(),
			retention: buildRetention() as UpdateWorkspacePipeline["retention"],
		};
		emit("update", props.pipeline.id, updates);
		return;
	}

	const pipeline: CreateWorkspacePipeline = {
		displayName: name.value.trim(),
		description: description.value.trim() || undefined,
		status,
		definition: buildDefinition(),
		...(hasRetentionOverride.value && { retention: buildRetention() }),
	};

	emit("create", pipeline);
}

// The pinned sheet footer lives in the parent; it drives submit and binds the
// enabled switch through these.
defineExpose({ submit, isValid, enabled });
</script>

<template>
  <div class="space-y-6">
    <!-- Name -->
    <div class="space-y-2">
      <Label for="pipeline-name" required>{{
        t("pipelines.create.nameLabel")
      }}</Label>
      <Input
        id="pipeline-name"
        v-model="name"
        data-testid="pipeline-name"
        :placeholder="t('pipelines.create.namePlaceholder')"
      />
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <Label for="pipeline-description">{{
        t("pipelines.create.descriptionLabel")
      }}</Label>
      <Textarea
        id="pipeline-description"
        v-model="description"
        :placeholder="t('pipelines.create.descriptionPlaceholder')"
        class="min-h-[72px]"
      />
    </div>

    <!-- Policies -->
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div>
          <Label>{{ t("pipelines.create.policiesLabel") }}</Label>
          <p class="text-xs text-muted-foreground">
            {{ t("pipelines.create.policiesHint") }}
          </p>
        </div>
        <MultiSelect
          v-model="selectedPolicies"
          :options="policyOptions"
          :label="t('pipelines.create.policiesSelect')"
          :empty-text="t('pipelines.create.policiesEmpty')"
          searchable
          content-class="w-64"
          data-testid="pipeline-policies"
        />
      </div>
      <div v-if="selectedPolicies.length" class="flex flex-wrap gap-1.5">
        <Badge
          v-for="value in selectedPolicies"
          :key="value"
          variant="secondary"
          class="gap-1 font-normal"
        >
          {{ policyOptions.find((o) => o.value === value)?.label ?? value }}
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground"
            @click="removePolicy(value)"
          >
            <X :size="12" />
          </button>
        </Badge>
      </div>
    </div>

    <!-- Scope: jurisdictions & languages -->
    <Collapsible v-model:open="scopeOpen" class="space-y-3">
      <CollapsibleTrigger as-child>
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {{ t("pipelines.create.advanced") }}
          <ChevronDown
            :size="16"
            class="transition-transform"
            :class="scopeOpen ? 'rotate-180' : ''"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent class="space-y-5">
        <!-- Jurisdictions -->
        <div class="space-y-2">
          <Label for="pipeline-countries">{{
            t("pipelines.create.countriesLabel")
          }}</Label>
          <TagCombobox
            id="pipeline-countries"
            v-model="countries"
            :options="countryOptions"
            :normalize="toCountryCode"
            :placeholder="t('pipelines.create.countriesPlaceholder')"
            :add-label="t('pipelines.create.addValue')"
            autocapitalize="characters"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("pipelines.create.scopeHint") }}
          </p>
        </div>

        <!-- Languages -->
        <div class="space-y-2">
          <Label for="pipeline-languages">{{
            t("pipelines.create.languagesLabel")
          }}</Label>
          <TagCombobox
            id="pipeline-languages"
            v-model="languages"
            :options="languageOptions"
            :normalize="toLanguageTag"
            :placeholder="t('pipelines.create.languagesPlaceholder')"
            :add-label="t('pipelines.create.addValue')"
            autocapitalize="none"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("pipelines.create.languagesHint") }}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <!-- Retention override -->
    <Collapsible v-model:open="retentionOpen" class="space-y-3">
      <CollapsibleTrigger as-child>
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {{ t("pipelines.create.retention") }}
          <ChevronDown
            :size="16"
            class="transition-transform"
            :class="retentionOpen ? 'rotate-180' : ''"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent class="space-y-2.5">
        <p class="pb-1.5 text-xs text-muted-foreground">
          {{ t("pipelines.create.retentionHint") }}
        </p>
        <div
          v-for="target in RETENTION_TARGETS"
          :key="target"
          class="flex items-center justify-between gap-3"
        >
          <Label>
            {{ t(`pipelines.create.retentionTargets.${target}`) }}
          </Label>
          <div class="flex items-center gap-2">
            <Input
              v-if="retention[target].mode === 'fixed'"
              v-model.number="retention[target].days"
              type="number"
              min="1"
              class="h-9 w-20"
              :aria-label="t('pipelines.create.retentionDays')"
            />
            <Select v-model="retention[target].mode">
              <SelectTrigger class="h-9 w-[200px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="mode in RETENTION_FIELD_MODES"
                  :key="mode"
                  :value="mode"
                >
                  {{ t(`pipelines.create.retentionModes.${mode}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
