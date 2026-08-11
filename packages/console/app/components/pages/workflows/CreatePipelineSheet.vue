<script setup lang="ts">
import { ChevronDown, Loader2, X } from "@lucide/vue";
import type {
	CreatePipeline,
	PolicySummary,
	Retention,
} from "@nvisy/sdk/datatypes";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import { Textarea } from "#console/components/ui/textarea";
import { MultiSelect } from "#console/components/ui/multi-select";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#console/components/ui/sheet";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
	isLoading?: boolean;
	policies?: PolicySummary[];
}>();

const emit = defineEmits<{
	create: [pipeline: CreatePipeline];
}>();

const name = ref("");
const slug = ref("");
const slugEdited = ref(false);
const description = ref("");

// Linked policies.
const selectedPolicies = ref<string[]>([]);
const policyOptions = computed(() =>
	(props.policies ?? []).map((p) => ({ value: p.slug, label: p.displayName })),
);

// Scope: jurisdictions (country codes) + asserted languages (BCP-47 tags).
const scopeOpen = ref(false);
const countries = ref<string[]>([]);
const countryInput = ref("");
const languages = ref<string[]>([]);
const languageInput = ref("");

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
	"forever",
	"days",
	"zeroDays",
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
	return f.mode === "days" ? { mode: "days", days: f.days } : { mode: f.mode };
}
// Only send the `retention` override when at least one scope isn't inheriting.
const hasRetentionOverride = computed(() =>
	RETENTION_TARGETS.some((tgt) => retention.value[tgt].mode !== "inherit"),
);

// Slugify: lowercase alphanumeric with single internal dashes.
function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
watch(name, (value) => {
	if (!slugEdited.value) slug.value = slugify(value);
});
function onSlugInput() {
	slugEdited.value = true;
	slug.value = slugify(slug.value);
}

function addCountry() {
	const value = countryInput.value.trim().toUpperCase();
	if (value && !countries.value.includes(value)) countries.value.push(value);
	countryInput.value = "";
}
function addLanguage() {
	const value = languageInput.value.trim().toLowerCase();
	if (value && !languages.value.includes(value)) languages.value.push(value);
	languageInput.value = "";
}
function removePolicy(value: string) {
	selectedPolicies.value = selectedPolicies.value.filter((v) => v !== value);
}
function removeCountry(value: string) {
	countries.value = countries.value.filter((v) => v !== value);
}
function removeLanguage(value: string) {
	languages.value = languages.value.filter((v) => v !== value);
}

const isFormValid = computed(
	() => name.value.trim().length >= 3 && slug.value.length > 0,
);

function reset() {
	name.value = "";
	slug.value = "";
	slugEdited.value = false;
	description.value = "";
	selectedPolicies.value = [];
	scopeOpen.value = false;
	countries.value = [];
	countryInput.value = "";
	languages.value = [];
	languageInput.value = "";
	retentionOpen.value = false;
	retention.value = {
		auditLogs: newRetentionField(),
		redactedDocuments: newRetentionField(),
	};
}

function handleOpenChange(value: boolean) {
	if (!value) reset();
	open.value = value;
}

function submit() {
	if (!isFormValid.value) return;

	// Only asserted languages/countries and an actual retention override are
	// sent, so a simple pipeline inherits engine/workspace defaults.
	const hasScope = countries.value.length > 0 || languages.value.length > 0;

	const pipeline: CreatePipeline = {
		displayName: name.value.trim(),
		slug: slug.value,
		description: description.value.trim() || undefined,
		definition: {
			...(selectedPolicies.value.length && {
				policySlugs: [...selectedPolicies.value],
			}),
			...(hasScope && {
				defaultScope: {
					languages: languages.value.map((language) => ({
						language,
						provenance: "asserted" as const,
					})),
					...(countries.value.length && { countries: [...countries.value] }),
				},
			}),
		},
		...(hasRetentionOverride.value && {
			// The generated type marks both scopes as required Retention, but the
			// API's contract is "override when set / null == inherit" (each field
			// `@default null`). Sending null for an inheriting scope is the correct
			// wire shape; cast past the codegen quirk.
			retention: {
				auditLogs: fieldToRetention(retention.value.auditLogs),
				redactedDocuments: fieldToRetention(retention.value.redactedDocuments),
			} as CreatePipeline["retention"],
		}),
	};

	// Parent closes the sheet on success (and keeps it open on error so the
	// user can retry); don't close here.
	emit("create", pipeline);
}

function cancel() {
	reset();
	open.value = false;
}
</script>

