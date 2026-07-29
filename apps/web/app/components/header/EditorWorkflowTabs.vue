<script setup lang="ts">
import { Workflow, X, Plus, ChevronDown, Pencil } from "@lucide/vue";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#console/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { UnsavedChangesDialog } from "#console/components/pages/workflows/dialogs";

// Use editor workflows store for multiple open workflows
const {
	openWorkflows,
	activeWorkflowId,
	closeWorkflow,
	getWorkflowForClose,
	setActiveWorkflow,
	moveWorkflowToFront,
	createNewWorkflow,
	ensureWorkflowOpen,
	renameWorkflow,
} = useEditorWorkflows();

// Unsaved changes dialog state
const unsavedDialogOpen = ref(false);
const pendingCloseWorkflowId = ref<string | null>(null);
const pendingCloseWorkflowName = ref("");

// Ensure at least one workflow is open on mount
onMounted(() => {
	ensureWorkflowOpen();
});

// Rename state
const editingWorkflowId = ref<string | null>(null);
const editingName = ref("");
const renameInputRef = ref<HTMLInputElement | null>(null);

// Max visible tabs before showing dropdown
const MAX_VISIBLE_TABS = 3;

// Compute visible tabs and overflow tabs
const visibleWorkflows = computed(() => {
	if (openWorkflows.value.length <= MAX_VISIBLE_TABS) {
		return openWorkflows.value;
	}

	// Always show the active workflow in visible tabs
	const activeIndex = openWorkflows.value.findIndex(
		(w) => w.workflowId === activeWorkflowId.value,
	);

	if (activeIndex < MAX_VISIBLE_TABS) {
		// Active workflow is already in the visible range
		return openWorkflows.value.slice(0, MAX_VISIBLE_TABS);
	}

	// Active workflow is in overflow, swap it with the last visible tab
	const visible = openWorkflows.value.slice(0, MAX_VISIBLE_TABS - 1);
	const activeWorkflow = openWorkflows.value[activeIndex];
	if (activeWorkflow) {
		return [...visible, activeWorkflow];
	}
	return visible;
});

const overflowWorkflows = computed(() => {
	if (openWorkflows.value.length <= MAX_VISIBLE_TABS) {
		return [];
	}

	const visibleIds = new Set(
		visibleWorkflows.value.map((w) => w?.workflowId).filter(Boolean),
	);
	return openWorkflows.value.filter((w) => w && !visibleIds.has(w.workflowId));
});

const hasOverflow = computed(() => overflowWorkflows.value.length > 0);

function handleCloseWorkflow(workflowId: string) {
	const workflow = getWorkflowForClose(workflowId);
	if (!workflow) return;

	if (workflow.isDirty) {
		// Show confirmation dialog
		pendingCloseWorkflowId.value = workflowId;
		pendingCloseWorkflowName.value = workflow.name;
		unsavedDialogOpen.value = true;
	} else {
		// Close directly if no unsaved changes
		closeWorkflow(workflowId);
	}
}

function handleConfirmClose() {
	if (pendingCloseWorkflowId.value) {
		closeWorkflow(pendingCloseWorkflowId.value);
	}
	pendingCloseWorkflowId.value = null;
	pendingCloseWorkflowName.value = "";
	unsavedDialogOpen.value = false;
}

function handleSelectWorkflow(workflowId: string) {
	setActiveWorkflow(workflowId);
}

function handleSelectFromDropdown(workflowId: string) {
	moveWorkflowToFront(workflowId);
}

function handleCreateNew() {
	createNewWorkflow();
}

function startRename(workflowId: string, currentName: string) {
	editingWorkflowId.value = workflowId;
	editingName.value = currentName;
	nextTick(() => {
		renameInputRef.value?.focus();
		renameInputRef.value?.select();
	});
}

function finishRename() {
	if (editingWorkflowId.value && editingName.value.trim()) {
		renameWorkflow(editingWorkflowId.value, editingName.value.trim());
	}
	editingWorkflowId.value = null;
	editingName.value = "";
}

function cancelRename() {
	editingWorkflowId.value = null;
	editingName.value = "";
}

