import type { Node, Edge } from "@vue-flow/core";

const STORAGE_KEY_PREFIX = "nvisy-workflow-";

export interface WorkflowData {
	nodes: Node[];
	edges: Edge[];
}

const workflowCache = new Map<string, WorkflowData>();

/**
 * Get default nodes for a new workflow (Upload and Download)
 * Node IDs are prefixed with the workflow ID for uniqueness
 */
function getDefaultNodes(workflowId: string): Node[] {
	return [
		{
			id: `${workflowId}-1`,
			type: "input",
			position: { x: 100, y: 200 },
			data: { label: "Upload", type: "upload" },
		},
		{
			id: `${workflowId}-2`,
			type: "output",
			position: { x: 500, y: 200 },
			data: { label: "Download", type: "download" },
		},
	];
}

/**
 * Load workflow data for a specific workflow ID
 */
export function loadWorkflowData(workflowId: string): WorkflowData {
	// Check cache first
	if (workflowCache.has(workflowId)) {
		return workflowCache.get(workflowId)!;
	}

	// Try to load from localStorage (only available on client)
	if (import.meta.client) {
		const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
		if (saved) {
			try {
				const data = JSON.parse(saved);
				const workflowData: WorkflowData = {
					nodes: data.nodes || [],
					edges: data.edges || [],
				};
				workflowCache.set(workflowId, workflowData);
				return workflowData;
			} catch {
				// Invalid JSON, continue to defaults
			}
		}
	}

	// New workflows start with upload and download nodes
	if (workflowId.startsWith("new-")) {
		const data: WorkflowData = {
			nodes: getDefaultNodes(workflowId),
			edges: [],
		};
		workflowCache.set(workflowId, data);
		return data;
	}

	// Existing workflow with no saved data - return empty
	const data: WorkflowData = { nodes: [], edges: [] };
	workflowCache.set(workflowId, data);
	return data;
}

/**
 * Save workflow data for a specific workflow ID
 */
export function saveWorkflowData(workflowId: string, data: WorkflowData) {
	workflowCache.set(workflowId, data);
	if (import.meta.client) {
		localStorage.setItem(
			`${STORAGE_KEY_PREFIX}${workflowId}`,
			JSON.stringify(data),
		);
	}
}

/**
 * Clear workflow data from cache and localStorage
 */
export function clearWorkflowData(workflowId: string) {
	workflowCache.delete(workflowId);
	if (import.meta.client) {
		localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
	}
}

/**
 * Composable for workflow storage operations
 */
export function useWorkflowStorage() {
	return {
		loadWorkflowData,
		saveWorkflowData,
		clearWorkflowData,
	};
}
