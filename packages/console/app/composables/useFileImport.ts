import type { Connection } from "@nvisy/sdk/datatypes";
import type { PickedFile } from "#console/utils/connections";
import {
	openDropboxChooser,
	openOneDrivePicker,
} from "#console/utils/connections";

/**
 * Which providers have a browser picker wired up here, and how each authenticates:
 *
 * - `token`: the picker runs against a short-lived provider OAuth token minted
 *   server-side (`getPickerToken`) from the connection's stored credentials.
 *   OneDrive uses this; Google Drive and Box would too.
 * - `app-key`: the picker is a client-side drop-in keyed by a public,
 *   domain-restricted app key (deployment config), not a per-connection token.
 *   Dropbox's Chooser uses this; the server still fetches the picked files by id
 *   via the connection's own OAuth token.
 *
 * A provider not listed here shows "picker not available yet". Each provider's
 * picker lives in its own module under `utils/connections/pickers/`.
 */
const PICKER_AUTH: Record<string, "token" | "app-key"> = {
	one_drive: "token",
	dropbox: "app-key",
};

/**
 * Whether a provider's import picker is available. App-key pickers (Dropbox) are
 * only available when the deployment configured the key, so callers pass the
 * config they know so an unconfigured provider's Import action stays hidden
 * rather than failing on click.
 */
export function isImportablePicker(
	provider: string,
	config?: { dropboxAppKey?: string },
): boolean {
	const auth = PICKER_AUTH[provider];
	if (!auth) return false;
	if (provider === "dropbox") return !!config?.dropboxAppKey;
	return true;
}

/**
 * The full import flow for a file-service connection: open the provider's picker
 * and import the chosen files. Token pickers (OneDrive) mint a short-lived
 * provider token first; app-key pickers (Dropbox) use the deployment's public
 * app key instead. Returns the number of files handed to the import (0 when
 * cancelled).
 */
export function useFileImport() {
	const { getPickerTokenAsync, importFilesAsync } = useConnections();
	const dropboxAppKey = useRuntimeConfig().public.dropboxAppKey as string;

	async function pickFiles(
		connection: Connection,
	): Promise<PickedFile[] | null> {
		switch (connection.provider) {
			case "one_drive": {
				const { accessToken } = await getPickerTokenAsync(connection.id);
				return openOneDrivePicker(accessToken);
			}
			case "dropbox": {
				if (!dropboxAppKey) {
					throw new Error("Dropbox import isn't configured on this deployment");
				}
				return openDropboxChooser(dropboxAppKey);
			}
			default:
				throw new Error(
					`Import isn't available for ${connection.provider} yet`,
				);
		}
	}

	async function importFrom(connection: Connection): Promise<number> {
		if (!isImportablePicker(connection.provider, { dropboxAppKey })) {
			throw new Error(`Import isn't available for ${connection.provider} yet`);
		}
		const picked = await pickFiles(connection);
		if (!picked || picked.length === 0) return 0;
		await importFilesAsync({ connectionId: connection.id, files: picked });
		return picked.length;
	}

	return { importFrom };
}
