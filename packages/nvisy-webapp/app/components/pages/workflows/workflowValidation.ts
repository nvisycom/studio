import type { Node, Edge } from "@vue-flow/core";

export interface ValidationError {
	type: "error" | "warning";
	nodeId?: string;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
}

/**
 * Get all nodes connected to a given node (incoming)
 */
function getIncomingNodes(nodeId: string, edges: Edge[]): string[] {
	return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

/**
 * Get all nodes connected from a given node (outgoing)
 */
function getOutgoingNodes(nodeId: string, edges: Edge[]): string[] {
	return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

/**
 * Check if a node is reachable from any input node
 */
function isReachableFromInput(
	nodeId: string,
	nodes: Node[],
	edges: Edge[],
	visited = new Set<string>(),
): boolean {
	if (visited.has(nodeId)) return false;
	visited.add(nodeId);

	const node = nodes.find((n) => n.id === nodeId);
	if (!node) return false;

	// Input nodes are reachable by definition
	if (node.type === "input") return true;

	// Check if any incoming node is reachable from input
	const incomingNodes = getIncomingNodes(nodeId, edges);
	return incomingNodes.some((id) =>
		isReachableFromInput(id, nodes, edges, visited),
	);
}

/**
 * Check if a node can reach any output node
 */
function canReachOutput(
	nodeId: string,
	nodes: Node[],
	edges: Edge[],
	visited = new Set<string>(),
): boolean {
	if (visited.has(nodeId)) return false;
	visited.add(nodeId);

	const node = nodes.find((n) => n.id === nodeId);
	if (!node) return false;

	// Output nodes can reach output by definition
	if (node.type === "output") return true;

	// Check if any outgoing node can reach output
	const outgoingNodes = getOutgoingNodes(nodeId, edges);
	return outgoingNodes.some((id) => canReachOutput(id, nodes, edges, visited));
}

/**
 * Validate a workflow for common issues
 */
export function validateWorkflow(
	nodes: Node[],
	edges: Edge[],
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	// Empty workflow
	if (nodes.length === 0) {
		errors.push({
			type: "error",
			message: "Workflow is empty. Add at least one node.",
		});
		return { isValid: false, errors, warnings };
	}

	// Check for input nodes
	const inputNodes = nodes.filter((n) => n.type === "input");
	if (inputNodes.length === 0) {
		errors.push({
			type: "error",
			message: "Workflow needs at least one input node.",
		});
	}

	// Check for output nodes
	const outputNodes = nodes.filter((n) => n.type === "output");
	if (outputNodes.length === 0) {
		errors.push({
			type: "error",
			message: "Workflow needs at least one output node.",
		});
	}

	// Check for disconnected nodes
	for (const node of nodes) {
		const hasIncoming = edges.some((e) => e.target === node.id);
		const hasOutgoing = edges.some((e) => e.source === node.id);

		// Input nodes don't need incoming connections
		if (node.type === "input") {
			if (!hasOutgoing) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Input node "${node.data?.label || node.id}" has no outgoing connections.`,
				});
			}
		}
		// Output nodes don't need outgoing connections
		else if (node.type === "output") {
			if (!hasIncoming) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Output node "${node.data?.label || node.id}" has no incoming connections.`,
				});
			}
		}
		// Cache Slot nodes are allowed to be disconnected (used for data teleportation)
		else if (node.type === "cache_slot") {
			// No validation needed - cache slots can be disconnected
		}
		// Other nodes should have both
		else {
			if (!hasIncoming && !hasOutgoing) {
				errors.push({
					type: "error",
					nodeId: node.id,
					message: `Node "${node.data?.label || node.id}" is completely disconnected.`,
				});
			} else if (!hasIncoming) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Node "${node.data?.label || node.id}" has no incoming connections.`,
				});
			} else if (!hasOutgoing) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Node "${node.data?.label || node.id}" has no outgoing connections.`,
				});
			}
		}
	}

	// Check for nodes not reachable from any input (skip cache slots)
	for (const node of nodes) {
		if (node.type !== "input" && node.type !== "cache_slot") {
			if (!isReachableFromInput(node.id, nodes, edges)) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Node "${node.data?.label || node.id}" is not reachable from any input.`,
				});
			}
		}
	}

	// Check for nodes that can't reach any output (skip cache slots)
	for (const node of nodes) {
		if (node.type !== "output" && node.type !== "cache_slot") {
			if (!canReachOutput(node.id, nodes, edges)) {
				warnings.push({
					type: "warning",
					nodeId: node.id,
					message: `Node "${node.data?.label || node.id}" cannot reach any output.`,
				});
			}
		}
	}

	// Check for cycles (simple detection)
	const visitedInPath = new Set<string>();
	const fullyVisited = new Set<string>();

	function hasCycle(nodeId: string): boolean {
		if (visitedInPath.has(nodeId)) return true;
		if (fullyVisited.has(nodeId)) return false;

		visitedInPath.add(nodeId);
		const outgoing = getOutgoingNodes(nodeId, edges);

		for (const targetId of outgoing) {
			if (hasCycle(targetId)) return true;
		}

		visitedInPath.delete(nodeId);
		fullyVisited.add(nodeId);
		return false;
	}

	for (const node of nodes) {
		if (!fullyVisited.has(node.id) && hasCycle(node.id)) {
			errors.push({
				type: "error",
				message: "Workflow contains a cycle. Cycles are not allowed.",
			});
			break;
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}
