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
import { resolveFolder } from "./folder";
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

/** Normalize a Blob/File to its name and bytes for writing into the folder. */
async function toNamedBytes(
	blob: Blob,
	index: number,
): Promise<{ name: string; bytes: Uint8Array }> {
	const name = blob instanceof File ? blob.name : `document-${index + 1}`;
	const bytes = new Uint8Array(await blob.arrayBuffer());
	return { name, bytes };
}

/** The local store's documents resource, backed by the workspace folder. */
export function createDocumentsRepository(): Repository["documents"] {
	/** Every stored record for a workspace, parsed. */
	async function allRecords(workspaceId: string): Promise<LocalDocument[]> {
		const page = await storeList("documents", { workspaceId, limit: 1000 });
		return page.items.map((r) => parseBody<LocalDocument>(r));
	}

	/** Write a file into the folder and persist its record, returning the doc. */
	async function writeDocument(
		workspaceId: string,
		workspaceHandle: string,
		folder: string,
		path: string,
		bytes: Uint8Array,
		kind: WorkspaceDocument["kind"],
	): Promise<LocalDocument> {
		// The filename shares the payload, so it goes through JSON and the bytes
		// are a plain number array (same tradeoff as `save_file`). The read path
		// uses a raw response because previews fetch bytes far more often.
		await invoke("documents_write", {
			folder,
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
		_workspaceId: string,
		documentId: string,
	): Promise<WorkspaceDocument> {
		const record = await storeGet("documents", documentId);
		if (!record) throw new Error(`document ${documentId} not found`);
		return parseBody<LocalDocument>(record);
	}

	return {
		listDocuments: async (
			workspaceId: string,
			query?: ListWorkspaceDocuments & CursorPagination,
		): Promise<WorkspaceDocumentPage> => {
			const folder = await resolveFolder(workspaceId);
			const workspace = await storeGet("workspaces", workspaceId);
			const handle = workspace?.name ?? workspaceId;

			// Reconcile the index against the folder.
			const scanned = await invoke<ScannedFile[]>("documents_scan", { folder });
			const byPath = new Map(scanned.map((f) => [f.path, f]));
			const records = await allRecords(workspaceId);
			const seen = new Set<string>();

			for (const doc of records) {
				const file = byPath.get(doc.path);
				if (!file) {
					// The file was removed outside the app — drop its stale record.
					await storeDelete("documents", doc.id);
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

			// New files on disk (dropped in via Finder) get a fresh record.
			for (const file of scanned) {
				if (seen.has(file.path)) continue;
				const now = new Date().toISOString();
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
			const folder = await resolveFolder(workspaceId);
			const doc = (await getDocument(workspaceId, documentId)) as LocalDocument;
			// Raw IPC response → ArrayBuffer (number[] on the WebKitGTK fallback).
			const raw = await invoke<ArrayBuffer | number[]>("documents_read", {
				folder,
				path: doc.path,
			});
			const bytes = Array.isArray(raw) ? new Uint8Array(raw) : raw;
			return new Response(bytes);
		},

		uploadDocuments: async (
			workspaceId: string,
			documents: Blob | Blob[],
		): Promise<WorkspaceDocument[]> => {
			const folder = await resolveFolder(workspaceId);
			const workspace = await storeGet("workspaces", workspaceId);
			const handle = workspace?.name ?? workspaceId;
			const blobs = Array.isArray(documents) ? documents : [documents];
			const out: WorkspaceDocument[] = [];
			for (const [index, blob] of blobs.entries()) {
				const { name, bytes } = await toNamedBytes(blob, index);
				out.push(
					await writeDocument(
						workspaceId,
						handle,
						folder,
						name,
						bytes,
						"original",
					),
				);
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
			const folder = await resolveFolder(workspaceId);
			const doc = (await getDocument(workspaceId, documentId)) as LocalDocument;
			await invoke("documents_remove", { folder, path: doc.path });
			await storeDelete("documents", documentId);
		},

		deleteDocuments: async (
			workspaceId: string,
			documentIds: string[],
		): Promise<WorkspaceDeletedDocuments> => {
			const folder = await resolveFolder(workspaceId);
			const deleted: string[] = [];
			const skipped: string[] = [];
			for (const id of documentIds) {
				const record = await storeGet("documents", id);
				if (!record) {
					skipped.push(id);
					continue;
				}
				const doc = parseBody<LocalDocument>(record);
				await invoke("documents_remove", { folder, path: doc.path });
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