<template>
  <Sheet :open="open" @update:open="handleOpenChange">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
    >
      <SheetHeader class="border-b border-border/50">
        <SheetTitle>{{ t("workflows.create.title") }}</SheetTitle>
        <SheetDescription>
          {{ t("workflows.create.description") }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 space-y-6 overflow-y-auto p-6">
        <!-- Basics -->
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="pipeline-name">{{
              t("workflows.create.nameLabel")
            }}</Label>
            <Input
              id="pipeline-name"
              v-model="name"
              :placeholder="t('workflows.create.namePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label for="pipeline-slug">{{
              t("workflows.create.slugLabel")
            }}</Label>
            <Input
              id="pipeline-slug"
              v-model="slug"
              autocapitalize="none"
              class="font-mono text-sm"
              :placeholder="t('workflows.create.slugPlaceholder')"
              @input="onSlugInput"
            />
          </div>
        </div>
        <p class="-mt-3 text-xs text-muted-foreground">
          {{ t("workflows.create.slugHint") }}
        </p>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="pipeline-description">{{
            t("workflows.create.descriptionLabel")
          }}</Label>
          <Textarea
            id="pipeline-description"
            v-model="description"
            :placeholder="t('workflows.create.descriptionPlaceholder')"
            class="min-h-[72px]"
          />
        </div>

        <!-- Policies -->
        <div class="space-y-2">
          <Label>{{ t("workflows.create.policiesLabel") }}</Label>
          <MultiSelect
            v-model="selectedPolicies"
            :options="policyOptions"
            :label="t('workflows.create.policiesSelect')"
            :empty-text="t('workflows.create.policiesEmpty')"
            searchable
            content-class="w-64"
          />
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
          <p class="text-xs text-muted-foreground">
            {{ t("workflows.create.policiesHint") }}
          </p>
        </div>

        <!-- Scope: jurisdictions & languages -->
        <Collapsible v-model:open="scopeOpen" class="space-y-3">
          <CollapsibleTrigger as-child>
            <button
              type="button"
              class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {{ t("workflows.create.advanced") }}
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
                t("workflows.create.countriesLabel")
              }}</Label>
              <Input
                id="pipeline-countries"
                v-model="countryInput"
                autocapitalize="characters"
                :placeholder="t('workflows.create.countriesPlaceholder')"
                @keydown.enter.prevent="addCountry"
              />
              <div v-if="countries.length" class="flex flex-wrap gap-1.5">
                <Badge
                  v-for="value in countries"
                  :key="value"
                  variant="secondary"
                  class="gap-1 font-normal"
                >
                  {{ value }}
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground"
                    @click="removeCountry(value)"
                  >
                    <X :size="12" />
                  </button>
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t("workflows.create.scopeHint") }}
              </p>
            </div>

            <!-- Languages -->
            <div class="space-y-2">
              <Label for="pipeline-languages">{{
                t("workflows.create.languagesLabel")
              }}</Label>
              <Input
                id="pipeline-languages"
                v-model="languageInput"
                autocapitalize="none"
                :placeholder="t('workflows.create.languagesPlaceholder')"
                @keydown.enter.prevent="addLanguage"
              />
              <div v-if="languages.length" class="flex flex-wrap gap-1.5">
                <Badge
                  v-for="value in languages"
                  :key="value"
                  variant="secondary"
                  class="gap-1 font-normal"
                >
                  {{ value }}
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground"
                    @click="removeLanguage(value)"
                  >
                    <X :size="12" />
                  </button>
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t("workflows.create.languagesHint") }}
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
              {{ t("workflows.create.retention") }}
              <ChevronDown
                :size="16"
                class="transition-transform"
                :class="retentionOpen ? 'rotate-180' : ''"
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-4">
            <p class="text-xs text-muted-foreground">
              {{ t("workflows.create.retentionHint") }}
            </p>
            <div
              v-for="target in RETENTION_TARGETS"
              :key="target"
              class="space-y-2"
            >
              <Label>{{
                t(`workflows.create.retentionTargets.${target}`)
              }}</Label>
              <div class="flex items-center gap-2">
                <Select v-model="retention[target].mode">
                  <SelectTrigger class="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="mode in RETENTION_FIELD_MODES"
                      :key="mode"
                      :value="mode"
                    >
                      {{ t(`workflows.create.retentionModes.${mode}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  v-if="retention[target].mode === 'days'"
                  v-model.number="retention[target].days"
                  type="number"
                  min="1"
                  class="w-24"
                  :aria-label="t('workflows.create.retentionDays')"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <SheetFooter class="flex-row justify-end border-t border-border/50">
        <Button variant="outline" @click="cancel">
          {{ t("workflows.create.cancel") }}
        </Button>
        <Button @click="submit" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("workflows.create.submit") }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
