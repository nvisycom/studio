import type { SyncDeletionPolicy, SyncMode } from "@nvisy/sdk/datatypes";
import type { LlmProvider } from "./llm";
import type { StorageProvider } from "./storage";
import { LLM_PROVIDERS } from "./llm";
import { STORAGE_PROVIDER_ICONS, STORAGE_PROVIDER_LABELS } from "./storage";

/** Sync directions offered in the connect dialog. */
export const SYNC_MODES: SyncMode[] = ["import", "export"];
/** Deletion policies offered when a source object disappears. */
export const DELETION_POLICIES: SyncDeletionPolicy[] = ["ignore", "delete"];

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

/** Icon path for a provider tag (LLM or storage), or null if unknown. */
export function providerIcon(provider: string): string | null {
	return (
		LLM_PROVIDERS[provider as LlmProvider]?.icon ??
		STORAGE_PROVIDER_ICONS[provider as StorageProvider] ??
		null
	);
}

/** Display label for a provider tag (LLM or storage), falling back to the raw tag. */
export function providerLabel(provider: string): string {
	return (
		LLM_PROVIDERS[provider as LlmProvider]?.company ??
		STORAGE_PROVIDER_LABELS[provider as StorageProvider] ??
		provider
	);
}
