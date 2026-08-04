<script setup lang="ts">
import type { CreatePolicy, Policy, UpdatePolicy } from "@nvisy/sdk/datatypes";
import type {
	EditableRule,
	PredicateKind,
	ActionKind,
	TextRedactionKind,
} from "#console/utils/policies";
import {
	buildCreatePolicy,
	buildUpdatePolicy,
	rulesFromDefinition,
} from "#console/utils/policies";
import { Loader2, Plus, Trash2 } from "@lucide/vue";
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

const { t } = useI18n();

const props = withDefaults(
	defineProps<{ policy?: Policy | null; isLoading?: boolean }>(),
	{ policy: null, isLoading: false },
);

const emit = defineEmits<{
	create: [policy: CreatePolicy];
	update: [slug: string, updates: UpdatePolicy];
	cancel: [];
}>();

const isEdit = computed(() => !!props.policy);

const PREDICATE_KINDS: PredicateKind[] = [
	"confidence",
	"labelOneOf",
	"tagOneOf",
];
const ACTION_KINDS: ActionKind[] = ["redact", "suppress", "audit"];
const TEXT_KINDS: TextRedactionKind[] = [
	"replace",
	"mask",
	"hash",
	"erase",
	"keep",
];

const displayName = ref("");
const slug = ref("");
const slugEdited = ref(false);
const description = ref("");
const rules = ref<EditableRule[]>([]);
const policyId = ref("");

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

watch(displayName, (value) => {
	if (!slugEdited.value) slug.value = slugify(value);
});

function onSlugInput() {
	slugEdited.value = true;
	slug.value = slugify(slug.value);
}

function newRule(): EditableRule {
	return {
		key: crypto.randomUUID(),
		name: "",
		predicates: [{ kind: "confidence", min: 0.5 }],
		action: { kind: "redact", textKind: "replace", template: "[{label}]" },
	};
}

function addRule() {
	rules.value = [...rules.value, newRule()];
}
function removeRule(key: string) {
	rules.value = rules.value.filter((r) => r.key !== key);
}
function addPredicate(rule: EditableRule) {
	rule.predicates.push({ kind: "labelOneOf", values: "" });
}
function removePredicate(rule: EditableRule, index: number) {
	rule.predicates.splice(index, 1);
}

const isValid = computed(
	() =>
		displayName.value.trim().length >= 3 &&
		slug.value.length > 0 &&
		rules.value.length > 0 &&
		rules.value.every((r) => r.name.trim().length > 0),
);

// Populate from the policy prop (edit) or start fresh (create).
watch(
	() => props.policy,
	(policy) => {
		if (policy) {
			policyId.value = policy.definition.id;
			displayName.value = policy.displayName;
			slug.value = policy.slug;
			slugEdited.value = true;
			description.value = policy.description ?? "";
			const editable = rulesFromDefinition(policy.definition);
			rules.value = editable.length > 0 ? editable : [newRule()];
		} else {
			policyId.value = crypto.randomUUID();
			displayName.value = "";
			slug.value = "";
			slugEdited.value = false;
			description.value = "";
			rules.value = [newRule()];
		}
	},
	{ immediate: true },
);

function submit() {
	if (!isValid.value) return;
	const input = {
		id: policyId.value,
		displayName: displayName.value,
		slug: slug.value,
		description: description.value,
		rules: rules.value,
	};
	if (props.policy) {
		emit("update", props.policy.slug, buildUpdatePolicy(input));
	} else {
		emit("create", buildCreatePolicy(input));
	}
}
</script>

