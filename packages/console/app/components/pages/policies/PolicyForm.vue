<script setup lang="ts">
import type { CreatePolicy, Policy, UpdatePolicy } from "@nvisy/sdk/datatypes";
import type {
	EditableRule,
	EditablePredicatedRule,
	EditableTableRule,
	EditableAction,
	EditableOperator,
	EditableLabel,
	EditableScope,
	PredicateKind,
	Modality,
} from "#console/utils/policies";
import {
	buildCreatePolicy,
	buildDefinition,
	rulesFromDefinition,
	fallbackFromDefinition,
	labelsFromDefinition,
	scopesFromDefinition,
} from "#console/utils/policies";
import { LabelPicker, LabelSelect, TagInput } from "#console/components/label";
import { slugify } from "#console/utils/naming";
import {
	Plus,
	Trash2,
	X,
	Sparkles,
	Hash,
	Tag as TagIcon,
	ChevronUp,
	ChevronDown,
} from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Textarea } from "#console/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import ModalityActionEditor from "./ModalityActionEditor.vue";
import CollapsibleSection from "./CollapsibleSection.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{ policy?: Policy | null; isLoading?: boolean }>(),
	{ policy: null, isLoading: false },
);

const emit = defineEmits<{
	create: [policy: CreatePolicy];
	update: [slug: string, updates: UpdatePolicy];
	/** Whether the form is submittable: valid, and (in edit mode) changed. */
	"can-submit": [value: boolean];
}>();

const isEdit = computed(() => !!props.policy);

// Predicate conditions the editor offers. `labelInScope` covers matching by a
// named label set, so a raw label-list condition isn't offered.
const PREDICATE_KINDS: PredicateKind[] = [
	"confidence",
	"tagOneOf",
	"labelInScope",
	"coRef",
];
const MODALITIES: Modality[] = ["text", "image", "audio", "tabular"];

// Which modalities a rule/fallback action currently configures (for the summary).
function activeModalities(action: EditableAction): Modality[] {
	return MODALITIES.filter((m) => action.modalities?.[m]);
}

const displayName = ref("");
const slug = ref("");
const description = ref("");
const rules = ref<EditableRule[]>([]);
const fallback = ref<EditableAction | null>(null);
const labels = ref<EditableLabel[]>([]);
const scopes = ref<EditableScope[]>([]);
const policyId = ref("");

// Collapsible sections start collapsed; adding an item auto-expands them.
const rulesOpen = ref(false);
const labelsOpen = ref(false);
const scopesOpen = ref(false);
const fallbackOpen = ref(false);

// Fallback (a ModalityRedactions, like a rule action)
// The fallback's default operator for a given modality (mirrors the editor).
function defaultFallbackOperator(m: Modality): EditableOperator {
	// New operators default to erase across every modality.
	switch (m) {
		case "image":
			return { imageKind: "erase" };
		case "audio":
			return { audioKind: "erase" };
		case "tabular":
			return { tabularKind: "erase" };
		default:
			return { textKind: "erase" };
	}
}
// Modalities not yet configured on the fallback, for the "Add fallback" menu.
const fallbackModalitiesAvailable = computed(() =>
	MODALITIES.filter((m) => !fallback.value?.modalities?.[m]),
);
// How many modalities the fallback configures, shown as the section count.
const fallbackModalityCount = computed(
	() => MODALITIES.length - fallbackModalitiesAvailable.value.length,
);
// Add a modality to the fallback, creating the fallback if it didn't exist yet.
function addFallbackModality(m: Modality) {
	fallbackOpen.value = true;
	const modalities = { ...fallback.value?.modalities };
	modalities[m] = defaultFallbackOperator(m);
	fallback.value = { modalities };
}
// Removing the fallback's last modality clears it back to the empty state.
watch(
	() => fallback.value && Object.keys(fallback.value.modalities).length === 0,
	(empty) => {
		if (empty) fallback.value = null;
	},
);

// The policy's own custom labels, offered inside each scope's picker under a
// "Custom" group so a scope can cover them alongside catalogue labels.
const customLabelOptions = computed(() =>
	labels.value
		.filter((l) => l.name.trim())
		.map((l) => ({ id: l.id, name: l.name.trim() })),
);

// The named scopes a `labelInScope` condition can reference, deduped.
const scopeNames = computed(() => [
	...new Set(scopes.value.map((s) => s.name.trim()).filter(Boolean)),
]);

