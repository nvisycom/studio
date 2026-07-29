import type { Component } from "vue";
import type { NodeTypesObject, NodeComponent } from "@vue-flow/core";
import {
	Upload,
	Database,
	HardDrive,
	MessageSquare,
	FileSearch,
	Table,
	Sparkles,
	FileJson,
	GitBranch,
	Workflow,
	Download,
	Waypoints,
	Webhook,
	Mail,
	Split,
	Languages,
	FileType,
	BookOpen,
	DatabaseZap,
	Link,
} from "@lucide/vue";
import DiscordIcon from "#console/components/icons/DiscordIcon.vue";
import SlackIcon from "#console/components/icons/SlackIcon.vue";
// Node components
import InputNode from "./nodes/inputs/InputNode.vue";
import OutputNode from "./nodes/outputs/OutputNode.vue";
import ProcessNode from "./nodes/transforms/ProcessNode.vue";
import NotificationNode from "./nodes/notify/NotificationNode.vue";
// Flow nodes and their config panels
import ExtensionSwitchNode from "./nodes/flow/ExtensionSwitchNode.vue";
import LanguageSwitchNode from "./nodes/flow/LanguageSwitchNode.vue";
import ContentSwitchNode from "./nodes/flow/ContentSwitchNode.vue";
import ExtensionSwitchConfig from "./nodes/flow/ExtensionSwitchConfig.vue";
import LanguageSwitchConfig from "./nodes/flow/LanguageSwitchConfig.vue";
import ContentSwitchConfig from "./nodes/flow/ContentSwitchConfig.vue";
import CacheSlotNode from "./nodes/flow/CacheSlotNode.vue";

/**
 * Node definition for menu display
 */
export interface NodeDefinition {
	type: string;
	label: string;
	icon: Component;
	category: string;
}

/**
 * Menu categories for grouping nodes
 */
export type MenuCategory =
	| "inputs"
	| "flow"
	| "transform"
	| "outputs"
	| "notify";

/**
 * Config panel definition for nodes that have configuration UI
 */
export interface NodeConfigPanel {
	title: string;
	component: Component;
}

/**
 * Registry entry for a node type
 */
export interface NodeRegistryEntry {
	component: Component;
	definition: NodeDefinition;
	createDefaultData: () => Record<string, unknown>;
	configPanel?: NodeConfigPanel;
}

// ============================================================================
// Default configurations for switch nodes
// ============================================================================

const defaultExtensions = [
	{ id: "pdf", label: "pdf", enabled: true },
	{ id: "docx", label: "docx", enabled: true },
	{ id: "xlsx", label: "xlsx", enabled: true },
	{ id: "doc", label: "doc", enabled: false },
	{ id: "xls", label: "xls", enabled: false },
	{ id: "pptx", label: "pptx", enabled: false },
	{ id: "ppt", label: "ppt", enabled: false },
	{ id: "odt", label: "odt", enabled: false },
	{ id: "ods", label: "ods", enabled: false },
	{ id: "odp", label: "odp", enabled: false },
	{ id: "rtf", label: "rtf", enabled: false },
	{ id: "txt", label: "txt", enabled: false },
	{ id: "csv", label: "csv", enabled: false },
	{ id: "json", label: "json", enabled: false },
	{ id: "xml", label: "xml", enabled: false },
	{ id: "html", label: "html", enabled: false },
	{ id: "md", label: "md", enabled: false },
	{ id: "png", label: "png", enabled: false },
	{ id: "jpg", label: "jpg", enabled: false },
	{ id: "jpeg", label: "jpeg", enabled: false },
	{ id: "gif", label: "gif", enabled: false },
	{ id: "bmp", label: "bmp", enabled: false },
	{ id: "tiff", label: "tiff", enabled: false },
	{ id: "webp", label: "webp", enabled: false },
	{ id: "svg", label: "svg", enabled: false },
	{ id: "heic", label: "heic", enabled: false },
	{ id: "zip", label: "zip", enabled: false },
	{ id: "rar", label: "rar", enabled: false },
	{ id: "7z", label: "7z", enabled: false },
	{ id: "tar", label: "tar", enabled: false },
	{ id: "gz", label: "gz", enabled: false },
];

