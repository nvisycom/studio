<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import type { Node, Edge } from "@vue-flow/core";
import { Trash2, Copy, Pencil, Settings, Search } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  canvasMenuNodes,
  filterNodesBySearch,
  hasFilteredResults,
  type NodeDefinition,
} from "./nodeRegistry";
import type { Position } from "./types";

interface Props {
  // Node context menu
  nodeMenuOpen: boolean;
  nodeMenuPosition: Position;
  contextMenuNode: Node | null;
  // Edge context menu
  edgeMenuOpen: boolean;
  edgeMenuPosition: Position;
  contextMenuEdge: Edge | null;
  // Canvas context menu
  canvasMenuOpen: boolean;
  canvasMenuPosition: Position;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:nodeMenuOpen": [value: boolean];
  "update:edgeMenuOpen": [value: boolean];
  "update:canvasMenuOpen": [value: boolean];
  "delete-node": [];
  "duplicate-node": [];
  "configure-node": [];
  "rename-node": [];
  "delete-edge": [];
  "add-node": [node: NodeDefinition];
}>();

// Search state for canvas menu
const canvasMenuSearch = ref("");
const canvasMenuSearchInput = ref<HTMLInputElement | null>(null);

// Filtered nodes based on search
const filteredCanvasMenuNodes = computed(() =>
  filterNodesBySearch(canvasMenuNodes, canvasMenuSearch.value),
);

const hasResults = computed(() =>
  hasFilteredResults(filteredCanvasMenuNodes.value),
);

// Focus search input when canvas menu opens
function focusSearchInput() {
  nextTick(() => {
    setTimeout(() => {
      canvasMenuSearchInput.value?.focus();
    }, 100);
  });
}

// Reset search when menu closes
function handleCanvasMenuOpenChange(open: boolean) {
  if (!open) {
    canvasMenuSearch.value = "";
  }
  emit("update:canvasMenuOpen", open);
}

function handleAddNode(node: NodeDefinition) {
  emit("add-node", node);
}

// Expose focus method
defineExpose({
  focusSearchInput,
});
</script>

<template>
  <!-- Node Context Menu -->
  <DropdownMenu
    :open="props.nodeMenuOpen"
    @update:open="emit('update:nodeMenuOpen', $event)"
  >
    <DropdownMenuTrigger as-child>
      <div
        class="fixed w-0 h-0 pointer-events-none"
        :style="{
          left: `${props.nodeMenuPosition.x}px`,
          top: `${props.nodeMenuPosition.y}px`,
        }"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      v-if="props.contextMenuNode"
      align="start"
      class="w-48"
    >
      <DropdownMenuItem class="cursor-pointer" @click="emit('configure-node')">
        <Settings :size="14" class="mr-2" />
        Configure
      </DropdownMenuItem>
      <DropdownMenuItem class="cursor-pointer" @click="emit('rename-node')">
        <Pencil :size="14" class="mr-2" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem class="cursor-pointer" @click="emit('duplicate-node')">
        <Copy :size="14" class="mr-2" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-red-600 dark:text-red-400 cursor-pointer"
        @click="emit('delete-node')"
      >
        <Trash2 :size="14" class="mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- Edge Context Menu -->
  <DropdownMenu
    :open="props.edgeMenuOpen"
    @update:open="emit('update:edgeMenuOpen', $event)"
  >
    <DropdownMenuTrigger as-child>
      <div
        class="fixed w-0 h-0 pointer-events-none"
        :style="{
          left: `${props.edgeMenuPosition.x}px`,
          top: `${props.edgeMenuPosition.y}px`,
        }"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      v-if="props.contextMenuEdge"
      align="start"
      class="w-48"
    >
      <DropdownMenuItem
        class="text-red-600 dark:text-red-400 cursor-pointer"
        @click="emit('delete-edge')"
      >
        <Trash2 :size="14" class="mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- Canvas Context Menu (Add Node) -->
  <DropdownMenu
    :open="props.canvasMenuOpen"
    @update:open="handleCanvasMenuOpenChange"
  >
    <DropdownMenuTrigger as-child>
      <div
        class="fixed w-0 h-0 pointer-events-none"
        :style="{
          left: `${props.canvasMenuPosition.x}px`,
          top: `${props.canvasMenuPosition.y}px`,
        }"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-56 p-0">
      <!-- Search Input -->
      <div class="p-2 border-b border-border">
        <div class="relative">
          <Search
            class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            ref="canvasMenuSearchInput"
            v-model="canvasMenuSearch"
            type="text"
            placeholder="Search nodes..."
            class="flex h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            @click.stop
            @keydown.stop
          />
        </div>
      </div>

      <!-- Scrollable nodes list -->
      <div class="max-h-[320px] overflow-y-scroll pr-1">
        <!-- Inputs -->
        <template v-if="filteredCanvasMenuNodes.inputs.length > 0">
          <div
            class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Inputs
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.inputs"
            :key="node.type"
            class="cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component :is="node.icon" :size="14" class="mr-2" />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- Flow -->
        <template v-if="filteredCanvasMenuNodes.flow.length > 0">
          <DropdownMenuSeparator
            v-if="filteredCanvasMenuNodes.inputs.length > 0"
          />
          <div
            class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Flow
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.flow"
            :key="node.type"
            class="cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component :is="node.icon" :size="14" class="mr-2" />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- Transform -->
        <template v-if="filteredCanvasMenuNodes.transform.length > 0">
          <DropdownMenuSeparator
            v-if="
              filteredCanvasMenuNodes.inputs.length > 0 ||
              filteredCanvasMenuNodes.flow.length > 0
            "
          />
          <div
            class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Transform
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.transform"
            :key="node.type"
            class="cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component :is="node.icon" :size="14" class="mr-2" />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- Outputs -->
        <template v-if="filteredCanvasMenuNodes.outputs.length > 0">
          <DropdownMenuSeparator
            v-if="
              filteredCanvasMenuNodes.inputs.length > 0 ||
              filteredCanvasMenuNodes.flow.length > 0 ||
              filteredCanvasMenuNodes.transform.length > 0
            "
          />
          <div
            class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Outputs
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.outputs"
            :key="node.type"
            class="cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component :is="node.icon" :size="14" class="mr-2" />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- Notify -->
        <template v-if="filteredCanvasMenuNodes.notify.length > 0">
          <DropdownMenuSeparator
            v-if="
              filteredCanvasMenuNodes.inputs.length > 0 ||
              filteredCanvasMenuNodes.flow.length > 0 ||
              filteredCanvasMenuNodes.transform.length > 0 ||
              filteredCanvasMenuNodes.outputs.length > 0
            "
          />
          <div
            class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Notify
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.notify"
            :key="node.type"
            class="cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component :is="node.icon" :size="14" class="mr-2" />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- No results -->
        <div
          v-if="!hasResults"
          class="px-2 py-4 text-sm text-muted-foreground text-center"
        >
          No nodes found
        </div>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
