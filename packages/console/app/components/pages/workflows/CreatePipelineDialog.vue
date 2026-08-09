<script setup lang="ts">
import { Loader2, ChevronDown, X } from "@lucide/vue";
import type { CreatePipeline, PolicySummary } from "@nvisy/sdk/datatypes";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Switch } from "#console/components/ui/switch";
import { Badge } from "#console/components/ui/badge";
import { Textarea } from "#console/components/ui/textarea";
import { MultiSelect } from "#console/components/ui/multi-select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

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

// Recognizer engines to enable. pattern/ner/llm map to RecognizerParams.
const usePattern = ref(true);
const useNer = ref(true);
const useLlm = ref(false);

const engines = [
	{ key: "pattern", model: usePattern },
	{ key: "ner", model: useNer },
	{ key: "llm", model: useLlm },
];

// Advanced: linked policies and scope (jurisdictions).
const advancedOpen = ref(false);
const selectedPolicies = ref<string[]>([]);
const countries = ref<string[]>([]);
const countryInput = ref("");

const policyOptions = computed(() =>
	(props.policies ?? []).map((p) => ({ value: p.slug, label: p.displayName })),
);

// Slugify: lowercase alphanumeric with single internal dashes.
function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Keep slug in sync with name until the user edits it directly.
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

function removePolicy(value: string) {
	selectedPolicies.value = selectedPolicies.value.filter((v) => v !== value);
}
function removeCountry(value: string) {
	countries.value = countries.value.filter((v) => v !== value);
}

const isFormValid = computed(
	() => name.value.trim().length >= 3 && slug.value.length > 0,
);

function reset() {
	name.value = "";
	slug.value = "";
	slugEdited.value = false;
	description.value = "";
	usePattern.value = true;
	useNer.value = true;
	useLlm.value = false;
	advancedOpen.value = false;
	selectedPolicies.value = [];
	countries.value = [];
	countryInput.value = "";
}

function handleOpenChange(value: boolean) {
	if (!value) reset();
	open.value = value;
}

function submit() {
	if (!isFormValid.value) return;

	const pipeline: CreatePipeline = {
		displayName: name.value.trim(),
		slug: slug.value,
		description: description.value.trim() || undefined,
		definition: {
			recognizers: {
				ner: useNer.value,
				llm: useLlm.value,
				...(usePattern.value && {
					pattern: { builtins: true, contextEnhanced: false },
				}),
			},
			// Required by the schema; engine defaults fill in the rest.
			deduplication: {},
			...(selectedPolicies.value.length && {
				policySlugs: [...selectedPolicies.value],
			}),
			...(countries.value.length && {
				// `languages` is required on ScopeParams; the pipeline asserts none
				// and lets detection fill them in.
				defaultScope: { languages: [], countries: [...countries.value] },
			}),
		},
	};

	// Parent closes the dialog on success (and keeps it open on error so the
	// user can retry); don't close here.
	emit("create", pipeline);
}

function cancel() {
	reset();
	open.value = false;
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t("workflows.create.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("workflows.create.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-[70vh] space-y-5 overflow-y-auto py-4 pr-1">
        <!-- Name -->
        <div class="space-y-2">
          <Label for="pipeline-name">{{ t("workflows.create.nameLabel") }}</Label>
          <Input
            id="pipeline-name"
            v-model="name"
            :placeholder="t('workflows.create.namePlaceholder')"
          />
        </div>

        <!-- Slug -->
        <div class="space-y-2">
          <Label for="pipeline-slug">{{ t("workflows.create.slugLabel") }}</Label>
          <Input
            id="pipeline-slug"
            v-model="slug"
            autocapitalize="none"
            class="font-mono text-sm"
            :placeholder="t('workflows.create.slugPlaceholder')"
            @input="onSlugInput"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("workflows.create.slugHint") }}
          </p>
        </div>

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

        <!-- Detection -->
        <div class="space-y-3">
          <Label>{{ t("workflows.create.detectionLabel") }}</Label>
          <div class="space-y-3 rounded-lg border border-border/50 p-3">
            <div
              v-for="engine in engines"
              :key="engine.key"
              class="flex items-center justify-between"
            >
              <div class="space-y-0.5">
                <p class="text-sm font-medium">
                  {{ t(`workflows.create.engines.${engine.key}.label`) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ t(`workflows.create.engines.${engine.key}.description`) }}
                </p>
              </div>
              <Switch
                :model-value="engine.model.value"
                @update:model-value="engine.model.value = $event"
              />
            </div>
          </div>
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

        <!-- Advanced: scope & entity types -->
        <Collapsible v-model:open="advancedOpen" class="space-y-3">
          <CollapsibleTrigger as-child>
            <button
              type="button"
              class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {{ t("workflows.create.advanced") }}
              <ChevronDown
                :size="16"
                class="transition-transform"
                :class="advancedOpen ? 'rotate-180' : ''"
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
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("workflows.create.cancel") }}
        </Button>
        <Button @click="submit" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("workflows.create.submit") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
