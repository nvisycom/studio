<script setup lang="ts">
import { PanelRightClose, PanelRightOpen } from "@lucide/vue";
import { VueFlow, useVueFlow, type Node, type Edge } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import WorkflowMinimap from "./WorkflowMinimap.vue";
import WorkflowToolbar from "./WorkflowToolbar.vue";
import WorkflowContextMenus from "./WorkflowContextMenus.vue";
import {
	nodeTypes,
	getRegistryEntryByDefinition,
	getConfigPanelForNodeType,
	type NodeDefinition,
} from "./nodeRegistry";
import { validateWorkflow, type ValidationResult } from "./workflowValidation";
import {
	loadWorkflowData,
	saveWorkflowData,
} from "#console/composables/useWorkflowStorage";
import { useWorkflowHistory } from "#console/composables/useWorkflowHistory";
import { Button } from "#console/components/ui/button";
import { WorkflowErrorDialog, WorkflowWarningDialog } from "./dialogs";
import AddButtonEdge from "./edges/AddButtonEdge.vue";
import type { Position } from "./types";

// Custom edge types
const edgeTypes = {
	addButton: AddButtonEdge,
};

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "./workflow-canvas.css";

interface Props {
	chatVisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	chatVisible: true,
});

const emit = defineEmits<{
	"toggle-chat": [];
	"select-config-node": [node: Node | null];
	"update-node": [nodeId: string, data: Record<string, unknown>];
}>();

// Get active workflow from composable
const { activeWorkflowId, markDirty, markClean } = useEditorWorkflows();

// Reactive nodes and edges. shallowRef matches VueFlow's own shallow internal
// state: these are synced wholesale via v-model (whole reassignment triggers
// reactivity), so deep-unwrapping VueFlow's Node/Edge generics is both wasted
// overhead and the source of excessively-deep type instantiation under vue-tsc.
const nodes = shallowRef<Node[]>([]);
const edges = shallowRef<Edge[]>([]);

// Generate unique node ID combining workflow ID and timestamp
function generateNodeId(): string {
	return `${activeWorkflowId.value}-${Date.now()}`;
}

// History management
const { canUndo, canRedo, pushState, undo, redo, isUndoing } =
	useWorkflowHistory(activeWorkflowId);

// Track if we should push to history (to avoid pushing during undo/redo)
let shouldPushHistory = true;
// Track if we should auto-save (to avoid saving during workflow switch)
let shouldAutoSave = true;

// Save current workflow state
function saveCurrentWorkflow() {
	if (activeWorkflowId.value && nodes.value.length > 0) {
		saveWorkflowData(activeWorkflowId.value, {
			nodes: nodes.value,
			edges: edges.value,
		});
	}
}

// Save on page unload (refresh/close)
onMounted(() => {
	window.addEventListener("beforeunload", saveCurrentWorkflow);
});

onUnmounted(() => {
	saveCurrentWorkflow();
	window.removeEventListener("beforeunload", saveCurrentWorkflow);
});

// Context menu state
const nodeMenuOpen = ref(false);
const nodeMenuPosition = ref<Position>({ x: 0, y: 0 });
const contextMenuNode = ref<Node | null>(null);

const edgeMenuOpen = ref(false);
const edgeMenuPosition = ref<Position>({ x: 0, y: 0 });
const contextMenuEdge = ref<Edge | null>(null);

const canvasMenuOpen = ref(false);
const canvasMenuPosition = ref<Position>({ x: 0, y: 0 });
const canvasDropPosition = ref<Position>({ x: 0, y: 0 });

// Edge insertion state (for adding node on edge)
const insertOnEdgeId = ref<string | null>(null);
const insertOnEdgeSourceId = ref<string | null>(null);
const insertOnEdgeTargetId = ref<string | null>(null);

// Config panel state
const selectedConfigNode = ref<Node | null>(null);

// Emit when selected config node changes
watch(selectedConfigNode, (node) => {
	emit("select-config-node", node);
});

// Helper to reset edge insertion state
function resetEdgeInsertionState() {
	insertOnEdgeId.value = null;
	insertOnEdgeSourceId.value = null;
	insertOnEdgeTargetId.value = null;
}

