import type { ConnectionConfig, StorageConfig } from "@nvisy/sdk/datatypes";
import type { CredentialField } from "./shared";

/**
 * Object-storage provider tags studio can create connections for. 0.15 adds AI
 * providers to `ConnectionConfig["provider"]`; the storage connect flow only
 * handles the storage subset, so we narrow to it.
 */
export type StorageProvider = Extract<
	ConnectionConfig["provider"],
	"s3" | "azure" | "gcs"
>;

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
 * Assembles a typed `StorageConfig` from the raw credential values the connect
 * form collected (keyed by `CredentialField.key`, which mirrors each provider's
 * credential shape) plus an optional root path.
 *
 * The per-provider switch narrows `provider` to a literal so each arm is checked
 * against the matching `StorageConfig` credential shape — no unsafe cast. Empty
 * optional fields are dropped so they don't override server-side defaults.
 */
export function buildStorageConfig(
	provider: StorageProvider,
	values: Record<string, string>,
	rootPath?: string,
): StorageConfig {
	const root = rootPath?.trim();
	const withRoot = root ? { rootPath: root } : {};
	const val = (key: string) => values[key]?.trim();
	const optional = (key: string) => {
		const v = val(key);
		return v ? { [key]: v } : {};
	};

	switch (provider) {
		case "s3":
			return {
				provider,
				credentials: {
					bucket: val("bucket") ?? "",
					accessKeyId: val("accessKeyId") ?? "",
					secretAccessKey: val("secretAccessKey") ?? "",
					...optional("region"),
					...optional("endpoint"),
					...optional("sessionToken"),
				},
				...withRoot,
			};
		case "azure":
			return {
				provider,
				credentials: {
					accountName: val("accountName") ?? "",
					container: val("container") ?? "",
					...optional("accessKey"),
					...optional("sasToken"),
					...optional("endpoint"),
				},
				...withRoot,
			};
		case "gcs":
			return {
				provider,
				credentials: {
					bucket: val("bucket") ?? "",
					...optional("serviceAccountKeyJson"),
					...optional("endpoint"),
				},
				...withRoot,
			};
	}
}

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
export const STORAGE_PROVIDER_ICONS: Record<StorageProvider, string> = {
	s3: "/integration/aws-s3.svg",
	azure: "/integration/azure.svg",
	gcs: "/integration/gcs.svg",
};

/** Human-readable name for each SDK storage provider. */
export const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
	s3: "Amazon S3",
	azure: "Azure Blob Storage",
	gcs: "Google Cloud Storage",
};
