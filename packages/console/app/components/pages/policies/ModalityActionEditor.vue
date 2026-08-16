<script setup lang="ts">
import type {
	EditableAction,
	EditableOperator,
	Modality,
	TextRedactionKind,
	ImageRedactionKind,
	AudioRedactionKind,
	HashAlgorithm,
} from "#console/utils/policies";
import { ChevronRight, Plus, X } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";

const { t } = useI18n();

// The action being edited (a rule action or the policy fallback). Mutated in
// place — both are plain reactive `EditableAction` objects.
const props = withDefaults(
	defineProps<{
		action: EditableAction;
		/**
		 * Frame each modality block with a border. On when the editor stands
		 * alone (the fallback); off inside a rule/table entry, where the rail and
		 * surrounding card already provide the structure.
		 */
		bordered?: boolean;
		/**
		 * Hide the built-in "Add modality" control — used by the fallback, where a
		 * section-level "Add fallback" menu adds modalities instead.
		 */
		hideAddModality?: boolean;
	}>(),
	{ bordered: false, hideAddModality: false },
);

const MODALITIES: Modality[] = ["text", "image", "audio", "tabular"];
// The text vocabulary (shared by tabular cells), split so the picker leads with
// the everyday operators and tucks the rest behind "More". Kinds carrying no
// params render no fields; the ones with params reveal only what they need.
const COMMON_TEXT_KINDS: TextRedactionKind[] = [
	"replace",
	"mask",
	"erase",
	"keep",
];
const ADVANCED_TEXT_KINDS: TextRedactionKind[] = [
	"truncate",
	"hash",
	"hmac_hash",
	"pseudonymize",
	"fake",
	"encrypt",
	"generalize_date",
	"clamp",
];
const IMAGE_KINDS: ImageRedactionKind[] = ["blur", "pixelate", "erase", "keep"];
const AUDIO_KINDS: AudioRedactionKind[] = ["silence", "beep", "erase", "keep"];
const HASH_ALGORITHMS: HashAlgorithm[] = ["sha256", "sha512"];

// Kinds that carry no editable params, so the operator select stretches to fill
// the row with no param field beside it.
const PARAMLESS_TEXT_KINDS = new Set<TextRedactionKind>([
	"erase",
	"keep",
	"pseudonymize",
	"encrypt",
	"fake",
	"generalize_date",
	"clamp",
]);

