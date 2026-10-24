<script setup lang="ts">
import type {
	WorkspacePolicy,
	WorkspacePolicySummary,
	UpdateWorkspacePolicy,
} from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { EditPolicySheet } from "#console/components/pages/policies";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
import {
	ArrowUpCircle,
	LayoutTemplate,
	Loader2,
	Pencil,
	ShieldCheck,
	Trash2,
} from "@lucide/vue";
import { personLabel } from "#console/utils/naming";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { ConfirmDialog } from "#console/components/shared";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();
const { wLink } = useWorkspaceLink();
const sectionTabs = useSectionTabs();

useHead({ title: "Policies" });

definePageMeta({
	pageCategory: "header.category.policies",
	// The socket renders the section tabs, so hide the breadcrumb category to
	// avoid showing "Policies" twice.
	hideCategory: true,
});

const {
	policies,
	isLoading,
	getPolicy,
	updatePolicyAsync,
	isUpdating,
	deletePolicyAsync,
	isDeleting,
	promotePolicyAsync,
	isPromoting,
} = usePolicies();

const policyToDelete = ref<WorkspacePolicySummary | null>(null);

// Promote a derived policy: a prompt for the new name, then the promotion.
const policyToPromote = ref<WorkspacePolicySummary | null>(null);
const promoteName = ref("");
function startPromote(policy: WorkspacePolicySummary) {
	policyToPromote.value = policy;
	promoteName.value = "";
}
async function confirmPromote() {
	const policy = policyToPromote.value;
	const displayName = promoteName.value.trim();
	if (!policy || !displayName) return;
	try {
		await promotePolicyAsync({ policyId: policy.id, displayName });
		toast.success(t("policies.toast.promoted"));
		policyToPromote.value = null;
	} catch (error) {
		toast.error(t("policies.toast.promoteFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

// Creating a policy is a shell-wide capability (the dialog is mounted in the
// layout), so the "New policy" button just raises the shared open state.
const { open: openCreate } = useCreatePolicy();

// Edit is page-local: this slide-over loads the full policy for its row.
// `editingPolicy` holds the loaded policy; `isLoadingPolicy` gates the sheet
// while it's fetched.
const isEditSheetOpen = ref(false);
const editingPolicy = ref<WorkspacePolicy | null>(null);
const isLoadingPolicy = ref(false);

async function openEdit(policy: WorkspacePolicySummary) {
	// The list only holds summaries; fetch the full policy (with its definition)
	// before opening the editor.
	editingPolicy.value = null;
	isLoadingPolicy.value = true;
	isEditSheetOpen.value = true;
	try {
		editingPolicy.value = await getPolicy(policy.id);
	} catch (error) {
		isEditSheetOpen.value = false;
		toast.error(t("policies.toast.loadFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	} finally {
		isLoadingPolicy.value = false;
	}
}

async function handleUpdate(policyId: string, updates: UpdateWorkspacePolicy) {
	try {
		await updatePolicyAsync({ policyId, updates });
		toast.success(t("policies.toast.updated"));
		isEditSheetOpen.value = false;
	} catch (error) {
		toast.error(t("policies.toast.updateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

// Filter by kind. The page already fetches the whole list, so this is a cheap
// client-side narrow (no refetch) across All / Authored / Derived.
const kindFilter = ref<"all" | "authored" | "derived">("all");
const KIND_FILTERS = ["all", "authored", "derived"] as const;

// VirtualTable keys rows by id; policies are keyed by slug, so expose it as id.
type PolicyRow = WorkspacePolicySummary & { id: string };
const policyRows = computed<PolicyRow[]>(() =>
	(policies.value ?? [])
		.filter((p) => kindFilter.value === "all" || p.kind === kindFilter.value)
		.map((p) => ({ ...p, id: p.id })),
);

const columns = computed<VirtualColumn<PolicyRow>[]>(() => [
	{
		key: "name",
		header: t("policies.table.name"),
		cell: (p) => ({
			type: "primary",
			title: p.displayName,
			subtitle: p.description,
			maxWidth: "max-w-md",
		}),
	},
	{
		key: "kind",
		header: t("policies.table.kind"),
		width: "120px",
		cell: (p) => ({
			type: "badge",
			label: t(`policies.kind.${p.kind}`),
			variant: p.kind === "derived" ? "secondary" : "outline",
		}),
	},
	{
		key: "creator",
		header: t("policies.table.creator"),
		width: "200px",
		cell: (p) => ({
			type: "avatar",
			name: personLabel(p.createdBy),
			src: resolveAvatarUrl(p.createdBy.avatarUrl),
		}),
	},
	{
		key: "created",
		header: t("policies.table.created"),
		width: "120px",
		cell: (p) => ({
			type: "text",
			value: relativeTime(p.createdAt),
			muted: true,
		}),
	},
	{
		key: "updated",
		header: t("policies.table.updated"),
		width: "120px",
		cell: (p) => ({
			type: "text",
			value: relativeTime(p.updatedAt),
			muted: true,
		}),
	},
]);

/** Right-click / ⋯ actions for a policy row. */
function rowActions(policy: PolicyRow): RowAction[] {
	const derived = policy.kind === "derived";
	return [
		// Derived policies are immutable (minted from labels), so promote them to an
		// editable authored policy instead of editing in place.
		...(derived
			? [
					{
						key: "promote",
						label: t("policies.table.promote"),
						icon: ArrowUpCircle,
						select: () => startPromote(policy),
					},
				]
			: [
					{
						key: "edit",
						label: t("policies.table.edit"),
						icon: Pencil,
						select: () => openEdit(policy),
					},
				]),
		{
			key: "delete",
			label: t("policies.table.delete"),
			icon: Trash2,
			danger: true,
			select: () => {
				policyToDelete.value = policy;
			},
		},
	];
}

async function confirmDelete() {
	const policy = policyToDelete.value;
	if (!policy) return;
	try {
		await deletePolicyAsync(policy.id);
		toast.success(t("policies.toast.deleted"));
		policyToDelete.value = null;
	} catch (error) {
		toast.error(t("policies.toast.deleteFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs live in the app header via the socket; page actions stay
           on the page, above the table. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.policies.value" />
      </HeaderSocket>

      <!-- Action row above the table. -->
      <div class="flex items-center justify-between gap-3">
        <!-- Kind filter: narrow to authored / derived (client-side). -->
        <div
          class="flex shrink-0 items-center gap-0.5 rounded-md border border-input p-0.5"
        >
          <button
            v-for="k in KIND_FILTERS"
            :key="k"
            type="button"
            class="rounded-sm px-2.5 py-1 text-sm transition-colors"
            :class="
              kindFilter === k
                ? 'bg-secondary font-medium text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="kindFilter = k"
          >
            {{ t(`policies.filter.${k}`) }}
          </button>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Button as-child variant="outline" size="sm" class="font-normal">
            <NuxtLink
              :to="wLink('/policies/templates')"
              class="flex items-center gap-1.5"
            >
              <LayoutTemplate :size="16" />
              {{ t("policies.viewTemplates") }}
            </NuxtLink>
          </Button>
          <Button size="sm" @click="openCreate">
            <ShieldCheck :size="16" class="mr-1.5" />
            {{ t("policies.create") }}
          </Button>
        </div>
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
          :rows="policyRows"
          :columns="columns"
          :row-actions="rowActions"
          :menu-label="t('policies.table.menu')"
          :empty="{
            icon: ShieldCheck,
            title: t('policies.empty.title'),
            description: t('policies.empty.description'),
          }"
        />
      </div>

      <!-- Delete confirm -->
      <ConfirmDialog
        :open="!!policyToDelete"
        :title="
          t('policies.delete.title', { name: policyToDelete?.displayName })
        "
        :description="t('policies.delete.description')"
        :confirm-label="t('policies.delete.confirm')"
        :cancel-label="t('policies.delete.cancel')"
        :is-loading="isDeleting"
        @update:open="(v) => !v && (policyToDelete = null)"
        @confirm="confirmDelete"
      />

      <!-- Edit only: creating a policy is handled by the shell-wide dialog. -->
      <EditPolicySheet
        v-model:open="isEditSheetOpen"
        :policy="editingPolicy"
        :is-loading="isUpdating"
        :loading-policy="isLoadingPolicy"
        @update="handleUpdate"
      />

      <!-- Promote a derived policy to an authored one: it needs a real name. -->
      <Dialog
        :open="!!policyToPromote"
        @update:open="(v) => !v && (policyToPromote = null)"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t("policies.promote.title") }}</DialogTitle>
            <DialogDescription>
              {{ t("policies.promote.description") }}
            </DialogDescription>
          </DialogHeader>
          <form class="space-y-2" @submit.prevent="confirmPromote">
            <Label for="promote-name">{{ t("policies.promote.nameLabel") }}</Label>
            <Input
              id="promote-name"
              v-model="promoteName"
              autofocus
              :maxlength="255"
              :placeholder="t('policies.promote.namePlaceholder')"
            />
          </form>
          <DialogFooter>
            <Button variant="outline" @click="policyToPromote = null">
              {{ t("common.cancel") }}
            </Button>
            <Button
              :disabled="!promoteName.trim() || isPromoting"
              @click="confirmPromote"
            >
              <Loader2
                v-if="isPromoting"
                :size="16"
                class="mr-2 animate-spin"
              />
              {{ t("policies.promote.confirm") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
