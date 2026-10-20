//! The on-device entity store, wired to the Tauri shell.
//!
//! The store itself is the Tauri-agnostic `studio-store` crate, which exposes one
//! typed repository per entity. The web layer's local repository calls generic
//! `store_*` commands naming a collection; this module resolves the collection
//! to its typed repository and forwards the call. Each command passes the
//! entity's JSON body opaquely — nothing here parses a body.

use studio_sqlite::{ListQuery, Page, Record, Store};
use tauri::{AppHandle, Manager, Runtime, State};

/// The database file name, created under the app's data directory.
const DB_FILE: &str = "store.db";

/// Opens the on-device store under the app's data directory, creating the
/// directory if needed.
///
/// # Errors
///
/// - A string error if the data directory can't be resolved or created, or the
///   store can't be opened.
pub async fn open<R: Runtime>(app: &AppHandle<R>) -> Result<Store, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "could not resolve the app data directory".to_owned())?;
    std::fs::create_dir_all(&dir).map_err(|err| format!("could not create app data dir: {err}"))?;
    Store::open(dir.join(DB_FILE))
        .await
        .map_err(|err| err.to_string())
}

/// Runs `$op` against the typed repository named by `$collection`, rejecting an
/// unknown collection. Every repository shares the same method set, so one arm
/// per collection forwards the call.
macro_rules! dispatch {
    ($store:expr, $collection:expr, |$repo:ident| $op:expr) => {
        match $collection {
            "policies" => {
                let $repo = $store.policies();
                $op
            }
            "scopes" => {
                let $repo = $store.scopes();
                $op
            }
            "matchers" => {
                let $repo = $store.matchers();
                $op
            }
            "pipelines" => {
                let $repo = $store.pipelines();
                $op
            }
            "labels" => {
                let $repo = $store.labels();
                $op
            }
            "detections" => {
                let $repo = $store.detections();
                $op
            }
            "redactions" => {
                let $repo = $store.redactions();
                $op
            }
            "workspaces" => {
                let $repo = $store.workspaces();
                $op
            }
            "documents" => {
                let $repo = $store.documents();
                $op
            }
            other => return Err(format!("unknown collection `{other}`")),
        }
    };
}

/// Lists one page of a collection's records, newest first, optionally scoped to
/// a workspace. `after` resumes from a previous page's `nextCursor`.
#[tauri::command]
pub async fn store_list(
    store: State<'_, Store>,
    collection: String,
    workspace_id: Option<String>,
    after: Option<String>,
    limit: Option<i64>,
) -> Result<Page, String> {
    let query = ListQuery {
        workspace_id,
        after,
        limit,
    };
    dispatch!(store.inner(), collection.as_str(), |repo| repo
        .list(query)
        .await
        .map_err(|err| err.to_string()))
}

/// Fetches one record by id, or `null` if absent.
#[tauri::command]
pub async fn store_get(
    store: State<'_, Store>,
    collection: String,
    id: String,
) -> Result<Option<Record>, String> {
    dispatch!(store.inner(), collection.as_str(), |repo| repo
        .get(&id)
        .await
        .map_err(|err| err.to_string()))
}

/// Inserts or replaces a record.
#[tauri::command]
pub async fn store_upsert(
    store: State<'_, Store>,
    collection: String,
    record: Record,
) -> Result<(), String> {
    dispatch!(store.inner(), collection.as_str(), |repo| repo
        .upsert(record)
        .await
        .map_err(|err| err.to_string()))
}

/// Deletes a record by id. A no-op if it is absent.
#[tauri::command]
pub async fn store_delete(
    store: State<'_, Store>,
    collection: String,
    id: String,
) -> Result<(), String> {
    dispatch!(store.inner(), collection.as_str(), |repo| repo
        .delete(&id)
        .await
        .map_err(|err| err.to_string()))
}
