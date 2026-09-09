import type { PickedFile } from "#console/utils/connections/pickers/types";
import { ImportError } from "#console/utils/connections/pickers/types";

// Dropbox Chooser (Drop-ins): a client-side picker keyed by a public app key,
// loaded from Dropbox's CDN via a script tag carrying `data-app-key`. Unlike the
// token pickers, it needs no per-connection token; the server later fetches the
// picked files by their Dropbox id via the connection's own OAuth credentials.
// See https://www.dropbox.com/developers/chooser.
const DROPBOX_SDK_URL = "https://www.dropbox.com/static/api/2/dropins.js";

interface DropboxChooserFile {
	id: string;
	name: string;
}
interface DropboxChooser {
	choose(options: {
		success: (files: DropboxChooserFile[]) => void;
		cancel?: () => void;
		multiselect?: boolean;
		linkType?: "preview" | "direct";
	}): void;
}
declare global {
	interface Window {
		Dropbox?: DropboxChooser;
	}
}

// Load the Chooser SDK once (idempotent). The app key is read by the SDK from
// the script tag's `data-app-key`. Resolves when `window.Dropbox` is ready.
let dropboxSdk: Promise<DropboxChooser> | null = null;
function loadDropboxSdk(appKey: string): Promise<DropboxChooser> {
	if (window.Dropbox) return Promise.resolve(window.Dropbox);
	if (dropboxSdk) return dropboxSdk;
	dropboxSdk = new Promise<DropboxChooser>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = DROPBOX_SDK_URL;
		script.id = "dropboxjs";
		script.setAttribute("data-app-key", appKey);
		script.onload = () => {
			if (window.Dropbox) {
				resolve(window.Dropbox);
				return;
			}
			// Loaded but no global: clear the cached promise so a later call retries
			// the load rather than reusing this rejection forever.
			dropboxSdk = null;
			reject(new ImportError("files.errors.importPickerLoadFailed"));
		};
		script.onerror = () => {
			dropboxSdk = null; // allow a retry on the next attempt
			reject(new ImportError("files.errors.importPickerLoadFailed"));
		};
		document.head.appendChild(script);
	});
	return dropboxSdk;
}

/**
 * Open the Dropbox Chooser (loading its SDK on first use) and resolve with the
 * chosen files (or `null` if the user cancelled). Keyed by the deployment's
 * public app key; no per-connection token is needed.
 */
export function openDropboxChooser(
	appKey: string,
): Promise<PickedFile[] | null> {
	return loadDropboxSdk(appKey).then(
		(dropbox) =>
			new Promise<PickedFile[] | null>((resolve) => {
				dropbox.choose({
					multiselect: true,
					// A preview link is enough — the server fetches the bytes by id via
					// the connection's OAuth token, so we don't use the link itself.
					linkType: "preview",
					success: (files) => {
						resolve(files.map((f) => ({ id: f.id, name: f.name })));
					},
					cancel: () => resolve(null),
				});
			}),
	);
}
