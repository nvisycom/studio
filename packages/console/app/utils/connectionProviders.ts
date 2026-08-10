import type {
	ConnectionConfig,
	LlmConfig,
	SyncDeletionPolicy,
	SyncMode,
} from "@nvisy/sdk/datatypes";

/** Sync directions offered in the connect dialog. */
export const SYNC_MODES: SyncMode[] = ["import", "export"];
/** Deletion policies offered when a source object disappears. */
export const DELETION_POLICIES: SyncDeletionPolicy[] = ["ignore", "delete"];

/**
 * Object-storage provider tags studio can create connections for. 0.15 adds AI
 * providers to `ConnectionConfig["provider"]`; the storage connect flow only
 * handles the storage subset, so we narrow to it.
 */
export type StorageProvider = Extract<
	ConnectionConfig["provider"],
	"s3" | "azure" | "gcs"
>;

/** LLM provider tags (openai / anthropic / ollama), derived from the SDK. */
export type LlmProvider = LlmConfig["provider"];

/** A credential field rendered in the connect dialog. */
export interface CredentialField {
	/** Key on the provider's credentials object. */
	key: string;
	/** i18n key for the field label (under `connections.dialogs.connect.fields`). */
	labelKey: string;
	required: boolean;
	/** Render as a multi-line textarea (e.g. a JSON key blob). */
	multiline?: boolean;
	/** Mask the input (secrets). */
	secret?: boolean;
}

/**
 * Storage providers the connect dialog supports, with the credential fields
 * each one needs. Mirrors the SDK's `ConnectionConfig` credential shapes.
 */
export const STORAGE_PROVIDERS: Record<StorageProvider, CredentialField[]> = {
	s3: [
		{ key: "bucket", labelKey: "bucket", required: true },
		{ key: "region", labelKey: "region", required: false },
		{ key: "endpoint", labelKey: "endpoint", required: false },
		{ key: "accessKeyId", labelKey: "accessKeyId", required: true },
		{
			key: "secretAccessKey",
			labelKey: "secretAccessKey",
			required: true,
			secret: true,
		},
		{
			key: "sessionToken",
			labelKey: "sessionToken",
			required: false,
			secret: true,
		},
	],
	azure: [
		{ key: "accountName", labelKey: "accountName", required: true },
		{ key: "container", labelKey: "container", required: true },
		{ key: "accessKey", labelKey: "accessKey", required: true, secret: true },
		{ key: "sasToken", labelKey: "sasToken", required: false, secret: true },
		{ key: "endpoint", labelKey: "endpoint", required: false },
	],
	gcs: [
		{ key: "bucket", labelKey: "bucket", required: true },
		{
			key: "serviceAccountKeyJson",
			labelKey: "serviceAccountKeyJson",
			required: true,
			secret: true,
			multiline: true,
		},
		{ key: "endpoint", labelKey: "endpoint", required: false },
	],
};

/**
 * Maps an explore-page provider card id to the SDK storage provider it creates
 * a connection for. Cards without an entry cannot be connected (Connect is
 * disabled), even if they are otherwise marked available.
 */
export const PROVIDER_CARD_TO_STORAGE: Record<string, StorageProvider> = {
	"aws-s3": "s3",
	minio: "s3",
	azure: "azure",
	gcs: "gcs",
};

/** The SDK storage provider for a card id, or null if it is not connectable. */
export function storageProviderForCard(cardId: string): StorageProvider | null {
	return PROVIDER_CARD_TO_STORAGE[cardId] ?? null;
}

/** Icon path (under `public/integration/`) for each SDK storage provider. */
export const PROVIDER_ICONS: Record<StorageProvider, string> = {
	s3: "/integration/aws-s3.svg",
	azure: "/integration/azure.svg",
	gcs: "/integration/gcs.svg",
};

/** Human-readable name for each SDK storage provider. */
export const PROVIDER_LABELS: Record<StorageProvider, string> = {
	s3: "Amazon S3",
	azure: "Azure Blob Storage",
	gcs: "Google Cloud Storage",
};

/** Icon path for a provider tag, or null if unknown. */
export function providerIcon(provider: string): string | null {
	return PROVIDER_ICONS[provider as StorageProvider] ?? null;
}

/** Display label for a provider tag, falling back to the raw tag. */
export function providerLabel(provider: string): string {
	return (
		LLM_PROVIDERS[provider as LlmProvider]?.company ??
		PROVIDER_LABELS[provider as StorageProvider] ??
		provider
	);
}

// LLM providers

/**
 * LLM connect-dialog metadata per provider. `needsApiKey` gates the API-key
 * field (Ollama is a local server, no key); `baseUrlRequired` reflects the SDK
 * (`ollama.baseUrl` is required, the hosted providers' is an optional override).
 */
export interface LlmProviderMeta {
	/** Product name shown as the card/dialog title (e.g. "ChatGPT"). */
	product: string;
	/** Company shown as the subtitle (e.g. "OpenAI"). */
	company: string;
	icon: string | null;
	needsApiKey: boolean;
	baseUrlRequired: boolean;
}

export const LLM_PROVIDERS: Record<LlmProvider, LlmProviderMeta> = {
	openai: {
		product: "ChatGPT",
		company: "OpenAI",
		icon: "/integration/openai.svg",
		needsApiKey: true,
		baseUrlRequired: false,
	},
	anthropic: {
		product: "Claude",
		company: "Anthropic",
		icon: "/integration/anthropic.svg",
		needsApiKey: true,
		baseUrlRequired: false,
	},
	ollama: {
		product: "Ollama",
		company: "Ollama",
		icon: "/integration/ollama.svg",
		needsApiKey: false,
		baseUrlRequired: true,
	},
};

/**
 * Maps an explore-page card id to the LLM provider it creates a connection for.
 */
export const PROVIDER_CARD_TO_LLM: Record<string, LlmProvider> = {
	chatgpt: "openai",
	claude: "anthropic",
	ollama: "ollama",
};

/** The SDK LLM provider for a card id, or null if it is not an LLM card. */
export function llmProviderForCard(cardId: string): LlmProvider | null {
	return PROVIDER_CARD_TO_LLM[cardId] ?? null;
}
