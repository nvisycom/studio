import { invoke } from "@tauri-apps/api/core";
import type {
	AccountRef,
	CursorPagination,
	ListWorkspaceDocuments,
	UpdateWorkspaceDocument,
	WorkspaceDeletedDocuments,
	WorkspaceDocument,
	WorkspaceDocumentPage,
} from "@nvisy/sdk/datatypes";
import type { Repository } from "#console/repositories/types";
import { ensureBound } from "./folder";
import {
	parseBody,
	type StoreRecord,
	storeDelete,
	storeGet,
	storeList,
	storeUpsert,
} from "./store";

/*
 * The documents resource of the local store: the files in the workspace's
 * folder. The folder (on disk) holds the bytes; the `documents` store table
 * holds one record per file so each keeps a stable id across renames — the
 * studio tabs, detection runs, and restore all key off that id.
 *
 * `listDocuments` reconciles the two: it scans the folder and matches each file
 * to its record by relative path, minting a record for a new file, refreshing a
 * record whose bytes changed (new hash/size), and dropping a record whose file
 * is gone. So a file dropped in via Finder appears, an edited file updates, and
 * a deleted file disappears — without a filesystem watcher.
 *
 * Bytes cross from Rust as a raw IPC response (an ArrayBuffer), wrapped here into
 * a `Response` so the studio's `downloadDocument → blob` byte path is identical
 * to the server's. Uploads and redaction output are written back as files in the
 * folder, each with its own record.
 */

/** The author stamped on locally-created records: no account exists offline. */
const LOCAL_AUTHOR: AccountRef = { id: "local", username: "local" };

/** One file the Rust scan reported: its folder-relative path, size, and hash. */
interface ScannedFile {
	path: string;
	size: number;
	hash: string;
}

/** The scan result: files read, plus paths that exist but couldn't be read. */
interface ScanResult {
	files: ScannedFile[];
	/** Paths present on disk but unreadable this scan — keep their records. */
	skipped: string[];
}

/** A stored document record: the SDK document plus its path within the folder. */
type LocalDocument = WorkspaceDocument & { path: string };

/** Split a file name into its base (display) name and lower-case extension. */
function splitName(fileName: string): {
	displayName: string;
	extension: string;
} {
	const dot = fileName.lastIndexOf(".");
	if (dot <= 0) return { displayName: fileName, extension: "" };
	return {
		displayName: fileName,
		extension: fileName.slice(dot + 1).toLowerCase(),
	};
}

/** A path not already in `taken`, disambiguating a collision as `name (n).ext`. */
function uniquePath(name: string, taken: Set<string>): string {
	if (!taken.has(name)) return name;
	const dot = name.lastIndexOf(".");
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : "";
	for (let n = 1; ; n++) {
		const candidate = `${base} (${n})${ext}`;
		if (!taken.has(candidate)) return candidate;
	}
}

/** The record to persist for a document (its path indexes the folder file). */
function toRecord(doc: LocalDocument): StoreRecord {
	return {
		id: doc.id,
		workspaceId: doc.workspaceId,
		name: doc.path,
		kind: doc.kind,
		updatedAt: doc.updatedAt,
		body: JSON.stringify(doc),
	};
}

/** A file's name and raw bytes, ready to write into the folder. */
interface NamedBytes {
	name: string;
	bytes: Uint8Array;
}

/** Normalize a Blob/File to its name and bytes for writing into the folder. */
async function toNamedBytes(blob: Blob, index: number): Promise<NamedBytes> {
	const name = blob instanceof File ? blob.name : `document-${index + 1}`;
	const bytes = new Uint8Array(await blob.arrayBuffer());
	return { name, bytes };
}

