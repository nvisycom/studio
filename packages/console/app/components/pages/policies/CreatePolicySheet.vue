<script setup lang="ts">
import type { CreatePolicy } from "@nvisy/sdk/datatypes";
import { PolicyForm } from "#console/components/pages/policies";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#console/components/ui/sheet";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });

defineProps<{ isLoading?: boolean }>();

const emit = defineEmits<{
	create: [policy: CreatePolicy];
}>();

// PolicyForm (no `policy` prop) is in create mode: it renders its own submit
// button and emits `create`. `cancel` just closes the sheet.
function onCreate(policy: CreatePolicy) {
	emit("create", policy);
}
function onCancel() {
	open.value = false;
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
    >
      <SheetHeader class="border-b border-border/50">
        <SheetTitle>{{ t("policies.editor.createTitle") }}</SheetTitle>
        <SheetDescription>
          {{ t("policies.editor.createDescription") }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <PolicyForm
          :is-loading="isLoading"
          @create="onCreate"
          @cancel="onCancel"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>