// Custom labels
function addLabel() {
	labelsOpen.value = true; // reveal the section so the new row is visible
	labels.value = [
		...labels.value,
		{
			key: crypto.randomUUID(),
			id: crypto.randomUUID(),
			locale: "en",
			name: "",
			tags: "",
			localizations: {},
		},
	];
}
function removeLabel(key: string) {
	// Also drop the label's id wherever a scope or table rule referenced it, so
	// a saved definition never points at a custom label that no longer exists.
	const removed = labels.value.find((l) => l.key === key);
	labels.value = labels.value.filter((l) => l.key !== key);
	if (!removed) return;
	for (const scope of scopes.value) {
		scope.labels = scope.labels.filter((id) => id !== removed.id);
	}
	for (const rule of rules.value) {
		if (rule.kind === "table") {
			for (const entry of rule.entries) {
				if (entry.label === removed.id) entry.label = "";
			}
		}
	}
}

// Label scopes
function addScope() {
	scopesOpen.value = true;
	scopes.value = [
		...scopes.value,
		{ key: crypto.randomUUID(), name: "", labels: [] },
	];
}
function removeScope(key: string) {
	scopes.value = scopes.value.filter((s) => s.key !== key);
}

// On create the slug is immutable and always derived from the name; on edit it
// is fixed to the existing policy's slug and never changes.
watch(displayName, (value) => {
	if (!isEdit.value) slug.value = slugify(value);
});

function defaultAction(): EditableAction {
	return { modalities: { text: { textKind: "erase" } } };
}

function newPredicatedRule(): EditablePredicatedRule {
	return {
		kind: "predicated",
		key: crypto.randomUUID(),
		name: "",
		predicates: [{ kind: "confidence", min: 0.5 }],
		action: defaultAction(),
	};
}
function newTableRule(): EditableTableRule {
	return {
		kind: "table",
		key: crypto.randomUUID(),
		name: "",
		entries: [{ key: crypto.randomUUID(), label: "", action: defaultAction() }],
	};
}

function addRule(kind: EditableRule["kind"] = "predicated") {
	rulesOpen.value = true; // reveal the section so the new rule is visible
	rules.value = [
		...rules.value,
		kind === "table" ? newTableRule() : newPredicatedRule(),
	];
}
function removeRule(key: string) {
	rules.value = rules.value.filter((r) => r.key !== key);
}
// Rules evaluate top-to-bottom (first match wins), so order is meaningful.
function moveRule(index: number, delta: number) {
	const target = index + delta;
	if (target < 0 || target >= rules.value.length) return;
	const next = [...rules.value];
	const moved = next[index];
	if (!moved) return;
	next.splice(index, 1);
	next.splice(target, 0, moved);
	rules.value = next;
}
// Predicated-rule conditions
function addPredicate(rule: EditablePredicatedRule) {
	rule.predicates.push({ kind: "labelInScope", values: "" });
}
function removePredicate(rule: EditablePredicatedRule, index: number) {
	rule.predicates.splice(index, 1);
}
// Table-rule entries
function addEntry(rule: EditableTableRule) {
	rule.entries.push({
		key: crypto.randomUUID(),
		label: "",
		action: defaultAction(),
	});
}
function removeEntry(rule: EditableTableRule, key: string) {
	rule.entries = rule.entries.filter((e) => e.key !== key);
}

// Validation, split per card
const metaValid = computed(
	() => displayName.value.trim().length >= 3 && slug.value.length > 0,
);
const definitionValid = computed(() => {
	// Rules are optional (a policy may be labels + fallback only), but each rule
	// that exists must be named, and the policy has to do *something* — at least
	// one rule or a fallback.
	const rulesNamed = rules.value.every((r) => r.name.trim().length > 0);
	const doesSomething = rules.value.length > 0 || !!fallback.value;
	// Every `label in scope` condition must reference a scope this policy
	// defines — otherwise the rule would serialize an empty/dangling scope name.
	const scopeRefsResolve = rules.value.every((r) =>
		r.kind !== "predicated"
			? true
			: r.predicates.every(
					(p) =>
						p.kind !== "labelInScope" ||
						scopeNames.value.includes((p.values ?? "").trim()),
				),
	);
	// A scope with labels but no name is dropped on serialize (buildScopes), so
	// saving would silently discard the reviewer's labels. Require a name whenever
	// a scope carries labels; a freshly-added empty scope stays valid so it doesn't
	// block saving mid-edit.
	const scopesNamed = scopes.value.every(
		(s) => s.labels.length === 0 || s.name.trim().length > 0,
	);
	return rulesNamed && doesSomething && scopeRefsResolve && scopesNamed;
});
const isValid = computed(() => metaValid.value && definitionValid.value);

