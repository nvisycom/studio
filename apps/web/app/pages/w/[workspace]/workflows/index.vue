<script setup lang="ts">
import {
	ExternalLink,
	Loader2,
	Workflow,
	Pencil,
	Trash2,
	History,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import type {
	CreatePipeline,
	Pipeline,
	PipelineSummary,
	UpdatePipeline,
} from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import DataTableHead from "#console/components/pages/DataTableHead.vue";
import RowActions from "#console/components/pages/RowActions.vue";
import { personLabel } from "#console/utils/naming";
import { ConfirmDialog, EntityAvatar } from "#console/components/common";
import { PipelineSheet } from "#console/components/pages/workflows";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();

useHead({ title: "Workflows" });

definePageMeta({
	pageCategory: "header.category.workflows",
});

const {
	pipelines,
	isLoading,
	getPipeline,
	createPipelineAsync,
	isCreating,
	updatePipelineAsync,
	isUpdating,
	deletePipelineAsync,
	isDeleting,
} = usePipelines();

// Policies are linkable at creation (definition.policySlugs).
const { policies } = usePolicies();

const isCreateSheetOpen = ref(false);

// One slide-over for both create and edit. `editingPipeline` null → create;
// a loaded Pipeline → edit. `loadingPipeline` gates the sheet while the full
// pipeline (with definition + retention) is fetched.
const isEditSheetOpen = ref(false);
const editingPipeline = ref<Pipeline | null>(null);
const loadingPipeline = ref(false);

async function handleCreate(pipeline: CreatePipeline) {
	try {
		await createPipelineAsync(pipeline);
		toast.success(t("workflows.toast.created"));
		isCreateSheetOpen.value = false;
	} catch (err) {
		toast.error(t("workflows.toast.createFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

async function openEdit(pipeline: PipelineSummary) {
	// The list holds summaries; fetch the full pipeline before opening the editor.
	editingPipeline.value = null;
	loadingPipeline.value = true;
	isEditSheetOpen.value = true;
	try {
		editingPipeline.value = await getPipeline(pipeline.slug);
	} catch (err) {
		isEditSheetOpen.value = false;
		toast.error(t("workflows.toast.loadFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	} finally {
		loadingPipeline.value = false;
	}
}

async function handleUpdate(slug: string, updates: UpdatePipeline) {
	try {
		await updatePipelineAsync({ pipelineSlug: slug, updates });
		toast.success(t("workflows.toast.updated"));
		isEditSheetOpen.value = false;
	} catch (err) {
		toast.error(t("workflows.toast.updateFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

const statusVariant: Record<
	PipelineSummary["status"],
	"default" | "secondary" | "outline"
> = {
	enabled: "default",
	draft: "secondary",
	disabled: "outline",
};

const pipelineToDelete = ref<PipelineSummary | null>(null);

async function confirmDelete() {
	const pipeline = pipelineToDelete.value;
	if (!pipeline) return;
	try {
		await deletePipelineAsync(pipeline.slug);
		toast.success(t("workflows.toast.deleted"));
		pipelineToDelete.value = null;
	} catch (err) {
		toast.error(t("workflows.toast.deleteFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

/** Right-click / ⋯ actions for a workflow row. */
function rowActions(pipeline: PipelineSummary): RowAction[] {
	return [
		{
			key: "edit",
			label: t("workflows.actions.edit"),
			icon: Pencil,
			select: () => openEdit(pipeline),
		},
		{
			key: "delete",
			label: t("workflows.actions.delete"),
			icon: Trash2,
			danger: true,
			separatorBefore: true,
			select: () => {
				pipelineToDelete.value = pipeline;
			},
		},
	];
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- Workflows Card -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
                >
                  {{ t("workflows.title") }}
                </CardTitle>
                <CardDescription class="text-sm">
                  {{ t("workflows.count", { count: pipelines?.length ?? 0 }) }}
                </CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button as-child variant="outline" size="sm" class="font-normal">
                  <NuxtLink :to="wLink('/workflows/runs')">
                    <History :size="16" />
                    {{ t("workflows.actions.viewRuns") }}
                  </NuxtLink>
                </Button>
                <Button size="sm" @click="isCreateSheetOpen = true">
                  <Workflow :size="16" class="mr-1.5" />
                  {{ t("workflows.actions.create") }}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table v-if="pipelines && pipelines.length > 0" class="table-fixed">
              <TableHeader>
                <TableRow>
                  <DataTableHead>{{ t("workflows.table.name") }}</DataTableHead>
                  <DataTableHead class="w-[130px]">
                    {{ t("workflows.table.status") }}
                  </DataTableHead>
                  <DataTableHead class="w-[200px]">
                    {{ t("workflows.table.creator") }}
                  </DataTableHead>
                  <DataTableHead class="w-[120px]">
                    {{ t("workflows.table.created") }}
                  </DataTableHead>
                  <DataTableHead class="w-[120px]">
                    {{ t("workflows.table.updated") }}
                  </DataTableHead>
                  <DataTableHead class="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <RowActions
                  v-for="pipeline in pipelines"
                  :key="pipeline.slug"
                  :actions="rowActions(pipeline)"
                  :menu-label="t('workflows.table.menu')"
                  row-class="group"
                >
                  <TableCell>
                    <div class="min-w-0 max-w-md">
                      <p class="truncate font-medium text-foreground">
                        {{ pipeline.displayName }}
                      </p>
                      <p
                        v-if="pipeline.description"
                        class="truncate text-xs text-muted-foreground"
                      >
                        {{ pipeline.description }}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="statusVariant[pipeline.status]"
                      class="font-normal capitalize"
                    >
                      {{ t(`workflows.status.${pipeline.status}`) }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <EntityAvatar
                        :name="personLabel(pipeline.createdBy)"
                        :src="resolveAvatarUrl(pipeline.createdBy.avatarUrl)"
                        size="sm"
                      />
                      <span class="truncate text-sm text-foreground">
                        {{ personLabel(pipeline.createdBy) }}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ relativeTime(pipeline.createdAt) }}
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ relativeTime(pipeline.updatedAt) }}
                  </TableCell>
                </RowActions>
              </TableBody>
            </Table>

            <!-- Empty State -->
            <div v-else class="py-12">
              <div class="text-center">
                <div
                  class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
                >
                  <Workflow class="size-5 text-muted-foreground" />
                </div>
                <p class="text-sm text-foreground mb-1">
                  {{ t("workflows.empty.title") }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ t("workflows.empty.description") }}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("workflows.footer") }}
              <a
                href="https://docs.nvisy.com/pipelines"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("workflows.learnMore") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <PipelineSheet
          v-model:open="isCreateSheetOpen"
          :is-loading="isCreating"
          :policies="policies ?? undefined"
          @create="handleCreate"
        />

        <PipelineSheet
          v-model:open="isEditSheetOpen"
          :pipeline="editingPipeline"
          :loading-pipeline="loadingPipeline"
          :is-loading="isUpdating"
          :policies="policies ?? undefined"
          @update="handleUpdate"
        />

        <ConfirmDialog
          :open="!!pipelineToDelete"
          :title="
            t('workflows.delete.title', { name: pipelineToDelete?.displayName })
          "
          :description="t('workflows.delete.description')"
          :confirm-label="t('workflows.delete.confirm')"
          :cancel-label="t('workflows.delete.cancel')"
          :is-loading="isDeleting"
          @update:open="(v) => !v && (pipelineToDelete = null)"
          @confirm="confirmDelete"
        >
          <template v-if="pipelineToDelete" #details>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">
                {{ pipelineToDelete.displayName }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ t(`workflows.status.${pipelineToDelete.status}`) }}
              </p>
            </div>
          </template>
        </ConfirmDialog>
      </template>
    </div>
  </div>
</template>
