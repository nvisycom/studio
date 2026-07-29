<script setup lang="ts">
import type { Node, Edge } from "@vue-flow/core";
import { Trash2, Copy, Pencil, Settings, Search } from "@lucide/vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "#console/components/ui/dropdown-menu";
import {
	canvasMenuNodes,
	filterNodesBySearch,
	filterNodesForEdgeInsertion,
	hasFilteredResults,
	type NodeDefinition,
} from "./nodeRegistry";
import type { Position } from "./types";

interface Props {
	nodeMenuOpen: boolean;
	nodeMenuPosition: Position;
	contextMenuNode: Node | null;
	edgeMenuOpen: boolean;
	edgeMenuPosition: Position;
	contextMenuEdge: Edge | null;
	canvasMenuOpen: boolean;
	canvasMenuPosition: Position;
	isEdgeInsertion?: boolean;
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

const canvasMenuSearch = ref("");
const canvasMenuSearchInput = ref<HTMLInputElement | null>(null);

const baseNodes = computed(() =>
	props.isEdgeInsertion
		? filterNodesForEdgeInsertion(canvasMenuNodes)
		: canvasMenuNodes,
);

const filteredCanvasMenuNodes = computed(() =>
	filterNodesBySearch(baseNodes.value, canvasMenuSearch.value),
);

const hasResults = computed(() =>
	hasFilteredResults(filteredCanvasMenuNodes.value),
);

function focusSearchInput() {
	nextTick(() => {
		setTimeout(() => {
			canvasMenuSearchInput.value?.focus();
		}, 100);
	});
}

function handleCanvasMenuOpenChange(open: boolean) {
	if (!open) {
		canvasMenuSearch.value = "";
	}
	emit("update:canvasMenuOpen", open);
}

function handleAddNode(node: NodeDefinition) {
	emit("add-node", node);
}

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
      class="min-w-40 p-1 bg-card/95 backdrop-blur-sm"
    >
      <DropdownMenuItem
        class="gap-2 text-[0.8125rem] cursor-pointer"
        @click="emit('configure-node')"
      >
        <Settings class="w-3.5 h-3.5 text-muted-foreground" />
        Configure
      </DropdownMenuItem>
      <DropdownMenuItem
        class="gap-2 text-[0.8125rem] cursor-pointer"
        @click="emit('rename-node')"
      >
        <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        class="gap-2 text-[0.8125rem] cursor-pointer"
        @click="emit('duplicate-node')"
      >
        <Copy class="w-3.5 h-3.5 text-muted-foreground" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="gap-2 text-[0.8125rem] text-destructive cursor-pointer"
        @click="emit('delete-node')"
      >
        <Trash2 class="w-3.5 h-3.5" />
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
      class="min-w-40 p-1 bg-card/95 backdrop-blur-sm"
    >
      <DropdownMenuItem
        class="gap-2 text-[0.8125rem] text-destructive cursor-pointer"
        @click="emit('delete-edge')"
      >
        <Trash2 class="w-3.5 h-3.5" />
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
    <DropdownMenuContent
      align="start"
      class="w-56 p-0 bg-card/95 backdrop-blur-sm overflow-hidden"
    >
      <!-- Search Input -->
      <div class="p-2 border-b border-border">
        <div class="relative">
          <Search
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
          />
          <input
            ref="canvasMenuSearchInput"
            v-model="canvasMenuSearch"
            type="text"
            placeholder="Search nodes..."
            class="w-full h-8 pl-8 pr-3 text-[0.8125rem] bg-muted/50 border border-transparent rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border transition-all"
            @click.stop
            @keydown.stop
          />
        </div>
      </div>

      <!-- Scrollable nodes list -->
      <div class="max-h-80 overflow-y-auto p-1">
        <!-- Inputs -->
        <template v-if="filteredCanvasMenuNodes.inputs.length > 0">
          <div
            class="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Inputs
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.inputs"
            :key="node.type"
            class="gap-2 text-[0.8125rem] cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component
              :is="node.icon"
              class="w-3.5 h-3.5 text-muted-foreground"
            />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- Flow -->
        <template v-if="filteredCanvasMenuNodes.flow.length > 0">
          <DropdownMenuSeparator
            v-if="filteredCanvasMenuNodes.inputs.length > 0"
          />
          <div
            class="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Flow
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.flow"
            :key="node.type"
            class="gap-2 text-[0.8125rem] cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component
              :is="node.icon"
              class="w-3.5 h-3.5 text-muted-foreground"
            />
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
            class="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Transform
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.transform"
            :key="node.type"
            class="gap-2 text-[0.8125rem] cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component
              :is="node.icon"
              class="w-3.5 h-3.5 text-muted-foreground"
            />
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
            class="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Outputs
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.outputs"
            :key="node.type"
            class="gap-2 text-[0.8125rem] cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component
              :is="node.icon"
              class="w-3.5 h-3.5 text-muted-foreground"
            />
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
            class="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Notify
          </div>
          <DropdownMenuItem
            v-for="node in filteredCanvasMenuNodes.notify"
            :key="node.type"
            class="gap-2 text-[0.8125rem] cursor-pointer"
            @click="handleAddNode(node)"
          >
            <component
              :is="node.icon"
              class="w-3.5 h-3.5 text-muted-foreground"
            />
            {{ node.label }}
          </DropdownMenuItem>
        </template>

        <!-- No results -->
        <div
          v-if="!hasResults"
          class="px-2.5 py-6 text-[0.8125rem] text-center text-muted-foreground"
        >
          No nodes found
        </div>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
