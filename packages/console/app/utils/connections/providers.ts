import type { Component } from "vue";
import { Bot, Cloud, MessageSquare } from "@lucide/vue";

/**
 * The explore page's provider catalog: the static, localized list of services
 * shown on the "Explore providers" grid, plus the categories they group under.
 *
 * This is presentation data (i18n keys, brand icons, card metadata), separate
 * from the SDK-level provider tags and the card-id -> SDK-provider mappers in
 * the sibling modules (storage / llm / fileservice). A card's *effective*
 * availability is computed at render time from the connector catalog, not
 * stored here.
 */

/** Tag keys shown as chips on a card; each maps to `connections.explore.tags.<key>`. */
export type TagKey =
	| "fileSync"
	| "import"
	| "export"
	| "notifications"
	| "messaging"
	| "collaboration"
	| "notes"
	| "database"
	| "analytics"
	| "automation"
	| "noCode"
	| "ai"
	| "enterprise"
	| "developer"
	| "sdk";

/**
 * A provider surfaced on the explore page. `kind` is the load-bearing split:
 *  - `connectable`: enabled in-console, creating a Connection (object stores,
 *    cloud file services, bots, AI models).
 *  - `recommendation`: external routes we point at (SDKs, automation tools) and
 *    never connect in-console; they link out.
 *
 * `status` is the hardcoded baseline; for SDK-backed connectable families the
 * connector catalog overrides it at render time.
 */
export interface ExploreProvider {
	id: string;
	nameKey: string;
	descriptionKey: string;
	shortDescriptionKey?: string;
	icon: string;
	kind: "connectable" | "recommendation";
	status: "available" | "unavailable";
	category: string;
	tags: TagKey[];
	isNew?: boolean;
	isExternal?: boolean;
	externalUrl?: string;
}

/** A category pill filtering the connectable region. */
export interface ExploreCategory {
	key: string;
	nameKey: string;
	icon: Component;
}

/**
 * Category pills scope the connectable region only. Recommendation categories
 * (automation, SDKs) live in their own region and aren't filtered here.
 */
export const CATEGORIES: ExploreCategory[] = [
	{
		key: "cloud-storage",
		nameKey: "connections.explore.categories.cloudStorage.name",
		icon: Cloud,
	},
	{
		key: "productivity",
		nameKey: "connections.explore.categories.productivity.name",
		icon: MessageSquare,
	},
	{
		key: "ai-enhancements",
		nameKey: "connections.explore.categories.ai.name",
		icon: Bot,
	},
];

// i18n key prefix for a provider's copy, e.g. `<ITEMS>.googleDrive.name`.
const ITEMS = "connections.explore.items";

