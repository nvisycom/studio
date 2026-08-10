<script setup lang="ts">
import type { UpdatePolicy } from "@nvisy/sdk/datatypes";
import { ArrowLeft, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { PolicyForm } from "#console/components/pages/policies";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const route = useRoute();

const slug = computed(() => route.params.slug as string);

const { getPolicy, updatePolicyAsync, isUpdating } = usePolicies();

// Fetch the full policy (with its definition); the list only has summaries.
const {
	data: policy,
	pending: isLoading,
	error,
} = useAsyncData(
	() => `policy-${slug.value}`,
	() => getPolicy(slug.value),
	{ watch: [slug] },
);

useHead(() => ({ title: policy.value?.displayName ?? "Policy" }));

definePageMeta({
	pageCategory: "header.category.policies",
});

// Bounce back to the list if the policy can't be loaded.
watch(error, (e) => {
	if (e) navigateTo(wLink("/policies"), { replace: true });
});

async function handleUpdate(policySlug: string, updates: UpdatePolicy) {
	try {
		await updatePolicyAsync({ policySlug, updates });
		toast.success(t("policies.toast.updated"));
		await navigateTo(wLink("/policies"));
	} catch (error) {
		toast.error(t("policies.toast.updateFailed"), {
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

      <!-- Loading the policy -->
      <div
        v-if="isLoading && !policy"
        class="flex items-center justify-center py-16"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <PolicyForm
        v-else-if="policy"
        :policy="policy"
        :is-loading="isUpdating"
        @update="handleUpdate"
        @cancel="cancel"
      />
    </div>
  </div>
</template>
