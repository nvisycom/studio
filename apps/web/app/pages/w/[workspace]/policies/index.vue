<script setup lang="ts">
import type { PolicySummary } from "@nvisy/sdk/datatypes";
import {
	Loader2,
	Plus,
	Pencil,
	ShieldCheck,
	Trash2,
	MoreHorizontal,
	ExternalLink,
} from "@lucide/vue";
import { formatRelativeTime } from "#console/utils/date";
import { EntityAvatar } from "#console/components/common";
import { Button } from "#console/components/ui/button";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "#console/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();

useHead({ title: "Policies" });

definePageMeta({
	pageCategory: "Policies",
});

const { policies, isLoading, deletePolicyAsync, isDeleting } = usePolicies();

const policyToDelete = ref<PolicySummary | null>(null);

function openCreate() {
	navigateTo(wLink("/policies/new"));
}

function openEdit(policy: PolicySummary) {
	navigateTo(wLink(`/policies/${policy.slug}`));
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
            <Button size="sm" @click="openCreate">
              <Plus :size="16" class="mr-1.5" />
              {{ t("policies.create") }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Empty -->
          <div v-else-if="!policies || policies.length === 0" class="py-12">
            <div class="text-center">
              <div
                class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
              >
                <ShieldCheck class="size-5 text-muted-foreground" />
              </div>
              <p class="text-sm text-foreground mb-1">
                {{ t("policies.empty.title") }}
              </p>
              <p class="text-xs text-muted-foreground mb-4">
                {{ t("policies.empty.description") }}
              </p>
              <Button size="sm" @click="openCreate">
                <Plus :size="16" />
                {{ t("policies.create") }}
              </Button>
            </div>
          </div>

          <!-- Table -->
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("policies.table.name") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("policies.table.creator") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("policies.table.created") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("policies.table.updated") }}
                </TableHead>
                <TableHead class="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <ContextMenu v-for="policy in policies" :key="policy.slug">
                <ContextMenuTrigger as-child>
                  <TableRow class="group">
                    <TableCell>
                      <div class="min-w-0">
                        <p class="truncate font-medium text-foreground">
                          {{ policy.displayName }}
                        </p>
                        <p
                          v-if="policy.description"
                          class="truncate text-xs text-muted-foreground"
                        >
                          {{ policy.description }}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2">
                        <EntityAvatar
                          :name="policy.createdBy.displayName || policy.createdBy.username"
                          :src="resolveAvatarUrl(policy.createdBy.avatarUrl)"
                          size="sm"
                        />
                        <div class="min-w-0">
                          <p class="truncate text-sm text-foreground">
                            {{
                              policy.createdBy.displayName ||
                              policy.createdBy.username
                            }}
                          </p>
                          <p
                            v-if="policy.createdBy.displayName"
                            class="truncate text-xs text-muted-foreground"
                          >
                            {{ policy.createdBy.username }}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ formatRelativeTime(policy.createdAt, t) }}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ formatRelativeTime(policy.updatedAt, t) }}
                    </TableCell>
                    <TableCell class="text-right" @click.stop>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                            :aria-label="t('policies.table.menu')"
                          >
                            <MoreHorizontal :size="16" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="openEdit(policy)">
                            <Pencil :size="14" class="mr-2" />
                            {{ t("policies.table.edit") }}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            class="text-destructive focus:text-destructive"
                            @click="policyToDelete = policy"
                          >
                            <Trash2 :size="14" class="mr-2" />
                            {{ t("policies.table.delete") }}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    class="cursor-pointer"
                    @click="openEdit(policy)"
                  >
                    <Pencil :size="14" class="mr-2" />
                    {{ t("policies.table.edit") }}
                  </ContextMenuItem>
                  <ContextMenuItem
                    class="cursor-pointer text-destructive focus:text-destructive"
                    @click="policyToDelete = policy"
                  >
                    <Trash2 :size="14" class="mr-2" />
                    {{ t("policies.table.delete") }}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </TableBody>
          </Table>
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
      <Dialog
        :open="!!policyToDelete"
        @update:open="(v) => !v && (policyToDelete = null)"
      >
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {{ t("policies.delete.title", { name: policyToDelete?.displayName }) }}
            </DialogTitle>
            <DialogDescription>
              {{ t("policies.delete.description") }}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" @click="policyToDelete = null">
              {{ t("policies.delete.cancel") }}
            </Button>
            <Button
              variant="destructive"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
              {{ t("policies.delete.confirm") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
