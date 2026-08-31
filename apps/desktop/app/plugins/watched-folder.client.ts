import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { until } from "@vueuse/core";
import { NvisyApiError } from "@nvisy/sdk";
import type { Nvisy } from "@nvisy/sdk";
import type { WatchedFolder } from "#console/composables/useWatchedFolder";

/**
 * Auto-upload files from the watched folder.
 *
 * The Rust watcher (see `watch.rs`) reads each new/backlog file and emits it as
 * a `folder-file` event carrying its bytes and the workspace it's bound to. Here
 * we upload it to that workspace via the SDK client (the upload needs the authed
 * client + a specific workspace, which live in the web layer). Runs even with
 * the window hidden to the tray.
 *
 * The backlog can be hundreds of files and is re-emitted on every scan/restart,
 * so a naive "upload each as it arrives" would flood the server (it did — it
 * exhausted the connection pool). Three things keep it gentle:
 *   - content dedup against the server: each file is hashed (SHA-256) and we ask
 *     whether the workspace already holds that content (`listFiles({ hash })`)
 *     before sending any bytes. The server is the single source of truth, so
 *     this survives restarts and works across devices with no local bookkeeping,
 *     and we never spend upload bandwidth on a file the server already has;
 *   - batching: genuinely-new files upload `UPLOAD_BATCH` at a time in one call
 *     (with a short `BATCH_GAP` pause between batches), turning a 200-file
 *     backlog into a couple dozen paced requests instead of 200;
 *   - backoff: a batch that fails with a retryable error (5xx/408/429 — the
 *     server is busy) waits and retries rather than charging ahead; a batch that
 *     fails for a client reason (4xx) is dropped, since retrying won't help.
 */
interface FolderFile {
	name: string;
	data: number[];
	workspaceSlug: string;
}

/** A file ready to upload, paired with its source event so a failed upload can
 * requeue exactly the files that still need sending. */
interface PreparedUpload {
	file: File;
	source: FolderFile;
}

/** Files sent to the server per upload call. */
const UPLOAD_BATCH = 8;
/** Pause between successful batches, so we never saturate the connection pool. */
const BATCH_GAP = 300;
/** Attempts for a batch that keeps hitting retryable (server-busy) errors. */
const MAX_ATTEMPTS = 5;
/** First backoff delay; doubles each retry, capped at `MAX_BACKOFF`. */
const BASE_BACKOFF = 500;
const MAX_BACKOFF = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A retryable error means the server is busy (5xx/408/429), not that the file
 * is bad — worth waiting out. Anything else (or a non-API error) is not. */
const isRetryable = (error: unknown) =>
	error instanceof NvisyApiError && error.isRetryable();

/** Lowercase hex SHA-256 of the bytes, matching the server's `fileHash` format. */
async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
}