export const PROVIDERS: ExploreProvider[] = [
	// Cloud storage & object stores
	{
		id: "google-drive",
		nameKey: `${ITEMS}.googleDrive.name`,
		descriptionKey: `${ITEMS}.googleDrive.description`,
		shortDescriptionKey: `${ITEMS}.googleDrive.shortDescription`,
		icon: "/integration/google-drive.svg",
		status: "unavailable",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
	},
	{
		id: "onedrive",
		nameKey: `${ITEMS}.oneDrive.name`,
		descriptionKey: `${ITEMS}.oneDrive.description`,
		shortDescriptionKey: `${ITEMS}.oneDrive.shortDescription`,
		icon: "/integration/microsoft-onedrive.svg",
		status: "unavailable",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export", "enterprise"],
	},
	{
		id: "dropbox",
		nameKey: `${ITEMS}.dropbox.name`,
		descriptionKey: `${ITEMS}.dropbox.description`,
		shortDescriptionKey: `${ITEMS}.dropbox.shortDescription`,
		icon: "/integration/dropbox.svg",
		status: "unavailable",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
	},
	{
		id: "box",
		nameKey: `${ITEMS}.box.name`,
		descriptionKey: `${ITEMS}.box.description`,
		shortDescriptionKey: `${ITEMS}.box.shortDescription`,
		icon: "/integration/box.svg",
		status: "unavailable",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export", "enterprise"],
	},
	{
		id: "aws-s3",
		nameKey: `${ITEMS}.awsS3.name`,
		descriptionKey: `${ITEMS}.awsS3.description`,
		shortDescriptionKey: `${ITEMS}.awsS3.shortDescription`,
		icon: "/integration/aws-s3.svg",
		status: "available",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "developer", "enterprise"],
	},
	{
		id: "azure",
		nameKey: `${ITEMS}.azure.name`,
		descriptionKey: `${ITEMS}.azure.description`,
		shortDescriptionKey: `${ITEMS}.azure.shortDescription`,
		icon: "/integration/azure.svg",
		status: "available",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "enterprise"],
	},
	{
		id: "gcs",
		nameKey: `${ITEMS}.gcs.name`,
		descriptionKey: `${ITEMS}.gcs.description`,
		shortDescriptionKey: `${ITEMS}.gcs.shortDescription`,
		icon: "/integration/gcs.svg",
		status: "available",
		kind: "connectable",
		category: "cloud-storage",
		tags: ["fileSync", "enterprise"],
	},
	// Bots & messaging
	{
		id: "slack",
		nameKey: `${ITEMS}.slack.name`,
		descriptionKey: `${ITEMS}.slack.description`,
		shortDescriptionKey: `${ITEMS}.slack.shortDescription`,
		icon: "/integration/slack.svg",
		status: "unavailable",
		kind: "connectable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
	},
	{
		id: "teams",
		nameKey: `${ITEMS}.teams.name`,
		descriptionKey: `${ITEMS}.teams.description`,
		shortDescriptionKey: `${ITEMS}.teams.shortDescription`,
		icon: "/integration/microsoft-teams.svg",
		status: "unavailable",
		kind: "connectable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration", "enterprise"],
	},
	{
		id: "notion",
		nameKey: `${ITEMS}.notion.name`,
		descriptionKey: `${ITEMS}.notion.description`,
		shortDescriptionKey: `${ITEMS}.notion.shortDescription`,
		icon: "/integration/notion.svg",
		status: "unavailable",
		kind: "connectable",
		category: "productivity",
		tags: ["notes", "collaboration", "export"],
	},
	{
		id: "discord",
		nameKey: `${ITEMS}.discord.name`,
		descriptionKey: `${ITEMS}.discord.description`,
		shortDescriptionKey: `${ITEMS}.discord.shortDescription`,
		icon: "/integration/discord.svg",
		status: "unavailable",
		kind: "connectable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
	},
	// AI models
	{
		id: "chatgpt",
		nameKey: `${ITEMS}.chatgpt.name`,
		descriptionKey: `${ITEMS}.chatgpt.description`,
		shortDescriptionKey: `${ITEMS}.chatgpt.shortDescription`,
		icon: "/integration/openai.svg",
		status: "available",
		kind: "connectable",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
	},
	{
		id: "claude",
		nameKey: `${ITEMS}.claude.name`,
		descriptionKey: `${ITEMS}.claude.description`,
		shortDescriptionKey: `${ITEMS}.claude.shortDescription`,
		icon: "/integration/anthropic.svg",
		status: "available",
		kind: "connectable",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
	},
	{
		id: "ollama",
		nameKey: `${ITEMS}.ollama.name`,
		descriptionKey: `${ITEMS}.ollama.description`,
		shortDescriptionKey: `${ITEMS}.ollama.shortDescription`,
		icon: "/integration/ollama.svg",
		status: "available",
		kind: "connectable",
		category: "ai-enhancements",
		tags: ["ai", "developer"],
	},
	// Recommendations: automation tools
	{
		id: "zapier",
		nameKey: `${ITEMS}.zapier.name`,
		descriptionKey: `${ITEMS}.zapier.description`,
		shortDescriptionKey: `${ITEMS}.zapier.shortDescription`,
		icon: "/integration/zapier.svg",
		status: "available",
		kind: "recommendation",
		category: "data-analytics",
		tags: ["automation", "noCode", "developer"],
		isExternal: true,
		externalUrl: "https://zapier.com",
	},
	{
		id: "make",
		nameKey: `${ITEMS}.make.name`,
		descriptionKey: `${ITEMS}.make.description`,
		shortDescriptionKey: `${ITEMS}.make.shortDescription`,
		icon: "/integration/make.svg",
		status: "available",
		kind: "recommendation",
		category: "data-analytics",
		tags: ["automation", "noCode"],
		isExternal: true,
		externalUrl: "https://www.make.com",
	},
	{
		id: "n8n",
		nameKey: `${ITEMS}.n8n.name`,
		descriptionKey: `${ITEMS}.n8n.description`,
		shortDescriptionKey: `${ITEMS}.n8n.shortDescription`,
		icon: "/integration/n8n.svg",
		status: "available",
		kind: "recommendation",
		category: "data-analytics",
		tags: ["automation", "noCode", "developer"],
		isExternal: true,
		externalUrl: "https://n8n.io",
	},
	// Recommendations: SDKs
	{
		id: "javascript-sdk",
		nameKey: `${ITEMS}.javascriptSdk.name`,
		descriptionKey: `${ITEMS}.javascriptSdk.description`,
		shortDescriptionKey: `${ITEMS}.javascriptSdk.shortDescription`,
		icon: "/integration/javascript.svg",
		status: "available",
		kind: "recommendation",
		category: "sdk",
		tags: ["sdk", "developer"],
		isExternal: true,
		externalUrl: "https://www.npmjs.com/package/@nvisy/sdk",
	},
	{
		id: "python-sdk",
		nameKey: `${ITEMS}.pythonSdk.name`,
		descriptionKey: `${ITEMS}.pythonSdk.description`,
		shortDescriptionKey: `${ITEMS}.pythonSdk.shortDescription`,
		icon: "/integration/python.svg",
		status: "available",
		kind: "recommendation",
		category: "sdk",
		tags: ["sdk", "developer"],
		isExternal: true,
		externalUrl: "https://pypi.org/project/nvisy-sdk/",
	},
	{
		id: "rust-sdk",
		nameKey: `${ITEMS}.rustSdk.name`,
		descriptionKey: `${ITEMS}.rustSdk.description`,
		shortDescriptionKey: `${ITEMS}.rustSdk.shortDescription`,
		icon: "/integration/rust.svg",
		status: "available",
		kind: "recommendation",
		category: "sdk",
		tags: ["sdk", "developer"],
		isExternal: true,
		externalUrl: "https://crates.io/crates/nvisy-sdk",
	},
];
