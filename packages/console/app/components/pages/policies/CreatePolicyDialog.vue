<script setup lang="ts">
import type { CreatePolicy } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";
import { EditPolicySheet } from "#console/components/pages/policies";

/**
 * The shell-wide "create policy" dialog: mounted once in the layout and driven by
 * `useCreatePolicy`, so any trigger (command palette, overview step, policies
 * page) opens the same dialog wherever the user is. Owns the create mutation and,
 * on success, navigates to the policies list so the new policy is in view.
 *
 * Editing a policy is the page's job (it needs the loaded policy and its row), so
 * only the create half lives here — both render the shared PolicyForm via
 * EditPolicySheet.
 */
const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { isOpen, close } = useCreatePolicy();
const { createPolicyAsync, isCreating } = usePolicies();

async function handleCreate(policy: CreatePolicy) {
	try {
		await createPolicyAsync(policy);
		toast.success(t("policies.toast.created"));
		close();
		await navigateTo(wLink("/policies"));
	} catch (err) {
		// Keep the dialog open on failure so the user can retry.
		toast.error(t("policies.toast.createFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}
</script>

<template>
  <EditPolicySheet
    v-model:open="isOpen"
    :is-loading="isCreating"
    @create="handleCreate"
  />
</template>
