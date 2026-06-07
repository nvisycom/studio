export interface OpenWorkflow {
	workflowId: string;
	name: string;
	isNew: boolean;
	isDirty: boolean;
}

interface PersistedState {
	openWorkflows: OpenWorkflow[];
	activeWorkflowId: string | null;
	newWorkflowCounter: number;
}

const STORAGE_KEY = "nvisy-editor-workflows";

/**
 * Load persisted state from localStorage
 */
function loadPersistedState(): PersistedState | null {
	if (!import.meta.client) return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			return JSON.parse(saved);
		}
	} catch {
		// Invalid JSON
	}
	return null;
}

/**
 * Save state to localStorage
 */
function savePersistedState(state: PersistedState) {
	if (!import.meta.client) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// localStorage full or unavailable
	}
}

// Initialize state from localStorage if available
const persistedState = loadPersistedState();

/**
 * Composable for managing open workflows in Editor across navigation.
 * Uses a shared state that persists to localStorage.
 */
const openWorkflows = ref<Map<string, OpenWorkflow>>(
	persistedState
		? new Map(persistedState.openWorkflows.map((w) => [w.workflowId, w]))
		: new Map(),
);
const activeWorkflowId = ref<string | null>(
	persistedState?.activeWorkflowId ?? null,
);
let newWorkflowCounter = persistedState?.newWorkflowCounter ?? 1;

/**
 * Persist current state to localStorage
 */
function persistState() {
	savePersistedState({
		openWorkflows: Array.from(openWorkflows.value.values()),
		activeWorkflowId: activeWorkflowId.value,
		newWorkflowCounter,
	});
}

export function useEditorWorkflows() {
	// Get active workflow
	const activeWorkflow = computed(() => {
		if (!activeWorkflowId.value) return null;
		return openWorkflows.value.get(activeWorkflowId.value) || null;
	});

	// Get all open workflows as array
	const openWorkflowsList = computed(() =>
		Array.from(openWorkflows.value.values()),
	);

	// Create a new workflow (placed first in tabs)
	function createNewWorkflow() {
		const workflowId = `new-${crypto.randomUUID()}`;
		const workflow: OpenWorkflow = {
			workflowId,
			name: `Untitled ${newWorkflowCounter++}`,
			isNew: true,
			isDirty: false,
		};

		// Place new workflow first in the map
		const newMap = new Map<string, OpenWorkflow>();
		newMap.set(workflowId, workflow);
		for (const [id, w] of openWorkflows.value) {
			newMap.set(id, w);
		}
		openWorkflows.value = newMap;

		activeWorkflowId.value = workflowId;
		persistState();
		return workflowId;
	}

	// Open an existing workflow
	function openWorkflow(workflowId: string, name: string) {
		// If already open, just set as active
		if (openWorkflows.value.has(workflowId)) {
			activeWorkflowId.value = workflowId;
			persistState();
			return;
		}

		const workflow: OpenWorkflow = {
			workflowId,
			name,
			isNew: false,
			isDirty: false,
		};
		openWorkflows.value.set(workflowId, workflow);
		activeWorkflowId.value = workflowId;
		persistState();
	}

	// Close a workflow (bypasses dirty check - use tryCloseWorkflow for user-initiated closes)
	function closeWorkflow(workflowId: string) {
		openWorkflows.value.delete(workflowId);

		// If closing active workflow, switch to another open workflow or null
		if (activeWorkflowId.value === workflowId) {
			const remaining = Array.from(openWorkflows.value.keys());
			activeWorkflowId.value =
				remaining.length > 0 ? (remaining[0] ?? null) : null;
		}
		persistState();
	}

	// Get workflow info for dirty check (use this before closing to show dialog if needed)
	function getWorkflowForClose(workflowId: string): OpenWorkflow | null {
		return openWorkflows.value.get(workflowId) ?? null;
	}

	// Check if any workflow has unsaved changes
	function hasUnsavedChanges(): boolean {
		return Array.from(openWorkflows.value.values()).some((w) => w.isDirty);
	}

	// Set active workflow
	function setActiveWorkflow(workflowId: string) {
		if (openWorkflows.value.has(workflowId)) {
			activeWorkflowId.value = workflowId;
			persistState();
		}
	}

	// Mark workflow as dirty (has unsaved changes)
	function markDirty(workflowId: string) {
		const workflow = openWorkflows.value.get(workflowId);
		if (workflow && !workflow.isDirty) {
			openWorkflows.value.set(workflowId, { ...workflow, isDirty: true });
			persistState();
		}
	}

	// Mark workflow as clean (saved)
	function markClean(workflowId: string) {
		const workflow = openWorkflows.value.get(workflowId);
		if (workflow?.isDirty) {
			openWorkflows.value.set(workflowId, { ...workflow, isDirty: false });
			persistState();
		}
	}

	// Rename a workflow
	function renameWorkflow(workflowId: string, newName: string) {
		const workflow = openWorkflows.value.get(workflowId);
		if (workflow) {
			openWorkflows.value.set(workflowId, { ...workflow, name: newName });
			persistState();
		}
	}

	// Move a workflow to the front of the list
	function moveWorkflowToFront(workflowId: string) {
		if (!openWorkflows.value.has(workflowId)) return;

		const workflow = openWorkflows.value.get(workflowId)!;
		const newMap = new Map<string, OpenWorkflow>();
		newMap.set(workflowId, workflow);

		for (const [id, w] of openWorkflows.value) {
			if (id !== workflowId) {
				newMap.set(id, w);
			}
		}

		openWorkflows.value = newMap;
		activeWorkflowId.value = workflowId;
		persistState();
	}

	// Check if a workflow is open
	function isWorkflowOpen(workflowId: string) {
		return openWorkflows.value.has(workflowId);
	}

	// Close all workflows
	function closeAllWorkflows() {
		openWorkflows.value.clear();
		activeWorkflowId.value = null;
		persistState();
	}

	// Ensure at least one workflow is open (create new if none)
	function ensureWorkflowOpen() {
		if (openWorkflows.value.size === 0) {
			createNewWorkflow();
		}
	}

	return {
		// State
		openWorkflows: openWorkflowsList,
		activeWorkflowId: readonly(activeWorkflowId),
		activeWorkflow,

		// Actions
		createNewWorkflow,
		openWorkflow,
		closeWorkflow,
		getWorkflowForClose,
		hasUnsavedChanges,
		setActiveWorkflow,
		markDirty,
		markClean,
		renameWorkflow,
		moveWorkflowToFront,
		isWorkflowOpen,
		closeAllWorkflows,
		ensureWorkflowOpen,
	};
}
