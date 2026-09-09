<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import type {
	CreatePipeline,
	Pipeline,
	PolicySummary,
	UpdatePipeline,
} from "@nvisy/sdk/datatypes";
import { PipelineForm } from "#console/components/pages/workflows";
import { Button } from "#console/components/ui/button";
import { EnabledSwitch } from "#console/components/shared";
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

// `pipeline` present → edit mode; absent → create mode. PipelineForm owns the
// form state and exposes `submit()`/validity/enabled through a template ref so
// the pinned footer here can drive it. `loadingPipeline` is true while the full
// pipeline is fetched for edit (so we don't briefly flash the create form).
const props = defineProps<{
	isLoading?: boolean;
	loadingPipeline?: boolean;
	policies?: PolicySummary[];
	pipeline?: Pipeline | null;
}>();

const emit = defineEmits<{
	create: [pipeline: CreatePipeline];
	update: [slug: string, updates: UpdatePipeline];
}>();

const isEdit = computed(() => !!props.pipeline || !!props.loadingPipeline);

/** i18n keys switch on mode. */
const keys = computed(() => {
	const ns = isEdit.value ? "workflows.edit" : "workflows.create";
	return {
		title: `${ns}.title`,
		description: `${ns}.description`,
		submit: `${ns}.submit`,
	};
});

const form = ref<{
	submit: () => void;
	isValid: boolean;
	enabled: boolean;
} | null>(null);
const canSubmit = ref(false);

function onCreate(pipeline: CreatePipeline) {
	emit("create", pipeline);
}
function onUpdate(slug: string, updates: UpdatePipeline) {
	emit("update", slug, updates);
}
function cancel() {
	open.value = false;
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
    >
      <SheetHeader class="border-b border-border/50">
        <SheetTitle>{{ t(keys.title) }}</SheetTitle>
        <SheetDescription>{{ t(keys.description) }}</SheetDescription>
      </SheetHeader>

      <!-- Fetching the full pipeline for edit -->
      <div
        v-if="loadingPipeline"
        class="flex flex-1 items-center justify-center"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else class="flex-1 overflow-y-auto p-6">
        <PipelineForm
          ref="form"
          :pipeline="pipeline"
          :policies="policies"
          :is-loading="isLoading"
          @create="onCreate"
          @update="onUpdate"
          @can-submit="canSubmit = $event"
        />
      </div>

      <SheetFooter
        v-if="!loadingPipeline && form"
        class="flex-row items-center justify-between border-t border-border/50"
      >
        <EnabledSwitch v-model="form.enabled" />
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="cancel">
            {{ t("workflows.create.cancel") }}
          </Button>
          <Button
            data-testid="pipeline-submit"
            :disabled="!canSubmit || isLoading"
            @click="form?.submit()"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t(keys.submit) }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
