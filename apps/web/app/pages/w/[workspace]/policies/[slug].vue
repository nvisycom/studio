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
	pageCategory: "Automation",
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

      <!-- Loading the policy -->
      <div
        v-if="isLoading && !policy"
        class="flex items-center justify-center py-16"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else-if="policy">
        <div class="mb-6 space-y-1">
          <h1 class="text-lg font-semibold">
            {{ t("policies.editor.editTitle") }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t("policies.editor.description") }}
          </p>
        </div>

        <PolicyForm
          :policy="policy"
          :is-loading="isUpdating"
          @update="handleUpdate"
          @cancel="cancel"
        />
      </template>
    </div>
  </div>
</template>
