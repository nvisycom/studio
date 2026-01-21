import type { Node, Edge } from "@vue-flow/core";

const STORAGE_KEY_PREFIX = "nvisy-workflow-";

export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  nodeId: number;
}

const workflowCache = new Map<string, WorkflowData>();

/**
 * Calculate the next available node ID based on existing nodes
 * This prevents ID collisions when loading workflows
 */
function calculateNextNodeId(nodes: Node[]): number {
  if (nodes.length === 0) return 1;

  const maxId = nodes.reduce((max, node) => {
    const id = parseInt(node.id, 10);
    return isNaN(id) ? max : Math.max(max, id);
  }, 0);

  return maxId + 1;
}

/**
 * Get default nodes for a new workflow (Upload and Download)
 */
function getDefaultNodes(): Node[] {
  return [
    {
      id: "1",
      type: "input",
      position: { x: 100, y: 200 },
      data: { label: "Upload", type: "upload" },
    },
    {
      id: "2",
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

  // Try to load from localStorage first (for all workflow types)
  if (import.meta.client) {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const nodes = data.nodes || [];
        const workflowData = {
          nodes,
          edges: data.edges || [],
          // Always recalculate nodeId from actual nodes to prevent collisions
          nodeId: calculateNextNodeId(nodes),
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
    const defaultNodes = getDefaultNodes();
    const data = {
      nodes: defaultNodes,
      edges: [],
      nodeId: calculateNextNodeId(defaultNodes),
    };
    workflowCache.set(workflowId, data);
    return data;
  }

  // Existing workflow with no saved data - return empty
  const data = { nodes: [], edges: [], nodeId: 1 };
  workflowCache.set(workflowId, data);
  return data;
}

/**
 * Save workflow data for a specific workflow ID
 */
export function saveWorkflowData(workflowId: string, data: WorkflowData) {
  // Ensure nodeId is always valid based on actual nodes
  const safeData = {
    ...data,
    nodeId: Math.max(data.nodeId, calculateNextNodeId(data.nodes)),
  };
  workflowCache.set(workflowId, safeData);
  if (import.meta.client) {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${workflowId}`,
      JSON.stringify(safeData),
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
