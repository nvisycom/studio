<script setup lang="ts">
import type { CreatePipeline } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";
import { EditPipelineSheet } from "#console/components/pages/workflows";

/**
 * The shell-wide "create pipeline" dialog: mounted once in the layout and driven
 * by `useCreatePipeline`, so any trigger (command palette, workflows page) opens
 * the same dialog wherever the user is. Owns the create mutation and, on success,
 * navigates to the workflows list so the new pipeline is in view. Fetches the
 * policy list itself (the sheet offers them for linking).
 *
 * Editing a pipeline is the page's job (it loads the pipeline and owns its row),
 * so only create lives here — both render the shared PipelineForm via
 * EditPipelineSheet.
 */
const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { isOpen, close } = useCreatePipeline();
const { policies } = usePolicies();
const { createPipelineAsync, isCreating } = usePipelines();

async function handleCreate(pipeline: CreatePipeline) {
	try {
		await createPipelineAsync(pipeline);
		toast.success(t("workflows.toast.created"));
		close();
		await navigateTo(wLink("/workflows"));
	} catch (err) {
		// Keep the dialog open on failure so the user can retry.
		toast.error(t("workflows.toast.createFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}
</script>

<template>
  <EditPipelineSheet
    v-model:open="isOpen"
    :policies="policies ?? undefined"
    :is-loading="isCreating"
    @create="handleCreate"
  />
</template>
