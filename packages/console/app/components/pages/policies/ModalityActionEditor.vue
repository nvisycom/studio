<script setup lang="ts">
import type {
	EditableAction,
	EditableOperator,
	Modality,
	TextRedactionKind,
	ImageRedactionKind,
	AudioRedactionKind,
	TabularRedactionKind,
} from "#console/utils/policies";
import { Plus, X } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Button } from "#console/components/ui/button";
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

const { t } = useI18n();

// The action being edited (a rule action or the policy fallback). Mutated in
// place — both are plain reactive `EditableAction` objects.
const props = defineProps<{ action: EditableAction }>();

const MODALITIES: Modality[] = ["text", "image", "audio", "tabular"];
const TEXT_KINDS: TextRedactionKind[] = [
	"replace",
	"mask",
	"hash",
	"erase",
	"keep",
];
const IMAGE_KINDS: ImageRedactionKind[] = ["blur", "pixelate", "erase", "keep"];
const AUDIO_KINDS: AudioRedactionKind[] = ["silence", "beep", "erase", "keep"];
const TABULAR_KINDS: TabularRedactionKind[] = [
	"replace",
	"mask",
	"hash",
	"erase",
	"keep",
];

function defaultOperator(modality: Modality): EditableOperator {
	switch (modality) {
		case "image":
			return { imageKind: "blur", sigma: 8 };
		case "audio":
			return { audioKind: "silence" };
		case "tabular":
			return { tabularKind: "replace", template: "[{label}]" };
		default:
			return { textKind: "replace", template: "[{label}]" };
	}
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
        class="flex items-center gap-2"
      >
        <span
          class="w-16 shrink-0 text-xs font-medium text-muted-foreground"
        >
          {{ t(`policies.editor.modality.${m}`) }}
        </span>

        <!-- Text / Tabular share the text vocabulary -->
        <template v-if="m === 'text' || m === 'tabular'">
          <Select v-if="m === 'text'" v-model="action.modalities![m]!.textKind">
            <SelectTrigger class="h-9 w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in TEXT_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.textKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-else v-model="action.modalities![m]!.tabularKind">
            <SelectTrigger class="h-9 w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in TABULAR_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.textKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            v-if="
              (m === 'text'
                ? action.modalities![m]!.textKind
                : action.modalities![m]!.tabularKind) === 'replace'
            "
            v-model="action.modalities![m]!.template"
            class="h-9 flex-1 font-mono text-sm"
            placeholder="[{label}]"
          />
          <Input
            v-else-if="
              (m === 'text'
                ? action.modalities![m]!.textKind
                : action.modalities![m]!.tabularKind) === 'mask'
            "
            v-model="action.modalities![m]!.maskChar"
            class="h-9 w-16 text-center font-mono"
            maxlength="1"
            placeholder="*"
          />
          <div v-else class="flex-1" />
        </template>

        <!-- Image -->
        <template v-else-if="m === 'image'">
          <Select v-model="action.modalities![m]!.imageKind">
            <SelectTrigger class="h-9 w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in IMAGE_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.imageKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
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
          <div v-else class="flex-1" />
        </template>

        <!-- Audio -->
        <template v-else-if="m === 'audio'">
          <Select v-model="action.modalities![m]!.audioKind">
            <SelectTrigger class="h-9 w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="k in AUDIO_KINDS" :key="k" :value="k">
                {{ t(`policies.editor.audioKind.${k}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            v-if="action.modalities![m]!.audioKind === 'beep'"
            v-model.number="action.modalities![m]!.hz"
            type="number"
            min="1"
            class="h-9 flex-1"
            :placeholder="t('policies.editor.hz')"
          />
          <div v-else class="flex-1" />
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

    <DropdownMenu v-if="availableModalities().length">
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
