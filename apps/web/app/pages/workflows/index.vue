<script setup lang="ts">
import { ref } from "vue";
import {
	ExternalLink,
	Loader2,
	Workflow,
	Plus,
	MoreHorizontal,
	Pencil,
	Trash2,
	Copy,
	History,
} from "@lucide/vue";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Switch } from "#console/components/ui/switch";

useHead({ title: "Workflows" });

definePageMeta({
	pageCategory: "Automation",
});

// Mock data for workflows - replace with actual API call
const isLoading = ref(false);
const workflows = ref([
	{
		id: "wf-1",
		name: "Document Processing Pipeline",
		description: "Extract and process documents from uploads",
		status: "active",
		lastRun: "2024-01-20T10:30:00Z",
		createdAt: "2024-01-15T08:00:00Z",
		runsCount: 156,
	},
	{
		id: "wf-2",
		name: "Invoice Extraction",
		description: "Extract data from invoice PDFs",
		status: "active",
		lastRun: "2024-01-20T09:15:00Z",
		createdAt: "2024-01-10T14:30:00Z",
		runsCount: 89,
	},
	{
		id: "wf-3",
		name: "Contract Analysis",
		description: "Analyze and summarize contracts",
		status: "paused",
		lastRun: "2024-01-18T16:45:00Z",
		createdAt: "2024-01-05T11:00:00Z",
		runsCount: 42,
	},
]);

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function toggleWorkflowStatus(workflowId: string, active: boolean) {
	const workflow = workflows.value.find((w) => w.id === workflowId);
	if (workflow) {
		workflow.status = active ? "active" : "paused";
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
                  Workflows
                </CardTitle>
                <CardDescription class="text-sm">
                  {{ workflows.length }} workflow{{
                    workflows.length !== 1 ? "s" : ""
                  }}
                  configured
                </CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
                  <NuxtLink to="/workflows/runs">
                    <History :size="16" />
                    View Runs
                  </NuxtLink>
                </Button>
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
                  <NuxtLink to="/editor">
                    <Plus :size="16" />
                    Create Workflow
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table v-if="workflows.length > 0">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Runs</TableHead>
                  <TableHead class="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="workflow in workflows" :key="workflow.id">
                  <TableCell>
                    <div>
                      <NuxtLink
                        :to="`/editor?id=${workflow.id}`"
                        class="font-medium hover:underline"
                      >
                        {{ workflow.name }}
                      </NuxtLink>
                      <p class="text-xs text-muted-foreground">
                        {{ workflow.description }}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      :model-value="workflow.status === 'active'"
                      @update:model-value="
                        (val) => toggleWorkflowStatus(workflow.id, val)
                      "
                    />
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ formatDate(workflow.lastRun) }}
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ workflow.runsCount }}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <MoreHorizontal :size="16" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="w-48">
                        <DropdownMenuItem as-child class="cursor-pointer">
                          <NuxtLink :to="`/editor?id=${workflow.id}`">
                            <Pencil :size="14" class="mr-2" />
                            Edit
                          </NuxtLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem class="cursor-pointer">
                          <Copy :size="14" class="mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          class="text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 :size="14" class="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
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
                <p class="text-sm text-foreground mb-1">No workflows yet</p>
                <p class="text-xs text-muted-foreground mb-4">
                  Create your first workflow to automate document processing
                </p>
                <Button as-child size="sm">
                  <NuxtLink to="/editor">
                    <Plus :size="16" />
                    Create Workflow
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              Workflows automate document processing pipelines.
              <a
                href="https://docs.nvisy.com/workflows"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                Learn more
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>
      </template>
    </div>
  </div>
</template>