<template>
  <div class="space-y-8">
    <!-- Metadata -->
    <section class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label>{{ t("policies.editor.nameLabel") }}</Label>
          <Input
            v-model="displayName"
            :placeholder="t('policies.editor.namePlaceholder')"
          />
        </div>
        <div class="space-y-2">
          <Label>{{ t("policies.editor.slugLabel") }}</Label>
          <Input
            v-model="slug"
            autocapitalize="none"
            class="font-mono text-sm"
            :disabled="isEdit"
            @input="onSlugInput"
          />
        </div>
      </div>
      <div class="space-y-2">
        <Label>{{ t("policies.editor.descriptionLabel") }}</Label>
        <Textarea
          v-model="description"
          :placeholder="t('policies.editor.descriptionPlaceholder')"
          class="min-h-[60px]"
        />
      </div>
    </section>

    <!-- Rules -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium">
            {{ t("policies.editor.rulesLabel") }}
          </h2>
          <p class="text-xs text-muted-foreground">
            {{ t("policies.editor.rulesHint") }}
          </p>
        </div>
        <Button variant="outline" size="sm" @click="addRule">
          <Plus :size="14" class="mr-1.5" />
          {{ t("policies.editor.addRule") }}
        </Button>
      </div>

      <div
        v-for="(rule, ruleIndex) in rules"
        :key="rule.key"
        class="space-y-4 rounded-lg border border-border/60 p-4"
      >
        <div class="flex items-center gap-2">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground"
          >
            {{ ruleIndex + 1 }}
          </span>
          <Input
            v-model="rule.name"
            :placeholder="t('policies.editor.ruleNamePlaceholder')"
            class="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            class="size-8 shrink-0"
            @click="removeRule(rule.key)"
          >
            <Trash2 :size="15" class="text-muted-foreground" />
          </Button>
        </div>

        <!-- Conditions -->
        <div class="space-y-2 pl-8">
          <p
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ t("policies.editor.conditions") }}
          </p>
          <div
            v-for="(pred, i) in rule.predicates"
            :key="i"
            class="flex items-center gap-2"
          >
            <Select v-model="pred.kind">
              <SelectTrigger class="w-[170px]">
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
              class="flex-1"
            />
            <Input
              v-else
              v-model="pred.values"
              :placeholder="t('policies.editor.valuesPlaceholder')"
              class="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              class="size-8 shrink-0"
              :disabled="rule.predicates.length <= 1"
              @click="removePredicate(rule, i)"
            >
              <Trash2 :size="14" class="text-muted-foreground" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 text-xs text-muted-foreground"
            @click="addPredicate(rule)"
          >
            <Plus :size="13" class="mr-1" />
            {{ t("policies.editor.addCondition") }}
          </Button>
        </div>

        <!-- Action -->
        <div class="space-y-2 pl-8">
          <p
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ t("policies.editor.action") }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Select v-model="rule.action.kind">
              <SelectTrigger class="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="k in ACTION_KINDS" :key="k" :value="k">
                  {{ t(`policies.editor.actionKind.${k}`) }}
                </SelectItem>
              </SelectContent>
            </Select>

            <template v-if="rule.action.kind === 'redact'">
              <Select v-model="rule.action.textKind">
                <SelectTrigger class="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="k in TEXT_KINDS" :key="k" :value="k">
                    {{ t(`policies.editor.textKind.${k}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-if="rule.action.textKind === 'replace'"
                v-model="rule.action.template"
                class="flex-1 font-mono text-sm"
                placeholder="[{label}]"
              />
              <Input
                v-else-if="rule.action.textKind === 'mask'"
                v-model="rule.action.maskChar"
                class="w-16 text-center font-mono"
                maxlength="1"
                placeholder="*"
              />
            </template>

            <Input
              v-else
              v-model="rule.action.note"
              :placeholder="t('policies.editor.notePlaceholder')"
              class="flex-1"
            />
          </div>
        </div>
      </div>

      <p
        v-if="rules.length === 0"
        class="rounded-lg border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground"
      >
        {{ t("policies.editor.noRules") }}
      </p>
    </section>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-2 border-t border-border/60 pt-6">
      <Button variant="outline" @click="emit('cancel')">
        {{ t("policies.editor.cancel") }}
      </Button>
      <Button :disabled="!isValid || isLoading" @click="submit">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isEdit ? t("policies.editor.save") : t("policies.editor.submit") }}
      </Button>
    </div>
  </div>
</template>