// Dialog state
const errorDialogOpen = ref(false);
const errorDialogMessages = ref<string[]>([]);
const warningDialogOpen = ref(false);
const warningDialogMessages = ref<string[]>([]);

// Context menus component ref
const contextMenusRef = ref<InstanceType<typeof WorkflowContextMenus> | null>(
	null,
);

const {
	addNodes,
	removeNodes,
	addEdges,
	removeEdges,
	updateNode,
	setNodes,
	setEdges,
	addSelectedNodes,
	addSelectedEdges,
	getSelectedNodes,
	project,
	vueFlowRef,
	fitView,
	onNodeContextMenu,
	onNodeClick,
	onEdgeContextMenu,
	onEdgesChange,
	onNodesChange,
	onConnect,
	onPaneClick,
	onPaneContextMenu,
	getEdges,
	getNodes,
	viewport,
} = useVueFlow("workflow-canvas");

// Watch for active workflow changes and load/save data
watch(
	activeWorkflowId,
	(newId, oldId) => {
		// Save current workflow before switching
		if (oldId && (nodes.value.length > 0 || edges.value.length > 0)) {
			saveWorkflowData(oldId, {
				nodes: nodes.value,
				edges: edges.value,
			});
		}

		// Load new workflow
		if (newId) {
			const data = loadWorkflowData(newId);
			shouldPushHistory = false;
			shouldAutoSave = false;
			// Use setNodes/setEdges to properly reset Vue Flow's internal state
			setNodes(data.nodes);
			setEdges(data.edges);
			nextTick(() => {
				shouldPushHistory = true;
				shouldAutoSave = true;
			});
		} else {
			shouldAutoSave = false;
			setNodes([]);
			setEdges([]);
			nextTick(() => {
				shouldAutoSave = true;
			});
		}
	},
	{ immediate: true },
);

// Auto-save on changes and push to history
watch(
	[nodes, edges],
	(newVal, oldVal) => {
		if (activeWorkflowId.value && shouldAutoSave) {
			saveWorkflowData(activeWorkflowId.value, {
				nodes: nodes.value,
				edges: edges.value,
			});
			// Mark workflow as dirty if it has nodes
			if (nodes.value.length > 0) {
				markDirty(activeWorkflowId.value);
			}

			// Push to history if this is a user action (not undo/redo)
			if (shouldPushHistory && !isUndoing.value && oldVal) {
				const [oldNodes, oldEdges] = oldVal;
				const [newNodes, newEdges] = newVal;
				if (oldNodes && oldEdges && newNodes && newEdges) {
					pushState(oldNodes, oldEdges, newNodes, newEdges);
				}
			}
		}
	},
	{ deep: true },
);

// Handler for adding node on edge - provided to custom edge component
function handleEdgeAddNode(
	edgeId: string,
	position: Position,
	sourceNodeId: string,
	targetNodeId: string,
) {
	// Store edge info for when node is selected from menu
	insertOnEdgeId.value = edgeId;
	insertOnEdgeSourceId.value = sourceNodeId;
	insertOnEdgeTargetId.value = targetNodeId;

	// Set position for new node and open context menu
	canvasDropPosition.value = position;

	// Calculate screen position for menu (convert from flow coordinates)
	const { left, top } = vueFlowRef.value!.getBoundingClientRect();
	const { x, y, zoom } = viewport.value;
	const screenX = position.x * zoom + x + left;
	const screenY = position.y * zoom + y + top;

	canvasMenuPosition.value = { x: screenX, y: screenY };
	canvasMenuOpen.value = true;

	// Focus search input after menu opens
	contextMenusRef.value?.focusSearchInput();
}

// Provide the handler to edge components
provide("onEdgeAddNode", handleEdgeAddNode);

/**
 * Extract client coordinates from mouse or touch event
 */
function getEventCoordinates(event: MouseEvent | TouchEvent): Position {
	if ("clientX" in event) {
		return { x: event.clientX, y: event.clientY };
	}
	// Touch event - use first touch point
	const touch = event.touches[0] || event.changedTouches[0];
	return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
}