const defaultLanguages = [
	{ id: "en", label: "English", code: "en", enabled: true },
	{ id: "de", label: "German", code: "de", enabled: true },
	{ id: "fr", label: "French", code: "fr", enabled: false },
	{ id: "es", label: "Spanish", code: "es", enabled: false },
	{ id: "it", label: "Italian", code: "it", enabled: false },
	{ id: "pt", label: "Portuguese", code: "pt", enabled: false },
	{ id: "nl", label: "Dutch", code: "nl", enabled: false },
	{ id: "pl", label: "Polish", code: "pl", enabled: false },
	{ id: "ru", label: "Russian", code: "ru", enabled: false },
	{ id: "uk", label: "Ukrainian", code: "uk", enabled: false },
	{ id: "ja", label: "Japanese", code: "ja", enabled: false },
	{ id: "zh", label: "Chinese", code: "zh", enabled: false },
	{ id: "ko", label: "Korean", code: "ko", enabled: false },
	{ id: "ar", label: "Arabic", code: "ar", enabled: false },
	{ id: "hi", label: "Hindi", code: "hi", enabled: false },
	{ id: "tr", label: "Turkish", code: "tr", enabled: false },
	{ id: "vi", label: "Vietnamese", code: "vi", enabled: false },
	{ id: "th", label: "Thai", code: "th", enabled: false },
	{ id: "sv", label: "Swedish", code: "sv", enabled: false },
	{ id: "da", label: "Danish", code: "da", enabled: false },
	{ id: "no", label: "Norwegian", code: "no", enabled: false },
	{ id: "fi", label: "Finnish", code: "fi", enabled: false },
	{ id: "cs", label: "Czech", code: "cs", enabled: false },
	{ id: "el", label: "Greek", code: "el", enabled: false },
	{ id: "he", label: "Hebrew", code: "he", enabled: false },
	{ id: "hu", label: "Hungarian", code: "hu", enabled: false },
	{ id: "id", label: "Indonesian", code: "id", enabled: false },
	{ id: "ms", label: "Malay", code: "ms", enabled: false },
	{ id: "ro", label: "Romanian", code: "ro", enabled: false },
	{ id: "sk", label: "Slovak", code: "sk", enabled: false },
	{ id: "bg", label: "Bulgarian", code: "bg", enabled: false },
	{ id: "hr", label: "Croatian", code: "hr", enabled: false },
	{ id: "sr", label: "Serbian", code: "sr", enabled: false },
	{ id: "sl", label: "Slovenian", code: "sl", enabled: false },
	{ id: "et", label: "Estonian", code: "et", enabled: false },
	{ id: "lv", label: "Latvian", code: "lv", enabled: false },
	{ id: "lt", label: "Lithuanian", code: "lt", enabled: false },
];

const defaultContentTypes = [
	{ id: "document", label: "Document", enabled: true },
	{ id: "image", label: "Image", enabled: true },
	{ id: "audio", label: "Audio", enabled: false },
	{ id: "video", label: "Video", enabled: false },
	{ id: "spreadsheet", label: "Spreadsheet", enabled: false },
	{ id: "presentation", label: "Presentation", enabled: false },
	{ id: "archive", label: "Archive", enabled: false },
	{ id: "code", label: "Code", enabled: false },
	{ id: "data", label: "Data", enabled: false },
	{ id: "other", label: "Other", enabled: false },
];

// ============================================================================
// Node Registry - single source of truth for all node types
// ============================================================================

/**
 * All known node registry keys
 */
type NodeRegistryKey =
	| "upload"
	| "context"
	| "input_cache"
	| "input_relational_db"
	| "input_object_store"
	| "input_message_queue"
	| "cache_slot"
	| "extension_switch"
	| "language_switch"
	| "content_switch"
	| "partition"
	| "chunk"
	| "embed"
	| "extract"
	| "transform"
	| "custom"
	| "download"
	| "output_relational_db"
	| "vector_db"
	| "output_cache"
	| "output_object_store"
	| "output_message_queue"
	| "webhook"
	| "email"
	| "slack"
	| "discord";

