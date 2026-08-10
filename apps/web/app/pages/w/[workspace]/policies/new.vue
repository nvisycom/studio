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
	pageCategory: "header.category.policies",
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
      <!-- Back nav, matching /integrations/explore -->
      <div class="mb-6">
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink :to="wLink('/policies')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("policies.editor.back") }}
          </NuxtLink>
        </Button>
      </div>

      <PolicyForm
        :is-loading="isCreating"
        @create="handleCreate"
        @cancel="cancel"
      />
    </div>
  </div>
</template>
