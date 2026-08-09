<script setup lang="ts">
import {
	ExternalLink,
	Loader2,
	Workflow,
	Plus,
	MoreHorizontal,
	Trash2,
	History,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import type { CreatePipeline, PipelineSummary } from "@nvisy/sdk/datatypes";
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
import { CreatePipelineDialog } from "#console/components/pages/workflows";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "Workflows" });

definePageMeta({
	pageCategory: "Workflows",
});

const {
	pipelines,
	isLoading,
	createPipelineAsync,
	isCreating,
	deletePipelineAsync,
} = usePipelines();

// Policies are linkable at creation (definition.policySlugs).
const { policies } = usePolicies();

const isCreateDialogOpen = ref(false);

async function handleCreate(pipeline: CreatePipeline) {
	try {
		await createPipelineAsync(pipeline);
		toast.success(t("workflows.toast.created"));
		isCreateDialogOpen.value = false;
	} catch (err) {
		toast.error(t("workflows.toast.createFailed"), {
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

async function handleDelete(slug: string) {
	try {
		await deletePipelineAsync(slug);
		toast.success(t("workflows.toast.deleted"));
	} catch (err) {
		toast.error(t("workflows.toast.deleteFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
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
                <Button
                  variant="outline"
                  size="sm"
                  class="font-normal"
                  @click="isCreateDialogOpen = true"
                >
                  <Plus :size="16" />
                  {{ t("workflows.actions.create") }}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table v-if="pipelines && pipelines.length > 0">
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t("workflows.table.name") }}</TableHead>
                  <TableHead>{{ t("workflows.table.status") }}</TableHead>
                  <TableHead>{{ t("workflows.table.updated") }}</TableHead>
                  <TableHead class="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <ContextMenu
                  v-for="pipeline in pipelines"
                  :key="pipeline.slug"
                >
                  <ContextMenuTrigger as-child>
                    <TableRow>
                      <TableCell>
                        <div>
                          <p class="font-medium">{{ pipeline.displayName }}</p>
                          <p
                            v-if="pipeline.description"
                            class="text-xs text-muted-foreground"
                          >
                            {{ pipeline.description }}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          :variant="statusVariant[pipeline.status]"
                          class="capitalize"
                        >
                          {{ t(`workflows.status.${pipeline.status}`) }}
                        </Badge>
                      </TableCell>
                      <TableCell class="text-muted-foreground text-sm">
                        {{ formatRelativeTime(pipeline.updatedAt, t) }}
                      </TableCell>
                      <TableCell class="text-right" @click.stop>
                        <DropdownMenu>
                          <DropdownMenuTrigger as-child>
                            <Button variant="ghost" size="icon" class="h-8 w-8">
                              <MoreHorizontal :size="16" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" class="w-48">
                            <DropdownMenuItem
                              class="text-red-600 dark:text-red-400 cursor-pointer"
                              @click="handleDelete(pipeline.slug)"
                            >
                              <Trash2 :size="14" class="mr-2" />
                              {{ t("workflows.actions.delete") }}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      class="cursor-pointer text-destructive focus:text-destructive"
                      @click="handleDelete(pipeline.slug)"
                    >
                      <Trash2 :size="14" class="mr-2" />
                      {{ t("workflows.actions.delete") }}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
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
                <p class="text-xs text-muted-foreground mb-4">
                  {{ t("workflows.empty.description") }}
                </p>
                <Button size="sm" @click="isCreateDialogOpen = true">
                  <Plus :size="16" />
                  {{ t("workflows.actions.create") }}
                </Button>
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

        <CreatePipelineDialog
          v-model:open="isCreateDialogOpen"
          :is-loading="isCreating"
          :policies="policies ?? undefined"
          @create="handleCreate"
        />
      </template>
    </div>
  </div>
</template>
