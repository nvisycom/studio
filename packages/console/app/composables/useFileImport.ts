import type { Connection } from "@nvisy/sdk/datatypes";
import type { PickedFile } from "#console/utils/connections";
import {
	ImportError,
	openDropboxChooser,
	openOneDrivePicker,
} from "#console/utils/connections";

/** Deployment config that decides whether a picker is available at all. */
interface PickerAvailability {
	dropboxAppKey?: string;
}

/** What a picker needs at open time: the availability config plus a token minter. */
interface PickerContext extends PickerAvailability {
	/**
	 * Mint a short-lived provider access token for a token-based picker, optionally
	 * scoped to the resource the picker asked for (its `authenticate` command's
	 * `resource`); the server uses its default resource when none is given.
	 */
	getToken: (connectionId: string, resource?: string) => Promise<string>;
}

/**
 * One import picker: whether it's available for this deployment, and how to open
 * it for a connection. A provider is importable iff it has an entry here, so the
 * Import affordance and the actual open path can never drift out of sync.
 *
 * Two authentication shapes:
 * - token-based (OneDrive): mints a short-lived provider token server-side
 *   (`getToken`) from the connection's stored credentials.
 * - app-key (Dropbox): a client-side drop-in keyed by a public, domain-restricted
 *   app key; the server still fetches the picked files by id via the connection's
 *   own OAuth token.
 *
 * Each provider's picker lives in its own module under `utils/connections/pickers/`.
 */
interface ImportPicker {
	available: (config: PickerAvailability) => boolean;
	open: (
		connection: Connection,
		ctx: PickerContext,
	) => Promise<PickedFile[] | null>;
}

const PICKERS: Record<string, ImportPicker> = {
	one_drive: {
		available: () => true,
		open: (connection, { getToken }) =>
			openOneDrivePicker((resource) => getToken(connection.id, resource)),
	},
	dropbox: {
		available: (config) => !!config.dropboxAppKey,
		// `available` guarantees the key, so the non-null assertion is safe.
		open: (_connection, ctx) => openDropboxChooser(ctx.dropboxAppKey!),
	},
};

/**
 * Whether a connection can be imported from right now: a file service, active,
 * and with an available picker. The single eligibility rule the Import table
 * action, the source-picker dialog, and the import flow all share.
 */
export function isImportableConnection(
	connection: Connection,
	config: PickerAvailability,
): boolean {
	if (connection.connectionType !== "file_service" || !connection.isActive) {
		return false;
	}
	return PICKERS[connection.provider]?.available(config) ?? false;
}

export function useFileImport() {
	const { getPickerTokenAsync, importFilesAsync } = useConnections();
	const dropboxAppKey = useRuntimeConfig().public.dropboxAppKey as string;

	const ctx: PickerContext = {
		dropboxAppKey,
		getToken: async (connectionId, resource) =>
			(await getPickerTokenAsync({ connectionId, resource })).accessToken,
	};

	/**
	 * Open the connection's picker and import the chosen files. Returns the number
	 * of files handed to the import (0 when cancelled). Throws {@link ImportError}
	 * with an i18n key when the connection can't be imported from.
	 */
	async function importFrom(connection: Connection): Promise<number> {
		if (!isImportableConnection(connection, { dropboxAppKey })) {
			throw new ImportError("files.errors.importUnavailable");
		}
		const picked = await PICKERS[connection.provider]!.open(connection, ctx);
		if (!picked || picked.length === 0) return 0;
		await importFilesAsync({ connectionId: connection.id, files: picked });
		return picked.length;
	}

	return { importFrom };
}
