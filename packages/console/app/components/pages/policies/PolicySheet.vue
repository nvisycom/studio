<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import type { CreatePolicy, Policy, UpdatePolicy } from "@nvisy/sdk/datatypes";
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

// `policy` present → edit mode; absent → create mode. PolicyForm renders its own
// submit and emits `create` / `update` accordingly. `loadingPolicy` is true
// while the full policy is being fetched for edit (so we don't briefly flash the
// create form).
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

function onCreate(policy: CreatePolicy) {
	emit("create", policy);
}
function onUpdate(slug: string, updates: UpdatePolicy) {
	emit("update", slug, updates);
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
          :policy="policy"
          :is-loading="isLoading"
          @create="onCreate"
          @update="onUpdate"
          @cancel="onCancel"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>
