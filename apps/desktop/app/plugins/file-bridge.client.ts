import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

/**
 * Fill the shared file bridge with native Finder open/save panels.
 *
 * The shared UI ingests and saves files through `useFileBridge`; on the web the
 * seam stays unset and the browser's `<input>` / anchor-download handle it. Here
 * we invoke the Rust `open_files` / `save_file` commands, which run the OS panel
 * and read/write the chosen path in the Rust process — so the webview needs no
 * filesystem scope, only the user's explicit pick.
 *
 * On a plain browser (or the web app) `isTauri()` is false and we leave the
 * bridge untouched.
 */

/** One `PickedFile` from the Rust `open_files` command: name plus raw bytes. */
interface PickedFile {
	name: string;
	data: number[];
}

/** A native open-panel extension filter, as the Rust command expects it. */
interface FileFilter {
	name: string;
	extensions: string[];
}

/**
 * Turn an `<input accept>` value (`.csv,.docx,…`) into the extension list the
 * native panel filters on. Only bare extension tokens apply — MIME types and
 * wildcards have no dotted-extension equivalent, so tokens containing a slash
 * are dropped.
 */
function acceptToFilters(accept: string): FileFilter[] {
	const extensions = accept
		.split(",")
		.map((token) => token.trim().replace(/^\./, ""))
		.filter((token) => token.length > 0 && !token.includes("/"));

	if (extensions.length === 0) return [];
	return [{ name: "Supported files", extensions }];
}

/** Wrap the Rust command's name+bytes payloads into `File`s. */
function toFiles(picked: PickedFile[]): File[] {
	return picked.map((file) => new File([new Uint8Array(file.data)], file.name));
}

export default defineNuxtPlugin({
	name: "file-bridge",
	setup() {
		if (!isTauri()) return;

		setFileBridge({
			async openFiles(accept: string) {
				const picked = await invoke<PickedFile[]>("open_files", {
					filters: acceptToFilters(accept),
				});
				return picked.length > 0 ? toFiles(picked) : null;
			},

			async saveFile(data: Blob, suggestedName: string) {
				// Tauri's raw (octet-stream) IPC body only applies when the whole
				// invoke argument is the bytes; here the filename shares the payload,
				// so it goes through JSON and the bytes must be a plain number array.
				// Fine for documents; revisit with a Channel if very large files
				// become common.
				const bytes = Array.from(new Uint8Array(await data.arrayBuffer()));
				return invoke<boolean>("save_file", { suggestedName, data: bytes });
			},
		});

		// Tauri intercepts OS file drops before the DOM, so a page's `drop`
		// handler never sees them. Read the dropped paths' bytes in Rust and
		// dispatch them to whichever page registered via `onFilesDropped`.
		// The listener lives for the app's lifetime (no teardown needed); we drop
		// the unlisten handle but log a registration failure rather than swallow it.
		const webview = getCurrentWebviewWindow();
		webview
			.onDragDropEvent(async (event) => {
				// Enter/over light the page's drop affordance; leave clears it. (DOM
				// drag events don't fire under Tauri, so pages rely on these.)
				if (event.payload.type === "enter" || event.payload.type === "over") {
					emitDragStateChanged(true);
					return;
				}
				if (event.payload.type === "leave") {
					emitDragStateChanged(false);
					return;
				}

				// type === "drop"
				emitDragStateChanged(false);
				const paths = event.payload.paths;
				if (paths.length === 0) return;
				try {
					const picked = await invoke<PickedFile[]>("read_files", {
						paths,
						// Skip an oversized file by its metadata before reading its
						// bytes; the page publishes the workspace's effective cap.
						maxBytes: getDropSizeLimit() ?? null,
					});
					if (picked.length > 0) emitFilesDropped(toFiles(picked));
				} catch (error) {
					// A drop that can't be read shouldn't crash the handler — the
					// page's validation and the upload flow surface what the user needs.
					console.error("failed to read dropped files", error);
				}
			})
			.catch((error) => {
				console.error("failed to register drag-drop listener", error);
			});
	},
});