// Snapshots of the loaded policy, used to detect per-card changes (edit mode).
const metaBaseline = ref("");
const definitionBaseline = ref("");

function currentInput() {
	return {
		id: policyId.value,
		displayName: displayName.value,
		slug: slug.value,
		description: description.value,
		rules: rules.value,
		fallback: fallback.value,
		labels: labels.value,
		scopes: scopes.value,
	};
}
function metaSnapshot(): string {
	return JSON.stringify({
		displayName: displayName.value.trim(),
		description: description.value.trim(),
	});
}
function definitionSnapshot(): string {
	// Compare the editor state (not the built definition — that mints fresh
	// UUIDs each call, which would always look changed). Strip local-only keys.
	return JSON.stringify({
		rules: rules.value.map((r) =>
			r.kind === "table"
				? {
						kind: "table",
						name: r.name.trim(),
						description: r.description?.trim() ?? "",
						entries: r.entries.map((e) => ({
							label: e.label.trim(),
							action: e.action,
						})),
					}
				: {
						kind: "predicated",
						name: r.name.trim(),
						description: r.description?.trim() ?? "",
						predicates: r.predicates,
						action: r.action,
					},
		),
		fallback: fallback.value,
		labels: labels.value.map((l) => ({
			name: l.name.trim(),
			description: l.description?.trim() ?? "",
			tags: l.tags ?? "",
		})),
		scopes: scopes.value.map((s) => ({
			name: s.name.trim(),
			description: s.description?.trim() ?? "",
			labels: [...s.labels].sort(),
		})),
	});
}

const hasMetaChanges = computed(() => metaSnapshot() !== metaBaseline.value);
const hasDefinitionChanges = computed(
	() => definitionSnapshot() !== definitionBaseline.value,
);
const hasChanges = computed(
	() => hasMetaChanges.value || hasDefinitionChanges.value,
);

// Whether the pinned sheet footer can submit: valid, and (edit) actually
// changed. Emitted to the parent, which owns the footer button — a parent
// computed reading this through a template ref wouldn't track it reactively.
const canSubmit = computed(
	() => isValid.value && (!isEdit.value || hasChanges.value),
);
watch(canSubmit, (value) => emit("can-submit", value), { immediate: true });

// Populate from the policy prop (edit) or start fresh (create).
watch(
	() => props.policy,
	(policy) => {
		if (policy) {
			policyId.value = policy.definition.id;
			displayName.value = policy.displayName;
			slug.value = policy.slug;
			description.value = policy.description ?? "";
			// Reverse-map the stored definition into the editor model. Guard each
			// mapper so one unexpected shape can't blank the whole form.
			try {
				const editable = rulesFromDefinition(policy.definition);
				rules.value = editable.length > 0 ? editable : [];
			} catch {
				rules.value = [];
			}
			try {
				fallback.value = fallbackFromDefinition(policy.definition);
			} catch {
				fallback.value = null;
			}
			try {
				labels.value = labelsFromDefinition(policy.definition);
			} catch {
				labels.value = [];
			}
			try {
				scopes.value = scopesFromDefinition(policy.definition);
			} catch {
				scopes.value = [];
			}
		} else {
			policyId.value = crypto.randomUUID();
			displayName.value = "";
			slug.value = "";
			description.value = "";
			// Start with no rules — the user adds them explicitly (a policy may
			// also be labels + fallback only).
			rules.value = [];
			fallback.value = null;
			labels.value = [];
			scopes.value = [];
		}
		// Capture baselines after populating, so change tracking starts clean.
		nextTick(() => {
			metaBaseline.value = metaSnapshot();
			definitionBaseline.value = definitionSnapshot();
		});
	},
	{ immediate: true },
);

// Create: one submit sends the whole policy.
function submitCreate() {
	if (!isValid.value) return;
	emit("create", buildCreatePolicy(currentInput()));
}

