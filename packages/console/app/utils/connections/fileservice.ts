import type { FileProviders, Provider } from "@nvisy/sdk/datatypes";

/**
 * Cloud file-service providers connected over OAuth (Google Drive, Dropbox,
 * OneDrive, Box). These differ from object stores and LLMs: they carry no
 * user-entered credentials, so they are connected by redirecting the user to
 * the provider's `authorizeUrl` (see `startFileServiceOAuth`) rather than
 * through a credential form. Derived from the SDK's `Provider` type.
 */
export type FileProvider = Provider;

/**
 * Maps an OAuth file-service provider to its key on the catalog's
 * {@link FileProviders} flags object. The SDK provider tags are snake_case
 * (`google_drive`) while the catalog flags are camelCase (`googleDrive`), so
 * this bridges the two without an unsafe cast.
 */
export const FILE_PROVIDER_CATALOG_KEY: Record<
	FileProvider,
	keyof FileProviders
> = {
	google_drive: "googleDrive",
	dropbox: "dropbox",
	one_drive: "oneDrive",
	box: "box",
};

/**
 * Maps an explore-page card id to the OAuth file-service provider it connects.
 * Cards without an entry are not file-service providers.
 */
export const PROVIDER_CARD_TO_FILE_SERVICE: Record<string, FileProvider> = {
	"google-drive": "google_drive",
	dropbox: "dropbox",
	onedrive: "one_drive",
	box: "box",
};

/** The file-service provider for a card id, or null if it is not one. */
export function fileServiceForCard(cardId: string): FileProvider | null {
	return PROVIDER_CARD_TO_FILE_SERVICE[cardId] ?? null;
}