/** The local store's documents resource, backed by the workspace folder. */
export function createDocumentsRepository(): Repository["documents"] {
	/** Every stored record for a workspace, parsed — across all pages. */
	async function allRecords(workspaceId: string): Promise<LocalDocument[]> {
		const out: LocalDocument[] = [];
		let after: string | undefined;
		do {
			const page = await storeList("documents", { workspaceId, after });
			out.push(...page.items.map((r) => parseBody<LocalDocument>(r)));
			after = page.nextCursor;
		} while (after);
		return out;
	}

	/** The workspace's URL handle (not its display name), for document records. */
	async function workspaceHandle(workspaceId: string): Promise<string> {
		const record = await storeGet("workspaces", workspaceId);
		return record
			? (parseBody<{ handle: string }>(record).handle ?? workspaceId)
			: workspaceId;
	}

	/** Write a file into the folder and persist its record, returning the doc. */
	async function writeDocument(
		workspaceId: string,
		workspaceHandle: string,
		path: string,
		bytes: Uint8Array,
		kind: WorkspaceDocument["kind"],
	): Promise<LocalDocument> {
		// The filename shares the payload, so it goes through JSON and the bytes
		// are a plain number array (same tradeoff as `save_file`). The read path
		// uses a raw response because previews fetch bytes far more often.
		await invoke("documents_write", {
			workspaceId,
			path,
			data: Array.from(bytes),
		});
		const now = new Date().toISOString();
		const { displayName, extension } = splitName(path);
		const doc: LocalDocument = {
			id: crypto.randomUUID(),
			path,
			displayName,
			extension,
			originalFilename: path,
			size: bytes.byteLength,
			hash: await sha256Hex(bytes),
			kind,
			createdAt: now,
			updatedAt: now,
			uploadedBy: LOCAL_AUTHOR,
			workspaceId,
			workspaceHandle,
		};
		await storeUpsert("documents", toRecord(doc));
		return doc;
	}

	async function getDocument(
		workspaceId: string,
		documentId: string,
	): Promise<WorkspaceDocument> {
		const record = await storeGet("documents", documentId);
		const doc = record ? parseBody<LocalDocument>(record) : null;
		// Scope the lookup to the workspace: a record is addressed by id alone, so
		// without this check a document id from another workspace would resolve its
		// path under THIS workspace's folder (acting on the wrong file). Treat a
		// cross-workspace id as not found.
		if (!doc || doc.workspaceId !== workspaceId) {
			throw new Error(`document ${documentId} not found`);
		}
		return doc;
	}

	return {
		listDocuments: async (
			workspaceId: string,
			query?: ListWorkspaceDocuments & CursorPagination,
		): Promise<WorkspaceDocumentPage> => {
			await ensureBound(workspaceId);
			const handle = await workspaceHandle(workspaceId);

			// Reconcile the index against the folder.
			const scan = await invoke<ScanResult>("documents_scan", {
				workspaceId,
			});
			const byPath = new Map(scan.files.map((f) => [f.path, f]));
			// Paths that exist on disk but couldn't be read this scan: keep their
			// records untouched (a transient lock/permission error must not drop a
			// document's stable id by looking like a deletion).
			const skipped = new Set(scan.skipped);
			const records = await allRecords(workspaceId);
			const seen = new Set<string>();
			// Records whose path no longer exists on disk — candidates for a rename
			// match (by content hash) before we treat them as deleted.
			const orphans: LocalDocument[] = [];

			for (const doc of records) {
				const file = byPath.get(doc.path);
				if (!file) {
					// A skipped (unreadable) path still exists — keep the record as-is,
					// don't orphan it.
					if (skipped.has(doc.path)) {
						seen.add(doc.path);
					} else {
						orphans.push(doc);
					}
					continue;
				}
				seen.add(doc.path);
				// The bytes changed on disk: refresh size/hash, keep the id.
				if (file.hash !== doc.hash || file.size !== doc.size) {
					const next: LocalDocument = {
						...doc,
						size: file.size,
						hash: file.hash,
						updatedAt: new Date().toISOString(),
					};
					await storeUpsert("documents", toRecord(next));
				}
			}

			// Match new scanned files to orphaned records by hash first — that's a
			// rename (keep the id, so studio tabs / runs stay bound); only a file
			// with no orphan match is genuinely new and gets a fresh id.
			const orphansByHash = new Map(orphans.map((d) => [d.hash, d]));
			for (const file of scan.files) {
				if (seen.has(file.path)) continue;
				const now = new Date().toISOString();
				const renamed = orphansByHash.get(file.hash);
				if (renamed) {
					orphansByHash.delete(file.hash);
					const { displayName, extension } = splitName(file.path);
					await storeUpsert(
						"documents",
						toRecord({
							...renamed,
							path: file.path,
							displayName,
							extension,
							updatedAt: now,
						}),
					);
					continue;
				}
				const { displayName, extension } = splitName(file.path);
				// A `.redacted.` sibling is a redaction output; everything else is an
				// original.
				const kind: WorkspaceDocument["kind"] = /\.redacted\.[^.]+$/.test(
					file.path,
				)
					? "redacted"
					: "original";
				const doc: LocalDocument = {
					id: crypto.randomUUID(),
					path: file.path,
					displayName,
					extension,
					originalFilename: file.path,
					size: file.size,
					hash: file.hash,
					kind,
					createdAt: now,
					updatedAt: now,
					uploadedBy: LOCAL_AUTHOR,
					workspaceId,
					workspaceHandle: handle,
				};
				await storeUpsert("documents", toRecord(doc));
			}

			// Any orphan not matched to a rename is genuinely gone — drop its record.
			for (const orphan of orphansByHash.values()) {
				await storeDelete("documents", orphan.id);
			}

			// Return the reconciled set, newest-first, applying the search filter.
			let items = (await allRecords(workspaceId)).sort((a, b) =>
				b.updatedAt.localeCompare(a.updatedAt),
			);
			const search = query?.search?.trim().toLowerCase();
			if (search) {
				items = items.filter((d) =>
					d.displayName.toLowerCase().includes(search),
				);
			}
			return { items };
		},

		getDocument,

		downloadDocument: async (
			workspaceId: string,
			documentId: string,
		): Promise<Response> => {
			await ensureBound(workspaceId);
			const doc = (await getDocument(workspaceId, documentId)) as LocalDocument;
			// Raw IPC response → ArrayBuffer (number[] on the WebKitGTK fallback).
			const raw = await invoke<ArrayBuffer | number[]>("documents_read", {
				workspaceId,
				path: doc.path,
			});
			const bytes = Array.isArray(raw) ? new Uint8Array(raw) : raw;
			return new Response(bytes);
		},

		uploadDocuments: async (
			workspaceId: string,
			documents: Blob | Blob[],
		): Promise<WorkspaceDocument[]> => {
			await ensureBound(workspaceId);
			const handle = await workspaceHandle(workspaceId);
			const blobs = Array.isArray(documents) ? documents : [documents];
			// Existing records, so an upload neither overwrites a different file of
			// the same name nor re-adds an identical one.
			const existing = await allRecords(workspaceId);
			const byHash = new Map(existing.map((d) => [d.hash, d]));
			const usedPaths = new Set(existing.map((d) => d.path));
			const out: WorkspaceDocument[] = [];
			for (const [index, blob] of blobs.entries()) {
				const { name, bytes } = await toNamedBytes(blob, index);
				// Identical content already here → reuse that record, don't duplicate.
				const hash = await sha256Hex(bytes);
				const same = byHash.get(hash);
				if (same) {
					out.push(same);
					continue;
				}
				// Name taken by a different file → pick a unique "name (n).ext".
				const path = uniquePath(name, usedPaths);
				usedPaths.add(path);
				const doc = await writeDocument(
					workspaceId,
					handle,
					path,
					bytes,
					"original",
				);
				byHash.set(hash, doc);
				out.push(doc);
			}
			return out;
		},

		updateDocument: async (
			workspaceId: string,
			documentId: string,
			updates: UpdateWorkspaceDocument,
		): Promise<WorkspaceDocument> => {
			const current = (await getDocument(
				workspaceId,
				documentId,
			)) as LocalDocument;
			const next: LocalDocument = {
				...current,
				displayName: updates.displayName ?? current.displayName,
				updatedAt: new Date().toISOString(),
			};
			await storeUpsert("documents", toRecord(next));
			return next;
		},

		deleteDocument: async (
			workspaceId: string,
			documentId: string,
		): Promise<void> => {
			await ensureBound(workspaceId);
			const doc = (await getDocument(workspaceId, documentId)) as LocalDocument;
			await invoke("documents_remove", { workspaceId, path: doc.path });
			await storeDelete("documents", documentId);
		},

		deleteDocuments: async (
			workspaceId: string,
			documentIds: string[],
		): Promise<WorkspaceDeletedDocuments> => {
			await ensureBound(workspaceId);
			const deleted: string[] = [];
			const skipped: string[] = [];
			for (const id of documentIds) {
				const record = await storeGet("documents", id);
				const doc = record ? parseBody<LocalDocument>(record) : null;
				// Skip a missing id, and one that belongs to another workspace — its
				// path would otherwise resolve under THIS workspace's folder and delete
				// the wrong file.
				if (!doc || doc.workspaceId !== workspaceId) {
					skipped.push(id);
					continue;
				}
				await invoke("documents_remove", { workspaceId, path: doc.path });
				await storeDelete("documents", id);
				deleted.push(id);
			}
			return { deleted, skipped };
		},
	};
}

/** Lower-case hex SHA-256 of bytes, via the Web Crypto API. */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
	// Copy into a fresh ArrayBuffer so the digest input is an exact-length
	// `ArrayBuffer` (not a view over a larger/shared buffer, which the strict
	// BufferSource type rejects).
	const buffer = bytes.slice().buffer as ArrayBuffer;
	const digest = await crypto.subtle.digest("SHA-256", buffer);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