function defaultOperator(modality: Modality): EditableOperator {
	// New operators default to erase across every modality.
	switch (modality) {
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

// The text/tabular kind of an operator, whichever modality owns it.
function textyKind(op: EditableOperator, m: Modality): TextRedactionKind {
	return (m === "tabular" ? op.tabularKind : op.textKind) ?? "replace";
}
function setTextyKind(
	op: EditableOperator,
	m: Modality,
	kind: TextRedactionKind,
) {
	if (m === "tabular") op.tabularKind = kind;
	else op.textKind = kind;
}

// Whether a text/tabular select has expanded the full advanced operator list.
// Collapsed by default; the common operators plus the current one (if advanced)
// stay visible, with the rest behind "More operators".
const showAdvanced = reactive<Partial<Record<Modality, boolean>>>({});

// The operators shown above "More operators": the common four, plus the current
// selection when it's an advanced kind (so the choice is always visible without
// expanding the whole list).
function leadKinds(m: Modality): TextRedactionKind[] {
	const current = textyKind(props.action.modalities![m]!, m);
	return ADVANCED_TEXT_KINDS.includes(current)
		? [...COMMON_TEXT_KINDS, current]
		: COMMON_TEXT_KINDS;
}
// The advanced operators still hidden under "More" (excludes any pinned above).
function moreKinds(m: Modality): TextRedactionKind[] {
	const current = textyKind(props.action.modalities![m]!, m);
	return ADVANCED_TEXT_KINDS.filter((k) => k !== current);
}

function activeModalities(): Modality[] {
	return MODALITIES.filter((m) => props.action.modalities?.[m]);
}
function availableModalities(): Modality[] {
	return MODALITIES.filter((m) => !props.action.modalities?.[m]);
}
function addModality(modality: Modality) {
	if (!props.action.modalities) props.action.modalities = {};
	props.action.modalities[modality] = defaultOperator(modality);
}
function removeModality(modality: Modality) {
	if (props.action.modalities) delete props.action.modalities[modality];
}
</script>

<template>
  <div class="space-y-2.5">
    <div class="space-y-2">
      <div
        v-for="m in activeModalities()"
        :key="m"
        class="space-y-1.5"
        :class="bordered ? 'rounded-md border border-border/60 p-2.5' : ''"
      >
        <!-- Modality name -->
        <p class="text-xs font-medium text-muted-foreground">
          {{ t(`policies.editor.modality.${m}`) }}
        </p>

        <!-- Operator select + its params, inline, then remove -->
        <div class="flex items-center gap-2">
          <!-- Text / Tabular share the text vocabulary -->
          <Select
            v-if="m === 'text' || m === 'tabular'"
            :model-value="textyKind(action.modalities![m]!, m)"
            @update:model-value="
              setTextyKind(action.modalities![m]!, m, $event as TextRedactionKind)
            "
            @update:open="(open: boolean) => { if (!open) showAdvanced[m] = false; }"
          >
            <SelectTrigger
              class="h-9 shrink-0"
              :class="
                PARAMLESS_TEXT_KINDS.has(textyKind(action.modalities![m]!, m))
                  ? 'flex-1'
                  : 'w-40'
              "
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in leadKinds(m)" :key="k" :value="k">
                {{ t(`policies.editor.textKind.${k}`) }}
              </SelectItem>
              <SelectSeparator />
              <template v-if="showAdvanced[m]">
                <SelectItem v-for="k in moreKinds(m)" :key="k" :value="k">
                  {{ t(`policies.editor.textKind.${k}`) }}
                </SelectItem>
              </template>
              <button
                v-else
                type="button"
                class="flex w-full cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground"
                @click.stop.prevent="showAdvanced[m] = true"
              >
                {{ t("policies.editor.moreOperators") }}
                <ChevronRight :size="14" />
              </button>
            </SelectContent>
          </Select>

          <Select
            v-else-if="m === 'image'"
            v-model="action.modalities![m]!.imageKind"
          >
            <SelectTrigger
              class="h-9 shrink-0"
              :class="
                action.modalities![m]!.imageKind === 'blur' ||
                action.modalities![m]!.imageKind === 'pixelate'
                  ? 'w-40'
                  : 'flex-1'
              "
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in IMAGE_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.imageKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            v-else-if="m === 'audio'"
            v-model="action.modalities![m]!.audioKind"
          >
            <SelectTrigger
              class="h-9 shrink-0"
              :class="action.modalities![m]!.audioKind === 'beep' ? 'w-40' : 'flex-1'"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in AUDIO_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.audioKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Text / tabular params, inline -->
          <template v-if="m === 'text' || m === 'tabular'">
            <!-- replace: template -->
            <Input
              v-if="textyKind(action.modalities![m]!, m) === 'replace'"
              v-model="action.modalities![m]!.template"
              class="h-9 flex-1 font-mono text-sm"
              placeholder="[{label}]"
            />

            <!-- mask: char + keep start/end -->
            <template
              v-else-if="textyKind(action.modalities![m]!, m) === 'mask'"
            >
              <Input
                v-model="action.modalities![m]!.maskChar"
                class="h-9 w-14 text-center font-mono"
                maxlength="1"
                placeholder="*"
              />
              <Input
                v-model.number="action.modalities![m]!.keepPrefix"
                type="number"
                min="0"
                class="h-9 flex-1"
                :placeholder="t('policies.editor.param.keepPrefix')"
              />
              <Input
                v-model.number="action.modalities![m]!.keepSuffix"
                type="number"
                min="0"
                class="h-9 flex-1"
                :placeholder="t('policies.editor.param.keepSuffix')"
              />
            </template>

            <!-- truncate: keep start/end -->
            <template
              v-else-if="textyKind(action.modalities![m]!, m) === 'truncate'"
            >
              <Input
                v-model.number="action.modalities![m]!.keepPrefix"
                type="number"
                min="0"
                class="h-9 flex-1"
                :placeholder="t('policies.editor.param.keepPrefix')"
              />
              <Input
                v-model.number="action.modalities![m]!.keepSuffix"
                type="number"
                min="0"
                class="h-9 flex-1"
                :placeholder="t('policies.editor.param.keepSuffix')"
              />
            </template>

            <!-- hash / hmac_hash: algorithm (+ salt for hash) -->
            <template
              v-else-if="
                textyKind(action.modalities![m]!, m) === 'hash' ||
                textyKind(action.modalities![m]!, m) === 'hmac_hash'
              "
            >
              <Select v-model="action.modalities![m]!.algorithm">
                <SelectTrigger
                  class="h-9"
                  :class="
                    textyKind(action.modalities![m]!, m) === 'hash'
                      ? 'w-32'
                      : 'flex-1'
                  "
                >
                  <SelectValue
                    :placeholder="t('policies.editor.param.sha256')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="a in HASH_ALGORITHMS" :key="a" :value="a">
                    {{ t(`policies.editor.param.${a}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-if="textyKind(action.modalities![m]!, m) === 'hash'"
                v-model="action.modalities![m]!.salt"
                class="h-9 flex-1 font-mono text-sm"
                :placeholder="t('policies.editor.param.saltPlaceholder')"
              />
            </template>
          </template>

          <!-- Image params, inline -->
          <template v-else-if="m === 'image'">
            <Input
              v-if="action.modalities![m]!.imageKind === 'blur'"
              v-model.number="action.modalities![m]!.sigma"
              type="number"
              min="1"
              class="h-9 flex-1"
              :placeholder="t('policies.editor.sigma')"
            />
            <Input
              v-else-if="action.modalities![m]!.imageKind === 'pixelate'"
              v-model.number="action.modalities![m]!.blockSize"
              type="number"
              min="2"
              class="h-9 flex-1"
              :placeholder="t('policies.editor.blockSize')"
            />
          </template>

          <!-- Audio params, inline -->
          <template v-else-if="m === 'audio'">
            <Input
              v-if="action.modalities![m]!.audioKind === 'beep'"
              v-model.number="action.modalities![m]!.hz"
              type="number"
              min="1"
              class="h-9 flex-1"
              :placeholder="t('policies.editor.hz')"
            />
          </template>

          <Button
            variant="ghost"
            size="icon"
            class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            :aria-label="t('policies.editor.removeModality')"
            @click="removeModality(m)"
          >
            <X :size="15" />
          </Button>
        </div>
      </div>
    </div>

    <DropdownMenu v-if="!hideAddModality && availableModalities().length">
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus :size="13" class="mr-1" />
          {{ t("policies.editor.addModality") }}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          v-for="m in availableModalities()"
          :key="m"
          @click="addModality(m)"
        >
          {{ t(`policies.editor.modality.${m}`) }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
