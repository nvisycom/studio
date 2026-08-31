import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

/**
 * Fill the shared file bridge with native Finder open/save panels and OS
 * drag-drop.
 *
 * The shared UI ingests and saves files through `useFileBridge`; on the web the
 * seam stays unset and the browser's `<input>` / anchor-download handle it. Here
 * everything filesystem-touching runs in the Rust process, so the webview needs
 * no filesystem scope:
 *
 * - `open_files` / `save_file` run the native panel and read/write the chosen
 *   path in Rust; the user's pick is the only grant.
 * - Drops are read entirely in Rust (which emits `files-dropped`); the webview
 *   never supplies a path to read. We only listen for the emitted files here and
 *   use the webview drag events for the drop affordance.
 *
 * On a plain browser (or the web app) `isTauri()` is false and we leave the
 * bridge untouched.
 */

/** One `PickedFile` from Rust: name plus raw bytes. */
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

/** Wrap Rust's name+bytes payloads into `File`s. */
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

		// Push the current workspace's upload cap to Rust so its drop handler can
		// skip an oversized file before reading it. The page keeps this updated
		// via the bridge; mirror every change to the Rust side.
		watch(
			() => getDropSizeLimit(),
			(maxBytes) => {
				invoke("set_drop_limit", { maxBytes: maxBytes ?? null }).catch(
					(error) => console.error("failed to set drop limit", error),
				);
			},
			{ immediate: true },
		);

		// The files themselves are read in Rust and arrive as a `files-dropped`
		// event — the webview never reads a path. Dispatch them to whichever page
		// registered via `onFilesDropped`.
		listen<PickedFile[]>("files-dropped", (event) => {
			if (event.payload.length > 0) emitFilesDropped(toFiles(event.payload));
		}).catch((error) =>
			console.error("failed to listen for dropped files", error),
		);

		// The webview drag events drive only the drop affordance (enter/over show
		// it, leave/drop clear it); DOM drag events don't fire under Tauri.
		const webview = getCurrentWebviewWindow();
		webview
			.onDragDropEvent((event) => {
				const over =
					event.payload.type === "enter" || event.payload.type === "over";
				emitDragStateChanged(over);
			})
			.catch((error) =>
				console.error("failed to register drag-drop listener", error),
			);
	},
});
