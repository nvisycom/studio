<script setup lang="ts">
import type {
	CreatePolicy,
	Policy,
	PolicySummary,
	UpdatePolicy,
} from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { PolicySheet } from "#console/components/pages/policies";
import {
	Loader2,
	Pencil,
	ShieldCheck,
	Trash2,
	ExternalLink,
	LayoutTemplate,
} from "@lucide/vue";
import { personLabel } from "#console/utils/naming";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { ConfirmDialog } from "#console/components/common";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();

useHead({ title: "Policies" });

definePageMeta({
	pageCategory: "header.category.policies",
});

const {
	policies,
	isLoading,
	getPolicy,
	createPolicyAsync,
	isCreating,
	updatePolicyAsync,
	isUpdating,
	deletePolicyAsync,
	isDeleting,
} = usePolicies();

const policyToDelete = ref<PolicySummary | null>(null);

// One slide-over for both create and edit. `editingPolicy` null → create mode;
// a loaded Policy → edit mode. `?create=1` (templates "start from scratch",
// overview setup step) opens it in create mode on load.
const route = useRoute();
const isSheetOpen = ref(route.query.create === "1");
const editingPolicy = ref<Policy | null>(null);
const isLoadingPolicy = ref(false);

function openCreate() {
	editingPolicy.value = null;
	isSheetOpen.value = true;
}

async function openEdit(policy: PolicySummary) {
	// The list only holds summaries; fetch the full policy (with its definition)
	// before opening the editor.
	editingPolicy.value = null;
	isLoadingPolicy.value = true;
	isSheetOpen.value = true;
	try {
		editingPolicy.value = await getPolicy(policy.slug);
	} catch (error) {
		isSheetOpen.value = false;
		toast.error(t("policies.toast.loadFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	} finally {
		isLoadingPolicy.value = false;
	}
}

async function handleCreate(policy: CreatePolicy) {
	try {
		await createPolicyAsync(policy);
		toast.success(t("policies.toast.created"));
		isSheetOpen.value = false;
	} catch (error) {
		toast.error(t("policies.toast.createFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleUpdate(policySlug: string, updates: UpdatePolicy) {
	try {
		await updatePolicyAsync({ policySlug, updates });
		toast.success(t("policies.toast.updated"));
		isSheetOpen.value = false;
	} catch (error) {
		toast.error(t("policies.toast.updateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

// VirtualTable keys rows by id; policies are keyed by slug, so expose it as id.
type PolicyRow = PolicySummary & { id: string };
const policyRows = computed<PolicyRow[]>(() =>
	(policies.value ?? []).map((p) => ({ ...p, id: p.slug })),
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
	return [
		{
			key: "edit",
			label: t("policies.table.edit"),
			icon: Pencil,
			select: () => openEdit(policy),
		},
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
		await deletePolicyAsync(policy.slug);
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
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-6xl">
      <Card class="rounded-xl border-border/50 py-0 pt-6">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <CardTitle
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("policies.title") }}
              </CardTitle>
              <CardDescription class="text-sm">
                {{ t("policies.count", { count: policies?.length ?? 0 }) }}
              </CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <Button as-child variant="outline" size="sm" class="font-normal">
                <NuxtLink :to="wLink('/policies/templates')">
                  <LayoutTemplate :size="16" class="mr-1.5" />
                  {{ t("policies.browseTemplates") }}
                </NuxtLink>
              </Button>
              <Button size="sm" @click="openCreate">
                <ShieldCheck :size="16" class="mr-1.5" />
                {{ t("policies.create") }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <VirtualTable
            v-else
            :rows="policyRows"
            :columns="columns"
            :row-actions="rowActions"
            :menu-label="t('policies.table.menu')"
            max-height="60vh"
            :empty="{
              icon: ShieldCheck,
              title: t('policies.empty.title'),
              description: t('policies.empty.description'),
            }"
          />
        </CardContent>
        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
        >
          <p class="text-xs text-muted-foreground">
            {{ t("policies.footer") }}
            <a
              href="https://docs.nvisy.com/policies"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
            >
              {{ t("policies.learnMore") }}
              <ExternalLink :size="12" />
            </a>
          </p>
        </CardFooter>
      </Card>

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

      <PolicySheet
        v-model:open="isSheetOpen"
        :policy="editingPolicy"
        :is-loading="isCreating || isUpdating"
        :loading-policy="isLoadingPolicy"
        @create="handleCreate"
        @update="handleUpdate"
      />
    </div>
  </div>
</template>
