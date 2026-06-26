<script setup lang="ts">
import { useVueFlow } from "@vue-flow/core";
import { Undo2, Redo2, Trash2, Play, Save, MoreHorizontal } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "#console/components/ui/dropdown-menu";

interface Props {
	canUndo: boolean;
	canRedo: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	undo: [];
	redo: [];
	save: [];
	run: [];
	deleteSelected: [];
}>();

const { getSelectedNodes, getSelectedEdges } = useVueFlow("workflow-canvas");

function handleUndo() {
	emit("undo");
}

function handleRedo() {
	emit("redo");
}

function handleDelete() {
	emit("deleteSelected");
}

function handleSave() {
	emit("save");
}

function handleRun() {
	emit("run");
}

const hasSelection = computed(
	() => getSelectedNodes.value.length > 0 || getSelectedEdges.value.length > 0,
);
</script>

<template>
  <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
    <div
      class="flex items-center gap-1 px-2 py-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-sm"
    >
      <!-- Undo/Redo -->
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0"
        :disabled="!props.canUndo"
        title="Undo (⌘Z)"
        @click="handleUndo"
      >
        <Undo2 class="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0"
        :disabled="!props.canRedo"
        title="Redo (⌘⇧Z)"
        @click="handleRedo"
      >
        <Redo2 class="w-3.5 h-3.5" />
      </Button>

      <div class="w-px h-4 bg-border mx-1" />

      <!-- Delete -->
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0"
        :disabled="!hasSelection"
        title="Delete selected"
        @click="handleDelete"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </Button>

      <div class="w-px h-4 bg-border mx-1" />

      <!-- Save & Run -->
      <Button
        variant="ghost"
        size="sm"
        class="h-7 px-2 gap-1.5 text-xs"
        title="Save workflow"
        @click="handleSave"
      >
        <Save class="w-3.5 h-3.5" />
        Save
      </Button>
      <Button
        size="sm"
        class="h-7 px-2 gap-1.5 text-xs"
        title="Run workflow"
        @click="handleRun"
      >
        <Play class="w-3.5 h-3.5" />
        Run
      </Button>

      <!-- More options -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-7 w-7 p-0">
            <MoreHorizontal class="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuItem class="text-xs">Export as JSON</DropdownMenuItem>
          <DropdownMenuItem class="text-xs">Import from JSON</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-xs">Clear canvas</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
