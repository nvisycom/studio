<script setup lang="ts">
import { Loader2, Workflow, Pencil, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import type {
	CreatePipeline,
	Pipeline,
	PipelineSummary,
	UpdatePipeline,
} from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Button } from "#console/components/ui/button";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
import { personLabel } from "#console/utils/naming";
import { ConfirmDialog } from "#console/components/shared";
import { PipelineSheet } from "#console/components/pages/workflows";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();
const sectionTabs = useSectionTabs();

useHead({ title: "Workflows" });

definePageMeta({
	pageCategory: "header.category.workflows",
	hideCategory: true,
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

// VirtualTable keys rows by id; pipelines are keyed by slug, so expose it as id.
type PipelineRow = PipelineSummary & { id: string };
const pipelineRows = computed<PipelineRow[]>(() =>
	(pipelines.value ?? []).map((p) => ({ ...p, id: p.slug })),
);

const columns = computed<VirtualColumn<PipelineRow>[]>(() => [
	{
		key: "name",
		header: t("workflows.table.name"),
		cell: (p) => ({
			type: "primary",
			title: p.displayName,
			subtitle: p.description,
			maxWidth: "max-w-md",
		}),
	},
	{
		key: "creator",
		header: t("workflows.table.creator"),
		width: "200px",
		cell: (p) => ({
			type: "avatar",
			name: personLabel(p.createdBy),
			src: resolveAvatarUrl(p.createdBy.avatarUrl),
		}),
	},
	{
		key: "created",
		header: t("workflows.table.created"),
		width: "120px",
		cell: (p) => ({
			type: "text",
			value: relativeTime(p.createdAt),
			muted: true,
		}),
	},
	{
		key: "updated",
		header: t("workflows.table.updated"),
		width: "120px",
		cell: (p) => ({
			type: "text",
			value: relativeTime(p.updatedAt),
			muted: true,
		}),
	},
]);

/** Right-click / ⋯ actions for a workflow row. */
function rowActions(pipeline: PipelineRow): RowAction[] {
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
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.workflows.value" />
      </HeaderSocket>

      <!-- Action row above the table. -->
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          {{ t("workflows.count", { count: pipelines?.length ?? 0 }) }}
        </p>
        <Button
          size="sm"
          data-testid="pipeline-create"
          @click="isCreateSheetOpen = true"
        >
          <Workflow :size="16" class="mr-1.5" />
          {{ t("workflows.actions.create") }}
        </Button>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Bare full-width table, filling the remaining height. -->
      <div v-else class="relative min-h-0 flex-1">
        <VirtualTable
          :rows="pipelineRows"
          :columns="columns"
          :row-actions="rowActions"
          :menu-label="t('workflows.table.menu')"
          :empty="{
            icon: Workflow,
            title: t('workflows.empty.title'),
            description: t('workflows.empty.description'),
          }"
        />
      </div>

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
    </div>
  </div>
</template>