export default defineNuxtPlugin((nuxtApp) => {
	if (!isTauri()) return;

	const client = nuxtApp.$nvisyClient;

	// Pending files, drained in batches. Enqueue never blocks the event handler;
	// a single `draining` pass owns the uploads so batches never overlap.
	const queue: FolderFile[] = [];
	let draining = false;

	/** Delay before retrying a batch the server was too busy to accept. */
	const REQUEUE_DELAY = 5_000;

	/** Drop files whose content the workspace already holds (no bytes sent), and
	 * return the rest as ready-to-upload `File`s (paired with the source event, so
	 * a failed upload can requeue exactly the files that still need sending). */
	async function newFiles(
		sdk: Nvisy,
		items: FolderFile[],
		workspaceSlug: string,
	): Promise<PreparedUpload[]> {
		const out: PreparedUpload[] = [];
		for (const item of items) {
			const bytes = new Uint8Array(item.data);
			const hash = await sha256Hex(bytes);
			const existing = await sdk.files.listFiles(workspaceSlug, {
				hash,
				limit: 1,
			});
			if (existing.items.length === 0) {
				out.push({ file: new File([bytes], item.name), source: item });
			}
		}
		return out;
	}

	/** Upload one batch, retrying with backoff while the server is busy. Returns
	 * `"ok"` on success, `"retry"` when the server stayed busy through every
	 * attempt (the caller should requeue), or `"drop"` for a client error (4xx)
	 * that retrying can't fix. */
	async function uploadBatch(
		sdk: Nvisy,
		files: File[],
		workspaceSlug: string,
	): Promise<"ok" | "retry" | "drop"> {
		let backoff = BASE_BACKOFF;
		for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				await sdk.files.uploadFiles(workspaceSlug, files);
				return "ok";
			} catch (error) {
				if (!isRetryable(error)) {
					console.error("[watch] dropping batch (client error)", error);
					return "drop";
				}
				if (attempt < MAX_ATTEMPTS) {
					await sleep(backoff);
					backoff = Math.min(backoff * 2, MAX_BACKOFF);
				}
			}
		}
		// Server stayed busy through every attempt — worth trying again later.
		return "retry";
	}

	async function drain() {
		if (draining) return;
		draining = true;
		let first = true;
		while (queue.length > 0) {
			const sdk = client.value;
			if (!sdk) break; // signed out; the next scan re-enqueues after auth
			// Take a run of files for a single workspace: the folder is bound to one
			// workspace, but a rebind can leave events for the previous one still
			// queued, so never mix workspaces in one upload call.
			const workspaceSlug = queue[0]?.workspaceSlug;
			if (!workspaceSlug) {
				queue.shift();
				continue;
			}
			const batch: FolderFile[] = [];
			while (
				batch.length < UPLOAD_BATCH &&
				queue[0]?.workspaceSlug === workspaceSlug
			) {
				const item = queue.shift();
				if (item) batch.push(item);
			}
			try {
				const prepared = await newFiles(sdk, batch, workspaceSlug);
				if (prepared.length > 0) {
					if (!first) await sleep(BATCH_GAP);
					first = false;
					const result = await uploadBatch(
						sdk,
						prepared.map((p) => p.file),
						workspaceSlug,
					);
					if (result === "retry") {
						// Transient server outage — requeue these files (not the ones
						// already on the server) and back off, so nothing is lost.
						queue.push(...prepared.map((p) => p.source));
						await sleep(REQUEUE_DELAY);
					}
				}
			} catch (error) {
				// A failure while hashing/checking existence — log and move on.
				console.error("[watch] failed to prepare batch", error);
			}
		}
		draining = false;
	}

	listen<FolderFile>("folder-file", (event) => {
		const { name } = event.payload;
		if (!isAcceptedFileName(name)) return; // unsupported type
		queue.push(event.payload);
		void drain();
	}).catch((error) =>
		console.error("[watch] failed to listen for watched files", error),
	);

	// A restored watch arms before login, so its backlog can't upload yet. Ask
	// Rust to re-emit the backlog once, the first time the client is ready — not
	// on later client swaps (token refresh), which would needlessly re-read the
	// whole folder over IPC. New arrivals stream in on their own regardless.
	until(client)
		.toBeTruthy()
		.then(() => {
			// Re-supply the accepted-extension allowlist on scan (as on set) so Rust
			// can skip disallowed files before reading them — the frontend stays the
			// single source of truth; Rust never persists the list.
			invoke("scan_watch_folder", {
				extensions: [...ACCEPTED_EXTENSIONS],
			}).catch(() => {});
			void drain();
		});

	// Fill the shared watched-folder seam so the settings card can configure it
	// without importing Tauri. `set` opens the native folder picker (Rust-side)
	// and hands the watcher the shared accepted-extension allowlist.
	setWatchedFolder({
		get: () => invoke<WatchedFolder | null>("watch_folder"),
		set: (workspaceSlug) =>
			invoke<WatchedFolder | null>("set_watch_folder", {
				workspaceSlug,
				extensions: [...ACCEPTED_EXTENSIONS],
			}),
		clear: () => invoke("clear_watch_folder").then(() => undefined),
	});
});