export const nodeRegistry: Record<NodeRegistryKey, NodeRegistryEntry> = {
	// Input nodes
	upload: {
		component: InputNode,
		definition: {
			type: "upload",
			label: "Upload",
			icon: Upload,
			category: "input",
		},
		createDefaultData: () => ({ label: "Upload", type: "upload" }),
	},
	context: {
		component: InputNode,
		definition: {
			type: "context",
			label: "Context",
			icon: BookOpen,
			category: "input",
		},
		createDefaultData: () => ({ label: "Context", type: "context" }),
	},
	input_cache: {
		component: InputNode,
		definition: {
			type: "cache",
			label: "Cache",
			icon: DatabaseZap,
			category: "input",
		},
		createDefaultData: () => ({ label: "Cache", type: "cache" }),
	},
	input_relational_db: {
		component: InputNode,
		definition: {
			type: "relational_db",
			label: "Relational Database",
			icon: Database,
			category: "input",
		},
		createDefaultData: () => ({
			label: "Relational Database",
			type: "relational_db",
		}),
	},
	input_object_store: {
		component: InputNode,
		definition: {
			type: "object_store",
			label: "Object Store",
			icon: HardDrive,
			category: "input",
		},
		createDefaultData: () => ({ label: "Object Store", type: "object_store" }),
	},
	input_message_queue: {
		component: InputNode,
		definition: {
			type: "message_queue",
			label: "Message Queue",
			icon: MessageSquare,
			category: "input",
		},
		createDefaultData: () => ({
			label: "Message Queue",
			type: "message_queue",
		}),
	},

	// Flow nodes (switches)
	extension_switch: {
		component: ExtensionSwitchNode,
		definition: {
			type: "extension_switch",
			label: "Extension Switch",
			icon: Split,
			category: "extension_switch",
		},
		createDefaultData: () => ({
			label: "Extension Switch",
			extensions: JSON.parse(JSON.stringify(defaultExtensions)),
			invertMode: false,
		}),
		configPanel: {
			title: "Extension Switch",
			component: ExtensionSwitchConfig,
		},
	},
	language_switch: {
		component: LanguageSwitchNode,
		definition: {
			type: "language_switch",
			label: "Language Switch",
			icon: Languages,
			category: "language_switch",
		},
		createDefaultData: () => ({
			label: "Language Switch",
			languages: JSON.parse(JSON.stringify(defaultLanguages)),
			invertMode: false,
		}),
		configPanel: {
			title: "Language Switch",
			component: LanguageSwitchConfig,
		},
	},
	content_switch: {
		component: ContentSwitchNode,
		definition: {
			type: "content_switch",
			label: "Content Switch",
			icon: FileType,
			category: "content_switch",
		},
		createDefaultData: () => ({
			label: "Content Switch",
			contentTypes: JSON.parse(JSON.stringify(defaultContentTypes)),
			invertMode: false,
		}),
		configPanel: {
			title: "Content Switch",
			component: ContentSwitchConfig,
		},
	},
	cache_slot: {
		component: CacheSlotNode,
		definition: {
			type: "cache_slot",
			label: "Cache Slot",
			icon: Link,
			category: "cache_slot",
		},
		createDefaultData: () => ({ label: "Cache Slot", slotName: "" }),
	},

	// Transform/Process nodes
	partition: {
		component: ProcessNode,
		definition: {
			type: "partition",
			label: "Partition",
			icon: FileSearch,
			category: "process",
		},
		createDefaultData: () => ({ label: "Partition", type: "partition" }),
	},
	chunk: {
		component: ProcessNode,
		definition: {
			type: "chunk",
			label: "Chunk",
			icon: Table,
			category: "process",
		},
		createDefaultData: () => ({ label: "Chunk", type: "chunk" }),
	},
	embed: {
		component: ProcessNode,
		definition: {
			type: "embed",
			label: "Embed",
			icon: Sparkles,
			category: "process",
		},
		createDefaultData: () => ({ label: "Embed", type: "embed" }),
	},
	extract: {
		component: ProcessNode,
		definition: {
			type: "extract",
			label: "Extract Data",
			icon: FileJson,
			category: "process",
		},
		createDefaultData: () => ({ label: "Extract Data", type: "extract" }),
	},
	transform: {
		component: ProcessNode,
		definition: {
			type: "transform",
			label: "Transform",
			icon: GitBranch,
			category: "process",
		},
		createDefaultData: () => ({ label: "Transform", type: "transform" }),
	},
	custom: {
		component: ProcessNode,
		definition: {
			type: "custom",
			label: "Custom Schema",
			icon: Workflow,
			category: "process",
		},
		createDefaultData: () => ({ label: "Custom Schema", type: "custom" }),
	},

	// Output nodes
	download: {
		component: OutputNode,
		definition: {
			type: "download",
			label: "Download",
			icon: Download,
			category: "output",
		},
		createDefaultData: () => ({ label: "Download", type: "download" }),
	},
	output_relational_db: {
		component: OutputNode,
		definition: {
			type: "relational_db",
			label: "Relational Database",
			icon: Database,
			category: "output",
		},
		createDefaultData: () => ({
			label: "Relational Database",
			type: "relational_db",
		}),
	},
	vector_db: {
		component: OutputNode,
		definition: {
			type: "vector_db",
			label: "Vector Database",
			icon: Waypoints,
			category: "output",
		},
		createDefaultData: () => ({ label: "Vector Database", type: "vector_db" }),
	},
	output_cache: {
		component: OutputNode,
		definition: {
			type: "cache",
			label: "Cache",
			icon: DatabaseZap,
			category: "output",
		},
		createDefaultData: () => ({ label: "Cache", type: "cache" }),
	},
	output_object_store: {
		component: OutputNode,
		definition: {
			type: "object_store",
			label: "Object Store",
			icon: HardDrive,
			category: "output",
		},
		createDefaultData: () => ({ label: "Object Store", type: "object_store" }),
	},
	output_message_queue: {
		component: OutputNode,
		definition: {
			type: "message_queue",
			label: "Message Queue",
			icon: MessageSquare,
			category: "output",
		},
		createDefaultData: () => ({
			label: "Message Queue",
			type: "message_queue",
		}),
	},

	// Notification nodes
	webhook: {
		component: NotificationNode,
		definition: {
			type: "webhook",
			label: "Webhook",
			icon: Webhook,
			category: "notification",
		},
		createDefaultData: () => ({ label: "Webhook", type: "webhook" }),
	},
	email: {
		component: NotificationNode,
		definition: {
			type: "email",
			label: "Email",
			icon: Mail,
			category: "notification",
		},
		createDefaultData: () => ({ label: "Email", type: "email" }),
	},
	slack: {
		component: NotificationNode,
		definition: {
			type: "slack",
			label: "Slack",
			icon: SlackIcon,
			category: "notification",
		},
		createDefaultData: () => ({ label: "Slack", type: "slack" }),
	},
	discord: {
		component: NotificationNode,
		definition: {
			type: "discord",
			label: "Discord",
			icon: DiscordIcon,
			category: "notification",
		},
		createDefaultData: () => ({ label: "Discord", type: "discord" }),
	},
};