// Handle new connections
onConnect((connection) => {
	addEdges([
		{
			...connection,
			id: `e${connection.source}-${connection.target}-${Date.now()}`,
			type: "addButton",
		},
	]);
	// Sync edges ref with Vue Flow's internal state for persistence
	nextTick(() => {
		edges.value = getEdges.value;
	});
});

// Sync edges when they change (including keyboard deletions)
onEdgesChange((changes) => {
	// Check if any edges were removed
	const hasRemovals = changes.some((change) => change.type === "remove");
	if (hasRemovals) {
		nextTick(() => {
			edges.value = getEdges.value;
		});
	}
});

// Sync nodes when they change (including keyboard deletions)
onNodesChange((changes) => {
	// Check if any nodes were removed
	const hasRemovals = changes.some((change) => change.type === "remove");
	if (hasRemovals) {
		nextTick(() => {
			nodes.value = getNodes.value;
		});
	}
});

// Handle node click - close context menus and open config panel if available
onNodeClick(({ node }) => {
	nodeMenuOpen.value = false;
	edgeMenuOpen.value = false;
	canvasMenuOpen.value = false;
	// Open config panel if the node type has one defined in the registry
	if (node.type && getConfigPanelForNodeType(node.type)) {
		selectedConfigNode.value = node;
	} else {
		selectedConfigNode.value = null;
	}
});

// Handle node right-click
onNodeContextMenu(({ event, node }) => {
	event.preventDefault();
	edgeMenuOpen.value = false;
	canvasMenuOpen.value = false;
	addSelectedNodes([node]);
	contextMenuNode.value = node;
	nodeMenuPosition.value = getEventCoordinates(event);
	nodeMenuOpen.value = true;
});

// Handle edge right-click
onEdgeContextMenu(({ event, edge }) => {
	event.preventDefault();
	nodeMenuOpen.value = false;
	addSelectedEdges([edge]);
	contextMenuEdge.value = edge;
	edgeMenuPosition.value = getEventCoordinates(event);
	edgeMenuOpen.value = true;
});

// Handle pane (canvas) right-click to add nodes
onPaneContextMenu((event) => {
	event.preventDefault();
	nodeMenuOpen.value = false;
	edgeMenuOpen.value = false;

	const coords = getEventCoordinates(event);
	const { left, top } = vueFlowRef.value!.getBoundingClientRect();
	canvasDropPosition.value = project({
		x: coords.x - left,
		y: coords.y - top,
	});
	canvasMenuPosition.value = coords;
	canvasMenuOpen.value = true;

	// Focus search input after menu opens
	contextMenusRef.value?.focusSearchInput();
});

// Close config panel and context menus when clicking on empty canvas
onPaneClick(() => {
	selectedConfigNode.value = null;
	nodeMenuOpen.value = false;
	edgeMenuOpen.value = false;
	canvasMenuOpen.value = false;
	resetEdgeInsertionState();
});

function onDragOver(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}
}

function onDrop(event: DragEvent) {
	const data = event.dataTransfer?.getData("application/vueflow");
	if (!data) return;

	const { category, type } = JSON.parse(data);

	const { left, top } = vueFlowRef.value!.getBoundingClientRect();
	const position = project({
		x: event.clientX - left,
		y: event.clientY - top,
	});

	// Get node data from registry
	const entry = getRegistryEntryByDefinition({
		type,
		category,
		label: "",
		icon: {} as any,
	});
	const nodeData = entry ? entry.createDefaultData() : { label: type, type };

	const newNode: Node = {
		id: generateNodeId(),
		type: category,
		position,
		data: nodeData,
	};

	addNodes([newNode]);
}

// Toolbar handlers
function handleFitView() {
	fitView({ padding: 0.2 });
}

function handleToggleChat() {
	emit("toggle-chat");
}

function handleRun() {
	// Validate workflow before running
	const result = validateWorkflow(nodes.value, edges.value);
	if (!result.isValid) {
		errorDialogMessages.value = result.errors.map((e) => e.message);
		errorDialogOpen.value = true;
		return;
	}

	if (result.warnings.length > 0) {
		warningDialogMessages.value = result.warnings.map((w) => w.message);
		warningDialogOpen.value = true;
		return;
	}

	executeWorkflow();
}