// Edit: one save sends a partial UpdatePolicy containing only the cards that
// actually changed, then rebaselines so the button disables again.
function saveEdit() {
	if (!props.policy || !isValid.value || !hasChanges.value) return;
	const updates: UpdatePolicy = {};
	if (hasMetaChanges.value) {
		updates.displayName = displayName.value.trim();
		updates.description = description.value.trim() || undefined;
	}
	if (hasDefinitionChanges.value) {
		updates.definition = buildDefinition(currentInput());
	}
	emit("update", props.policy.slug, updates);
	metaBaseline.value = metaSnapshot();
	definitionBaseline.value = definitionSnapshot();
}

// The pinned footer lives in the parent sheet; it drives submit through these.
function submit() {
	if (isEdit.value) saveEdit();
	else submitCreate();
}
defineExpose({ submit, isValid, isEdit, hasChanges });

// Plain-English summary of a predicated rule, shown under each card.
function ruleSummary(rule: EditablePredicatedRule): string {
	const conds = rule.predicates
		.map((p) => {
			if (p.kind === "confidence")
				return t("policies.editor.summary.confidence", {
					min: p.min ?? 0,
				});
			const values = (p.values ?? "").trim() || "…";
			if (p.kind === "labelOneOf")
				return t("policies.editor.summary.label", { values });
			if (p.kind === "tagOneOf")
				return t("policies.editor.summary.tag", { values });
			if (p.kind === "labelInScope")
				return t("policies.editor.summary.scope", { values });
			return t("policies.editor.summary.coref", { values });
		})
		.join(t("policies.editor.summary.and"));

	const mods = activeModalities(rule.action);
	const action =
		mods.length === 0
			? t("policies.editor.summary.redact")
			: t("policies.editor.summary.redactModalities", {
					list: mods
						.map((m) => t(`policies.editor.modality.${m}`))
						.join(t("policies.editor.summary.and")),
				});

	return t("policies.editor.summary.line", { conditions: conds, action });
}
</script>