// ============================================================================
// Derived exports for Vue Flow and menus
// ============================================================================

/**
 * Node type components for Vue Flow
 * Using type assertion since Vue Flow's NodeTypesObject is overly strict about component props
 */
export const nodeTypes = {
	input: markRaw(InputNode),
	process: markRaw(ProcessNode),
	output: markRaw(OutputNode),
	notification: markRaw(NotificationNode),
	extension_switch: markRaw(ExtensionSwitchNode),
	language_switch: markRaw(LanguageSwitchNode),
	content_switch: markRaw(ContentSwitchNode),
	cache_slot: markRaw(CacheSlotNode),
} as NodeTypesObject;

/**
 * Grouped node definitions for the canvas context menu
 */
export interface CanvasMenuNodes {
	inputs: NodeDefinition[];
	flow: NodeDefinition[];
	transform: NodeDefinition[];
	outputs: NodeDefinition[];
	notify: NodeDefinition[];
}

export const canvasMenuNodes: CanvasMenuNodes = {
	inputs: [
		nodeRegistry.upload.definition,
		nodeRegistry.context.definition,
		nodeRegistry.input_cache.definition,
		nodeRegistry.input_relational_db.definition,
		nodeRegistry.input_object_store.definition,
		nodeRegistry.input_message_queue.definition,
	],
	flow: [
		nodeRegistry.cache_slot.definition,
		nodeRegistry.extension_switch.definition,
		nodeRegistry.language_switch.definition,
		nodeRegistry.content_switch.definition,
	],
	transform: [
		nodeRegistry.partition.definition,
		nodeRegistry.chunk.definition,
		nodeRegistry.embed.definition,
		nodeRegistry.extract.definition,
		nodeRegistry.transform.definition,
		nodeRegistry.custom.definition,
	],
	outputs: [
		nodeRegistry.download.definition,
		nodeRegistry.output_relational_db.definition,
		nodeRegistry.vector_db.definition,
		nodeRegistry.output_cache.definition,
		nodeRegistry.output_object_store.definition,
		nodeRegistry.output_message_queue.definition,
	],
	notify: [
		nodeRegistry.webhook.definition,
		nodeRegistry.email.definition,
		nodeRegistry.slack.definition,
		nodeRegistry.discord.definition,
	],
};

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Get default data for a node type
 */
