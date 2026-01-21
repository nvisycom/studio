import { ref, computed, watch, type Ref } from "vue";
import type { Node, Edge } from "@vue-flow/core";

interface HistoryState {
	nodes: Node[];
	edges: Edge[];
}

const MAX_HISTORY_SIZE = 50;
const DEBOUNCE_DELAY = 300; // ms to wait before committing to history

// Per-workflow history stacks - using reactive refs
const historyStacks = ref<
	Map<
		string,
		{
			past: HistoryState[];
			future: HistoryState[];
		}
	>
>(new Map());

/**
 * Get or create history stack for a workflow
 */
function getHistoryStack(workflowId: string) {
	if (!historyStacks.value.has(workflowId)) {
		historyStacks.value.set(workflowId, { past: [], future: [] });
	}
	return historyStacks.value.get(workflowId)!;
}

/**
 * Deep clone nodes and edges for history
 */
function cloneState(nodes: Node[], edges: Edge[]): HistoryState {
	return {
		nodes: JSON.parse(JSON.stringify(nodes)),
		edges: JSON.parse(JSON.stringify(edges)),
	};
}

/**
 * Compare two states to check if they're meaningfully different
 * (ignores selection state, only compares structure)
 */
function statesAreDifferent(a: HistoryState, b: HistoryState): boolean {
	// Different number of nodes or edges
	if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) {
		return true;
	}

	// Check if node IDs, types, positions, or data changed
	for (let i = 0; i < a.nodes.length; i++) {
		const nodeA = a.nodes[i];
		const nodeB = b.nodes.find((n) => n.id === nodeA.id);
		if (!nodeB) return true;
		if (nodeA.type !== nodeB.type) return true;
		if (
			nodeA.position.x !== nodeB.position.x ||
			nodeA.position.y !== nodeB.position.y
		)
			return true;
		if (JSON.stringify(nodeA.data) !== JSON.stringify(nodeB.data)) return true;
	}

	// Check if edge connections changed
	for (let i = 0; i < a.edges.length; i++) {
		const edgeA = a.edges[i];
		const edgeB = b.edges.find((e) => e.id === edgeA.id);
		if (!edgeB) return true;
		if (edgeA.source !== edgeB.source || edgeA.target !== edgeB.target)
			return true;
	}

	return false;
}

/**
 * Composable for managing workflow undo/redo history
 */
export function useWorkflowHistory(workflowId: Ref<string | null>) {
	const isUndoing = ref(false);

	// Local reactive counters to trigger reactivity updates
	const historyVersion = ref(0);

	// Debounce timer and pending state
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let pendingState: HistoryState | null = null;

	const canUndo = computed(() => {
		// Access historyVersion to create dependency
		historyVersion.value;
		if (!workflowId.value) return false;
		const stack = getHistoryStack(workflowId.value);
		return stack.past.length > 0;
	});

	const canRedo = computed(() => {
		// Access historyVersion to create dependency
		historyVersion.value;
		if (!workflowId.value) return false;
		const stack = getHistoryStack(workflowId.value);
		return stack.future.length > 0;
	});

	// Update version when workflow changes
	watch(workflowId, () => {
		historyVersion.value++;
		// Clear any pending debounce when switching workflows
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
			pendingState = null;
		}
	});

	// Track the current (new) state to compare against when committing
	let currentStateSnapshot: HistoryState | null = null;

	/**
	 * Commit the pending state to history
	 */
	function commitPendingState() {
		if (!workflowId.value || !pendingState || !currentStateSnapshot) {
			pendingState = null;
			currentStateSnapshot = null;
			debounceTimer = null;
			return;
		}

		// Only push if the current state is meaningfully different from the pending (before) state
		// This filters out selection-only changes
		if (!statesAreDifferent(pendingState, currentStateSnapshot)) {
			pendingState = null;
			currentStateSnapshot = null;
			debounceTimer = null;
			return;
		}

		const stack = getHistoryStack(workflowId.value);

		// Only push if different from the last state in history (avoid duplicates)
		const lastState = stack.past[stack.past.length - 1];
		if (!lastState || statesAreDifferent(lastState, pendingState)) {
			stack.past.push(pendingState);

			// Limit history size
			if (stack.past.length > MAX_HISTORY_SIZE) {
				stack.past.shift();
			}

			// Clear future on new action
			stack.future = [];

			// Trigger reactivity update
			historyVersion.value++;
		}

		pendingState = null;
		currentStateSnapshot = null;
		debounceTimer = null;
	}

	/**
	 * Push state change to history (debounced to batch rapid changes)
	 * @param oldNodes - nodes before the change
	 * @param oldEdges - edges before the change
	 * @param newNodes - nodes after the change
	 * @param newEdges - edges after the change
	 */
	function pushState(
		oldNodes: Node[],
		oldEdges: Edge[],
		newNodes: Node[],
		newEdges: Edge[],
	) {
		if (!workflowId.value || isUndoing.value) return;

		// Clone the old state (the "before" state we'll restore on undo)
		const oldState = cloneState(oldNodes, oldEdges);
		// Clone the new state (the "after" state to compare against)
		const newState = cloneState(newNodes, newEdges);

		// If no pending state, this is the start of a new change
		if (!pendingState) {
			pendingState = oldState;
		}
		// Always update the current snapshot to the latest "after" state
		currentStateSnapshot = newState;

		// Reset debounce timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(commitPendingState, DEBOUNCE_DELAY);
	}

	/**
	 * Force commit any pending state immediately (call before undo/redo)
	 */
	function flushPendingState() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			commitPendingState();
		}
	}

	/**
	 * Undo to previous state
	 * Returns the state to restore, and a cleanup function to call after applying
	 */
	function undo(
		currentNodes: Node[],
		currentEdges: Edge[],
	): { state: HistoryState; done: () => void } | null {
		if (!workflowId.value) return null;

		// Flush any pending changes first
		flushPendingState();

		const stack = getHistoryStack(workflowId.value);
		if (stack.past.length === 0) return null;

		isUndoing.value = true;

		// Save current state to future
		stack.future.push(cloneState(currentNodes, currentEdges));

		// Pop and return previous state
		const previousState = stack.past.pop()!;

		// Trigger reactivity update
		historyVersion.value++;

		return {
			state: previousState,
			done: () => {
				isUndoing.value = false;
			},
		};
	}

	/**
	 * Redo to next state
	 * Returns the state to restore, and a cleanup function to call after applying
	 */
	function redo(
		currentNodes: Node[],
		currentEdges: Edge[],
	): { state: HistoryState; done: () => void } | null {
		if (!workflowId.value) return null;

		// Flush any pending changes first
		flushPendingState();

		const stack = getHistoryStack(workflowId.value);
		if (stack.future.length === 0) return null;

		isUndoing.value = true;

		// Save current state to past
		stack.past.push(cloneState(currentNodes, currentEdges));

		// Pop and return future state
		const nextState = stack.future.pop()!;

		// Trigger reactivity update
		historyVersion.value++;

		return {
			state: nextState,
			done: () => {
				isUndoing.value = false;
			},
		};
	}

	/**
	 * Clear history for current workflow
	 */
	function clearHistory() {
		if (!workflowId.value) return;
		historyStacks.value.delete(workflowId.value);
		historyVersion.value++;
	}

	return {
		canUndo,
		canRedo,
		pushState,
		undo,
		redo,
		clearHistory,
		isUndoing,
	};
}