function executeWorkflow() {
	// TODO: Implement actual workflow execution
	console.log("Run workflow:", activeWorkflowId.value);
}

function handleWarningConfirm() {
	warningDialogOpen.value = false;
	executeWorkflow();
}

function handleSave() {
	// Force save current workflow state
	if (activeWorkflowId.value) {
		saveWorkflowData(activeWorkflowId.value, {
			nodes: nodes.value,
			edges: edges.value,
		});
		markClean(activeWorkflowId.value);
		console.log("Saved workflow:", activeWorkflowId.value);
	}
}

function handleUndo() {
	const result = undo(nodes.value, edges.value);
	if (result) {
		shouldPushHistory = false;
		nodes.value = result.state.nodes;
		edges.value = result.state.edges;
		nextTick(() => {
			shouldPushHistory = true;
			result.done();
		});
	}
}

function handleRedo() {
	const result = redo(nodes.value, edges.value);
	if (result) {
		shouldPushHistory = false;
		nodes.value = result.state.nodes;
		edges.value = result.state.edges;
		nextTick(() => {
			shouldPushHistory = true;
			result.done();
		});
	}
}

function handleDuplicateSelected() {
	const selected = getSelectedNodes.value;
	if (selected.length === 0) return;

	const newNodes: Node[] = selected.map((node) => ({
		id: generateNodeId(),
		type: node.type,
		position: {
			x: node.position.x + 50,
			y: node.position.y + 50,
		},
		data: { ...node.data },
	}));

	addNodes(newNodes);
}

function handleSelectAll() {
	addSelectedNodes(getNodes.value);
}

function handleEscape() {
	selectedConfigNode.value = null;
	nodeMenuOpen.value = false;
	edgeMenuOpen.value = false;
	canvasMenuOpen.value = false;
	resetEdgeInsertionState();
}

// Keyboard shortcuts
defineShortcuts({
	meta_s: handleSave,
	meta_z: handleUndo,
	meta_shift_z: handleRedo,
	meta_y: handleRedo,
	meta_d: handleDuplicateSelected,
	meta_a: handleSelectAll,
	escape: handleEscape,
});

// Node context menu handlers
function handleDeleteNode() {
	if (contextMenuNode.value) {
		removeNodes([contextMenuNode.value.id]);
		nodeMenuOpen.value = false;
	}
}

function handleDuplicateNode() {
	if (contextMenuNode.value) {
		const newNode: Node = {
			id: generateNodeId(),
			type: contextMenuNode.value.type,
			position: {
				x: contextMenuNode.value.position.x + 50,
				y: contextMenuNode.value.position.y + 50,
			},
			data: { ...contextMenuNode.value.data },
		};
		addNodes([newNode]);
		nodeMenuOpen.value = false;
	}
}

function handleConfigureNode() {
	// Only open config panel if the node type has one defined in the registry
	if (
		contextMenuNode.value?.type &&
		getConfigPanelForNodeType(contextMenuNode.value.type)
	) {
		selectedConfigNode.value = contextMenuNode.value;
	}
	nodeMenuOpen.value = false;
}

function handleRenameNode() {
	console.log("Rename node:", contextMenuNode.value);
	nodeMenuOpen.value = false;
}

// Edge context menu handlers
function handleDeleteEdge() {
	if (contextMenuEdge.value) {
		removeEdges([contextMenuEdge.value.id]);
		edgeMenuOpen.value = false;
	}
}

