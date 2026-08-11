<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import type { CreatePolicy, Policy, UpdatePolicy } from "@nvisy/sdk/datatypes";
import { PolicyForm } from "#console/components/pages/policies";
import { Button } from "#console/components/ui/button";
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

// `policy` present → edit mode; absent → create mode. PolicyForm owns the form
// state and exposes `submit()`/validity through a template ref so the pinned
// footer here can drive it. `loadingPolicy` is true while the full policy is
// being fetched for edit (so we don't briefly flash the create form).
const props = defineProps<{
	policy?: Policy | null;
	isLoading?: boolean;
	loadingPolicy?: boolean;
}>();

const emit = defineEmits<{
	create: [policy: CreatePolicy];
	update: [slug: string, updates: UpdatePolicy];
}>();

const isEdit = computed(() => !!props.policy || !!props.loadingPolicy);

const form = ref<{
	submit: () => void;
	isValid: boolean;
	hasChanges: boolean;
} | null>(null);

// In edit mode the footer stays disabled until something actually changes; in
// create mode it only needs a valid form.
const canSubmit = computed(() => {
	if (!form.value?.isValid) return false;
	return isEdit.value ? form.value.hasChanges : true;
});

function onCreate(policy: CreatePolicy) {
	emit("create", policy);
}
function onUpdate(slug: string, updates: UpdatePolicy) {
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
        <SheetTitle>
          {{
            isEdit
              ? t("policies.editor.editTitle")
              : t("policies.editor.createTitle")
          }}
        </SheetTitle>
        <SheetDescription>
          {{
            isEdit
              ? t("policies.editor.editDescription")
              : t("policies.editor.createDescription")
          }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <!-- Fetching the full policy for edit -->
        <div
          v-if="loadingPolicy"
          class="flex items-center justify-center py-16"
        >
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>
        <PolicyForm
          v-else
          ref="form"
          :policy="policy"
          :is-loading="isLoading"
          @create="onCreate"
          @update="onUpdate"
        />
      </div>

      <SheetFooter
        v-if="!loadingPolicy"
        class="flex-row justify-end border-t border-border/50"
      >
        <Button variant="outline" @click="cancel">
          {{ t("policies.editor.cancel") }}
        </Button>
        <Button :disabled="!canSubmit || isLoading" @click="form?.submit()">
          <Loader2 v-if="isLoading" :size="16" class="mr-2 animate-spin" />
          {{ isEdit ? t("policies.editor.save") : t("policies.editor.submit") }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