function handleRenameKeydown(event: KeyboardEvent) {
	if (event.key === "Enter") {
		finishRename();
	} else if (event.key === "Escape") {
		cancelRename();
	}
}

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}
</script>

<template>
  <div
    v-if="openWorkflows.length > 0"
    class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1 max-w-full overflow-x-auto scrollbar-none"
  >
    <TooltipProvider>
      <!-- Visible Tabs -->
      <Tooltip v-for="workflow in visibleWorkflows" :key="workflow.workflowId">
        <TooltipTrigger as-child>
          <div
            :class="[
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer gap-2 group min-w-[100px] max-w-[180px]',
              activeWorkflowId === workflow.workflowId
                ? 'bg-background text-foreground shadow'
                : 'hover:bg-background/50 text-muted-foreground',
            ]"
            @click="handleSelectWorkflow(workflow.workflowId)"
            @dblclick.stop="startRename(workflow.workflowId, workflow.name)"
          >
            <div class="relative flex-shrink-0">
              <Workflow :size="14" />
            </div>

            <!-- Editing state -->
            <Input
              v-if="editingWorkflowId === workflow.workflowId"
              ref="renameInputRef"
              v-model="editingName"
              class="h-5 text-sm px-1 py-0 w-full min-w-0"
              @blur="finishRename"
              @keydown="handleRenameKeydown"
              @click.stop
            />

            <!-- Display state -->
            <template v-else>
              <span class="text-sm truncate flex-1">
                {{ truncate(workflow.name, 20) }}
                <span v-if="workflow.isDirty" class="text-muted-foreground"
                  >•</span
                >
              </span>
              <Button
                variant="ghost"
                size="icon"
                class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                @click.stop="handleCloseWorkflow(workflow.workflowId)"
              >
                <X :size="12" />
              </Button>
            </template>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{{ workflow.name }}{{ workflow.isDirty ? " (unsaved)" : "" }}</p>
          <p class="text-xs text-muted-foreground">Double-click to rename</p>
        </TooltipContent>
      </Tooltip>

      <!-- Overflow Dropdown -->
      <DropdownMenu v-if="hasOverflow">
        <DropdownMenuTrigger as-child>
          <div
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-normal ring-offset-background transition-all cursor-pointer gap-1 hover:bg-background/50 text-muted-foreground"
          >
            <span class="text-xs">+{{ overflowWorkflows.length }}</span>
            <ChevronDown :size="14" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="w-[220px] max-h-[300px] overflow-y-auto"
        >
          <DropdownMenuItem
            v-for="workflow in overflowWorkflows"
            :key="workflow.workflowId"
            class="cursor-pointer flex items-center gap-2 group"
            @click="handleSelectFromDropdown(workflow.workflowId)"
          >
            <div class="relative flex-shrink-0">
              <Workflow :size="14" />
            </div>
            <span class="flex-1 truncate">
              {{ workflow.name }}
              <span v-if="workflow.isDirty" class="text-muted-foreground"
                >•</span
              >
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Rename"
              @click.stop="
                handleSelectFromDropdown(workflow.workflowId);
                startRename(workflow.workflowId, workflow.name);
              "
            >
              <Pencil :size="12" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Close"
              @click.stop="handleCloseWorkflow(workflow.workflowId)"
            >
              <X :size="12" />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- New Workflow Button -->
      <Tooltip>
        <TooltipTrigger as-child>
          <div
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-normal ring-offset-background transition-all cursor-pointer hover:bg-background/50 text-muted-foreground"
            @click="handleCreateNew"
          >
            <Plus :size="16" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>New workflow</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

  <!-- Empty state when no workflow is open -->
  <div
    v-else
    class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1"
  >
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <div
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-normal ring-offset-background transition-all cursor-pointer hover:bg-background/50 text-muted-foreground gap-2"
            @click="handleCreateNew"
          >
            <Plus :size="16" />
            <span>New workflow</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create a new workflow</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

  <!-- Unsaved Changes Dialog -->
  <UnsavedChangesDialog
    v-model:open="unsavedDialogOpen"
    :workflow-name="pendingCloseWorkflowName"
    @confirm="handleConfirmClose"
  />
</template>
