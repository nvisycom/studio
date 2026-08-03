<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import type { CreatePipeline } from "@nvisy/sdk/datatypes";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Switch } from "#console/components/ui/switch";
import { Textarea } from "#console/components/ui/textarea";
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

defineProps<{
	isLoading?: boolean;
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
}

function handleOpenChange(value: boolean) {
	if (!value) reset();
	open.value = value;
}

function submit() {
	if (!isFormValid.value) return;

	const pipeline: CreatePipeline = {
		name: name.value.trim(),
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
			labelCatalog: {},
		},
	};

	emit("create", pipeline);
	open.value = false;
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

      <div class="space-y-5 py-4">
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