export function getDefaultNodeData(type: string): Record<string, unknown> {
	const key = type as NodeRegistryKey;
	if (key in nodeRegistry) {
		return nodeRegistry[key].createDefaultData();
	}
	// Fallback for unknown types
	return { label: type, type };
}

/**
 * Get registry entry by node definition (looks up by type + category)
 */
export function getRegistryEntryByDefinition(
	def: NodeDefinition,
): NodeRegistryEntry | undefined {
	// For nodes that share the same type but different categories (like relational_db for input/output)
	// we need to match both type and category
	return Object.values(nodeRegistry).find(
		(entry) =>
			entry.definition.type === def.type &&
			entry.definition.category === def.category,
	);
}

/**
 * Get config panel for a node type (by Vue Flow node type, e.g. "extension_switch")
 */
export function getConfigPanelForNodeType(
	nodeType: string,
): NodeConfigPanel | undefined {
	const key = nodeType as NodeRegistryKey;
	if (key in nodeRegistry) {
		return nodeRegistry[key].configPanel;
	}
	return undefined;
}

/**
 * Filter node definitions by search term
 */
export function filterNodesBySearch(
	nodes: CanvasMenuNodes,
	search: string,
): CanvasMenuNodes {
	const searchLower = search.toLowerCase().trim();
	if (!searchLower) return nodes;

	const filterNodes = (nodeList: NodeDefinition[]) =>
		nodeList.filter((node) => node.label.toLowerCase().includes(searchLower));

	return {
		inputs: filterNodes(nodes.inputs),
		flow: filterNodes(nodes.flow),
		transform: filterNodes(nodes.transform),
		outputs: filterNodes(nodes.outputs),
		notify: filterNodes(nodes.notify),
	};
}

/**
 * Check if filtered nodes have any results
 */
export function hasFilteredResults(nodes: CanvasMenuNodes): boolean {
	return (
		nodes.inputs.length > 0 ||
		nodes.flow.length > 0 ||
		nodes.transform.length > 0 ||
		nodes.outputs.length > 0 ||
		nodes.notify.length > 0
	);
}

/**
 * Categories that have both input and output handles (can be inserted on edges)
 */
const categoriesWithBothHandles = new Set([
	"process",
	"cache_slot",
	"extension_switch",
	"language_switch",
	"content_switch",
]);

/**
 * Filter nodes to only those that can be inserted on an edge
 * (nodes that have both input and output handles)
 */
export function filterNodesForEdgeInsertion(
	nodes: CanvasMenuNodes,
): CanvasMenuNodes {
	const filterByCategory = (nodeList: NodeDefinition[]) =>
		nodeList.filter((node) => categoriesWithBothHandles.has(node.category));

	return {
		inputs: [], // Input nodes have no input handle
		flow: filterByCategory(nodes.flow),
		transform: filterByCategory(nodes.transform),
		outputs: [], // Output nodes have no output handle
		notify: [], // Notification nodes have no output handle
	};
}
