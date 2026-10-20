import { invoke } from "@tauri-apps/api/core";

/*
 * The generic client for the on-device store commands (`store_*`).
 *
 * Every local entity repository is built on these four calls: the store holds
 * each entity as a record of indexed columns plus an opaque JSON body, and these
 * wrappers move records in and out by collection name. The per-entity files map
 * between a record's body and the SDK entity type; nothing here parses a body.
 */

/** The collections the store holds; mirrors the Rust `Collection` set. */
export type Collection =
	| "policies"
	| "pipelines"
	| "scopes"
	| "matchers"
	| "labels"
	| "detections"
	| "redactions"
	| "workspaces"
	| "documents";

/** A stored record as the Rust `store_*` commands return and accept it. */
export interface StoreRecord {
	id: string;
	workspaceId: string | null;
	name: string | null;
	kind: string | null;
	updatedAt: string;
	/** The entity's JSON body, as a string. Stored verbatim. */
	body: string;
}

/** One page of records as `store_list` returns it. */
export interface StorePage {
	items: StoreRecord[];
	nextCursor?: string;
}

/** Paging for a list call. */
export interface StoreListQuery {
	workspaceId?: string;
	after?: string;
	limit?: number;
}

/** List one page of a collection's records, newest first. */
export function storeList(
	collection: Collection,
	query?: StoreListQuery,
): Promise<StorePage> {
	return invoke<StorePage>("store_list", {
		collection,
		workspaceId: query?.workspaceId,
		after: query?.after,
		limit: query?.limit,
	});
}

/** Fetch one record by id, or `null` if absent. */
export function storeGet(
	collection: Collection,
	id: string,
): Promise<StoreRecord | null> {
	return invoke<StoreRecord | null>("store_get", { collection, id });
}

/** Insert or replace a record. */
export function storeUpsert(
	collection: Collection,
	record: StoreRecord,
): Promise<void> {
	return invoke("store_upsert", { collection, record });
}

/** Delete a record by id. A no-op if it is absent. */
export function storeDelete(collection: Collection, id: string): Promise<void> {
	return invoke("store_delete", { collection, id });
}

/** Parse a record's JSON body into its entity type. */
export function parseBody<T>(record: StoreRecord): T {
	return JSON.parse(record.body) as T;
}
