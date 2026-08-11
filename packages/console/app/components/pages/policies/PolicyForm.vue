<script setup lang="ts">
import type { CreatePolicy, Policy, UpdatePolicy } from "@nvisy/sdk/datatypes";
import type {
	EditableRule,
	EditablePredicatedRule,
	EditableTableRule,
	EditableLabelEntry,
	EditableAction,
	EditableLabel,
	EditableGroup,
	PredicateKind,
	Modality,
	TextRedactionKind,
} from "#console/utils/policies";
import {
	buildCreatePolicy,
	buildDefinition,
	rulesFromDefinition,
	fallbackFromDefinition,
	labelsFromDefinition,
	groupsFromDefinition,
} from "#console/utils/policies";
import { slugify } from "#console/utils/naming";
import { Plus, Trash2, X, Sparkles, ChevronUp, ChevronDown } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Textarea } from "#console/components/ui/textarea";
import { Switch } from "#console/components/ui/switch";
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
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";
import ModalityActionEditor from "./ModalityActionEditor.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{ policy?: Policy | null; isLoading?: boolean }>(),
	{ policy: null, isLoading: false },
);

const emit = defineEmits<{
	create: [policy: CreatePolicy];
	update: [slug: string, updates: UpdatePolicy];
}>();

const isEdit = computed(() => !!props.policy);

const PREDICATE_KINDS: PredicateKind[] = [
	"confidence",
	"labelOneOf",
	"tagOneOf",
	"labelInGroup",
	"coRef",
];
const MODALITIES: Modality[] = ["text", "image", "audio", "tabular"];
// Text vocabulary for the table-rule entry operator; the full per-modality
// operator UI lives in ModalityActionEditor.
const TEXT_KINDS: TextRedactionKind[] = [
	"replace",
	"mask",
	"hash",
	"erase",
	"keep",
];

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
const groups = ref<EditableGroup[]>([]);
const policyId = ref("");

// Collapsible sections start collapsed; adding an item auto-expands them.
const rulesOpen = ref(false);
const labelsOpen = ref(false);
const groupsOpen = ref(false);

// Fallback (a ModalityRedactions, like a rule action)
function toggleFallback(enabled: boolean) {
	fallback.value = enabled
		? { modalities: { text: { textKind: "replace", template: "[{label}]" } } }
		: null;
}

// Labels catalog
function addLabel() {
	labelsOpen.value = true; // reveal the section so the new row is visible
	labels.value = [
		...labels.value,
		{ key: crypto.randomUUID(), name: "", tags: "" },
	];
}
function removeLabel(key: string) {
	labels.value = labels.value.filter((l) => l.key !== key);
}

// Label groups
function addGroup() {
	groupsOpen.value = true;
	groups.value = [
		...groups.value,
		{ key: crypto.randomUUID(), name: "", labels: "" },
	];
}
function removeGroup(key: string) {
	groups.value = groups.value.filter((g) => g.key !== key);
}

// On create the slug is immutable and always derived from the name; on edit it
// is fixed to the existing policy's slug and never changes.
watch(displayName, (value) => {
	if (!isEdit.value) slug.value = slugify(value);
});