// Canvas context menu handlers
function handleAddNodeFromCanvas(nodeDef: NodeDefinition) {
	// Get node data from registry
	const entry = getRegistryEntryByDefinition(nodeDef);
	const nodeData = entry
		? entry.createDefaultData()
		: { label: nodeDef.label, type: nodeDef.type };

	const newNodeId = generateNodeId();
	const newNode: Node = {
		id: newNodeId,
		type: nodeDef.category,
		position: { ...canvasDropPosition.value },
		data: nodeData,
	};
	addNodes([newNode]);

	// If inserting on an edge, rewire connections
	if (
		insertOnEdgeId.value &&
		insertOnEdgeSourceId.value &&
		insertOnEdgeTargetId.value
	) {
		// Remove the original edge
		removeEdges([insertOnEdgeId.value]);

		// Add new edges: source -> new node -> target
		addEdges([
			{
				id: `e${insertOnEdgeSourceId.value}-${newNodeId}-${Date.now()}`,
				source: insertOnEdgeSourceId.value,
				target: newNodeId,
				type: "addButton",
			},
			{
				id: `e${newNodeId}-${insertOnEdgeTargetId.value}-${Date.now() + 1}`,
				source: newNodeId,
				target: insertOnEdgeTargetId.value,
				type: "addButton",
			},
		]);

		// Sync edges
		nextTick(() => {
			edges.value = getEdges.value;
		});

		// Reset edge insertion state
		resetEdgeInsertionState();
	}

	canvasMenuOpen.value = false;
}

// Config panel handlers - exposed for parent to call via event
function handleUpdateNode(
	nodeIdToUpdate: string,
	data: Record<string, unknown>,
) {
	updateNode(nodeIdToUpdate, { data });
	// Update the selected node ref to reflect changes
	const node = nodes.value.find((n) => n.id === nodeIdToUpdate);
	if (node) {
		selectedConfigNode.value = { ...node, data };
	}
}

// Expose method for parent to update nodes
defineExpose({
	updateNodeData: handleUpdateNode,
});
</script>

<template>
  <div class="h-full w-full relative workflow-canvas">
    <!-- Toolbar -->
    <WorkflowToolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      @fit-view="handleFitView"
      @run="handleRun"
      @save="handleSave"
      @undo="handleUndo"
      @redo="handleRedo"
    />

    <!-- Vue Flow Canvas -->
    <ClientOnly>
      <VueFlow
        id="workflow-canvas"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :edges-updatable="true"
        :delete-key-code="['Backspace', 'Delete']"
        fit-view-on-init
        class="bg-muted/30"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <Background pattern-color="hsl(var(--border))" :gap="20" />
        <WorkflowMinimap />
      </VueFlow>
    </ClientOnly>

    <!-- Chat Toggle Button -->
    <Button
      variant="ghost"
      size="sm"
      class="absolute bottom-4 right-4 z-10 h-8 w-8 p-0 bg-background shadow-sm border border-border rounded-lg"
      :title="props.chatVisible ? 'Hide Chat' : 'Show Chat'"
      @click="handleToggleChat"
    >
      <PanelRightClose v-if="props.chatVisible" class="w-4 h-4" />
      <PanelRightOpen v-else class="w-4 h-4" />
    </Button>

    <!-- Context Menus -->
    <WorkflowContextMenus
      ref="contextMenusRef"
      v-model:node-menu-open="nodeMenuOpen"
      v-model:edge-menu-open="edgeMenuOpen"
      v-model:canvas-menu-open="canvasMenuOpen"
      :node-menu-position="nodeMenuPosition"
      :edge-menu-position="edgeMenuPosition"
      :canvas-menu-position="canvasMenuPosition"
      :context-menu-node="contextMenuNode"
      :context-menu-edge="contextMenuEdge"
      :is-edge-insertion="insertOnEdgeId !== null"
      @delete-node="handleDeleteNode"
      @duplicate-node="handleDuplicateNode"
      @configure-node="handleConfigureNode"
      @rename-node="handleRenameNode"
      @delete-edge="handleDeleteEdge"
      @add-node="handleAddNodeFromCanvas"
    />

    <!-- Validation Error Dialog -->
    <WorkflowErrorDialog
      v-model:open="errorDialogOpen"
      :messages="errorDialogMessages"
    />

    <!-- Validation Warning Dialog -->
    <WorkflowWarningDialog
      v-model:open="warningDialogOpen"
      :messages="warningDialogMessages"
      @confirm="handleWarningConfirm"
    />
  </div>
</template>
