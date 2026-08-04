<script setup lang="ts">
import type { CreatePolicy } from "@nvisy/sdk/datatypes";
import { ArrowLeft } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { PolicyForm } from "#console/components/pages/policies";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "New Policy" });

definePageMeta({
	pageCategory: "Automation",
});

const { createPolicyAsync, isCreating } = usePolicies();

async function handleCreate(policy: CreatePolicy) {
	try {
		await createPolicyAsync(policy);
		toast.success(t("policies.toast.created"));
		await navigateTo(wLink("/policies"));
	} catch (error) {
		toast.error(t("policies.toast.createFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

function cancel() {
	navigateTo(wLink("/policies"));
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-3xl">
      <Button
        as-child
        variant="ghost"
        size="sm"
        class="mb-4 -ml-2 font-normal text-muted-foreground"
      >
        <NuxtLink :to="wLink('/policies')" class="flex items-center gap-1.5">
          <ArrowLeft :size="15" />
          {{ t("policies.editor.back") }}
        </NuxtLink>
      </Button>

      <div class="mb-6 space-y-1">
        <h1 class="text-lg font-semibold">{{ t("policies.editor.title") }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t("policies.editor.description") }}
        </p>
      </div>

      <PolicyForm
        :is-loading="isCreating"
        @create="handleCreate"
        @cancel="cancel"
      />
    </div>
  </div>
</template>