function defaultAction(): EditableAction {
	return {
		modalities: { text: { textKind: "replace", template: "[{label}]" } },
	};
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
	rule.predicates.push({ kind: "labelOneOf", values: "" });
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
	return rulesNamed && doesSomething;
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
		groups: groups.value,
		// Preserve definition fields the editor doesn't model (edit only).
		original: props.policy?.definition,
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
		groups: groups.value.map((g) => ({
			name: g.name.trim(),
			description: g.description?.trim() ?? "",
			labels: g.labels ?? "",
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
				groups.value = groupsFromDefinition(policy.definition);
			} catch {
				groups.value = [];
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
			groups.value = [];
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
			if (p.kind === "labelInGroup")
				return t("policies.editor.summary.group", { values });
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
  <div class="space-y-6">
    <!-- Identity (name / slug / description) -->
    <section class="space-y-4">
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
        </div>
      </div>
      <p class="-mt-3 text-xs text-muted-foreground">
        {{ t("policies.editor.slugHint") }}
      </p>
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

    <!-- Definition (labels / rules / fallback) -->
    <div class="space-y-8">
    <!-- Labels catalog -->
    <Collapsible v-model:open="labelsOpen" as="section" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="flex flex-1 items-center gap-2 text-left"
          >
            <ChevronDown
              :size="16"
              class="shrink-0 text-muted-foreground transition-transform"
              :class="labelsOpen ? '' : '-rotate-90'"
            />
            <div>
              <h2 class="text-sm font-medium">
                {{ t("policies.editor.labels.label") }}
                <span class="text-muted-foreground">({{ labels.length }})</span>
              </h2>
              <p class="text-xs text-muted-foreground">
                {{ t("policies.editor.labels.hint") }}
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
        <Button variant="outline" size="sm" @click="addLabel">
          <Plus :size="14" class="mr-1.5" />
          {{ t("policies.editor.labels.add") }}
        </Button>
      </div>
      <CollapsibleContent class="space-y-3">
      <div
        v-for="label in labels"
        :key="label.key"
        class="space-y-2.5 rounded-lg border border-border/60 p-3"
      >
        <div class="flex items-center gap-2">
          <Input
            v-model="label.name"
            :placeholder="t('policies.editor.labels.namePlaceholder')"
            class="h-9 flex-1 font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            @click="removeLabel(label.key)"
          >
            <Trash2 :size="15" />
          </Button>
        </div>
        <Input
          v-model="label.description"
          :placeholder="t('policies.editor.labels.descriptionPlaceholder')"
          class="h-9"
        />
        <Input
          v-model="label.tags"
          :placeholder="t('policies.editor.labels.tagsPlaceholder')"
          class="h-9 font-mono text-sm"
        />
      </div>
      </CollapsibleContent>
    </Collapsible>

    <!-- Label groups -->
    <Collapsible v-model:open="groupsOpen" as="section" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="flex flex-1 items-center gap-2 text-left"
          >
            <ChevronDown
              :size="16"
              class="shrink-0 text-muted-foreground transition-transform"
              :class="groupsOpen ? '' : '-rotate-90'"
            />
            <div>
              <h2 class="text-sm font-medium">
                {{ t("policies.editor.groups.label") }}
                <span class="text-muted-foreground">({{ groups.length }})</span>
              </h2>
              <p class="text-xs text-muted-foreground">
                {{ t("policies.editor.groups.hint") }}
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
        <Button variant="outline" size="sm" @click="addGroup">
          <Plus :size="14" class="mr-1.5" />
          {{ t("policies.editor.groups.add") }}
        </Button>
      </div>
      <CollapsibleContent class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.key"
          class="space-y-2.5 rounded-lg border border-border/60 p-3"
        >
          <div class="flex items-center gap-2">
            <Input
              v-model="group.name"
              :placeholder="t('policies.editor.groups.namePlaceholder')"
              class="h-9 flex-1 font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
              @click="removeGroup(group.key)"
            >
              <Trash2 :size="15" />
            </Button>
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs text-muted-foreground">
              {{ t("policies.editor.groups.labelsLabel") }}
            </Label>
            <Textarea
              v-model="group.labels"
              :placeholder="t('policies.editor.groups.labelsPlaceholder')"
              class="min-h-[60px] font-mono text-sm"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <!-- Rules -->
    <Collapsible v-model:open="rulesOpen" as="section" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="flex flex-1 items-center gap-2 text-left"
          >
            <ChevronDown
              :size="16"
              class="shrink-0 text-muted-foreground transition-transform"
              :class="rulesOpen ? '' : '-rotate-90'"
            />
            <div>
              <h2 class="text-sm font-medium">
                {{ t("policies.editor.rulesLabel") }}
                <span class="text-muted-foreground">({{ rules.length }})</span>
              </h2>
              <p class="text-xs text-muted-foreground">
                {{ t("policies.editor.rulesHint") }}
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
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
      </div>

      <CollapsibleContent class="space-y-3">
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
            <div class="flex items-center gap-2">
              <span
                class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {{ t("policies.editor.when") }}
              </span>
              <span class="h-px flex-1 bg-border/50" />
            </div>
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

          <!-- THEN -->
          <div class="space-y-2.5 px-4 py-3.5">
            <div class="flex items-center gap-2">
              <span
                class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {{ t("policies.editor.then") }}
              </span>
              <span class="h-px flex-1 bg-border/50" />
            </div>

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
          <div class="flex items-center gap-2">
            <span
              class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              {{ t("policies.editor.table.label") }}
            </span>
            <span class="h-px flex-1 bg-border/50" />
          </div>
          <div
            v-for="entry in rule.entries"
            :key="entry.key"
            class="flex items-center gap-2"
          >
            <Input
              v-model="entry.label"
              :placeholder="t('policies.editor.table.labelPlaceholder')"
              class="h-9 w-[200px] shrink-0 font-mono text-sm"
            />
            <span class="shrink-0 text-xs text-muted-foreground">→</span>
            <div class="flex flex-1 items-center gap-2">
              <Select v-model="entry.action.modalities.text!.textKind">
                <SelectTrigger class="h-9 w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="k in TEXT_KINDS" :key="k" :value="k">
                    {{ t(`policies.editor.textKind.${k}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-if="entry.action.modalities.text?.textKind === 'replace'"
                v-model="entry.action.modalities.text.template"
                class="h-9 flex-1 font-mono text-sm"
                placeholder="[{label}]"
              />
              <Input
                v-else-if="entry.action.modalities.text?.textKind === 'mask'"
                v-model="entry.action.modalities.text.maskChar"
                class="h-9 w-16 text-center font-mono"
                maxlength="1"
                placeholder="*"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
              :aria-label="t('policies.editor.table.removeEntry')"
              @click="removeEntry(rule, entry.key)"
            >
              <Trash2 :size="15" />
            </Button>
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

      </CollapsibleContent>
    </Collapsible>

    <!-- Fallback -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium">
            {{ t("policies.editor.fallback.label") }}
          </h2>
          <p class="text-xs text-muted-foreground">
            {{ t("policies.editor.fallback.hint") }}
          </p>
        </div>
        <Switch
          :model-value="!!fallback"
          @update:model-value="toggleFallback"
        />
      </div>
      <div
        v-if="fallback"
        class="rounded-lg border border-border/60 p-3"
      >
        <ModalityActionEditor :action="fallback" />
      </div>
    </section>
    </div>
  </div>
</template>