<template>
  <div class="space-y-8">
    <!-- DETAILS: identity (name / slug / description) -->
    <section class="space-y-4">
      <p
        class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {{ t("policies.editor.groups.details") }}
      </p>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="policy-name" required>{{
            t("policies.editor.nameLabel")
          }}</Label>
          <Input
            id="policy-name"
            v-model="displayName"
            :placeholder="t('policies.editor.namePlaceholder')"
          />
        </div>
        <div class="space-y-2">
          <Label for="policy-slug">{{ t("policies.editor.slugLabel") }}</Label>
          <Input
            id="policy-slug"
            :model-value="slug"
            readonly
            tabindex="-1"
            aria-readonly="true"
            class="font-mono text-sm text-muted-foreground"
            :placeholder="t('policies.editor.slugPlaceholder')"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("policies.editor.slugHint") }}
          </p>
        </div>
      </div>
      <div class="space-y-2">
        <Label for="policy-description">{{
          t("policies.editor.descriptionLabel")
        }}</Label>
        <Textarea
          id="policy-description"
          v-model="description"
          :placeholder="t('policies.editor.descriptionPlaceholder')"
          class="min-h-[72px]"
        />
      </div>
    </section>

    <!-- VOCABULARY: label scopes + custom labels -->
    <div class="space-y-4">
    <p
      class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {{ t("policies.editor.groups.vocabulary") }}
    </p>

    <!-- Custom labels -->
    <CollapsibleSection
      v-model:open="labelsOpen"
      :title="t('policies.editor.labels.label')"
      :hint="t('policies.editor.labels.hint')"
      :count="labels.length"
    >
      <template #action>
        <Button variant="outline" size="sm" @click="addLabel">
          <Plus :size="14" class="mr-1.5" />
          {{ t("policies.editor.labels.add") }}
        </Button>
      </template>
        <div
          v-for="label in labels"
          :key="label.key"
          class="overflow-hidden rounded-lg border border-border/60"
        >
          <!-- Header: the label name is its identity, plus delete. -->
          <div
            class="flex items-center gap-2 border-b border-border/60 bg-muted/30 pr-1.5 pl-1"
          >
            <TagIcon :size="14" class="ml-1.5 shrink-0 text-muted-foreground" />
            <Input
              v-model="label.name"
              :placeholder="t('policies.editor.labels.namePlaceholder')"
              class="h-9 flex-1 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              class="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              @click="removeLabel(label.key)"
            >
              <Trash2 :size="15" />
            </Button>
          </div>
          <div class="space-y-2.5 p-2.5">
            <Input
              v-model="label.description"
              :placeholder="t('policies.editor.labels.descriptionPlaceholder')"
              class="h-9"
            />
            <TagInput
              v-model="label.tags"
              :placeholder="t('policies.editor.labels.tagsPlaceholder')"
            />
          </div>
        </div>
    </CollapsibleSection>

    <!-- Label scopes -->
    <CollapsibleSection
      v-model:open="scopesOpen"
      :title="t('policies.editor.scopes.label')"
      :hint="t('policies.editor.scopes.hint')"
      :count="scopes.length"
    >
      <template #action>
        <Button variant="outline" size="sm" @click="addScope">
          <Plus :size="14" class="mr-1.5" />
          {{ t("policies.editor.scopes.add") }}
        </Button>
      </template>
        <div
          v-for="scope in scopes"
          :key="scope.key"
          class="overflow-hidden rounded-lg border border-border/60"
        >
          <!-- Scope header: the name is the scope's identity, plus its label
               count and delete. -->
          <div
            class="flex items-center gap-2 border-b border-border/60 bg-muted/30 pr-1.5 pl-1"
          >
            <Hash :size="14" class="ml-1.5 shrink-0 text-muted-foreground" />
            <Input
              v-model="scope.name"
              :placeholder="t('policies.editor.scopes.namePlaceholder')"
              :aria-invalid="
                scope.labels.length > 0 && !scope.name.trim() ? 'true' : undefined
              "
              class="h-9 flex-1 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0 aria-invalid:text-destructive aria-invalid:placeholder:text-destructive/70"
            />
            <span
              v-if="scope.labels.length"
              class="shrink-0 text-xs tabular-nums text-muted-foreground"
            >
              {{ t("policies.editor.scopes.count", { count: scope.labels.length }) }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              @click="removeScope(scope.key)"
            >
              <Trash2 :size="15" />
            </Button>
          </div>
          <div class="p-2.5">
            <LabelPicker
              v-model="scope.labels"
              :extra-labels="customLabelOptions"
              borderless
            />
          </div>
        </div>
    </CollapsibleSection>
    </div>

    <!-- BEHAVIOR: rules + fallback -->
    <div class="space-y-4">
    <p
      class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {{ t("policies.editor.groups.behavior") }}
    </p>

    <!-- Rules -->
    <CollapsibleSection
      v-model:open="rulesOpen"
      :title="t('policies.editor.rulesLabel')"
      :hint="t('policies.editor.rulesHint')"
      :count="rules.length"
    >
      <template #action>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Plus :size="14" class="mr-1.5" />
              {{ t("policies.editor.addRule") }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="addRule('predicated')">
              {{ t("policies.editor.addPredicatedRule") }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="addRule('table')">
              {{ t("policies.editor.addTableRule") }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
      <div
        v-for="(rule, ruleIndex) in rules"
        :key="rule.key"
        class="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
      >
        <!-- Rule header -->
        <div class="flex items-center gap-2.5 border-b border-border/60 px-4 py-3">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background tabular-nums"
          >
            {{ ruleIndex + 1 }}
          </span>
          <Input
            v-model="rule.name"
            :placeholder="t('policies.editor.ruleNamePlaceholder')"
            class="h-8 flex-1 border-transparent bg-transparent px-1 text-sm font-medium shadow-none focus-visible:border-border focus-visible:bg-background"
          />
          <div class="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground disabled:opacity-30"
              :disabled="ruleIndex === 0"
              :aria-label="t('policies.editor.moveUp')"
              @click="moveRule(ruleIndex, -1)"
            >
              <ChevronUp :size="15" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground disabled:opacity-30"
              :disabled="ruleIndex === rules.length - 1"
              :aria-label="t('policies.editor.moveDown')"
              @click="moveRule(ruleIndex, 1)"
            >
              <ChevronDown :size="15" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-destructive"
              :aria-label="t('policies.editor.removeRule')"
              @click="removeRule(rule.key)"
            >
              <Trash2 :size="15" />
            </Button>
          </div>
        </div>

        <!-- Predicated rule: When → Then -->
        <div
          v-if="rule.kind === 'predicated'"
          class="divide-y divide-border/60"
        >
          <!-- WHEN -->
          <div class="space-y-2.5 px-4 py-3.5">
            <div
              v-for="(pred, i) in rule.predicates"
              :key="i"
              class="flex items-center gap-2"
            >
              <Select v-model="pred.kind">
                <SelectTrigger class="h-9 w-[180px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="k in PREDICATE_KINDS" :key="k" :value="k">
                    {{ t(`policies.editor.predicate.${k}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-if="pred.kind === 'confidence'"
                v-model.number="pred.min"
                type="number"
                step="0.05"
                min="0"
                max="1"
                class="h-9 flex-1"
              />
              <Select
                v-else-if="pred.kind === 'labelInScope'"
                v-model="pred.values"
              >
                <SelectTrigger class="h-9 flex-1">
                  <SelectValue
                    :placeholder="t('policies.editor.valuesPlaceholder.labelInScope')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="name in scopeNames"
                    :key="name"
                    :value="name"
                    class="font-mono text-sm"
                  >
                    {{ name }}
                  </SelectItem>
                  <p
                    v-if="!scopeNames.length"
                    class="px-2 py-1.5 text-sm text-muted-foreground"
                  >
                    {{ t("policies.editor.predicate.scopeEmpty") }}
                  </p>
                </SelectContent>
              </Select>
              <TagInput
                v-else-if="pred.kind === 'tagOneOf'"
                v-model="pred.values"
                :placeholder="t('policies.editor.valuesPlaceholder.tagOneOf')"
                class="flex-1"
              />
              <Input
                v-else
                v-model="pred.values"
                :placeholder="t(`policies.editor.valuesPlaceholder.${pred.kind}`)"
                class="h-9 flex-1 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                class="size-9 shrink-0 text-muted-foreground"
                :disabled="rule.predicates.length <= 1"
                @click="removePredicate(rule, i)"
              >
                <X :size="15" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              @click="addPredicate(rule)"
            >
              <Plus :size="13" class="mr-1" />
              {{ t("policies.editor.addCondition") }}
            </Button>
          </div>

          <!-- THEN: separated from the conditions by a thin divider -->
          <div class="space-y-2.5 px-4 py-3.5">
            <span class="block h-px bg-border/50" />
            <ModalityActionEditor :action="rule.action" />
          </div>

          <!-- Summary -->
          <div class="flex items-start gap-2 bg-muted/40 px-4 py-2.5">
            <Sparkles :size="13" class="mt-0.5 shrink-0 text-muted-foreground" />
            <p class="text-xs leading-relaxed text-muted-foreground">
              {{ ruleSummary(rule) }}
            </p>
          </div>
        </div>

        <!-- Table rule: per-label action lookup -->
        <div v-else class="space-y-2.5 px-4 py-3.5">
          <!-- Each entry: a label, its per-modality actions indented on a rail
               below it (the modality blocks are borderless — the rail groups
               them under their label). -->
          <div v-for="entry in rule.entries" :key="entry.key">
            <div class="flex items-center gap-2">
              <TagIcon :size="14" class="shrink-0 text-muted-foreground" />
              <div class="min-w-0 flex-1">
                <LabelSelect
                  v-model="entry.label"
                  :extra-labels="customLabelOptions"
                  :placeholder="t('policies.editor.table.labelPlaceholder')"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                :aria-label="t('policies.editor.table.removeEntry')"
                @click="removeEntry(rule, entry.key)"
              >
                <Trash2 :size="15" />
              </Button>
            </div>
            <div class="ml-[7px] mt-1.5 border-l-2 border-border/60 pl-4">
              <ModalityActionEditor :action="entry.action" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="font-normal"
            @click="addEntry(rule)"
          >
            <Plus :size="14" class="mr-1.5" />
            {{ t("policies.editor.table.addEntry") }}
          </Button>
        </div>
      </div>
    </CollapsibleSection>

    <!-- Fallback -->
    <CollapsibleSection
      v-model:open="fallbackOpen"
      :title="t('policies.editor.fallback.label')"
      :hint="t('policies.editor.fallback.hint')"
      :count="fallbackModalityCount"
    >
      <template #action>
        <DropdownMenu v-if="fallbackModalitiesAvailable.length">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Plus :size="14" class="mr-1.5" />
              {{ t("policies.editor.fallback.add") }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="m in fallbackModalitiesAvailable"
              :key="m"
              @click="addFallbackModality(m)"
            >
              {{ t(`policies.editor.modality.${m}`) }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
      <ModalityActionEditor
        v-if="fallback"
        :action="fallback"
        bordered
        hide-add-modality
      />
      <p v-else class="text-sm text-muted-foreground">
        {{ t("policies.editor.fallback.empty") }}
      </p>
    </CollapsibleSection>
    </div>
  </div>
</template>
